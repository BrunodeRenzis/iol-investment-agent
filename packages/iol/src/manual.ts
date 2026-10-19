import { createTerminalIO } from './internal/manual-terminal';
import { runManualVerification } from './internal/manual-runner';
import { assertManualRuntime } from './internal/manual-preflight';
import { IolError } from './error';

/** Separate user-run process. Never imported by the package root or API. */
async function main(): Promise<void> {
  assertManualRuntime();
  const stop = new AbortController();
  const cancel = (): void => stop.abort();
  process.once('SIGINT', cancel);
  process.once('SIGTERM', cancel);
  process.stdout.on('error', cancel);
  try {
    const io = createTerminalIO(process.stdin, process.stdout);
    const ok = await runManualVerification(
      io,
      globalThis.fetch,
      process.argv.slice(2),
      process.execArgv,
      stop.signal,
    );
    if (!ok) process.exitCode = 1;
  } finally {
    process.off('SIGINT', cancel);
    process.off('SIGTERM', cancel);
    // Keep stdout's safe error handler until process exit, including pending writes.
    if (process.stdin.isTTY && process.stdin.isRaw)
      process.stdin.setRawMode(false);
    process.stdin.pause();
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    process.stderr.write(
      JSON.stringify({
        status: 'stopped',
        category:
          error instanceof IolError
            ? new IolError(error.code).code
            : 'terminal_unavailable',
      }) + '\n',
    );
    process.exitCode = 1;
  });
}
