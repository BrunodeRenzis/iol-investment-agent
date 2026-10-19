import { parse } from 'lossless-json';
import {
  payloadFailure,
  requiredKind,
  schemaFailure,
} from './schema-diagnostic';

export const MAX_RESPONSE_BYTES = 1_048_576;

/** Opaque lexical number: never converted to a JS Number, even temporarily. */
class NumericLexeme {
  constructor(readonly text: string) {
    Object.freeze(this);
  }
}

function validateNumbers(value: unknown, path: string): void {
  if (value instanceof NumericLexeme) {
    if (/[eE]/.test(value.text)) throw schemaFailure('exponent', path);
    if (!/^-?(?:0|[1-9][0-9]{0,99})(?:\.[0-9]{1,100})?$/.test(value.text))
      throw schemaFailure('range', path);
  } else if (Array.isArray(value)) {
    for (const item of value as unknown[]) validateNumbers(item, `${path}[]`);
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value))
      validateNumbers(item, `${path}.${key}`);
  }
}

export function parseWireJson(text: string, path = 'payload'): unknown {
  try {
    if (
      typeof text !== 'string' ||
      Buffer.byteLength(text, 'utf8') > MAX_RESPONSE_BYTES
    )
      throw schemaFailure('range', path);
    const value: unknown = parse(text, null, {
      // Preserve lexical tokens first; validation still completes before return.
      parseNumber: (literal: string) => new NumericLexeme(literal),
      onDuplicateKey: () => {
        throw schemaFailure('malformed', path);
      },
    });
    validateNumbers(value, path);
    return value;
  } catch (error: unknown) {
    throw payloadFailure(error, path);
  }
}

export function decimal(value: unknown, path = 'payload'): string {
  if (!(value instanceof NumericLexeme))
    throw schemaFailure(requiredKind(value), path);
  return value.text;
}

export function int32(value: unknown, path = 'payload'): string {
  const text = decimal(value, path);
  if (!/^-?(?:0|[1-9][0-9]*)$/.test(text)) throw schemaFailure('type', path);
  const integer = BigInt(text);
  if (integer < -2147483648n || integer > 2147483647n)
    throw schemaFailure('range', path);
  return text;
}

export type Decoder<T> = (value: unknown, path?: string) => T;
export type Decoded<D> = D extends Decoder<infer T> ? T : never;

export const stringValue: Decoder<string> = (value, path = 'payload') => {
  if (typeof value !== 'string') throw schemaFailure(requiredKind(value), path);
  if (value.length > 4096) throw schemaFailure('range', path);
  return value;
};
export function enumeration<const T extends readonly string[]>(
  values: T,
): Decoder<T[number]> {
  return (value, path = 'payload') => {
    if (typeof value !== 'string')
      throw schemaFailure(requiredKind(value), path);
    if (!values.includes(value)) throw schemaFailure('enum', path);
    return value;
  };
}
export function optional<T>(decode: Decoder<T>): Decoder<T | null | undefined> {
  return (value, path) =>
    value === undefined || value === null ? value : decode(value, path);
}
export function array<T>(decode: Decoder<T>): Decoder<readonly T[]> {
  return (value, path = 'payload') => {
    if (!Array.isArray(value)) throw schemaFailure(requiredKind(value), path);
    if (value.length > 10000) throw schemaFailure('range', path);
    return Object.freeze(
      value.map((item: unknown) => decode(item, `${path}[]`)),
    );
  };
}

/** Unknown fields rejected; discarded identifiers are validated but never returned. */
export function object<const S extends Record<string, Decoder<unknown>>>(
  fields: S,
  discarded: Readonly<Record<string, Decoder<unknown>>> = {},
): Decoder<{ readonly [K in keyof S]: Decoded<S[K]> }> {
  return (value, path = 'payload') => {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      value instanceof NumericLexeme
    )
      throw schemaFailure(requiredKind(value), path);
    const source = value as Record<string, unknown>;
    for (const key of Object.keys(source)) {
      if (!Object.hasOwn(fields, key) && !Object.hasOwn(discarded, key))
        throw schemaFailure('unknown_fields', path);
    }
    const result: Record<string, unknown> = {};
    for (const [key, decode] of Object.entries(fields)) {
      const decoded = decode(
        Object.hasOwn(source, key) ? source[key] : undefined,
        `${path}.${key}`,
      );
      if (decoded !== undefined) result[key] = decoded;
    }
    for (const [key, decode] of Object.entries(discarded))
      decode(
        Object.hasOwn(source, key) ? source[key] : undefined,
        `${path}.${key}`,
      );
    // Each field is validated above; the mapped type preserves the decoder result.
    return Object.freeze(result) as { readonly [K in keyof S]: Decoded<S[K]> };
  };
}
