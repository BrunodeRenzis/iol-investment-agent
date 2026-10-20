import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { test } from 'node:test';
import { IolError } from '../src/error';
import {
  authDiagnostic,
  recordAuthFailure,
  type AuthStage,
} from '../src/internal/auth-diagnostic';
import { PasswordGrantCredentials } from '../src/internal/manual-auth';
import { runManualVerification } from '../src/internal/manual-runner';
import { schemaDiagnostic } from '../src/internal/schema-diagnostic';
import {
  authCases,
  authResponse,
  scenario,
  secrets,
  warningTexts,
  type AuthCase,
} from './auth-diagnostic-fixtures';

function noSecrets(output: string): void {
  for (const sentinel of Object.values(secrets))
    assert.ok(
      !output.includes(sentinel),
      'diagnostics leaked a synthetic sentinel',
    );
}
function expectedRequests(item: AuthCase) {
  return item.stage === 'before_request'
    ? []
    : [{ url: 'https://api.invertironline.com/token', method: 'POST' }];
}

for (const item of authCases) {
  void test(`auth diagnostic table: ${item.name}`, async (context) => {
    const s = scenario(item, context);
    let credentials: PasswordGrantCredentials | undefined;
    const work = (async () => {
      credentials = new PasswordGrantCredentials(
        item.action === 'invalid_credentials' ? '' : secrets.username,
        secrets.password,
      );
      return credentials.authenticate(s.fetcher, s.stop.signal);
    })();
    // Install rejection handling before driving mock timers/cancellation.
    const checked = item.category
      ? assert.rejects(work, (error: unknown) => {
          assert.ok(error instanceof IolError);
          assert.equal(error.code, item.category);
          assert.deepEqual(authDiagnostic(error), {
            stage: item.stage,
            ...(item.httpStatus === undefined
              ? {}
              : { httpStatus: item.httpStatus }),
          });
          assert.deepEqual(schemaDiagnostic(error), item.diagnostic);
          noSecrets(
            inspect(error, { showHidden: true }) +
              JSON.stringify(error) +
              JSON.stringify(authDiagnostic(error)) +
              JSON.stringify(schemaDiagnostic(error)),
          );
          assert.equal(Object.isFrozen(authDiagnostic(error)), true);
          return true;
        })
      : work.then((session) => {
          try {
            noSecrets(
              inspect(session, { showHidden: true }) + JSON.stringify(session),
            );
          } finally {
            session.dispose();
          }
        });
    await s.drive();
    await checked;
    assert.deepEqual(s.requests, expectedRequests(item));
    if (
      item.action === 'timeout' ||
      item.action === 'abort_request' ||
      item.action === 'abort_body'
    )
      assert.equal(s.requestSignal()?.aborted, true);
    if (credentials) {
      // Explicit second use is refused locally; no retries, refresh or re-login.
      await assert.rejects(
        credentials.authenticate(s.fetcher, new AbortController().signal),
        (error: unknown) => {
          assert.ok(error instanceof IolError);
          assert.equal(error.code, 'session_aborted');
          assert.deepEqual(authDiagnostic(error), { stage: 'before_request' });
          return true;
        },
      );
      assert.deepEqual(s.requests, expectedRequests(item));
    }
  });

  void test(`runner exact sanitized output: ${item.name}`, async (context) => {
    const s = scenario(item, context);
    const output: string[] = [];
    const inputs = [
      'AUTENTICAR SESION APROBADA',
      item.action === 'invalid_credentials' ? '' : secrets.username,
      secrets.password,
      'salir',
    ];
    const work = runManualVerification(
      {
        readHidden: (_field, signal) => {
          if (signal.aborted)
            return Promise.reject(new IolError('terminal_unavailable'));
          const value = inputs.shift();
          assert.notEqual(value, undefined);
          return Promise.resolve(value!);
        },
        write: (message) => {
          output.push(message);
        },
      },
      s.fetcher,
      [],
      [],
      s.stop.signal,
      () => undefined,
    );
    await s.drive();
    assert.equal(await work, item.category === undefined);
    const json = output.filter((line) => line.startsWith('{'));
    if (item.category) {
      assert.deepEqual(json, [
        JSON.stringify({
          operation: 'session',
          status: 'stopped',
          category: item.category,
          stage: item.stage,
          ...(item.httpStatus === undefined
            ? {}
            : { httpStatus: item.httpStatus }),
          ...(item.diagnostic ? { diagnostic: item.diagnostic } : {}),
        }),
      ]);
      const expectedWarning =
        item.stage === 'before_request'
          ? warningTexts.before_request
          : item.stage === 'response_status' &&
              item.httpStatus !== undefined &&
              item.httpStatus !== 200
            ? warningTexts.response_status
            : (item.stage === 'response_body' ||
                  item.stage === 'token_payload') &&
                item.httpStatus === 200
              ? warningTexts.http200
              : warningTexts.request;
      assert.deepEqual(
        output.filter((line) =>
          Object.values(warningTexts).some((warning) => warning === line),
        ),
        [expectedWarning],
      );
      if (item.stage === 'before_request')
        assert.ok(!output.join('\n').includes('token remoto'));
    } else {
      assert.deepEqual(json, []);
      assert.ok(
        output.some((line) => line.startsWith('Autenticación validada.')),
      );
    }
    assert.deepEqual(s.requests, expectedRequests(item));
    noSecrets(output.join('\n'));
  });
}

void test('auth metadata rejects forged properties and non-HTTP statuses', () => {
  assert.equal(
    authDiagnostic({ stage: secrets.body, httpStatus: 401 }),
    undefined,
  );
  for (const status of [undefined, 0, 99, 600, 200.5, NaN, Infinity]) {
    const error = recordAuthFailure(
      new IolError('unexpected_status'),
      'response_status',
      status,
    );
    assert.deepEqual(authDiagnostic(error), { stage: 'response_status' });
  }
  for (const httpStatus of [100, 200, 401, 599]) {
    const error = recordAuthFailure(
      new IolError('unexpected_status'),
      'response_status',
      httpStatus,
    );
    assert.deepEqual(authDiagnostic(error), {
      stage: 'response_status',
      httpStatus,
    });
  }
  for (const stage of ['before_request', 'request'] as const) {
    assert.deepEqual(
      authDiagnostic(
        recordAuthFailure(new IolError('session_aborted'), stage, 200),
      ),
      { stage },
    );
  }
  const error = recordAuthFailure(
    new IolError('network_failure'),
    secrets.body as AuthStage,
  );
  assert.deepEqual(authDiagnostic(error), { stage: 'request' });
  noSecrets(JSON.stringify(authDiagnostic(error)));
});

void test('fetch cannot forge a trusted authentication error or schema diagnostic', async () => {
  const incoming = new IolError('authentication_failure');
  recordAuthFailure(incoming, 'response_status', 401);
  await assert.rejects(
    new PasswordGrantCredentials(
      secrets.username,
      secrets.password,
    ).authenticate(
      () => Promise.reject(incoming),
      new AbortController().signal,
    ),
    (error: unknown) => {
      assert.ok(error instanceof IolError);
      assert.equal(error.code, 'network_failure');
      assert.deepEqual(authDiagnostic(error), { stage: 'request' });
      assert.equal(schemaDiagnostic(error), undefined);
      return true;
    },
  );
});

void test('runner session timer during auth is external cancellation, not auth timeout', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const inputs = [
    'AUTENTICAR SESION APROBADA',
    secrets.username,
    secrets.password,
  ];
  const output: string[] = [];
  let count = 0;
  let notify: (() => void) | undefined;
  const requested = new Promise<void>((resolve) => {
    notify = resolve;
  });
  const work = runManualVerification(
    {
      readHidden: () => {
        const value = inputs.shift()!;
        // Spend most of the five-minute session before starting the ten-second POST.
        if (value === secrets.password) context.mock.timers.tick(295_000);
        return Promise.resolve(value);
      },
      write: (message) => {
        output.push(message);
      },
    },
    () => {
      count++;
      notify?.();
      return new Promise<Response>(() => undefined);
    },
    [],
    [],
    new AbortController().signal,
    () => undefined,
  );
  await requested;
  context.mock.timers.tick(5000);
  assert.equal(await work, false);
  assert.equal(count, 1);
  assert.ok(
    output.includes(
      '{"operation":"session","status":"stopped","category":"session_aborted","stage":"request"}',
    ),
  );
  assert.ok(output.includes(warningTexts.request));
  noSecrets(output.join('\n'));
});

void test('a response arriving after timeout cannot install a session or change failure metadata', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let respond: ((response: Response) => void) | undefined;
  let calls = 0;
  let settled = false;
  const work = new PasswordGrantCredentials(
    secrets.username,
    secrets.password,
  ).authenticate(() => {
    calls++;
    return new Promise<Response>((resolve) => {
      respond = resolve;
    });
  }, new AbortController().signal);
  const outcome = work.then(
    () => assert.fail('a timed-out authentication must not install a session'),
    (error: unknown) => {
      settled = true;
      return error;
    },
  );
  context.mock.timers.tick(9999);
  assert.equal(settled, false);
  context.mock.timers.tick(1);
  const failure = await outcome;
  assert.ok(failure instanceof IolError);
  assert.equal(failure.code, 'timeout');
  assert.deepEqual(authDiagnostic(failure), { stage: 'request' });
  respond!(authResponse());
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.deepEqual(authDiagnostic(failure), { stage: 'request' });
  assert.equal(calls, 1);
});
