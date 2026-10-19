import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  IolError,
  IOL_COUNTRIES,
  IOL_MARKETS,
  type IolCountry,
  type IolMarket,
} from '../src';
import { createAdapter } from '../src/internal/adapter';
import {
  makeRequest,
  TRUSTED_ORIGIN,
  validateRequest,
} from '../src/internal/allowlist';
import { AuthenticatedReadTransport } from '../src/internal/transport';

const denied = (error: unknown): boolean =>
  error instanceof IolError && error.code === 'allowlist_rejection';

void test('invalid public operation parameters never reach the injected transport', () => {
  let calls = 0;
  const adapter = createAdapter({
    read: () => {
      calls++;
      return Promise.resolve('{}');
    },
  });
  assert.throws(() => adapter.getPortfolio('unknown' as IolCountry), denied);
  assert.throws(
    () => adapter.getInstrument('BCBA' as IolMarket, 'AL30'),
    denied,
  );
  assert.throws(() => adapter.getQuoteDetail('bCBA', 'AL30?x=1'), denied);
  assert.equal(calls, 0);
});
void test('four read operations bind exact path parameters and no query names', () => {
  assert.equal(validateRequest(makeRequest('accountState')), 'accountState');
  for (const pais of IOL_COUNTRIES)
    assert.equal(
      validateRequest(makeRequest('portfolio', { pais })),
      'portfolio',
    );
  for (const mercado of IOL_MARKETS)
    for (const operation of ['instrument', 'quoteDetail'] as const) {
      assert.equal(
        validateRequest(makeRequest(operation, { mercado, simbolo: 'AL30D' })),
        operation,
      );
    }
  assert.throws(() => makeRequest('accountState', { query: 'x' }), denied);
  assert.throws(
    () => makeRequest('portfolio', { country: 'argentina' }),
    denied,
  );
  assert.throws(
    () => makeRequest('portfolio', { pais: 'argentina', extra: 1 }),
    denied,
  );
  assert.throws(
    () => makeRequest('quoteDetail', { mercado: 'BCBA', simbolo: 'AL30' }),
    denied,
  );
  assert.throws(() => makeRequest('portfolio', { pais: 'Argentina' }), denied);
});

const paths = [
  '/api/micuenta/miportafolio',
  '/api/v2/datos-perfil',
  '/api/v2/operaciones',
  '/api/v2/operaciones/123',
  '/api/v2/operar/Comprar',
  '/api/v2/OperatoriaSimplificada/Validar/1/2',
  '/api/v2/asesores/test-inversor',
  '/api/v2/Asesor/Movimientos',
  '/api/v2/cotizaciones-orleans/X/Y/Todos',
  '/api/v2/Cotizaciones/MEP/X',
  '/api/v2/Notificacion',
  '/api/v2/bCBA/Titulos/AL30/Cotizacion',
  '/api/v2/bCBA/Titulos/AL30/Cotizacion/seriehistorica',
  '/api/v2/estadocuenta?x=1',
  '/api/v2/estadocuenta?',
  '/api/v2/estadocuenta#x',
  '/api/v2//estadocuenta',
  '/api/v2/estadocuenta/',
  '/api/v2/../v2/estadocuenta',
  '/api/v2/%65stadocuenta',
  '/api/v2/portafolio/Argentina',
  '/api/v2/portafolio/nope',
  '/api/v2/BCBA/Titulos/AL30',
  '/api/v2/bCBA/Titulos/AL30%2f..',
  '/api/v2/bCBA/Titulos/AL30%252f',
  '/api/v2/bCBA/Titulos/..',
  '/api/v2/bCBA/Titulos/A\\B',
  '/api/v2/bCBA/Titulos/A/B',
  '/api/v2/bCBA/Titulos/aapl',
  '/api/v2/bCBA/Titulos/A B',
  '/api/v2/bCBA/Titulos/A\n',
  '/api/v2/bCBA/Titulos/',
  '/token',
  '/unknown',
];
for (const [index, path] of paths.entries())
  void test(`unsafe path ${index + 1} is denied before transport invocation`, async () => {
    let calls = 0;
    const transport = new AuthenticatedReadTransport('synthetic-marker', () => {
      calls++;
      throw new Error('must not run');
    });
    await assert.rejects(
      transport.read({ origin: TRUSTED_ORIGIN, method: 'GET', path }),
      denied,
    );
    assert.equal(calls, 0);
  });

void test('origin/method checks reject normalization and alternate-host tricks before fetch', async () => {
  let calls = 0;
  const transport = new AuthenticatedReadTransport('synthetic-marker', () => {
    calls++;
    throw new Error('must not run');
  });
  for (const origin of [
    'http://api.invertironline.com',
    'https://api.invertironline.com/',
    'https://api.invertironline.com:443',
    'https://API.invertironline.com',
    'https://api.invertironline.com.evil.test',
    'https://sub.api.invertironline.com',
    'http://localhost',
    'https://evil.test@api.invertironline.com',
  ]) {
    await assert.rejects(
      transport.read({ origin, method: 'GET', path: '/api/v2/estadocuenta' }),
      denied,
    );
  }
  for (const method of ['DELETE', 'POST', 'PUT', 'PATCH', 'HEAD', 'get'])
    await assert.rejects(
      transport.read({
        origin: TRUSTED_ORIGIN,
        method,
        path: '/api/v2/estadocuenta',
      }),
      denied,
    );
  assert.equal(calls, 0);
});

void test('symbol routing grammar is bounded and rejects delimiters, traversal and encoding', () => {
  for (const simbolo of [
    '',
    '.',
    '..',
    'A.B',
    'A/B',
    'A\\B',
    'A B',
    'A\t',
    'A\0',
    'A?x',
    'A#x',
    'A%2f',
    'AL30\n',
    'A'.repeat(33),
    'Á',
    'aapl',
  ]) {
    assert.throws(
      () => makeRequest('instrument', { mercado: 'bCBA', simbolo }),
      denied,
    );
  }
  for (const simbolo of [
    'AL30',
    'AL30D',
    'AL30C',
    'AAPL',
    '123',
    'A'.repeat(32),
  ])
    assert.equal(
      validateRequest(makeRequest('instrument', { mercado: 'bCBA', simbolo })),
      'instrument',
    );
});
