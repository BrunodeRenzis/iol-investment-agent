import { url as inspectorUrl } from 'node:inspector';
import { IolError } from '../error';

const BLOCKED_ENV = new Set([
  'NODE_OPTIONS',
  'NODE_TLS_REJECT_UNAUTHORIZED',
  'NODE_EXTRA_CA_CERTS',
  'NODE_USE_SYSTEM_CA',
  'NODE_USE_ENV_PROXY',
  'HTTPS_PROXY',
  'HTTP_PROXY',
  'ALL_PROXY',
  'NODE_V8_COVERAGE',
  'SSLKEYLOGFILE',
  'NODE_REDIRECT_WARNINGS',
  'VSCODE_INSPECTOR_OPTIONS',
  'VSCODE_JS_DEBUG_OPTIONS',
]);

/** Names only. Even empty variables and lowercase aliases fail closed. */
export function validateManualRuntime(
  environmentKeys: readonly string[],
  execArgs: readonly string[],
  inspectorActive: boolean,
): void {
  if (
    inspectorActive ||
    execArgs.length ||
    environmentKeys.some((key) => BLOCKED_ENV.has(key.toUpperCase()))
  ) {
    throw new IolError('runtime_rejected');
  }
}

/** Sole environment access in this package; never read a value or broker secret. */
export function assertManualRuntime(): void {
  try {
    validateManualRuntime(
      Object.keys(process.env),
      process.execArgv,
      inspectorUrl() !== undefined,
    );
  } catch {
    throw new IolError('runtime_rejected');
  }
}
