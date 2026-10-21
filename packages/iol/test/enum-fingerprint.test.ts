import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { test } from 'node:test';
import { createOfflineIolAdapter, IolError } from '../src';
import { createAdapter } from '../src/internal/adapter';
import { rejectedEnumFingerprint } from '../src/internal/enum-fingerprint';
import { instrument } from '../src/internal/models';
import { runManualVerification } from '../src/internal/manual-runner';
import {
  payloadFailure,
  schemaDiagnostic,
  schemaFailure,
} from '../src/internal/schema-diagnostic';
import { SECURITY_TYPES } from '../src/internal/security-types';
import {
  accountFixture,
  instrumentFixture,
  portfolioFixture,
  quoteFixture,
} from './fixtures';

function fingerprint(error: unknown, operation = 'instrument') {
  return rejectedEnumFingerprint(error, operation, schemaDiagnostic(error));
}
function instrumentBody(value: unknown): string {
  return JSON.stringify({
    ...(JSON.parse(instrumentFixture) as Record<string, unknown>),
    tipo: value,
  });
}
function decoderFailure(value: unknown): IolError {
  try {
    instrument(
      {
        ...(JSON.parse(instrumentFixture) as Record<string, unknown>),
        tipo: value,
      },
      'instrument',
    );
  } catch (error: unknown) {
    assert.ok(error instanceof IolError);
    return error;
  }
  return assert.fail('the rejected type must not construct a DTO');
}
function privateError(error: unknown, wire: string): void {
  const serialized =
    JSON.stringify(error) + inspect(error, { showHidden: true });
  if (wire)
    assert.ok(!serialized.includes(wire), 'wire value leaked from error');
  assert.ok(!serialized.includes('rejectedEnumFingerprint'));
}

const cases = [
  {
    name: 'uppercase',
    wire: 'TITULOSPUBLICOS',
    expected: {
      foldsToV2Member: 'titulosPublicos',
      casing: 'all_upper',
      separators: 'none',
      padded: false,
    },
  },
  {
    name: 'canonical pattern with uppercase initial',
    wire: 'TitulosPublicos',
    expected: {
      foldsToV2Member: 'titulosPublicos',
      casing: 'first_upper',
      separators: 'none',
      padded: false,
    },
  },
  {
    name: 'lowercase',
    wire: 'titulospublicos',
    expected: {
      foldsToV2Member: 'titulosPublicos',
      casing: 'all_lower',
      separators: 'none',
      padded: false,
    },
  },
  {
    name: 'underscore',
    wire: 'titulos_publicos',
    expected: {
      foldsToV2Member: 'titulosPublicos',
      casing: 'all_lower',
      separators: 'underscore',
      padded: false,
    },
  },
  {
    name: 'leading space',
    wire: ' titulosPublicos',
    expected: {
      foldsToV2Member: 'titulosPublicos',
      casing: 'first_lower',
      separators: 'space',
      padded: true,
    },
  },
  {
    name: 'trailing space',
    wire: 'titulosPublicos ',
    expected: {
      foldsToV2Member: 'titulosPublicos',
      casing: 'first_lower',
      separators: 'space',
      padded: true,
    },
  },
  {
    name: 'internal space',
    wire: 'titulos Publicos',
    expected: {
      foldsToV2Member: 'titulosPublicos',
      casing: 'first_lower',
      separators: 'space',
      padded: false,
    },
  },
  {
    name: 'mixed casing and separators',
    wire: 'tiTulos_ Publicos',
    expected: {
      foldsToV2Member: 'titulosPublicos',
      casing: 'mixed',
      separators: 'mixed',
      padded: false,
    },
  },
  {
    name: 'distinct bonds member',
    wire: 'Bonos',
    expected: {
      foldsToV2Member: 'bONOS',
      casing: 'mixed',
      separators: 'none',
      padded: false,
    },
  },
  {
    name: 'documented folding collision',
    wire: 'ObligacionesNegociables',
    expected: { foldsToV2Member: 'ambiguous' },
  },
  {
    name: 'unknown alphabetic sentinel',
    wire: 'SECRETO',
    expected: { foldsToV2Member: 'none', charset: 'ascii_letters' },
  },
  {
    name: 'short unknown alphabetic value',
    wire: 'abc',
    expected: { foldsToV2Member: 'none', charset: 'ascii_letters' },
  },
  {
    name: 'unknown word sentinel',
    wire: 'PRIVATE_SENTINEL_123',
    expected: { foldsToV2Member: 'none', charset: 'ascii_word' },
  },
  {
    name: 'unknown punctuation sentinel',
    wire: 'PRIVATE@example.invalid',
    expected: { foldsToV2Member: 'none', charset: 'other' },
  },
  {
    name: 'accented value',
    wire: 'Títulos Públicos',
    expected: { foldsToV2Member: 'none', charset: 'other' },
  },
  {
    name: 'non-ASCII lookalike',
    wire: 'ＴITULOSPUBLICOS',
    expected: { foldsToV2Member: 'none', charset: 'other' },
  },
  {
    name: 'tab',
    wire: 'titulos\tPublicos',
    expected: { foldsToV2Member: 'none', charset: 'other' },
  },
  {
    name: 'newline',
    wire: 'titulosPublicos\n',
    expected: { foldsToV2Member: 'none', charset: 'other' },
  },
  {
    name: 'NUL',
    wire: 'titulos\0Publicos',
    expected: { foldsToV2Member: 'none', charset: 'other' },
  },
  {
    name: 'DEL',
    wire: 'titulosPublicos\x7f',
    expected: { foldsToV2Member: 'none', charset: 'other' },
  },
  {
    name: 'exact guard boundary',
    wire: 'titulosPublicos'.padStart(64, ' '),
    expected: {
      foldsToV2Member: 'titulosPublicos',
      casing: 'first_lower',
      separators: 'space',
      padded: true,
    },
  },
  {
    name: 'guard overflow',
    wire: 'titulosPublicos'.padStart(65, ' '),
    expected: { foldsToV2Member: 'none', charset: 'other' },
  },
  {
    name: 'empty string',
    wire: '',
    expected: { foldsToV2Member: 'none', charset: 'other' },
  },
] as const;

const sentinels = {
  username: 'SYNTHETIC_USERNAME_SENTINEL',
  password: 'SYNTHETIC_PASSWORD_SENTINEL',
  access: 'SYNTHETIC_ACCESS_SENTINEL',
  refresh: 'SYNTHETIC_REFRESH_SENTINEL',
  header: 'SYNTHETIC_HEADER_SENTINEL',
  exception: 'SYNTHETIC_EXCEPTION_SENTINEL',
};
async function run(bodies: readonly string[], rejectedFetch?: Error) {
  const output: string[] = [];
  const requests: { url: string; method: string | undefined }[] = [];
  const inputs = [
    'AUTENTICAR SESION APROBADA',
    sentinels.username,
    sentinels.password,
    '1',
    '2',
    '3',
    '4',
  ];
  let index = 0;
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
      assert.ok(typeof url === 'string');
      requests.push({ url, method: init?.method });
      if (requests.length === 1)
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: sentinels.access,
              refresh_token: sentinels.refresh,
              token_type: 'bearer',
              expires_in: 900,
            }),
            { headers: { 'Content-Type': 'application/json' } },
          ),
        );
      if (rejectedFetch !== undefined) return Promise.reject(rejectedFetch);
      const body = bodies[index++];
      assert.notEqual(body, undefined, 'unexpected additional GET');
      return Promise.resolve(
        new Response(body, {
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': sentinels.header,
            'Set-Cookie': sentinels.header,
            'X-Private': sentinels.header,
          },
        }),
      );
    },
    [],
    [],
    new AbortController().signal,
    () => undefined,
  );
  for (const sentinel of Object.values(sentinels))
    assert.ok(
      !output.join('\n').includes(sentinel),
      'runner leaked a synthetic sentinel',
    );
  return { ok, output, requests, inputs };
}

for (const entry of cases) {
  void test(`restricted enum fingerprint: ${entry.name}`, async () => {
    const original = decoderFailure(entry.wire);
    assert.equal(original.code, 'invalid_payload');
    assert.deepEqual(schemaDiagnostic(original), {
      path: 'instrument.tipo',
      kind: 'enum',
    });
    assert.deepEqual(fingerprint(original), entry.expected);
    assert.ok(Object.isFrozen(fingerprint(original)));
    privateError(original, entry.wire);
    const propagated = payloadFailure(original, 'instrument');
    assert.notEqual(propagated, original);
    assert.equal(fingerprint(propagated), fingerprint(original));
    privateError(propagated, entry.wire);
    await assert.rejects(
      createOfflineIolAdapter({
        instrument: instrumentBody(entry.wire),
      }).getInstrument('bCBA', 'AL30'),
      (error: unknown) => {
        assert.deepEqual(fingerprint(error), entry.expected);
        privateError(error, entry.wire);
        return true;
      },
    );

    const result = await run([instrumentBody(entry.wire)]);
    assert.equal(result.ok, false);
    assert.deepEqual(result.requests, [
      { url: 'https://api.invertironline.com/token', method: 'POST' },
      {
        url: 'https://api.invertironline.com/api/v2/bCBA/Titulos/AL30',
        method: 'GET',
      },
    ]);
    assert.deepEqual(result.inputs, ['2', '3', '4']);
    assert.deepEqual(
      result.output.filter((line) => line.startsWith('{')),
      [
        JSON.stringify({
          operation: 'session',
          status: 'stopped',
          category: 'invalid_payload',
          diagnostic: { path: 'instrument.tipo', kind: 'enum' },
          rejectedEnumFingerprint: entry.expected,
        }),
      ],
    );
    if (entry.wire)
      assert.ok(
        !result.output.join('\n').includes(entry.wire),
        'runner echoed rejected wire',
      );
    assert.ok(
      !result.output.some((line) => line.includes('Próxima acción: 2')),
    );
  });
}

void test('all 49 V2 members and the existing alias keep their exact DTO behavior', async () => {
  assert.equal(SECURITY_TYPES.length, 49);
  assert.ok(Object.isFrozen(SECURITY_TYPES));
  for (const value of [...SECURITY_TYPES, 'CEDEARS']) {
    const dto = await createOfflineIolAdapter({
      instrument: instrumentBody(value),
    }).getInstrument('bCBA', 'AL30');
    assert.equal(dto.tipo, value === 'CEDEARS' ? 'cEDEARS' : value);
    assert.equal(dto.simbolo, 'AL30');
    assert.equal(dto.mercado, 'bCBA');
    assert.ok(Object.isFrozen(dto));
  }
  await assert.rejects(
    createOfflineIolAdapter({
      instrument: instrumentBody('titulosPublicos'),
    }).getInstrument('nYSE', 'AL30'),
    (error: unknown) => {
      assert.deepEqual(schemaDiagnostic(error), {
        path: 'instrument',
        kind: 'malformed',
      });
      assert.equal(fingerprint(error), undefined);
      return true;
    },
  );
});

void test('trusted fingerprints never propagate under another operation or default fallback', () => {
  const source = decoderFailure('TITULOSPUBLICOS');
  for (const operation of [
    'portfolio',
    'quoteDetail',
    'accountState',
    'token',
    'payload',
    'instrument.tipo',
    'Instrument',
  ]) {
    assert.equal(fingerprint(source, operation), undefined);
    assert.equal(fingerprint(payloadFailure(source, operation)), undefined);
  }
  assert.equal(fingerprint(payloadFailure(source)), undefined);
  for (const kind of [
    'missing',
    'null',
    'type',
    'malformed',
    'unknown_fields',
  ] as const) {
    assert.equal(
      rejectedEnumFingerprint(source, 'instrument', {
        path: 'instrument.tipo',
        kind,
      }),
      undefined,
    );
    assert.equal(
      fingerprint(
        payloadFailure(schemaFailure(kind, 'instrument.tipo'), 'instrument'),
      ),
      undefined,
    );
  }
  assert.equal(
    rejectedEnumFingerprint(source, 'instrument', {
      path: 'quoteDetail.tipo',
      kind: 'enum',
    }),
    undefined,
  );
  assert.equal(
    fingerprint(
      payloadFailure(schemaFailure('enum', 'instrument.tipo'), 'instrument'),
    ),
    undefined,
  );
});

void test('non-string type failures and malformed JSON have no fingerprint', async () => {
  for (const [value, kind] of [
    [undefined, 'missing'],
    [null, 'null'],
    [true, 'type'],
    [123, 'type'],
    [{ tipo: 'TITULOSPUBLICOS' }, 'type'],
    [['TITULOSPUBLICOS'], 'type'],
  ] as const) {
    const error = decoderFailure(value);
    assert.deepEqual(schemaDiagnostic(error), {
      path: 'instrument.tipo',
      kind,
    });
    assert.equal(fingerprint(error), undefined);
    assert.equal(fingerprint(payloadFailure(error, 'instrument')), undefined);
  }
  await assert.rejects(
    createOfflineIolAdapter({ instrument: '{"tipo":' }).getInstrument(
      'bCBA',
      'AL30',
    ),
    (error: unknown) => {
      assert.deepEqual(schemaDiagnostic(error), {
        path: 'instrument',
        kind: 'malformed',
      });
      assert.equal(fingerprint(error), undefined);
      return true;
    },
  );
});

void test('binding excludes other operations, nested titles, fields and unknown keys', async () => {
  const value = 'TITULOSPUBLICOS';
  const adapters = [
    () =>
      createOfflineIolAdapter({
        portfolio: portfolioFixture.replace('titulosPublicos', value),
      }).getPortfolio('argentina'),
    () =>
      createOfflineIolAdapter({
        quoteDetail: quoteFixture.replace('titulosPublicos', value),
      }).getQuoteDetail('bCBA', 'AL30'),
    () =>
      createOfflineIolAdapter({
        accountState: accountFixture.replace(
          'inversion_Argentina_Dolares',
          value,
        ),
      }).getAccountState(),
    () =>
      createOfflineIolAdapter({
        accountState: accountFixture.replace('inmediato', value),
      }).getAccountState(),
    () =>
      createOfflineIolAdapter({
        accountState: accountFixture.replace('dolar_Estadounidense', value),
      }).getAccountState(),
    ...['bCBA', 'argentina', 't0', 'dolar_Estadounidense'].map(
      (previous) => () =>
        createOfflineIolAdapter({
          instrument: instrumentFixture.replace(previous, value),
        }).getInstrument('bCBA', 'AL30'),
    ),
    () =>
      createOfflineIolAdapter({
        instrument: instrumentFixture.replace(
          /}$/,
          ',"nested":{"tipo":"TITULOSPUBLICOS"}}',
        ),
      }).getInstrument('bCBA', 'AL30'),
    () =>
      createOfflineIolAdapter({
        instrument: instrumentFixture.replace(
          /}$/,
          ',"descripcion":{"tipo":"TITULOSPUBLICOS"}}',
        ),
      }).getInstrument('bCBA', 'AL30'),
    () =>
      createOfflineIolAdapter({
        instrument: instrumentFixture.replace(
          '"AL30"',
          '{"tipo":"TITULOSPUBLICOS"}',
        ),
      }).getInstrument('bCBA', 'AL30'),
    () =>
      createOfflineIolAdapter({
        accountState: accountFixture.replace(
          '"saldo":0',
          '"saldo":"TITULOSPUBLICOS"',
        ),
      }).getAccountState(),
  ];
  for (const read of adapters)
    await assert.rejects(read(), (error: unknown) => {
      assert.ok(error instanceof IolError);
      assert.equal(error.code, 'invalid_payload');
      assert.equal(fingerprint(error), undefined);
      assert.equal(fingerprint(payloadFailure(error, 'instrument')), undefined);
      privateError(error, value);
      return true;
    });
});

void test('forged exception properties cannot supply schema or fingerprint metadata', async () => {
  const forged = Object.assign(new Error(sentinels.exception), {
    stage: 'token_payload',
    httpStatus: 200,
    path: 'instrument.tipo',
    kind: 'enum',
    diagnostic: { path: 'instrument.tipo', kind: 'enum' },
    rejectedEnumFingerprint: {
      foldsToV2Member: 'titulosPublicos',
      casing: 'all_upper',
    },
  });
  for (const source of [
    forged,
    { ...forged },
    { path: 'instrument.tipo', kind: 'enum' },
  ]) {
    assert.equal(fingerprint(source), undefined);
    assert.equal(
      rejectedEnumFingerprint(source, 'instrument', {
        path: 'instrument.tipo',
        kind: 'enum',
      }),
      undefined,
    );
    const wrapped = payloadFailure(source, 'instrument');
    assert.deepEqual(schemaDiagnostic(wrapped), {
      path: 'instrument',
      kind: 'malformed',
    });
    assert.equal(fingerprint(wrapped), undefined);
    privateError(wrapped, sentinels.exception);
  }
  // Even a real decoder error injected through the transport cannot grant metadata.
  for (const source of [forged, decoderFailure('TITULOSPUBLICOS')]) {
    await assert.rejects(
      createAdapter({ read: () => Promise.reject(source) }).getInstrument(
        'bCBA',
        'AL30',
      ),
      (error: unknown) => {
        assert.equal(fingerprint(error), undefined);
        assert.equal(schemaDiagnostic(error), undefined);
        return true;
      },
    );
    const result = await run([], source);
    assert.equal(result.ok, false);
    assert.equal(result.requests.length, 2);
    assert.ok(!result.output.join('\n').includes('rejectedEnumFingerprint'));
    assert.ok(!result.output.join('\n').includes('httpStatus'));
    assert.ok(!result.output.join('\n').includes('stage'));
  }
});

void test('runner never emits a fingerprint on later actions or other instrument fields', async () => {
  const value = 'TITULOSPUBLICOS';
  const sequences = [
    [instrumentFixture.replace('bCBA', value)],
    [instrumentFixture.replace('argentina', value)],
    [instrumentFixture, quoteFixture.replace('titulosPublicos', value)],
    [
      instrumentFixture,
      quoteFixture,
      accountFixture.replace('inversion_Argentina_Dolares', value),
    ],
    [
      instrumentFixture,
      quoteFixture,
      accountFixture.replace('inmediato', value),
    ],
    [
      instrumentFixture,
      quoteFixture,
      accountFixture,
      portfolioFixture.replace('titulosPublicos', value),
    ],
  ];
  for (const bodies of sequences) {
    const result = await run(bodies);
    assert.equal(result.ok, false);
    assert.equal(result.requests.length, bodies.length + 1);
    assert.ok(!result.output.join('\n').includes('rejectedEnumFingerprint'));
    assert.ok(!result.output.join('\n').includes(value));
  }
});
