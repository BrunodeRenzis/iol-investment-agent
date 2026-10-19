import { IolError } from '../error';
import { IOL_COUNTRIES, IOL_MARKETS } from '../values';

export const TRUSTED_ORIGIN = 'https://api.invertironline.com';
export type Operation =
  | 'accountState'
  | 'portfolio'
  | 'instrument'
  | 'quoteDetail';
export interface ReadRequest {
  readonly origin: string;
  readonly method: string;
  readonly path: string;
}

function denied(): never {
  throw new IolError('allowlist_rejection');
}

export function validSymbol(value: unknown): value is string {
  // Local conservative routing policy, NOT an exhaustive IOL symbol grammar.
  return (
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= 32 &&
    !/[^A-Z0-9]/.test(value)
  );
}

/** Validate raw text before URL parsing can normalize away routing attacks. */
export function validateRequest(request: ReadRequest): Operation {
  if (
    !request ||
    Object.keys(request).sort().join(',') !== 'method,origin,path' ||
    request.origin !== TRUSTED_ORIGIN ||
    request.method !== 'GET' ||
    typeof request.path !== 'string'
  )
    return denied();
  if (request.path === '/api/v2/estadocuenta') return 'accountState';
  const parts = request.path.split('/');
  if (parts[0] !== '' || parts[1] !== 'api' || parts[2] !== 'v2')
    return denied();
  if (
    parts.length === 5 &&
    parts[3] === 'portafolio' &&
    IOL_COUNTRIES.some((country) => country === parts[4])
  )
    return 'portfolio';
  if (
    (parts.length === 6 || parts.length === 7) &&
    IOL_MARKETS.some((market) => market === parts[3]) &&
    parts[4] === 'Titulos' &&
    validSymbol(parts[5])
  ) {
    if (parts.length === 6) return 'instrument';
    if (parts[6] === 'CotizacionDetalle') return 'quoteDetail';
  }
  return denied();
}

export function makeRequest(
  operation: Operation,
  parameters: Readonly<Record<string, unknown>> = {},
): ReadRequest {
  const keys = Object.keys(parameters).sort().join(',');
  let path: string;
  switch (operation) {
    case 'accountState':
      if (keys !== '') return denied();
      path = '/api/v2/estadocuenta';
      break;
    case 'portfolio':
      if (
        keys !== 'pais' ||
        !IOL_COUNTRIES.some((country) => country === parameters['pais'])
      )
        return denied();
      path = `/api/v2/portafolio/${parameters['pais'] as string}`;
      break;
    case 'instrument':
    case 'quoteDetail':
      if (
        keys !== 'mercado,simbolo' ||
        !IOL_MARKETS.some((market) => market === parameters['mercado']) ||
        !validSymbol(parameters['simbolo'])
      )
        return denied();
      path = `/api/v2/${parameters['mercado'] as string}/Titulos/${parameters['simbolo']}`;
      if (operation === 'quoteDetail') path += '/CotizacionDetalle';
      break;
    default:
      return denied();
  }
  const request = Object.freeze({
    origin: TRUSTED_ORIGIN,
    method: 'GET',
    path,
  });
  validateRequest(request);
  return request;
}
