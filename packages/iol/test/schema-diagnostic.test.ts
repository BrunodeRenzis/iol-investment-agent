import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { test } from 'node:test';
import { createOfflineIolAdapter } from '../src';
import {
  schemaDiagnostic,
  schemaFailure,
} from '../src/internal/schema-diagnostic';
import { instrumentFixture } from './fixtures';

void test('schema errors distinguish casing, exponent, range, missing/null, type, unknown fields and malformed JSON', async () => {
  const cases = [
    [
      instrumentFixture.replace('bCBA', 'PRIVATE_CASE_SENTINEL'),
      'quoteDetail.mercado',
      'enum',
    ],
    [
      instrumentFixture.replace(/}$/, ',"ultimoPrecio":1.23456789e42}'),
      'quoteDetail.ultimoPrecio',
      'exponent',
    ],
    [
      instrumentFixture.replace(/}$/, ',"volumenNominal":2147483648}'),
      'quoteDetail.volumenNominal',
      'range',
    ],
    [
      instrumentFixture.replace(
        '"moneda":"dolar_Estadounidense"',
        '"moneda":null',
      ),
      'quoteDetail.moneda',
      'null',
    ],
    [
      instrumentFixture.replace(',"moneda":"dolar_Estadounidense"', ''),
      'quoteDetail.moneda',
      'missing',
    ],
    [
      instrumentFixture.replace(
        /}$/,
        ',"ultimoPrecio":"PRIVATE_VALUE_SENTINEL"}',
      ),
      'quoteDetail.ultimoPrecio',
      'type',
    ],
    [
      instrumentFixture.replace(
        /}$/,
        ',"PRIVATE_KEY_SENTINEL":"PRIVATE_VALUE_SENTINEL"}',
      ),
      'quoteDetail',
      'unknown_fields',
    ],
    ['{"PRIVATE_KEY_SENTINEL":', 'quoteDetail', 'malformed'],
  ] as const;
  for (const [body, path, kind] of cases) {
    await assert.rejects(
      createOfflineIolAdapter({ quoteDetail: body }).getQuoteDetail(
        'bCBA',
        'AL30',
      ),
      (error: unknown) => {
        assert.deepEqual(schemaDiagnostic(error), { path, kind });
        const output =
          JSON.stringify(schemaDiagnostic(error)) +
          JSON.stringify(error) +
          inspect(error);
        for (const secret of [
          'PRIVATE_CASE_SENTINEL',
          'PRIVATE_VALUE_SENTINEL',
          'PRIVATE_KEY_SENTINEL',
          '2147483648',
          '1.23456789e42',
          body,
        ])
          assert.ok(!output.includes(secret));
        return true;
      },
    );
  }
});
void test('nested schema paths use [] not indices and never retain unknown keys or forged error metadata', async () => {
  await assert.rejects(
    createOfflineIolAdapter({
      accountState:
        '{"cuentas":[{"tipo":"inversion_Argentina_Pesos","moneda":"SENSITIVE_ACCOUNT_VALUE"}]}',
    }).getAccountState(),
    (error: unknown) => {
      assert.deepEqual(schemaDiagnostic(error), {
        path: 'accountState.cuentas[].moneda',
        kind: 'enum',
      });
      return true;
    },
  );
  assert.equal(
    schemaDiagnostic({ diagnostic: { path: 'SECRET', kind: 'enum' } }),
    undefined,
  );
  assert.deepEqual(
    schemaDiagnostic(schemaFailure('type', 'SECRET_DYNAMIC_SYMBOL')),
    { path: 'payload', kind: 'type' },
  );
  await assert.rejects(
    createOfflineIolAdapter({
      quoteDetail: instrumentFixture.replace(
        /}$/,
        ',"SECRET_UNKNOWN_KEY":99e12}',
      ),
    }).getQuoteDetail('bCBA', 'AL30'),
    (error: unknown) => {
      assert.ok(
        !JSON.stringify(schemaDiagnostic(error)).includes('SECRET_UNKNOWN_KEY'),
      );
      return true;
    },
  );
});
