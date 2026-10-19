import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { test } from 'node:test';
import { IolError } from '../src';
import { PasswordGrantCredentials } from '../src/internal/manual-auth';
import { makeRequest } from '../src/internal/allowlist';
import { AuthenticatedReadTransport } from '../src/internal/transport';
import { MAX_ACCESS_TOKEN_LENGTH } from '../src/internal/token-policy';

// Deliberately synthetic sentinels, never loaded from the environment/provider.
export const tokenFixture =
  '{"access_token":"synthetic-access-sentinel","token_type":"bearer","expires_in":900,"refresh_token":"synthetic-refresh-sentinel",".issued":"uninterpreted",".expires":"uninterpreted",".refreshexpires":"unknown"}';
const markers = [
  'synthetic-user-sentinel',
  'synthetic-password-sentinel',
  'synthetic-access-sentinel',
  'synthetic-refresh-sentinel',
];
export function jsonResponse(body = tokenFixture): Response {
  return new Response(body, {
    headers: { 'content-type': 'application/json' },
  });
}
const credentials = (): PasswordGrantCredentials =>
  new PasswordGrantCredentials(markers[0]!, markers[1]!);
const safeError = (error: unknown): boolean => {
  assert.ok(error instanceof IolError);
  for (const marker of markers) {
    assert.ok(!inspect(error, { showHidden: true }).includes(marker));
    assert.ok(!JSON.stringify(error).includes(marker));
  }
  assert.equal('cause' in error, false);
  return true;
};

void test('password grant binds the only auth tuple and drops credentials after one use', async () => {
  let calls = 0;
  const fetcher: typeof fetch = (url, init) => {
    calls++;
    assert.equal(url, 'https://api.invertironline.com/token');
    assert.equal(init?.method, 'POST');
    assert.equal(init?.redirect, 'manual');
    assert.equal(init?.credentials, 'omit');
    const headers = new Headers(init?.headers);
    assert.equal(
      headers.get('content-type'),
      'application/x-www-form-urlencoded',
    );
    assert.equal(headers.has('authorization'), false);
    assert.equal(typeof init?.body, 'string');
    const form = new URLSearchParams(init?.body as string);
    assert.deepEqual([...form.keys()].sort(), [
      'grant_type',
      'password',
      'username',
    ]);
    assert.equal(form.get('grant_type'), 'password');
    assert.equal(form.get('username'), markers[0]);
    assert.equal(form.get('password'), markers[1]);
    return Promise.resolve(jsonResponse());
  };
  const secret = credentials();
  for (const marker of markers)
    assert.ok(!inspect(secret, { showHidden: true }).includes(marker));
  assert.deepEqual(Object.keys(secret), []);
  const session = await secret.authenticate(
    fetcher,
    new AbortController().signal,
  );
  try {
    for (const value of [secret, session])
      for (const marker of markers) {
        assert.ok(!JSON.stringify(value).includes(marker));
        assert.ok(!inspect(value, { showHidden: true }).includes(marker));
        assert.ok(
          !inspect(value, { showHidden: true, customInspect: false }).includes(
            marker,
          ),
        );
      }
    await assert.rejects(
      secret.authenticate(fetcher, new AbortController().signal),
      safeError,
    );
    assert.equal(calls, 1);
  } finally {
    session.dispose();
  }
  await assert.rejects(session.read(makeRequest('accountState')), safeError);
  assert.equal(calls, 1);
});

for (const status of [301, 302, 303, 307, 308, 400, 401, 403, 429, 500]) {
  void test(`auth status ${status} stops after exactly one request with no retry`, async () => {
    let calls = 0;
    const secret = credentials();
    const fetcher: typeof fetch = () => {
      calls++;
      return Promise.resolve(
        new Response(markers.join(' '), {
          status,
          headers: { location: 'https://other.invalid' },
        }),
      );
    };
    await assert.rejects(
      secret.authenticate(fetcher, new AbortController().signal),
      safeError,
    );
    await assert.rejects(
      secret.authenticate(fetcher, new AbortController().signal),
      safeError,
    );
    assert.equal(calls, 1);
  });
}

void test('auth rejects unknown fields, malformed/missing tokens, type and expiry without exposure', async () => {
  for (const body of [
    '{}',
    'null',
    '[]',
    tokenFixture.replace('900', '0'),
    tokenFixture.replace('900', '-1'),
    tokenFixture.replace('900', '1.5'),
    tokenFixture.replace('900', '1e3'),
    tokenFixture.replace('900', '2147483648'),
    tokenFixture.replace('"bearer"', '"unknown"'),
    tokenFixture.replace('synthetic-access-sentinel', 'invalid token'),
    tokenFixture.replace('"access_token":', '"unexpected":'),
    tokenFixture.replace('"unknown"', 'null'),
    tokenFixture.replace(
      /}$/,
      ',"sensitiveUnexpected":"synthetic-password-sentinel"}',
    ),
  ])
    await assert.rejects(
      credentials().authenticate(
        () => Promise.resolve(jsonResponse(body)),
        new AbortController().signal,
      ),
      safeError,
    );
});

void test('auth rejects wrong content type, oversized body, invalid UTF-8 and external errors', async () => {
  for (const response of [
    new Response(tokenFixture),
    jsonResponse(' '.repeat(65_537)),
    new Response(new Uint8Array([255]), {
      headers: { 'content-type': 'application/json' },
    }),
  ]) {
    await assert.rejects(
      credentials().authenticate(
        () => Promise.resolve(response),
        new AbortController().signal,
      ),
      safeError,
    );
  }
  await assert.rejects(
    credentials().authenticate(
      () => Promise.reject(new Error(markers.join(' '))),
      new AbortController().signal,
    ),
    safeError,
  );
  await assert.rejects(
    credentials().authenticate(() => {
      throw new Error(markers.join(' '));
    }, new AbortController().signal),
    safeError,
  );
});

void test('auth timeout aborts without retries even if the injected fetch never settles', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  let signal: AbortSignal | null | undefined;
  const work = credentials().authenticate((_url, init) => {
    calls++;
    signal = init?.signal;
    return new Promise<Response>(() => undefined);
  }, new AbortController().signal);
  const assertion = assert.rejects(work, safeError);
  context.mock.timers.tick(10_000);
  await assertion;
  assert.equal(signal?.aborted, true);
  assert.equal(calls, 1);
});

void test('local session expires and never refreshes or reuses the password', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  const session = await credentials().authenticate(() => {
    calls++;
    return Promise.resolve(jsonResponse());
  }, new AbortController().signal);
  context.mock.timers.tick(300_000);
  assert.equal(session.signal.aborted, true);
  await assert.rejects(session.read(makeRequest('accountState')), safeError);
  assert.equal(calls, 1);
});

void test('shorter expires_in ends the session; pre-cancelled auth never calls fetch', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  const fetcher: typeof fetch = () => {
    calls++;
    return Promise.resolve(jsonResponse(tokenFixture.replace('900', '1')));
  };
  const session = await credentials().authenticate(
    fetcher,
    new AbortController().signal,
  );
  context.mock.timers.tick(1000);
  assert.equal(session.signal.aborted, true);
  const stop = new AbortController();
  stop.abort();
  await assert.rejects(
    credentials().authenticate(fetcher, stop.signal),
    safeError,
  );
  assert.equal(calls, 1);
});

void test('issued and transported access tokens share the same dedicated length limit', async () => {
  for (const length of [MAX_ACCESS_TOKEN_LENGTH - 1, MAX_ACCESS_TOKEN_LENGTH]) {
    const token = 'Q'.repeat(length);
    const fetcher: typeof fetch = () =>
      Promise.resolve(
        jsonResponse(tokenFixture.replace('synthetic-access-sentinel', token)),
      );
    const session = await credentials().authenticate(
      fetcher,
      new AbortController().signal,
    );
    const transport = new AuthenticatedReadTransport(token, fetcher);
    try {
      assert.ok(!inspect(session).includes(token));
      assert.ok(!JSON.stringify(transport).includes(token));
    } finally {
      session.dispose();
      transport.dispose();
    }
  }
  const token = 'Q'.repeat(MAX_ACCESS_TOKEN_LENGTH + 1);
  const safe = (error: unknown): boolean => {
    assert.ok(error instanceof IolError);
    assert.equal(error.code, 'authentication_failure');
    assert.ok(!inspect(error).includes(token));
    assert.ok(!JSON.stringify(error).includes(token));
    return true;
  };
  let calls = 0;
  const fetcher: typeof fetch = () => {
    calls++;
    return Promise.resolve(
      jsonResponse(tokenFixture.replace('synthetic-access-sentinel', token)),
    );
  };
  await assert.rejects(
    credentials().authenticate(fetcher, new AbortController().signal),
    safe,
  );
  assert.throws(() => new AuthenticatedReadTransport(token, fetcher), safe);
  assert.equal(calls, 1);
});
