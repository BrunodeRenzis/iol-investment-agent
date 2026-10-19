import { IolError } from '../error';

export const MAX_ACCESS_TOKEN_LENGTH = 16_384;

/** Dedicated bearer policy shared by issuance decoding and authenticated reads. */
export function accessTokenValue(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length > MAX_ACCESS_TOKEN_LENGTH ||
    /[^A-Za-z0-9._~+/=-]/.test(value) ||
    !/^[A-Za-z0-9._~+/-]+={0,2}$/.test(value)
  ) {
    throw new IolError('authentication_failure');
  }
  return value;
}
