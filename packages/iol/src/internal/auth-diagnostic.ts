import type { IolError } from '../error';

const STAGES = [
  'before_request',
  'request',
  'response_status',
  'response_body',
  'token_payload',
] as const;
export type AuthStage = (typeof STAGES)[number];
export interface AuthDiagnostic {
  readonly stage: AuthStage;
  readonly httpStatus?: number;
}

// Local boundary facts only. Never read diagnostic properties from an exception.
const diagnostics = new WeakMap<object, AuthDiagnostic>();
export function recordAuthFailure(
  error: IolError,
  stage: AuthStage,
  httpStatus?: number,
): IolError {
  const safeStage = STAGES.includes(stage) ? stage : 'request';
  diagnostics.set(
    error,
    Object.freeze({
      stage: safeStage,
      ...(safeStage !== 'before_request' &&
      safeStage !== 'request' &&
      typeof httpStatus === 'number' &&
      Number.isInteger(httpStatus) &&
      httpStatus >= 100 &&
      httpStatus <= 599
        ? { httpStatus }
        : {}),
    }),
  );
  return error;
}

export function authDiagnostic(error: unknown): AuthDiagnostic | undefined {
  return typeof error === 'object' && error !== null
    ? diagnostics.get(error)
    : undefined;
}

const BEFORE_REQUEST =
  'No se envió la solicitud de autenticación. No se instaló ninguna sesión local.';
const REQUEST =
  'No se instaló sesión local. No se sabe si IOL recibió la solicitud ni si emitió un token. Tratar el intento como potencialmente activo y seguir la política de espera del runbook antes de reintentar.';
const HTTP_ERROR =
  'IOL respondió con error HTTP y no se instaló sesión local. No reintentar automáticamente; revisar el resultado antes de un nuevo intento aprobado.';
const HTTP_200 =
  'IOL respondió HTTP 200 pero la respuesta fue rechazada localmente. Un token remoto pudo haberse emitido y debe tratarse como potencialmente activo. No reintentar; seguir la política de espera o revocación oficial del runbook. dispose() no revoca tokens.';

export function authWarning(diagnostic: AuthDiagnostic): string {
  if (diagnostic.stage === 'before_request') return BEFORE_REQUEST;
  if (
    diagnostic.stage === 'response_status' &&
    diagnostic.httpStatus !== undefined &&
    diagnostic.httpStatus !== 200
  )
    return HTTP_ERROR;
  if (
    (diagnostic.stage === 'response_body' ||
      diagnostic.stage === 'token_payload') &&
    diagnostic.httpStatus === 200
  )
    return HTTP_200;
  // Includes opaque redirects (no HTTP status) and already-followed HTTP 200.
  return REQUEST;
}
