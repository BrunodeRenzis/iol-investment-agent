import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  runManualVerification,
  type InputField,
  type ManualIO,
} from '../src/internal/manual-runner';
import { validateManualRuntime } from '../src/internal/manual-preflight';
import { MAX_ACCESS_TOKEN_LENGTH } from '../src/internal/token-policy';
import {
  accountFixture,
  instrumentFixture,
  portfolioFixture,
  quoteFixture,
} from './fixtures';

const auth =
  '{"access_token":"synthetic-runner-access","token_type":"bearer","expires_in":900,"refresh_token":"synthetic-runner-refresh"}';
const user = 'synthetic-runner-user';
const password = 'synthetic-runner-password';
const login = ['AUTENTICAR SESION APROBADA', user, password];
const response = (body: string): Response =>
  new Response(body, { headers: { 'content-type': 'application/json' } });
function harness(
  inputs: string[],
  readResponse: () => Promise<Response> = () =>
    Promise.resolve(response(instrumentFixture)),
) {
  const output: string[] = [];
  const prompts: InputField[] = [];
  const calls: { url: unknown; method: string | undefined }[] = [];
  const io: ManualIO = {
    write: (message) => {
      output.push(message);
    },
    readHidden: (field) => {
      prompts.push(field);
      const next = inputs.shift();
      if (next === undefined) throw new Error('unexpected prompt');
      return Promise.resolve(next);
    },
  };
  const fetcher: typeof fetch = (url, init) => {
    calls.push({ url, method: init?.method });
    return init?.method === 'POST'
      ? Promise.resolve(response(auth))
      : readResponse();
  };
  return { io, fetcher, output, prompts, calls };
}
const run = (h: ReturnType<typeof harness>): Promise<boolean> =>
  runManualVerification(
    h.io,
    h.fetcher,
    [],
    [],
    new AbortController().signal,
    () => validateManualRuntime([], [], false),
  );

void test('startup and exit perform no network request or credential prompt', async () => {
  const h = harness(['salir']);
  assert.equal(await run(h), true);
  assert.deepEqual(h.calls, []);
  assert.deepEqual(h.prompts, ['action']);
});
void test('runner rejects every CLI/Node argument before input or network and never echoes it', async () => {
  for (const [args, execArgs] of [
    [[password], []],
    [[], ['--env-file=.env']],
    [[], ['--inspect']],
  ]) {
    const h = harness([]);
    assert.equal(
      await runManualVerification(
        h.io,
        h.fetcher,
        args!,
        execArgs!,
        new AbortController().signal,
      ),
      false,
    );
    assert.equal(h.prompts.length, 0);
    assert.equal(h.calls.length, 0);
    assert.ok(!h.output.join('\n').includes(password));
  }
});
void test('invalid startup action does not request credentials or call transport', async () => {
  const h = harness(['/token']);
  assert.equal(await run(h), false);
  assert.equal(h.calls.length, 0);
  assert.deepEqual(h.prompts, ['action']);
});
void test('authentication is a separate action: one POST, zero implicit reads', async () => {
  const h = harness([...login, 'salir']);
  assert.equal(await run(h), true);
  assert.deepEqual(h.calls, [
    { url: 'https://api.invertironline.com/token', method: 'POST' },
  ]);
  assert.deepEqual(h.prompts, ['action', 'username', 'password', 'action']);
});
void test('each explicit read produces one request; no chained operations or retries', async () => {
  const h = harness([...login, '1', 'salir']);
  assert.equal(await run(h), true);
  assert.deepEqual(
    h.calls.map((call) => call.method),
    ['POST', 'GET'],
  );
  assert.equal(
    h.calls[1]?.url,
    'https://api.invertironline.com/api/v2/bCBA/Titulos/AL30',
  );
});
for (const action of [
  'POST',
  '/api/v2/operar/Comprar',
  'datos-perfil',
  'historico',
  'refresh',
  'AUTENTICAR SESION APROBADA',
  '5',
]) {
  void test(`unsupported action ${action} cannot dispatch a request`, async () => {
    const h = harness([...login, action, '1']);
    assert.equal(await run(h), false);
    assert.equal(h.calls.length, 1);
  });
}
void test('repeated action stops instead of retrying; errors never advance to the next action', async () => {
  const h = harness([...login, '1', '1', '2']);
  assert.equal(await run(h), false);
  assert.equal(h.calls.length, 2);
});
for (const status of [301, 302, 303, 307, 308, 401, 429, 500]) {
  void test(`read status ${status} stops the session without retry or automatic next operation`, async () => {
    const h = harness([...login, '1', '2'], () =>
      Promise.resolve(
        new Response(password, {
          status,
          headers: { location: 'https://other.invalid' },
        }),
      ),
    );
    assert.equal(await run(h), false);
    assert.equal(h.calls.length, 2);
    assert.ok(!h.output.join('\n').includes(password));
  });
}
void test('unexpected errors and malformed payloads produce only fixed error categories', async () => {
  for (const read of [
    () => Promise.reject(new Error(password, { cause: auth })),
    () => Promise.resolve(response(auth)),
  ]) {
    const h = harness([...login, '1', '2'], read);
    assert.equal(await run(h), false);
    assert.equal(h.calls.length, 2);
    const output = h.output.join('\n');
    for (const secret of [
      password,
      user,
      auth,
      'synthetic-runner-access',
      'synthetic-runner-refresh',
    ])
      assert.ok(!output.includes(secret));
  }
});
void test('all four summaries reveal only allowlisted structure, never financial values or identifiers', async () => {
  const values = [
    instrumentFixture,
    quoteFixture,
    accountFixture,
    portfolioFixture,
  ].map((body) =>
    body.replaceAll('0.125', '987654321.123456789').replaceAll('AL30', 'AL30'),
  );
  const h = harness([...login, '1', '2', '3', '4'], () =>
    Promise.resolve(response(values.shift()!)),
  );
  assert.equal(await run(h), true);
  assert.equal(h.calls.length, 5);
  const summaries = h.output.filter((line) => line.startsWith('{')).join('\n');
  for (const secret of [
    user,
    password,
    auth,
    'synthetic-runner-access',
    'synthetic-runner-refresh',
    'FAKE-ACCOUNT',
    '12345678901234567890.123456789',
    '987654321.123456789',
    'titulosPublicos',
    'dolar_Estadounidense',
    'inversion_Argentina_Dolares',
    '2026-10-18T09:31:00',
    '2147483647',
    'AL30',
    instrumentFixture,
    accountFixture,
    quoteFixture,
    portfolioFixture,
  ])
    assert.ok(!summaries.includes(secret), 'sensitive value leaked');
  assert.ok(summaries.includes('lossless_validated'));
  assert.ok(summaries.includes('accountIdentifiers'));
});
void test('read timeout terminates without retry', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let notifyRead: (() => void) | undefined;
  const started = new Promise<void>((resolve) => {
    notifyRead = resolve;
  });
  const h = harness([...login, '1', '2'], () => {
    notifyRead?.();
    return new Promise<Response>(() => undefined);
  });
  const result = run(h);
  await started;
  context.mock.timers.tick(10_000);
  assert.equal(await result, false);
  assert.equal(h.calls.length, 2);
  assert.ok(h.output.join('\n').includes('timeout'));
});
void test('session timeout interrupts an idle hidden prompt without issuing a request', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const h = harness([]);
  h.io.readHidden = (_field, signal) =>
    new Promise<string>((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error(password)), {
        once: true,
      });
    });
  const result = run(h);
  context.mock.timers.tick(300_000);
  assert.equal(await result, false);
  assert.equal(h.calls.length, 0);
  assert.ok(!h.output.join('\n').includes(password));
});

void test('token expiry interrupts the authenticated idle session without refresh or re-login', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const h = harness([...login]);
  const originalInput = h.io.readHidden.bind(h.io);
  let idleStarted: (() => void) | undefined;
  const idle = new Promise<void>((resolve) => {
    idleStarted = resolve;
  });
  h.io.readHidden = (field, signal) => {
    if (h.prompts.length < 3) return originalInput(field, signal);
    idleStarted?.();
    return new Promise<string>((_resolve, reject) =>
      signal.addEventListener('abort', () => reject(new Error(password)), {
        once: true,
      }),
    );
  };
  let calls = 0;
  const result = runManualVerification(
    h.io,
    () => {
      calls++;
      return Promise.resolve(response(auth.replace('900', '1')));
    },
    [],
    [],
    new AbortController().signal,
    () => validateManualRuntime([], [], false),
  );
  await idle;
  context.mock.timers.tick(1000);
  assert.equal(await result, false);
  assert.equal(calls, 1);
  assert.ok(!h.output.join('\n').includes(password));
});

for (const key of ['NODE_OPTIONS', 'NODE_USE_SYSTEM_CA', 'node_use_system_ca'])
  void test(`unsafe runtime ${key} fails before any prompt or request, with only a fixed category`, async () => {
    const h = harness([]);
    assert.equal(
      await runManualVerification(
        h.io,
        h.fetcher,
        [],
        [],
        new AbortController().signal,
        () => validateManualRuntime([key], [], false),
      ),
      false,
    );
    assert.equal(h.prompts.length, 0);
    assert.equal(h.calls.length, 0);
    assert.ok(h.output.join('\n').includes('runtime_rejected'));
    assert.ok(!h.output.join('\n').includes(key));
  });

void test('reads enforce 1 -> 2 -> 3 -> 4, with cancellation and no automatic next action', async () => {
  for (const choices of [
    ['2'],
    ['3'],
    ['4'],
    ['1', '3'],
    ['1', '4'],
    ['1', '1'],
  ]) {
    const h = harness([...login, ...choices]);
    assert.equal(await run(h), false);
    assert.equal(h.calls.length, choices.length === 1 ? 1 : 2);
  }
  const bodies = [instrumentFixture, quoteFixture, accountFixture];
  const h = harness([...login, '1', '2', '3', 'salir'], () =>
    Promise.resolve(response(bodies.shift()!)),
  );
  assert.equal(await run(h), true);
  assert.equal(h.calls.length, 4);
});

for (const body of [
  auth.replace('900', '0'),
  auth.replace(
    'synthetic-runner-refresh',
    'R'.repeat(MAX_ACCESS_TOKEN_LENGTH + 1),
  ),
])
  void test('failure after possible issuance warns without retrying or exposing the token body', async () => {
    const h = harness([...login, 'AUTENTICAR SESION APROBADA']);
    let calls = 0;
    const ok = await runManualVerification(
      h.io,
      () => {
        calls++;
        return Promise.resolve(response(body));
      },
      [],
      [],
      new AbortController().signal,
      () => validateManualRuntime([], [], false),
    );
    assert.equal(ok, false);
    assert.equal(calls, 1);
    assert.deepEqual(h.prompts, ['action', 'username', 'password']);
    assert.ok(h.output.join('\n').includes('token remoto'));
    assert.ok(!h.output.join('\n').includes(auth));
    assert.ok(!h.output.join('\n').includes('synthetic-runner-access'));
    assert.ok(!h.output.join('\n').includes('RRRR'));
  });

void test('runner prints only the trusted schema diagnostic and stops before subsequent reads', async () => {
  const h = harness([...login, '1', '2'], () =>
    Promise.resolve(
      response(instrumentFixture.replace('bCBA', 'PRIVATE_REJECTED_VALUE')),
    ),
  );
  assert.equal(await run(h), false);
  assert.equal(h.calls.length, 2);
  const line = h.output.find((value) => value.startsWith('{'));
  assert.ok(line);
  assert.deepEqual(JSON.parse(line) as unknown, {
    operation: 'session',
    status: 'stopped',
    category: 'invalid_payload',
    diagnostic: { path: 'instrument.mercado', kind: 'enum' },
  });
  assert.ok(!h.output.join('\n').includes('PRIVATE_REJECTED_VALUE'));
});
