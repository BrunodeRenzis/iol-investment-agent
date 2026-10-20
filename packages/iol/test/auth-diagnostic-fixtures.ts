import type { TestContext } from 'node:test';
import type { IolErrorCode } from '../src/error';
import type { AuthStage } from '../src/internal/auth-diagnostic';
import type { FailureKind } from '../src/internal/schema-diagnostic';

export const secrets = {
  username: 'synthetic-user-sentinel',
  password: 'synthetic-password-sentinel',
  access: 'synthetic-access-sentinel',
  refresh: 'synthetic-refresh-sentinel',
  body: 'synthetic-body-sentinel',
  header: 'synthetic-header-sentinel',
  challenge: 'synthetic-challenge-sentinel',
  cookie: 'synthetic-cookie-sentinel',
  exception: 'synthetic-exception-sentinel',
} as const;
const token = {
  access_token: secrets.access,
  refresh_token: secrets.refresh,
  token_type: 'bearer',
  expires_in: 900,
};
const headers = {
  'content-type': 'application/json',
  'x-sensitive': secrets.header,
  'www-authenticate': secrets.challenge,
  'set-cookie': secrets.cookie,
};
export function authResponse(body = JSON.stringify(token)): Response {
  return new Response(body, { headers });
}
const payload = (patch: Record<string, unknown>) => () =>
  authResponse(JSON.stringify({ ...token, ...patch }));
const longToken = (marker: string, size: number) =>
  marker + 'Q'.repeat(size - marker.length);

export interface AuthCase {
  readonly name: string;
  readonly category?: IolErrorCode;
  readonly stage?: AuthStage;
  readonly httpStatus?: number;
  readonly diagnostic?: { readonly path: string; readonly kind: FailureKind };
  readonly response?: () => Response;
  readonly action?:
    | 'throw'
    | 'reject'
    | 'timeout'
    | 'abort_before'
    | 'abort_request'
    | 'abort_body'
    | 'lifetime'
    | 'invalid_credentials';
}
function invalid(
  name: string,
  field: string,
  kind: FailureKind,
  response: () => Response,
): AuthCase {
  return {
    name,
    category: 'invalid_payload',
    stage: 'token_payload',
    httpStatus: 200,
    diagnostic: { path: `token.${field}`, kind },
    response,
  };
}

// Explicit contract table: scenario -> category + local stage + observed status.
export const authCases: readonly AuthCase[] = [
  ...([400, 401, 403, 429, 500] as const).map(
    (httpStatus): AuthCase => ({
      name: `HTTP ${httpStatus}`,
      category:
        httpStatus === 401
          ? 'authentication_failure'
          : httpStatus === 403
            ? 'authorization_failure'
            : 'unexpected_status',
      stage: 'response_status',
      httpStatus,
      response: () =>
        new Response(secrets.body, { status: httpStatus, headers }),
    }),
  ),
  ...([301, 302, 303, 307, 308] as const).map(
    (httpStatus): AuthCase => ({
      name: `redirect ${httpStatus}`,
      category: 'redirect_rejected',
      stage: 'response_status',
      httpStatus,
      response: () =>
        new Response(secrets.body, {
          status: httpStatus,
          headers: { ...headers, location: 'https://other.invalid' },
        }),
    }),
  ),
  {
    name: 'already redirected 200',
    category: 'redirect_rejected',
    stage: 'response_status',
    httpStatus: 200,
    response: () =>
      Object.defineProperty<Response>(authResponse(), 'redirected', {
        value: true,
      }),
  },
  {
    name: 'opaque redirect',
    category: 'redirect_rejected',
    stage: 'response_status',
    response: () =>
      Object.defineProperties<Response>(authResponse(), {
        type: { value: 'opaqueredirect' },
        status: { value: 0 },
      }),
  },
  {
    name: 'auth timeout',
    category: 'timeout',
    stage: 'request',
    action: 'timeout',
  },
  {
    name: 'fetch rejects',
    category: 'network_failure',
    stage: 'request',
    action: 'reject',
  },
  {
    name: 'fetch throws',
    category: 'network_failure',
    stage: 'request',
    action: 'throw',
  },
  {
    name: 'content type',
    category: 'invalid_payload',
    stage: 'response_body',
    httpStatus: 200,
    response: () =>
      new Response(secrets.body, {
        headers: { ...headers, 'content-type': 'text/plain' },
      }),
  },
  {
    name: 'null body',
    category: 'invalid_payload',
    stage: 'response_body',
    httpStatus: 200,
    response: () => new Response(null, { headers }),
  },
  {
    name: 'empty body',
    category: 'invalid_payload',
    stage: 'token_payload',
    httpStatus: 200,
    diagnostic: { path: 'token', kind: 'malformed' },
    response: () => authResponse(''),
  },
  {
    name: 'body overflow',
    category: 'invalid_payload',
    stage: 'response_body',
    httpStatus: 200,
    response: () => authResponse(secrets.body + ' '.repeat(65_537)),
  },
  {
    name: 'invalid UTF8',
    category: 'invalid_payload',
    stage: 'response_body',
    httpStatus: 200,
    response: () => new Response(new Uint8Array([255]), { headers }),
  },
  {
    name: 'broken stream',
    category: 'network_failure',
    stage: 'response_body',
    httpStatus: 200,
    response: () =>
      new Response(
        new ReadableStream<Uint8Array>({
          pull(c) {
            c.enqueue(new TextEncoder().encode(secrets.body));
            c.error(new Error(secrets.exception));
          },
        }),
        { headers },
      ),
  },
  {
    name: 'malformed JSON',
    category: 'invalid_payload',
    stage: 'token_payload',
    httpStatus: 200,
    diagnostic: { path: 'token', kind: 'malformed' },
    response: () => authResponse(`{"${secrets.body}":`),
  },
  invalid(
    'missing access',
    'access_token',
    'missing',
    payload({ access_token: undefined }),
  ),
  invalid(
    'null access',
    'access_token',
    'null',
    payload({ access_token: null }),
  ),
  invalid(
    'non-string access',
    'access_token',
    'type',
    payload({ access_token: true }),
  ),
  invalid(
    'malformed access',
    'access_token',
    'malformed',
    payload({ access_token: `${secrets.access} invalid` }),
  ),
  invalid(
    'empty access',
    'access_token',
    'malformed',
    payload({ access_token: '' }),
  ),
  {
    name: 'access at 16384',
    response: payload({ access_token: longToken(secrets.access, 16_384) }),
  },
  invalid(
    'access at 16385',
    'access_token',
    'range',
    payload({ access_token: longToken(secrets.access, 16_385) }),
  ),
  { name: 'refresh absent', response: payload({ refresh_token: undefined }) },
  invalid(
    'refresh invalid',
    'refresh_token',
    'type',
    payload({ refresh_token: [secrets.refresh] }),
  ),
  invalid(
    'refresh at 16385',
    'refresh_token',
    'range',
    payload({ refresh_token: longToken(secrets.refresh, 16_385) }),
  ),
  invalid(
    'expiry missing',
    'expires_in',
    'missing',
    payload({ expires_in: undefined }),
  ),
  invalid('expiry zero', 'expires_in', 'range', payload({ expires_in: 0 })),
  invalid(
    'expiry negative',
    'expires_in',
    'range',
    payload({ expires_in: -1 }),
  ),
  invalid('expiry decimal', 'expires_in', 'type', payload({ expires_in: 1.5 })),
  invalid('expiry exponent', 'expires_in', 'exponent', () =>
    authResponse(JSON.stringify(token).replace('900', '1e3')),
  ),
  invalid(
    'expiry overflow',
    'expires_in',
    'range',
    payload({ expires_in: 2147483648 }),
  ),
  invalid(
    'token type unexpected',
    'token_type',
    'enum',
    payload({ token_type: secrets.body }),
  ),
  invalid(
    'extra fields',
    'unknown',
    'unknown_fields',
    payload({ [secrets.body]: secrets.body }),
  ),
  {
    name: 'local lifetime exhausted',
    category: 'session_aborted',
    stage: 'token_payload',
    httpStatus: 200,
    action: 'lifetime',
    response: payload({ expires_in: 1 }),
  },
  {
    name: 'signal before POST',
    category: 'session_aborted',
    stage: 'before_request',
    action: 'abort_before',
  },
  {
    name: 'signal during POST',
    category: 'session_aborted',
    stage: 'request',
    action: 'abort_request',
  },
  {
    name: 'signal during body',
    category: 'session_aborted',
    stage: 'response_body',
    httpStatus: 200,
    action: 'abort_body',
  },
  {
    name: 'invalid local credentials',
    category: 'invalid_payload',
    stage: 'before_request',
    action: 'invalid_credentials',
  },
];

export function scenario(item: AuthCase, context: TestContext) {
  const stop = new AbortController();
  const requests: { url: unknown; method: string | undefined }[] = [];
  let requestSignal: AbortSignal | null | undefined;
  let notify: (() => void) | undefined;
  const started = new Promise<void>((resolve) => {
    notify = resolve;
  });
  let time = 0;
  if (item.action === 'lifetime')
    context.mock.method(performance, 'now', () => time);
  if (item.action === 'timeout')
    context.mock.timers.enable({ apis: ['setTimeout'] });
  if (item.action === 'abort_before') stop.abort();
  const fetcher: typeof fetch = (url, init) => {
    requests.push({ url, method: init?.method });
    requestSignal = init?.signal;
    if (item.action !== 'abort_body') notify?.();
    if (item.action === 'throw') throw new Error(secrets.exception);
    if (item.action === 'reject')
      return Promise.reject(
        Object.assign(new Error(secrets.exception), {
          stage: secrets.body,
          httpStatus: 401,
          diagnostic: { path: secrets.access, kind: secrets.refresh },
        }),
      );
    if (item.action === 'abort_request' || item.action === 'timeout')
      return new Promise<Response>(() => undefined); // Deliberately ignores abort.
    if (item.action === 'abort_body') {
      const body = new ReadableStream<Uint8Array>({
        pull() {
          notify?.();
          return new Promise<void>(() => undefined);
        },
      });
      return Promise.resolve(new Response(body, { headers }));
    }
    if (item.action === 'lifetime') time = 1001;
    return Promise.resolve(item.response?.() ?? authResponse());
  };
  const drive = async (): Promise<void> => {
    if (item.action === 'timeout') {
      await started;
      context.mock.timers.tick(10_000);
    } else if (
      item.action === 'abort_request' ||
      item.action === 'abort_body'
    ) {
      await started;
      // Let the response handler reach response_body before external cancellation.
      if (item.action === 'abort_body')
        await new Promise<void>((resolve) => setImmediate(resolve));
      stop.abort();
    }
  };
  return { fetcher, stop, requests, drive, requestSignal: () => requestSignal };
}

export const warningTexts = {
  before_request:
    'No se envió la solicitud de autenticación. No se instaló ninguna sesión local.',
  request:
    'No se instaló sesión local. No se sabe si IOL recibió la solicitud ni si emitió un token. Tratar el intento como potencialmente activo y seguir la política de espera del runbook antes de reintentar.',
  response_status:
    'IOL respondió con error HTTP y no se instaló sesión local. No reintentar automáticamente; revisar el resultado antes de un nuevo intento aprobado.',
  http200:
    'IOL respondió HTTP 200 pero la respuesta fue rechazada localmente. Un token remoto pudo haberse emitido y debe tratarse como potencialmente activo. No reintentar; seguir la política de espera o revocación oficial del runbook. dispose() no revoca tokens.',
} as const;
