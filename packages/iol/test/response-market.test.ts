import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createOfflineIolAdapter, type IolMarket } from '../src';
import { makeRequest } from '../src/internal/allowlist';
import { createAdapter } from '../src/internal/adapter';
import { runManualVerification } from '../src/internal/manual-runner';
import * as summaries from '../src/internal/manual-summary';
import { schemaDiagnostic } from '../src/internal/schema-diagnostic';
import { instrumentFixture, portfolioFixture, quoteFixture } from './fixtures';

// V2 canonical spellings; D personal title/portfolio examples only (ADR-023).
const cases = [
  ['bCBA', 'bCBA'],
  ['nYSE', 'nYSE'],
  ['nASDAQ', 'nASDAQ'],
  ['aMEX', 'aMEX'],
  ['bCS', 'bCS'],
  ['rOFX', 'rOFX'],
  ['bcba', 'bCBA'],
  ['NYSE', 'nYSE'],
] as const;

for (const [wire, canonical] of cases)
  void test(`documented title market ${wire} decodes to ${canonical} and matches canonical request identity`, async () => {
    const adapter = createOfflineIolAdapter({
      instrument: instrumentFixture.replace('bCBA', wire),
    });
    const result = await adapter.getInstrument(canonical, 'AL30');
    assert.equal(result.mercado, canonical);
    assert.equal(Object.isFrozen(result), true);
    assert.deepEqual(
      makeRequest('instrument', { mercado: canonical, simbolo: 'AL30' }),
      {
        method: 'GET',
        origin: 'https://api.invertironline.com',
        path: `/api/v2/${canonical}/Titulos/AL30`,
      },
    );
  });

for (const wire of [
  'BCBA',
  'Bcba',
  'bCbA',
  'Nyse',
  'nyse',
  'NASDAQ',
  'UNKNOWN',
  'bcba ',
  '__proto__',
])
  void test(`undocumented personal title market ${wire} remains an enum error`, async () => {
    await assert.rejects(
      createOfflineIolAdapter({
        instrument: instrumentFixture.replace('bCBA', wire),
      }).getInstrument('bCBA', 'AL30'),
      (error: unknown) => {
        assert.deepEqual(schemaDiagnostic(error), {
          path: 'instrument.mercado',
          kind: 'enum',
        });
        assert.ok(!JSON.stringify(error).includes(wire));
        return true;
      },
    );
  });

void test('response aliases never grant request aliases or change quote decoding', async () => {
  let reads = 0;
  const adapter = createAdapter({
    read: () => {
      reads++;
      return Promise.resolve(instrumentFixture);
    },
  });
  for (const mercado of ['bcba', 'NYSE', 'BCBA']) {
    assert.throws(() => adapter.getInstrument(mercado as IolMarket, 'AL30'), {
      code: 'allowlist_rejection',
    });
    assert.throws(
      () => makeRequest('instrument', { mercado, simbolo: 'AL30' }),
      { code: 'allowlist_rejection' },
    );
  }
  assert.equal(reads, 0);
  await assert.rejects(
    createOfflineIolAdapter({
      quoteDetail: quoteFixture.replace('bCBA', 'bcba'),
    }).getQuoteDetail('bCBA', 'AL30'),
    (error: unknown) => {
      assert.deepEqual(schemaDiagnostic(error), {
        path: 'quoteDetail.mercado',
        kind: 'enum',
      });
      return true;
    },
  );
});

void test('shared portfolio title decoder canonicalizes only mercado', async () => {
  const result = await createOfflineIolAdapter({
    portfolio: portfolioFixture.replace('bCBA', 'NYSE'),
  }).getPortfolio('argentina');
  assert.equal(result.activos[0]?.titulo.mercado, 'nYSE');
  assert.equal(result.activos[0]?.titulo.moneda, 'dolar_Estadounidense');
  assert.equal(result.activos[0]?.titulo.tipo, 'titulosPublicos');
});

for (const wire of ['bCBA', 'bcba', 'NYSE'])
  void test(`mock login -> action 1 -> ${wire} response preserves canonical identity and the exact request`, async (context) => {
    const summary = context.mock.method(summaries, 'instrumentSummary');
    const inputs = [
      'AUTENTICAR SESION APROBADA',
      'synthetic-user',
      'synthetic-password',
      '1',
      'salir',
    ];
    const output: string[] = [];
    const calls: { method: string | undefined; url: unknown }[] = [];
    const ok = await runManualVerification(
      {
        readHidden: () => {
          const input = inputs.shift();
          assert.notEqual(input, undefined);
          return Promise.resolve(input!);
        },
        write: (message) => {
          output.push(message);
        },
      },
      (url, init) => {
        calls.push({ method: init?.method, url });
        return Promise.resolve(
          new Response(
            init?.method === 'POST'
              ? '{"access_token":"synthetic-access","token_type":"bearer","expires_in":900}'
              : instrumentFixture.replace('bCBA', wire),
            { headers: { 'content-type': 'application/json' } },
          ),
        );
      },
      [],
      [],
      new AbortController().signal,
      () => undefined,
    );
    assert.deepEqual(calls, [
      { method: 'POST', url: 'https://api.invertironline.com/token' },
      {
        method: 'GET',
        url: 'https://api.invertironline.com/api/v2/bCBA/Titulos/AL30',
      },
    ]);
    if (wire === 'NYSE') {
      // Recognized alias for a DIFFERENT market must still fail identity matching.
      assert.equal(ok, false);
      assert.equal(summary.mock.callCount(), 0);
      assert.ok(
        output.includes(
          '{"operation":"session","status":"stopped","category":"invalid_payload","diagnostic":{"path":"instrument","kind":"malformed"}}',
        ),
      );
    } else {
      assert.equal(ok, true);
      assert.equal(summary.mock.callCount(), 1);
      assert.equal(summary.mock.calls[0]!.arguments[0].mercado, 'bCBA');
    }
    assert.ok(!output.join('\n').includes('synthetic-'));
  });
