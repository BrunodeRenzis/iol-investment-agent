import { inspect } from 'node:util';
import { IolError } from '../error';
import { validateRequest, type ReadRequest } from './allowlist';
import { MAX_RESPONSE_BYTES } from './json';

/** Internal and mockable. Package root exports neither this nor a live factory. */
export interface IolTransport {
  read(request: ReadRequest): Promise<string>;
}

/** No default/global fetch: connecting this transport requires future gated wiring. */
export class AuthenticatedReadTransport implements IolTransport {
  readonly #token: string;
  readonly #fetch: typeof fetch;
  readonly #timeoutMs: number;
  constructor(token: string, fetcher: typeof fetch, timeoutMs = 10_000) {
    if (
      typeof token !== 'string' ||
      /[^A-Za-z0-9._~+/=-]/.test(token) ||
      !/^[A-Za-z0-9._~+/-]+={0,2}$/.test(token) ||
      token.length > 16384
    )
      throw new IolError('authentication_failure');
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000)
      throw new IolError('timeout');
    this.#token = token;
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

  async read(request: ReadRequest): Promise<string> {
    request = Object.freeze({ ...request });
    validateRequest(request);
    // Snapshot validated primitives before crossing an async boundary.
    const url = request.origin + request.path;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new IolError('timeout'));
      }, this.#timeoutMs);
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
