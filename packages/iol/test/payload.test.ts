import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createOfflineIolAdapter, IolError } from '../src';
import { Quantity } from '../../financial/src';
import {
  decimal,
  int32,
  parseWireJson,
  MAX_RESPONSE_BYTES,
} from '../src/internal/json';
import {
  accountFixture,
  instrumentFixture,
  portfolioFixture,
  quoteFixture,
} from './fixtures';

const invalid = (error: unknown): boolean =>
  error instanceof IolError && error.code === 'invalid_payload';
void test('financial numbers remain exact lexical strings and convert directly to a primitive', () => {
  for (const literal of [
    '0.1',
    '12345678901234567890.123456789',
    '0.' + '0'.repeat(99) + '1',
    '9'.repeat(100),
    '1.2300',
    '-0',
    '-123.45',
  ]) {
    assert.equal(decimal(parseWireJson(literal)), literal);
  }
  assert.equal(
    new Quantity(decimal(parseWireJson('12345678901234567890.123456789')))
      .value,
    '12345678901234567890.123456789',
  );
  assert.throws(() => decimal(parseWireJson('"0.1"')), invalid);
  assert.throws(() => decimal(0.1), invalid);
  assert.throws(() => decimal(parseWireJson('{"text":"0.1"}')), invalid);
});

for (const [index, literal] of [
  '1e3',
  '1E-10000',
  '1e9999',
  '0.1e0',
  '9'.repeat(101),
  '0.' + '0'.repeat(100) + '1',
  'NaN',
  'Infinity',
  '01',
  '+1',
  '.1',
  '1.',
  '--1',
  '[1,]',
  '{"x":1,}',
  '{"x":1,"x":2}',
  '{"x":"unterminated}',
  '{"x":1} trailing',
].entries()) {
  void test(`numeric/JSON malformed or unsupported case ${index + 1} fails closed`, () =>
    assert.throws(() => parseWireJson(literal), invalid));
}
void test('payload size is bounded and int32 is lexical, never truncated or rounded', () => {
  assert.throws(
    () => parseWireJson(' '.repeat(MAX_RESPONSE_BYTES + 1)),
    invalid,
  );
  for (const literal of ['0', '-2147483648', '2147483647'])
    assert.equal(int32(parseWireJson(literal)), literal);
  for (const literal of ['0.0', '1.5', '2147483648', '-2147483649'])
    assert.throws(() => int32(parseWireJson(literal)), invalid);
});
void test('offline account state preserves distinct dollar contexts and strips identifiers', async () => {
  const result = await createOfflineIolAdapter({
    accountState: accountFixture,
  }).getAccountState();
  assert.equal(result.cuentas.length, 2);
  assert.equal(result.cuentas[0]?.tipo, 'inversion_Argentina_Dolares');
  assert.equal(result.cuentas[1]?.tipo, 'inversion_Estados_Unidos_Dolares');
  assert.equal(
    result.cuentas[0]?.saldos?.[1]?.saldo,
    '12345678901234567890.123456789',
  );
  assert.equal(result.cuentas[0]?.saldo, '0');
  assert.equal(JSON.stringify(result).includes('FAKE-ACCOUNT'), false);
  assert.equal(Object.hasOwn(result.cuentas[0] ?? {}, 'numero'), false);
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.cuentas));
});
void test('portfolio, instrument and quote preserve fields without inferred semantics', async () => {
  const adapter = createOfflineIolAdapter({
    portfolio: portfolioFixture,
    instrument: instrumentFixture,
    quoteDetail: quoteFixture,
  });
  assert.equal(
    (await adapter.getPortfolio('argentina')).activos[0]?.cantidad,
    '0.125',
  );
  assert.equal((await adapter.getInstrument('bCBA', 'AL30')).plazo, 't0');
  const quote = await adapter.getQuoteDetail('bCBA', 'AL30');
  assert.equal(quote.fechaHora, '2026-10-18T09:31:00');
  assert.equal(quote.puntas?.[0]?.cantidadCompra, '0.125');
  assert.equal(quote.puntas?.[0]?.precioVenta, '0.11');
  assert.equal(quote.volumenNominal, '2147483647');
});
void test('empty portfolio and absent/null optional fields are preserved without filling data', async () => {
  const result = await createOfflineIolAdapter({
    portfolio: '{"pais":"estados_Unidos","activos":[]}',
  }).getPortfolio('estados_Unidos');
  assert.deepEqual(result.activos, []);
  const quote = instrumentFixture.replace(
    /}$/,
    ',"ultimoPrecio":0,"fechaHora":null}',
  );
  const parsed = await createOfflineIolAdapter({
    quoteDetail: quote,
  }).getQuoteDetail('bCBA', 'AL30');
  assert.equal(parsed.fechaHora, null);
  assert.equal(parsed.puntas, undefined);
  assert.equal(Object.hasOwn(parsed, 'puntas'), false);
});
for (const lastPrice of ['absent', 'null'] as const)
  void test(`quote with puntas preserves ${lastPrice} ultimoPrecio without synthesizing a price`, async () => {
    const parsed = await createOfflineIolAdapter({
      quoteDetail: `${instrumentFixture.slice(0, -1)},
        ${lastPrice === 'null' ? '"ultimoPrecio":null,' : ''}
        "puntas":[{"precioCompra":0.1,"cantidadCompra":0.125,
          "precioVenta":12345678901234567890.123456789,"cantidadVenta":1.2300}]}`,
    }).getQuoteDetail('bCBA', 'AL30');
    assert.equal(parsed.ultimoPrecio, lastPrice === 'null' ? null : undefined);
    assert.equal(Object.hasOwn(parsed, 'ultimoPrecio'), lastPrice === 'null');
    assert.deepEqual(parsed.puntas, [
      {
        precioCompra: '0.1',
        cantidadCompra: '0.125',
        precioVenta: '12345678901234567890.123456789',
        cantidadVenta: '1.2300',
      },
    ]);
  });

void test('empty puntas remains empty without a synthesized last price', async () => {
  const parsed = await createOfflineIolAdapter({
    quoteDetail: `${instrumentFixture.slice(0, -1)},"puntas":[]}`,
  }).getQuoteDetail('bCBA', 'AL30');
  assert.deepEqual(parsed.puntas, []);
  assert.equal(parsed.ultimoPrecio, undefined);
  assert.equal(Object.hasOwn(parsed, 'ultimoPrecio'), false);
});

for (const side of ['Compra', 'Venta'] as const)
  void test(`one-sided ${side} puntas stays lossless without reconstructing the other side`, async () => {
    const small = '0.' + '0'.repeat(99) + '1';
    const parsed = await createOfflineIolAdapter({
      quoteDetail: `${instrumentFixture.slice(0, -1)},"puntas":[{
        "precio${side}":12345678901234567890.123456789,"cantidad${side}":${small}}]}`,
    }).getQuoteDetail('bCBA', 'AL30');
    assert.deepEqual(parsed.puntas, [
      {
        [`precio${side}`]: '12345678901234567890.123456789',
        [`cantidad${side}`]: small,
      },
    ]);
    const missingSide = side === 'Compra' ? 'Venta' : 'Compra';
    assert.equal(
      Object.hasOwn(parsed.puntas?.[0] ?? {}, `precio${missingSide}`),
      false,
    );
    assert.equal(
      Object.hasOwn(parsed.puntas?.[0] ?? {}, `cantidad${missingSide}`),
      false,
    );
    assert.equal(parsed.ultimoPrecio, undefined);
    assert.equal(Object.hasOwn(parsed, 'ultimoPrecio'), false);
  });

void test('optional ultimoPrecio still rejects malformed or coerced numeric values', async () => {
  for (const value of ['"0.1"', 'true', '{}', '1e3'])
    await assert.rejects(
      createOfflineIolAdapter({
        quoteDetail: `${instrumentFixture.slice(0, -1)},"ultimoPrecio":${value}}`,
      }).getQuoteDetail('bCBA', 'AL30'),
      invalid,
    );
});

void test('schema rejects unknown fields/enums, casing, missing identity and shape mismatch', async () => {
  for (const body of [
    '{}',
    'null',
    '[]',
    instrumentFixture.replace('bCBA', 'BCBA'),
    instrumentFixture.replace('titulosPublicos', 'invented'),
    instrumentFixture.replace(/}$/, ',"dni":"FAKE"}'),
    instrumentFixture.replace('"simbolo":"AL30",', ''),
    instrumentFixture.replace('"plazo":"t0"', '"plazo":null'),
    instrumentFixture.replace(/}$/, ',"__proto__":{"polluted":true}}'),
  ])
    await assert.rejects(
      createOfflineIolAdapter({ instrument: body }).getInstrument(
        'bCBA',
        'AL30',
      ),
      invalid,
    );
  await assert.rejects(
    createOfflineIolAdapter({
      accountState: accountFixture.replace(
        'inversion_Argentina_Dolares',
        'Inversion_Argentina_Dolares',
      ),
    }).getAccountState(),
    invalid,
  );
  await assert.rejects(
    createOfflineIolAdapter({
      quoteDetail: quoteFixture.replace('2147483647', '0.125'),
    }).getQuoteDetail('bCBA', 'AL30'),
    invalid,
  );
});
