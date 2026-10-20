const ERROR_CODES = [
  'allowlist_rejection',
  'invalid_payload',
  'network_failure',
  'timeout',
  'authentication_failure',
  'session_aborted',
  'authorization_failure',
  'unexpected_status',
  'redirect_rejected',
  'offline_fixture_missing',
  'runtime_rejected',
  'terminal_unavailable',
] as const;
export type IolErrorCode = (typeof ERROR_CODES)[number];

/** No external message, body, URL, credential or cause is attached. */
export class IolError extends Error {
  readonly code: IolErrorCode;
  constructor(code: IolErrorCode) {
    const safeCode = ERROR_CODES.includes(code) ? code : 'network_failure';
    super(`IOL adapter: ${safeCode}`);
    this.code = safeCode;
    this.name = 'IolError';
    Object.freeze(this);
  }
}
