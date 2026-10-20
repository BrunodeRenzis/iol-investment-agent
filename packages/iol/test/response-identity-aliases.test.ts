import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createOfflineIolAdapter, type IolMarket } from '../src';
import { createAdapter } from '../src/internal/adapter';
import { makeRequest } from '../src/internal/allowlist';
import { schemaDiagnostic } from '../src/internal/schema-diagnostic';
import { instrumentFixture, portfolioFixture, quoteFixture } from './fixtures';

function diagnostic(path: string, kind = 'enum') {
  return (error: unknown): boolean => {
    assert.deepEqual(schemaDiagnostic(error), { path, kind });
    return true;
  };
}

void test('only the documented title type alias canonicalizes; Swagger types remain accepted', async () => {
  for (const [wire, canonical] of [
    ['CEDEARS', 'cEDEARS'],
    ['cEDEARS', 'cEDEARS'],
    ['titulosPublicos', 'titulosPublicos'],
    ['aCCIONES', 'aCCIONES'],
    ['oPCIONES', 'oPCIONES'],
  ]) {
    const result = await createOfflineIolAdapter({
      instrument: instrumentFixture.replace('titulosPublicos', wire!),
    }).getInstrument('bCBA', 'AL30');
    assert.equal(result.tipo, canonical);
    assert.equal(result.mercado, 'bCBA');
    assert.equal(result.simbolo, 'AL30');
    assert.equal(Object.isFrozen(result), true);
  }
  for (const wire of [
    'cedears',
    'Cedears',
    'CEDEAR',
    'CEDEARS ',
    'ACCIONES',
    'UNKNOWN',
  ])
    await assert.rejects(
      createOfflineIolAdapter({
        instrument: instrumentFixture.replace('titulosPublicos', wire),
      }).getInstrument('bCBA', 'AL30'),
      diagnostic('instrument.tipo'),
    );
});

void test('portfolio titles reuse the title type alias without changing other fields', async () => {
  const result = await createOfflineIolAdapter({
    portfolio: portfolioFixture.replace('titulosPublicos', 'CEDEARS'),
  }).getPortfolio('argentina');
  assert.equal(result.activos[0]?.titulo.tipo, 'cEDEARS');
  assert.equal(result.activos[0]?.titulo.pais, 'argentina');
  assert.equal(result.activos[0]?.titulo.plazo, 't0');
  assert.equal(result.activos[0]?.titulo.moneda, 'dolar_Estadounidense');
});

void test('quote market canonicalizes only bcba and retains every canonical market', async () => {
  for (const market of [
    'bCBA',
    'nYSE',
    'nASDAQ',
    'aMEX',
    'bCS',
    'rOFX',
  ] as const) {
    const result = await createOfflineIolAdapter({
      quoteDetail: quoteFixture.replace('bCBA', market),
    }).getQuoteDetail(market, 'AL30');
    assert.equal(result.mercado, market);
  }
  const result = await createOfflineIolAdapter({
    quoteDetail: quoteFixture.replace('bCBA', 'bcba'),
  }).getQuoteDetail('bCBA', 'AL30');
  assert.equal(result.mercado, 'bCBA');
  assert.equal(result.simbolo, 'AL30');
  for (const wire of [
    'BCBA',
    'Bcba',
    'bCbA',
    'bcba ',
    'NYSE',
    'nyse',
    'UNKNOWN',
  ])
    await assert.rejects(
      createOfflineIolAdapter({
        quoteDetail: quoteFixture.replace('bCBA', wire),
      }).getQuoteDetail('bCBA', 'AL30'),
      diagnostic('quoteDetail.mercado'),
    );
});

void test('canonicalization never bypasses response market or symbol identity checks', async () => {
  const adapter = createOfflineIolAdapter({
    instrument: instrumentFixture.replace('titulosPublicos', 'CEDEARS'),
    quoteDetail: quoteFixture.replace('bCBA', 'bcba'),
  });
  await assert.rejects(
    adapter.getInstrument('bCBA', 'OTHER'),
    diagnostic('instrument', 'malformed'),
  );
  await assert.rejects(
    adapter.getQuoteDetail('nYSE', 'AL30'),
    diagnostic('quoteDetail', 'malformed'),
  );
  await assert.rejects(
    adapter.getQuoteDetail('bCBA', 'OTHER'),
    diagnostic('quoteDetail', 'malformed'),
  );
});

void test('other-context identity spellings stay rejected in both response decoders', async () => {
  for (const [field, previous, wire] of [
    ['pais', 'argentina', 'Argentina'],
    ['plazo', 't0', 'T0'],
    ['moneda', 'dolar_Estadounidense', 'Peso_Argentino'],
    ['tipo', 'titulosPublicos', 'ACCIONES'],
    ['mercado', 'bCBA', 'BCBA'],
  ] as const) {
    const adapter = createOfflineIolAdapter({
      instrument: instrumentFixture.replace(previous, wire),
      quoteDetail: quoteFixture.replace(previous, wire),
    });
    await assert.rejects(
      adapter.getInstrument('bCBA', 'AL30'),
      diagnostic(`instrument.${field}`),
    );
    await assert.rejects(
      adapter.getQuoteDetail('bCBA', 'AL30'),
      diagnostic(`quoteDetail.${field}`),
    );
  }
  await assert.rejects(
    createOfflineIolAdapter({
      quoteDetail: quoteFixture.replace('titulosPublicos', 'CEDEARS'),
    }).getQuoteDetail('bCBA', 'AL30'),
    diagnostic('quoteDetail.tipo'),
  );
});

void test('response aliases add no request capability and preserve exact approved routes', async () => {
  const requests: unknown[] = [];
  const adapter = createAdapter({
    read: (request) => {
      requests.push(request);
      return Promise.resolve(
        request.path.endsWith('/CotizacionDetalle')
          ? quoteFixture.replace('bCBA', 'bcba')
          : instrumentFixture.replace('titulosPublicos', 'CEDEARS'),
      );
    },
  });
  for (const market of ['bcba', 'BCBA', 'NYSE']) {
    assert.throws(() => adapter.getInstrument(market as IolMarket, 'AL30'), {
      code: 'allowlist_rejection',
    });
    assert.throws(() => adapter.getQuoteDetail(market as IolMarket, 'AL30'), {
      code: 'allowlist_rejection',
    });
  }
  assert.throws(
    () =>
      makeRequest('instrument', {
        mercado: 'bCBA',
        simbolo: 'AL30',
        tipo: 'CEDEARS',
      }),
    { code: 'allowlist_rejection' },
  );
  assert.equal(requests.length, 0);
  await adapter.getInstrument('bCBA', 'AL30');
  await adapter.getQuoteDetail('bCBA', 'AL30');
  assert.deepEqual(requests, [
    {
      origin: 'https://api.invertironline.com',
      method: 'GET',
      path: '/api/v2/bCBA/Titulos/AL30',
    },
    {
      origin: 'https://api.invertironline.com',
      method: 'GET',
      path: '/api/v2/bCBA/Titulos/AL30/CotizacionDetalle',
    },
  ]);
});
