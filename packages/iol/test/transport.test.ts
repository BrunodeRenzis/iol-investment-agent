import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import * as publicApi from '../src';
import { createAdapter } from '../src/internal/adapter';
import { makeRequest } from '../src/internal/allowlist';
import { MAX_RESPONSE_BYTES } from '../src/internal/json';
import { AuthenticatedReadTransport } from '../src/internal/transport';
import {
  accountFixture,
  instrumentFixture,
  portfolioFixture,
  quoteFixture,
} from './fixtures';

// Synthetic test sentinel; never obtained from IOL or from environment variables.
const marker = 'synthetic-secret-sentinel';
const code =
  (expected: publicApi.IolErrorCode) =>
  (error: unknown): boolean => {
    assert.ok(error instanceof publicApi.IolError);
    assert.equal(error.code, expected);
    assert.equal(inspect(error).includes(marker), false);
    assert.equal(JSON.stringify(error).includes(marker), false);
    assert.equal('cause' in error, false);
    return true;
  };
void test('authenticated transport constructs only GET with manual redirects and sanitized body', async () => {
  let calls = 0;
  const fakeFetch: typeof fetch = (input, init) => {
    calls++;
    assert.equal(input, 'https://api.invertironline.com/api/v2/estadocuenta');
    assert.equal(init?.method, 'GET');
    assert.equal(init?.redirect, 'manual');
    assert.equal(init?.credentials, 'omit');
    assert.equal(
      new Headers(init?.headers).get('authorization'),
      `Bearer ${marker}`,
    );
    return Promise.resolve(
      new Response(accountFixture, {
        headers: { 'content-type': 'application/json' },
      }),
    );
  };
  const transport = new AuthenticatedReadTransport(marker, fakeFetch);
  const adapter = createAdapter(transport);
  assert.equal((await adapter.getAccountState()).cuentas.length, 2);
  assert.equal(calls, 1);
  assert.equal(JSON.stringify(transport).includes(marker), false);
  assert.equal(
    inspect(transport, { showHidden: true }).includes(marker),
    false,
  );
  assert.deepEqual(Object.keys(transport), []);
  assert.equal(JSON.stringify(adapter), '{}');
  assert.deepEqual(Object.keys(adapter).sort(), [
    'getAccountState',
    'getInstrument',
    'getPortfolio',
    'getQuoteDetail',
  ]);
});
void test('cross-origin redirects cannot trigger a second credential-bearing request', async () => {
  for (const status of [301, 302, 303, 307, 308]) {
    let calls = 0;
    const transport = new AuthenticatedReadTransport(marker, (_input, init) => {
      calls++;
      assert.equal(init?.redirect, 'manual');
      return Promise.resolve(
        new Response(marker, {
          status,
          headers: { location: 'https://attacker.invalid/steal' },
        }),
      );
    });
    await assert.rejects(
      transport.read(makeRequest('accountState')),
      code('redirect_rejected'),
    );
    assert.equal(calls, 1);
  }
});
void test('already-followed redirect response is rejected even with HTTP 200', async () => {
  const response = new Response('{}', {
    headers: { 'content-type': 'application/json' },
  });
  Object.defineProperty(response, 'redirected', { value: true });
  await assert.rejects(
    new AuthenticatedReadTransport(marker, () =>
      Promise.resolve(response),
    ).read(makeRequest('accountState')),
    code('redirect_rejected'),
  );
});
void test('status categories do not parse or expose undocumented error bodies and never retry', async () => {
  for (const [status, expected] of [
    [401, 'authentication_failure'],
    [403, 'authorization_failure'],
    [400, 'unexpected_status'],
    [404, 'unexpected_status'],
    [429, 'unexpected_status'],
    [500, 'unexpected_status'],
    [204, 'unexpected_status'],
  ] as const) {
    let calls = 0;
    const transport = new AuthenticatedReadTransport(marker, () => {
      calls++;
      return Promise.resolve(
        new Response(status === 204 ? null : marker, { status }),
      );
    });
    await assert.rejects(
      transport.read(makeRequest('accountState')),
      code(expected),
    );
    assert.equal(calls, 1);
  }
});
void test('network and mock transport errors cannot echo credentials or causes', async () => {
  const transport = new AuthenticatedReadTransport(marker, () =>
    Promise.reject(new Error(marker)),
  );
  await assert.rejects(
    createAdapter(transport).getAccountState(),
    code('network_failure'),
  );
  await assert.rejects(
    createAdapter({
      read: () => Promise.reject(new Error(marker)),
    }).getAccountState(),
    code('network_failure'),
  );
  await assert.rejects(
    publicApi
      .createOfflineIolAdapter({ accountState: marker })
      .getAccountState(),
    code('invalid_payload'),
  );
});
void test('timeout aborts fetch even if a mock ignores cancellation', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let signal: AbortSignal | undefined;
  const transport = new AuthenticatedReadTransport(marker, (_input, init) => {
    signal = init?.signal ?? undefined;
    return new Promise<Response>(() => undefined);
  });
  const result = assert.rejects(
    transport.read(makeRequest('accountState')),
    code('timeout'),
  );
  context.mock.timers.tick(10_000);
  await result;
  assert.equal(signal?.aborted, true);
});
void test('non-JSON, oversized and invalid UTF-8 bodies fail without including raw values', async () => {
  for (const response of [
    new Response(marker),
    new Response(' '.repeat(MAX_RESPONSE_BYTES + 1), {
      headers: { 'content-type': 'application/json' },
    }),
    new Response(new Uint8Array([0xff]), {
      headers: { 'content-type': 'application/json' },
    }),
  ]) {
    const adapter = createAdapter(
      new AuthenticatedReadTransport(marker, () => Promise.resolve(response)),
    );
    await assert.rejects(adapter.getAccountState(), code('invalid_payload'));
  }
});

void test('payload identity must match the requested instrument or country', async () => {
  const adapter = publicApi.createOfflineIolAdapter({
    portfolio: portfolioFixture,
    instrument: instrumentFixture,
    quoteDetail: quoteFixture,
  });
  await assert.rejects(
    adapter.getPortfolio('estados_Unidos'),
    code('invalid_payload'),
  );
  await assert.rejects(
    adapter.getInstrument('nYSE', 'AL30'),
    code('invalid_payload'),
  );
  await assert.rejects(
    adapter.getQuoteDetail('bCBA', 'AL30D'),
    code('invalid_payload'),
  );
});

void test('malformed bearer input and forged error codes cannot expose supplied values', () => {
  for (const token of ['', `${marker}\n`, `${marker}\r`, `${marker} value`]) {
    assert.throws(
      () =>
        new AuthenticatedReadTransport(token, () => {
          throw new Error('Network forbidden');
        }),
      code('authentication_failure'),
    );
  }
  const error = new publicApi.IolError(marker as publicApi.IolErrorCode);
  assert.ok(code('network_failure')(error));
});

void test('package exports deny direct access to internal authenticated transport', () => {
  const requireFromHere = createRequire(__filename);
  assert.throws(
    () => requireFromHere.resolve('@iol-agent/iol/internal/transport'),
    {
      code: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
    },
  );
});
void test('public factory stays offline, immutable and exports no credential/transport API', async (context) => {
  const network = context.mock.method(globalThis, 'fetch', () => {
    throw new Error('Network forbidden');
  });
  const adapter = publicApi.createOfflineIolAdapter({
    accountState: accountFixture,
  });
  await adapter.getAccountState();
  await assert.rejects(
    adapter.getPortfolio('argentina'),
    code('offline_fixture_missing'),
  );
  assert.equal(network.mock.callCount(), 0);
  assert.ok(Object.isFrozen(adapter));
  assert.deepEqual(Object.keys(publicApi).sort(), [
    'IOL_COUNTRIES',
    'IOL_MARKETS',
    'IolError',
    'createOfflineIolAdapter',
  ]);
});

void test('disposal cancels pending reads immediately and prevents token reuse even when fetch ignores abort', async () => {
  let calls = 0;
  let signal: AbortSignal | null | undefined;
  const transport = new AuthenticatedReadTransport(marker, (_url, init) => {
    calls++;
    signal = init?.signal;
    return new Promise<Response>(() => undefined);
  });
  const pending = assert.rejects(
    transport.read(makeRequest('accountState')),
    code('timeout'),
  );
  transport.dispose();
  await pending;
  assert.equal(signal?.aborted, true);
  await assert.rejects(
    transport.read(makeRequest('accountState')),
    code('authentication_failure'),
  );
  assert.equal(calls, 1);
});
