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
): Promise<boolean> {
  if (args.length || execArgs.length) {
    io.write('Inicio rechazado: no se admiten argumentos ni opciones de Node.');
    return false;
  }
  const controller = new AbortController();
  let session: ManualReadSession | undefined;
  let credentials: PasswordGrantCredentials | undefined;
  let username: string | undefined;
  let password: string | undefined;
  const stop = (): void => {
    controller.abort();
    session?.dispose();
  };
  stopSignal.addEventListener('abort', stop, { once: true });
  if (stopSignal.aborted) stop();
  const timer = setTimeout(stop, MANUAL_SESSION_MS);
  try {
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
    session = await credentials.authenticate(fetcher, controller.signal);
    credentials = undefined;
    session.signal.addEventListener('abort', stop, { once: true });
    if (session.signal.aborted) stop();
    const adapter = createAdapter(session);
    const performed = new Set<string>();
    io.write(
      'Autenticación validada. Sesión breve en memoria, sin refresh ni re-login.',
    );
    while (!controller.signal.aborted) {
      io.write(
        'Orden recomendado: 1 instrumento (bCBA/AL30), 2 cotización detalle (bCBA/AL30), 3 estado de cuenta, 4 portfolio (argentina). Una lectura por acción. salir termina. No repetir acciones.',
      );
      const choice = await io.readHidden('action', controller.signal);
      if (choice === 'salir') return true;
      if (controller.signal.aborted)
        throw new IolError('authentication_failure');
      if (performed.has(choice)) throw new IolError('allowlist_rejection');
      performed.add(choice);
      switch (choice) {
        case '1':
          io.write(
            instrumentSummary(await adapter.getInstrument('bCBA', 'AL30')),
          );
          break;
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
      if (performed.size === 4) return true;
    }
    throw new IolError('authentication_failure');
  } catch (error: unknown) {
    // Never inspect/serialize the external exception, cause, field names or payload.
    const code = new IolError(
      error instanceof IolError ? error.code : 'invalid_payload',
    ).code;
    io.write(
      JSON.stringify({
        operation: 'session',
        status: 'stopped',
        category: code,
      }),
    );
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
