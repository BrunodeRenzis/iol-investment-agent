import type { IolError } from '../error';
import type { SchemaDiagnostic } from './schema-diagnostic';
import { SECURITY_TYPES, type SecurityType } from './security-types';

type Casing =
  | 'all_upper'
  | 'all_lower'
  | 'first_upper'
  | 'first_lower'
  | 'mixed';
type Separators = 'none' | 'underscore' | 'space' | 'mixed';
type Fingerprint = Readonly<
  | {
      foldsToV2Member: SecurityType;
      casing: Casing;
      separators: Separators;
      padded: boolean;
    }
  | { foldsToV2Member: 'ambiguous' }
  | {
      foldsToV2Member: 'none';
      charset: 'ascii_letters' | 'ascii_word' | 'other';
    }
>;

// Diagnostic-only folding. Never used to decode or construct a DTO.
function fold(value: string): string {
  return value.toLowerCase().replace(/[ _]/g, '');
}
const members = new Map<string, SecurityType | 'ambiguous'>();
for (const member of SECURITY_TYPES) {
  const key = fold(member);
  members.set(key, members.has(key) ? 'ambiguous' : member);
}

function classify(value: string): Fingerprint {
  // Reject controls as well as non-ASCII; never trim, truncate or fold Unicode.
  if (value.length > 64 || /[^\x20-\x7e]/.test(value))
    return Object.freeze({ foldsToV2Member: 'none', charset: 'other' });
  const member = members.get(fold(value));
  if (member === undefined)
    return Object.freeze({
      foldsToV2Member: 'none',
      charset: /^[A-Za-z]+$/.test(value)
        ? 'ascii_letters'
        : /^[A-Za-z0-9_]+$/.test(value)
          ? 'ascii_word'
          : 'other',
    });
  if (member === 'ambiguous')
    return Object.freeze({ foldsToV2Member: 'ambiguous' });
  const letters = value.replace(/[ _]/g, '');
  const canonical = member.replace(/_/g, '');
  // Uniform case takes precedence. First_* means the canonical pattern with
  // only its first letter forced to that case; all other patterns are mixed.
  const casing: Casing =
    letters === letters.toUpperCase()
      ? 'all_upper'
      : letters === letters.toLowerCase()
        ? 'all_lower'
        : letters === canonical.charAt(0).toUpperCase() + canonical.slice(1)
          ? 'first_upper'
          : letters === canonical.charAt(0).toLowerCase() + canonical.slice(1)
            ? 'first_lower'
            : 'mixed';
  const underscore = value.includes('_');
  const space = value.includes(' ');
  return Object.freeze({
    foldsToV2Member: member,
    casing,
    separators: underscore
      ? space
        ? 'mixed'
        : 'underscore'
      : space
        ? 'space'
        : 'none',
    padded: value.startsWith(' ') || value.endsWith(' '),
  });
}

const fingerprints = new WeakMap<object, Fingerprint>();
function bound(diagnostic: SchemaDiagnostic | undefined): boolean {
  return diagnostic?.path === 'instrument.tipo' && diagnostic.kind === 'enum';
}

/** Called only by the title type decoder's rejection branch; no raw value retained. */
export function recordRejectedEnumFingerprint(
  error: unknown,
  value: unknown,
  diagnostic: SchemaDiagnostic | undefined,
): void {
  if (
    typeof error === 'object' &&
    error !== null &&
    typeof value === 'string' &&
    bound(diagnostic)
  )
    fingerprints.set(error, classify(value));
}

export function rejectedEnumFingerprint(
  error: unknown,
  operation: string | undefined,
  diagnostic: SchemaDiagnostic | undefined,
): Fingerprint | undefined {
  return operation === 'instrument' &&
    bound(diagnostic) &&
    typeof error === 'object' &&
    error !== null
    ? fingerprints.get(error)
    : undefined;
}

/** Copy only trusted frozen metadata, never properties supplied by an exception. */
export function propagateEnumFingerprint(
  source: unknown,
  target: IolError,
  operation: string,
  diagnostic: SchemaDiagnostic | undefined,
): void {
  const fingerprint = rejectedEnumFingerprint(source, operation, diagnostic);
  if (fingerprint) fingerprints.set(target, fingerprint);
}
