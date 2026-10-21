import { IolError } from '../error';
import { propagateEnumFingerprint } from './enum-fingerprint';

const KINDS = [
  'missing',
  'null',
  'type',
  'enum',
  'exponent',
  'range',
  'unknown_fields',
  'malformed',
] as const;
export type FailureKind = (typeof KINDS)[number];
export interface SchemaDiagnostic {
  readonly path: string;
  readonly kind: FailureKind;
}

// Independent output allowlist: no property names, symbols or array indices from
// a response are ever retained in a diagnostic unless they match this vocabulary.
const paths = new Map<string, string>();
function allow(root: string, names: readonly string[] = []): void {
  paths.set(root, root);
  for (const name of names) {
    const path = `${root}.${name}`;
    paths.set(path, path);
  }
}
const identity = ['simbolo', 'mercado', 'pais', 'tipo', 'plazo', 'moneda'];
allow('payload');
allow('token', [
  'access_token',
  'refresh_token',
  'token_type',
  'expires_in',
  'unknown',
]);
allow('instrument', [...identity, 'descripcion']);
allow('quoteDetail', [
  ...identity,
  'ultimoPrecio',
  'fechaHora',
  'variacion',
  'apertura',
  'maximo',
  'minimo',
  'cierreAnterior',
  'montoOperado',
  'volumenNominal',
  'precioPromedio',
  'precioAjuste',
  'interesesAbiertos',
  'cantidadOperaciones',
  'descripcionTitulo',
  'tendencia',
  'laminaMinima',
  'lote',
  'cantidadMinima',
  'puntosVariacion',
  'puntas',
]);
allow('quoteDetail.puntas[]', [
  'cantidadCompra',
  'precioCompra',
  'precioVenta',
  'cantidadVenta',
]);
allow('accountState', ['cuentas', 'totalEnPesos', 'estadisticas']);
allow('accountState.cuentas[]', [
  'tipo',
  'moneda',
  'estado',
  'numero',
  'disponible',
  'comprometido',
  'saldo',
  'titulosValorizados',
  'total',
  'margenDescubierto',
  'saldos',
]);
allow('accountState.cuentas[].saldos[]', [
  'liquidacion',
  'saldo',
  'comprometido',
  'disponible',
  'disponibleOperar',
]);
allow('accountState.estadisticas[]', ['descripcion', 'cantidad', 'volumen']);
allow('portfolio', ['pais', 'activos']);
allow('portfolio.activos[]', [
  'titulo',
  'cantidad',
  'comprometido',
  'puntosVariacion',
  'variacionDiaria',
  'ultimoPrecio',
  'ppc',
  'gananciaPorcentaje',
  'gananciaDinero',
  'valorizado',
  'parking',
]);
allow('portfolio.activos[].titulo', [...identity, 'descripcion']);
allow('portfolio.activos[].parking', ['disponibleInmediato']);

const diagnostics = new WeakMap<object, SchemaDiagnostic>();
export function schemaFailure(kind: FailureKind, path = 'payload'): IolError {
  const error = new IolError('invalid_payload');
  diagnostics.set(
    error,
    Object.freeze({
      path: paths.get(path) ?? 'payload',
      kind: KINDS.includes(kind) ? kind : 'malformed',
    }),
  );
  return error;
}
export function schemaDiagnostic(error: unknown): SchemaDiagnostic | undefined {
  return typeof error === 'object' && error !== null
    ? diagnostics.get(error)
    : undefined;
}
export function payloadFailure(
  error: unknown,
  fallbackPath = 'payload',
): IolError {
  const diagnostic = schemaDiagnostic(error);
  const safeError = schemaFailure(
    diagnostic?.kind ?? 'malformed',
    diagnostic?.path ?? fallbackPath,
  );
  propagateEnumFingerprint(error, safeError, fallbackPath, diagnostic);
  return safeError;
}
export function requiredKind(value: unknown): FailureKind {
  return value === undefined ? 'missing' : value === null ? 'null' : 'type';
}
