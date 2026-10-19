import { parse } from 'lossless-json';
import { IolError } from '../error';

export const MAX_RESPONSE_BYTES = 1_048_576;

/** Opaque lexical number: never converted to a JS Number, even temporarily. */
class NumericLexeme {
  constructor(readonly text: string) {
    Object.freeze(this);
  }
}

function invalid(): never {
  throw new IolError('invalid_payload');
}

export function parseWireJson(text: string): unknown {
  try {
    if (
      typeof text !== 'string' ||
      Buffer.byteLength(text, 'utf8') > MAX_RESPONSE_BYTES
    )
      return invalid();
    return parse(text, null, {
      parseNumber: (literal: string) => {
        // Validate a token already recognized by the JSON parser, not raw JSON.
        // Reject exponents explicitly until runtime evidence justifies supporting them.
        if (
          !/^-?(?:0|[1-9][0-9]{0,99})(?:\.[0-9]{1,100})$/.test(literal) &&
          !/^-?(?:0|[1-9][0-9]{0,99})$/.test(literal)
        )
          return invalid();
        return new NumericLexeme(literal);
      },
      onDuplicateKey: () => invalid(),
    });
  } catch {
    return invalid();
  }
}

export function decimal(value: unknown): string {
  if (!(value instanceof NumericLexeme)) return invalid();
  return value.text;
}

export function int32(value: unknown): string {
  const text = decimal(value);
  if (!/^-?(?:0|[1-9][0-9]*)$/.test(text)) return invalid();
  const integer = BigInt(text);
  if (integer < -2147483648n || integer > 2147483647n) return invalid();
  return text;
}

export type Decoder<T> = (value: unknown) => T;
export type Decoded<D> = D extends Decoder<infer T> ? T : never;

export const stringValue: Decoder<string> = (value) => {
  if (typeof value !== 'string' || value.length > 4096) return invalid();
  return value;
};
export function enumeration<const T extends readonly string[]>(
  values: T,
): Decoder<T[number]> {
  return (value) => {
    if (typeof value !== 'string' || !values.includes(value)) return invalid();
    return value;
  };
}
export function optional<T>(decode: Decoder<T>): Decoder<T | null | undefined> {
  return (value) =>
    value === undefined || value === null ? value : decode(value);
}
export function array<T>(decode: Decoder<T>): Decoder<readonly T[]> {
  return (value) => {
    if (!Array.isArray(value) || value.length > 10000) return invalid();
    return Object.freeze(value.map((item: unknown) => decode(item)));
  };
}

/** Unknown fields rejected; discarded identifiers are validated but never returned. */
export function object<const S extends Record<string, Decoder<unknown>>>(
  fields: S,
  discarded: Readonly<Record<string, Decoder<unknown>>> = {},
): Decoder<{ readonly [K in keyof S]: Decoded<S[K]> }> {
  return (value) => {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      value instanceof NumericLexeme
    )
      return invalid();
    const source = value as Record<string, unknown>;
    for (const key of Object.keys(source)) {
      if (!Object.hasOwn(fields, key) && !Object.hasOwn(discarded, key))
        return invalid();
    }
    const result: Record<string, unknown> = {};
    for (const [key, decode] of Object.entries(fields)) {
      const decoded = decode(
        Object.hasOwn(source, key) ? source[key] : undefined,
      );
      if (decoded !== undefined) result[key] = decoded;
    }
    for (const [key, decode] of Object.entries(discarded))
      decode(Object.hasOwn(source, key) ? source[key] : undefined);
    // Each field is validated above; the mapped type preserves the decoder result.
    return Object.freeze(result) as { readonly [K in keyof S]: Decoded<S[K]> };
  };
}
