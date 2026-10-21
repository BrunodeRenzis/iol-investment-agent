import { IolError } from '../error';
import { createAdapter } from './adapter';
import {
  MANUAL_SESSION_MS,
  PasswordGrantCredentials,
  type ManualReadSession,
} from './manual-auth';
import {
  accountSummary,
  instrumentSummary,
  portfolioSummary,
  quoteSummary,
} from './manual-summary';
import { assertManualRuntime } from './manual-preflight';
import { schemaDiagnostic } from './schema-diagnostic';
import { rejectedEnumFingerprint } from './enum-fingerprint';
import {
  authDiagnostic,
  authWarning,
  recordAuthFailure,
} from './auth-diagnostic';

export type InputField = 'action' | 'username' | 'password';
export interface ManualIO {
  readHidden(field: InputField, signal: AbortSignal): Promise<string>;
  write(message: string): void;
}

/** Internal orchestration. No environment access, automatic login, read or retry. */
export async function runManualVerification(
  io: ManualIO,
  fetcher: typeof fetch,
  args: readonly string[],
  execArgs: readonly string[],
  stopSignal: AbortSignal,
  preflight: () => void = assertManualRuntime,
): Promise<boolean> {
  if (args.length || execArgs.length) {
    io.write(
      JSON.stringify({ status: 'stopped', category: 'runtime_rejected' }),
    );
    return false;
  }
  const controller = new AbortController();
  let session: ManualReadSession | undefined;
  let credentials: PasswordGrantCredentials | undefined;
  let username: string | undefined;
  let password: string | undefined;
  let diagnosticOperation: 'instrument' | undefined;
  const stop = (): void => {
    controller.abort();
    session?.dispose();
  };
  stopSignal.addEventListener('abort', stop, { once: true });
  if (stopSignal.aborted) stop();
  const timer = setTimeout(stop, MANUAL_SESSION_MS);
  try {
    preflight();
    io.write(
      'Verificación REAL read-only. Requiere revisión independiente y aprobación previa de Bruno. No usar desde un agente, terminal grabada o depurador.',
    );
    io.write(
      'Sin requests al iniciar. Escribí AUTENTICAR SESION APROBADA para una autenticación; salir para terminar. Entrada oculta, sin pegar texto.',
    );
    const action = await io.readHidden('action', controller.signal);
    if (action === 'salir') return true;
    if (action !== 'AUTENTICAR SESION APROBADA')
      throw new IolError('allowlist_rejection');
    username = await io.readHidden('username', controller.signal);
    password = await io.readHidden('password', controller.signal);
    credentials = new PasswordGrantCredentials(username, password);
    username = undefined;
    password = undefined;
    preflight();
    session = await credentials.authenticate(fetcher, controller.signal);
    credentials = undefined;
    session.signal.addEventListener('abort', stop, { once: true });
    if (session.signal.aborted) stop();
    const adapter = createAdapter(session);
    let nextAction = 1;
    io.write(
      'Autenticación validada. Sesión breve en memoria, sin refresh ni re-login.',
    );
    while (!controller.signal.aborted) {
      io.write(
        `Orden obligatorio: 1 instrumento, 2 cotización detalle, 3 estado de cuenta, 4 portfolio. Próxima acción: ${nextAction}. Escribí su número para confirmar o salir para terminar.`,
      );
      const choice = await io.readHidden('action', controller.signal);
      if (choice === 'salir') return true;
      if (controller.signal.aborted) throw new IolError('session_aborted');
      if (choice !== String(nextAction))
        throw new IolError('allowlist_rejection');
      preflight();
      switch (choice) {
        case '1': {
          diagnosticOperation = 'instrument';
          const instrument = await adapter.getInstrument('bCBA', 'AL30');
          diagnosticOperation = undefined;
          io.write(instrumentSummary(instrument));
          break;
        }
        case '2':
          io.write(quoteSummary(await adapter.getQuoteDetail('bCBA', 'AL30')));
          break;
        case '3':
          io.write(accountSummary(await adapter.getAccountState()));
          break;
        case '4':
          io.write(portfolioSummary(await adapter.getPortfolio('argentina')));
          break;
        default:
          throw new IolError('allowlist_rejection');
      }
      if (nextAction === 4) return true;
      nextAction++;
    }
    throw new IolError('session_aborted');
  } catch (caught: unknown) {
    const error =
      controller.signal.aborted && !authDiagnostic(caught)
        ? session
          ? new IolError('session_aborted')
          : recordAuthFailure(new IolError('session_aborted'), 'before_request')
        : caught;
    const authentication = authDiagnostic(error);
    // Never inspect/serialize the external exception, cause, field names or payload.
    const code = new IolError(
      error instanceof IolError ? error.code : 'invalid_payload',
    ).code;
    const fingerprint =
      code === 'invalid_payload'
        ? rejectedEnumFingerprint(
            error,
            diagnosticOperation,
            schemaDiagnostic(error),
          )
        : undefined;
    io.write(
      JSON.stringify({
        operation: 'session',
        status: 'stopped',
        category: code,
        ...(authentication ?? {}),
        ...(schemaDiagnostic(error)
          ? { diagnostic: schemaDiagnostic(error) }
          : {}),
        ...(fingerprint ? { rejectedEnumFingerprint: fingerprint } : {}),
      }),
    );
    if (authentication && !session) io.write(authWarning(authentication));
    return false;
  } finally {
    clearTimeout(timer);
    stopSignal.removeEventListener('abort', stop);
    session?.signal.removeEventListener('abort', stop);
    session?.dispose();
    session = undefined;
    credentials?.dispose();
    credentials = undefined;
    username = undefined;
    password = undefined;
    io.write(
      'Sesión terminada. Referencias liberadas; JavaScript no garantiza borrado criptográfico de memoria.',
    );
  }
}
