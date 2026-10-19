import { inspect } from 'node:util';
import { IolError } from '../error';
import { validateRequest, type ReadRequest } from './allowlist';
import { MAX_RESPONSE_BYTES } from './json';
import { accessTokenValue } from './token-policy';

/** Internal and mockable. Package root exports neither this nor a live factory. */
export interface IolTransport {
  read(request: ReadRequest): Promise<string>;
}

/** No default/global fetch: private manual wiring is gated by ADR-021. */
export class AuthenticatedReadTransport implements IolTransport {
  #token: string | undefined;
  readonly #fetch: typeof fetch;
  readonly #timeoutMs: number;
  readonly #controllers = new Set<AbortController>();
  constructor(token: string, fetcher: typeof fetch, timeoutMs = 10_000) {
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000)
      throw new IolError('timeout');
    this.#token = accessTokenValue(token);
    this.#fetch = fetcher;
    this.#timeoutMs = timeoutMs;
    Object.freeze(this);
  }
  toJSON(): string {
    return '[IOL transport: private]';
  }
  [inspect.custom](): string {
    return '[IOL transport: private]';
  }

  dispose(): void {
    this.#token = undefined;
    for (const controller of this.#controllers) controller.abort();
    this.#controllers.clear();
  }

  async read(request: ReadRequest): Promise<string> {
    request = Object.freeze({ ...request });
    validateRequest(request);
    if (this.#token === undefined) throw new IolError('authentication_failure');
    // Snapshot validated primitives before crossing an async boundary.
    const url = request.origin + request.path;
    const controller = new AbortController();
    this.#controllers.add(controller);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let rejectAbort: (() => void) | undefined;
    const timeout = new Promise<never>((_, reject) => {
      rejectAbort = () => reject(new IolError('timeout'));
      controller.signal.addEventListener('abort', rejectAbort, { once: true });
      timer = setTimeout(() => controller.abort(), this.#timeoutMs);
    });
    try {
      return await Promise.race([
        this.#perform(url, controller.signal),
        timeout,
      ]);
    } catch (error: unknown) {
      // Even an injected transport error must not bring its message/cause across.
      if (controller.signal.aborted) throw new IolError('timeout');
      if (error instanceof IolError) throw new IolError(error.code);
      throw new IolError('network_failure');
    } finally {
      clearTimeout(timer);
      this.#controllers.delete(controller);
      if (rejectAbort)
        controller.signal.removeEventListener('abort', rejectAbort);
    }
  }

  async #perform(url: string, signal: AbortSignal): Promise<string> {
    const response = await this.#fetch(url, {
      method: 'GET',
      redirect: 'manual',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: {
        Authorization: `Bearer ${this.#token}`,
        Accept: 'application/json',
      },
      signal,
    });
    try {
      if (
        response.redirected ||
        response.type === 'opaqueredirect' ||
        (response.status >= 300 && response.status < 400)
      )
        throw new IolError('redirect_rejected');
      if (response.status === 401) throw new IolError('authentication_failure');
      if (response.status === 403) throw new IolError('authorization_failure');
      if (response.status !== 200) throw new IolError('unexpected_status');
      const contentType = response.headers
        .get('content-type')
        ?.split(';')[0]
        ?.trim()
        .toLowerCase();
      if (contentType !== 'application/json' && contentType !== 'text/json')
        throw new IolError('invalid_payload');
    } catch (error: unknown) {
      // Never read/log undocumented error bodies. Cleanup errors cannot replace the safe error.
      await response.body?.cancel().catch(() => undefined);
      throw error;
    }
    if (!response.body) throw new IolError('invalid_payload');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > MAX_RESPONSE_BYTES) throw new IolError('invalid_payload');
        chunks.push(chunk.value);
      }
      try {
        return new TextDecoder('utf-8', { fatal: true }).decode(
          Buffer.concat(chunks),
        );
      } catch {
        throw new IolError('invalid_payload');
      }
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  }
}
