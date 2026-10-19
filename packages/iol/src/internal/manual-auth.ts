import { inspect } from 'node:util';
import { IolError } from '../error';
import { int32, parseWireJson, stringValue } from './json';
import { AuthenticatedReadTransport, type IolTransport } from './transport';
import type { ReadRequest } from './allowlist';
import { accessTokenValue, MAX_ACCESS_TOKEN_LENGTH } from './token-policy';
import {
  payloadFailure,
  requiredKind,
  schemaDiagnostic,
  schemaFailure,
} from './schema-diagnostic';

const TOKEN_URL = 'https://api.invertironline.com/token';
const AUTH_TIMEOUT_MS = 10_000;
const MAX_TOKEN_BODY_BYTES = 65_536;
// Discarded optional token: dedicated bound, independent of generic strings.
const MAX_REFRESH_TOKEN_LENGTH = MAX_ACCESS_TOKEN_LENGTH;
export const MANUAL_SESSION_MS = 300_000;

/** Internal handle: never returns an access token or refresh token. */
export interface ManualReadSession extends IolTransport {
  readonly signal: AbortSignal;
  dispose(): void;
}

class MemorySession implements ManualReadSession {
  #transport: AuthenticatedReadTransport | undefined;
  readonly #controller = new AbortController();
  readonly #deadline: number;
  readonly #timer: ReturnType<typeof setTimeout>;
  constructor(token: string, fetcher: typeof fetch, lifetimeMs: number) {
    this.#transport = new AuthenticatedReadTransport(token, fetcher);
    this.#deadline = performance.now() + lifetimeMs;
    this.#timer = setTimeout(() => this.dispose(), lifetimeMs);
  }
  get signal(): AbortSignal {
    return this.#controller.signal;
  }
  async read(request: ReadRequest): Promise<string> {
    if (!this.#transport || performance.now() >= this.#deadline) {
      this.dispose();
      throw new IolError('authentication_failure');
    }
    const result = await this.#transport.read(request);
    if (this.signal.aborted || performance.now() >= this.#deadline) {
      this.dispose();
      throw new IolError('authentication_failure');
    }
    return result;
  }
  dispose(): void {
    clearTimeout(this.#timer);
    this.#transport?.dispose();
    this.#transport = undefined;
    this.#controller.abort();
  }
  toJSON(): string {
    return '[IOL session: private]';
  }
  [inspect.custom](): string {
    return '[IOL session: private]';
  }
}

function decodeSession(
  body: string,
  fetcher: typeof fetch,
  elapsedMs: number,
): ManualReadSession {
  const value = parseWireJson(body, 'token');
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new IolError('invalid_payload');
  const source = value as Record<string, unknown>;
  const allowed = [
    'access_token',
    'token_type',
    'expires_in',
    'refresh_token',
    '.issued',
    '.expires',
    '.refreshexpires',
  ];
  if (Object.keys(source).some((key) => !allowed.includes(key)))
    throw new IolError('invalid_payload');
  if (Object.hasOwn(source, 'refresh_token')) {
    if (typeof source.refresh_token !== 'string')
      throw schemaFailure(requiredKind(source.refresh_token), 'token');
    if (source.refresh_token.length > MAX_REFRESH_TOKEN_LENGTH)
      throw schemaFailure('range', 'token');
  }
  for (const key of ['.issued', '.expires', '.refreshexpires']) {
    if (Object.hasOwn(source, key)) stringValue(source[key]);
  }
  // Presence/strings only. No refresh lifetime or date semantics inferred.
  const tokenType = stringValue(source.token_type);
  if (tokenType !== 'bearer' && tokenType !== 'Bearer')
    throw new IolError('invalid_payload');
  const seconds = BigInt(int32(source.expires_in));
  if (seconds <= 0n) throw new IolError('invalid_payload');
  // Number here is bounded time metadata, never financial arithmetic.
  const lifetimeMs = Number(seconds > 300n ? 300n : seconds) * 1000 - elapsedMs;
  if (lifetimeMs <= 0) throw new IolError('authentication_failure');
  const accessToken = accessTokenValue(source.access_token);
  return new MemorySession(accessToken, fetcher, lifetimeMs);
}

async function tokenResponse(response: Response): Promise<string> {
  if (
    response.redirected ||
    response.type === 'opaqueredirect' ||
    (response.status >= 300 && response.status < 400)
  ) {
    await response.body?.cancel().catch(() => undefined);
    throw new IolError('redirect_rejected');
  }
  if (response.status !== 200) {
    await response.body?.cancel().catch(() => undefined);
    throw new IolError(
      response.status === 401
        ? 'authentication_failure'
        : response.status === 403
          ? 'authorization_failure'
          : 'unexpected_status',
    );
  }
  const contentType = response.headers
    .get('content-type')
    ?.split(';')[0]
    ?.trim()
    .toLowerCase();
  if (
    !response.body ||
    (contentType !== 'application/json' && contentType !== 'text/json')
  ) {
    await response.body?.cancel().catch(() => undefined);
    throw new IolError('invalid_payload');
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_TOKEN_BODY_BYTES) throw new IolError('invalid_payload');
      chunks.push(next.value);
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(
      Buffer.concat(chunks),
    );
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/** Single-use password grant. No getters, cache, env loader or refresh grant. */
export class PasswordGrantCredentials {
  #username: string | undefined;
  #password: string | undefined;
  constructor(username: string, password: string) {
    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !username.length ||
      username.length > 256 ||
      !password.length ||
      password.length > 1024 ||
      [...(username + password)].some(
        (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
      )
    ) {
      throw new IolError('authentication_failure');
    }
    this.#username = username;
    this.#password = password;
  }
  toJSON(): string {
    return '[IOL credentials: private]';
  }
  [inspect.custom](): string {
    return '[IOL credentials: private]';
  }
  dispose(): void {
    this.#username = undefined;
    this.#password = undefined;
  }

  async authenticate(
    fetcher: typeof fetch,
    signal: AbortSignal,
  ): Promise<ManualReadSession> {
    if (
      signal.aborted ||
      this.#username === undefined ||
      this.#password === undefined
    ) {
      this.dispose();
      throw new IolError('authentication_failure');
    }
    let body: string | undefined = new URLSearchParams({
      username: this.#username,
      password: this.#password,
      grant_type: 'password',
    }).toString();
    this.dispose();
    const started = performance.now();
    const controller = new AbortController();
    const cancel = (): void => controller.abort();
    signal.addEventListener('abort', cancel, { once: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    let rejectAbort: (() => void) | undefined;
    const expired = new Promise<never>((_, reject) => {
      rejectAbort = () => reject(new IolError('timeout'));
      controller.signal.addEventListener('abort', rejectAbort, { once: true });
      timer = setTimeout(cancel, AUTH_TIMEOUT_MS);
    });
    let responseBody: string | undefined;
    try {
      const response = fetcher(TOKEN_URL, {
        method: 'POST',
        redirect: 'manual',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body,
        signal: controller.signal,
      });
      body = undefined;
      responseBody = await Promise.race([
        response.then(tokenResponse),
        expired,
      ]);
      if (controller.signal.aborted) throw new IolError('timeout');
      return decodeSession(responseBody, fetcher, performance.now() - started);
    } catch (error: unknown) {
      if (schemaDiagnostic(error)) throw payloadFailure(error, 'token');
      throw new IolError(
        error instanceof IolError ? error.code : 'authentication_failure',
      );
    } finally {
      body = undefined;
      responseBody = undefined;
      this.dispose();
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      if (rejectAbort)
        controller.signal.removeEventListener('abort', rejectAbort);
    }
  }
}
