import assert from 'node:assert/strict';
import test from 'node:test';
import BigNumber from 'bignumber.js';
import {
  Currency,
  FxRate,
  Money,
  NominalValue,
  Percentage,
  Price,
  Quantity,
  RoundingMode,
  type RoundingPolicy,
  parseCurrency,
} from '../src';

const { ARS, USD } = Currency;

void test('Currency validates a closed set without coercion or case normalization', () => {
  assert.equal(parseCurrency('ARS'), ARS);
  assert.equal(parseCurrency('USD'), USD);
  for (const input of ['', 'usd', ' USD', 'EUR', 1, null, {}, undefined]) {
    assert.throws(() => parseCurrency(input), /Unsupported currency/);
  }
  const invalid = 'EUR' as Currency;
  assert.throws(() => new Money('1', invalid));
  assert.throws(() => new Price('1', invalid));
  assert.throws(() => new FxRate(invalid, USD, '1'));
  assert.throws(() => new FxRate(ARS, invalid, '1'));
});

const invalidInputs: readonly unknown[] = [
  '',
  ' ',
  'NaN',
  'Infinity',
  '-Infinity',
  '1e3',
  '1E-3',
  '0x10',
  '1_000',
  '1,25',
  ' 1',
  '1 ',
  '+1',
  '.5',
  '1.',
  '01',
  '--1',
  '1\n',
  0.1,
  NaN,
  Infinity,
  null,
  undefined,
  {},
  '1'.repeat(101),
  `0.${'0'.repeat(100)}1`,
];
for (const [index, input] of invalidInputs.entries()) {
  void test(`all financial entry points reject malformed or excessive input case ${index + 1}`, () => {
    // Exercise runtime callers that can bypass TypeScript, without using any.
    const raw = input as string;
    for (const create of [
      () => new Money(raw, ARS),
      () => new Price(raw, USD),
      () => new Quantity(raw),
      () => new NominalValue(raw),
      () => Percentage.fromPercent(raw),
      () => Percentage.fromRatio(raw),
      () => new FxRate(USD, ARS, raw),
      () => new Money('1', ARS).multiply(raw),
    ])
      assert.throws(create);
  });
}

void test('Money adds, subtracts and multiplies exactly, including signed amounts', () => {
  const a = new Money('0.1', ARS);
  assert.equal(a.add(new Money('0.2', ARS)).amount, '0.3');
  assert.equal(new Money('0.3', ARS).subtract(a).amount, '0.2');
  assert.equal(new Money('1.01', ARS).multiply('0.05').amount, '0.0505');
  assert.equal(a.multiply('-2.5').amount, '-0.25');
  assert.equal(a.subtract(new Money('1', ARS)).amount, '-0.9');
  assert.equal(a.amount, '0.1');
  assert.notEqual(a.multiply('1'), a);
});

void test('Money comparisons use exact values and reject every currency mismatch', () => {
  const ars = new Money('10.00', ARS);
  assert(ars.equals(new Money('10', ARS)));
  assert.equal(ars.compare(new Money('10.00000000000000001', ARS)), -1);
  assert.equal(ars.compare(new Money('-10', ARS)), 1);
  const usd = new Money('10', USD);
  assert.throws(() => ars.add(usd), /Currency mismatch/);
  assert.throws(() => ars.subtract(usd), /Currency mismatch/);
  assert.throws(() => ars.compare(usd), /Currency mismatch/);
  assert.throws(() => ars.equals(usd), /Currency mismatch/);
});

void test('values above JS safe integer and tiny values retain all digits', () => {
  const large = '99999999999999999999999999999999999999.1234567890123456789';
  assert.equal(new Money(large, ARS).amount, large);
  assert.equal(
    new Money('9007199254740993', USD).add(new Money('1', USD)).amount,
    '9007199254740994',
  );
  const smallest = `0.${'0'.repeat(99)}1`;
  assert.equal(new Price(smallest, USD).value, smallest);
  assert.equal(new Money(smallest, ARS).multiply('1').amount, smallest);
  const largest = '9'.repeat(100);
  assert.equal(new Money(largest, ARS).amount, largest);
  assert.throws(
    () => new Money(largest, ARS).add(new Money('1', ARS)),
    /exceeds/,
  );
  assert.throws(() => new Money(largest, ARS).multiply('10'), /exceeds/);
  assert.throws(() => new Money(smallest, ARS).multiply('0.1'), /exceeds/);
  assert.throws(() =>
    new Money(`${largest}.5`, ARS).round({
      decimalPlaces: 0,
      mode: RoundingMode.HalfEven,
    }),
  );
  assert.throws(() =>
    new Money(`${largest}.5`, ARS).format({
      decimalPlaces: 0,
      mode: RoundingMode.HalfEven,
    }),
  );
});

void test('Price preserves sub-cent precision without assuming ticks or settlement rules', () => {
  const price = new Price('123.456789012345678901', USD);
  assert.equal(price.value, '123.456789012345678901');
  assert(price.equals(new Price('123.4567890123456789010', USD)));
  assert.equal(price.compare(new Price('123.456789012345678902', USD)), -1);
  assert.equal(price.compare(new Price('1', USD)), 1);
  assert.throws(() => price.compare(new Price('1', ARS)), /Currency mismatch/);
  assert.throws(() => price.equals(new Price('1', ARS)), /Currency mismatch/);
  assert.throws(() => new Price('-1', ARS), /non-negative/);
  assert.equal(new Price('0', ARS).value, '0');
});

for (const Domain of [Quantity, NominalValue]) {
  void test(`${Domain.name} supports fractional, non-negative arithmetic and comparisons`, () => {
    const a = new Domain('1.25');
    // Each branch preserves the distinct nominal class rather than merging it with Quantity.
    if (a instanceof Quantity) {
      assert.equal(a.add(new Quantity('0.05')).value, '1.3');
      assert.equal(a.subtract(new Quantity('0.25')).value, '1');
      assert.throws(() => a.subtract(new Quantity('2')), /non-negative/);
      assert(a.equals(new Quantity('1.250')));
      assert.equal(a.compare(new Quantity('2')), -1);
    } else {
      assert.equal(a.add(new NominalValue('0.05')).value, '1.3');
      assert.equal(a.subtract(new NominalValue('0.25')).value, '1');
      assert.throws(() => a.subtract(new NominalValue('2')), /non-negative/);
      assert(a.equals(new NominalValue('1.250')));
      assert.equal(a.compare(new NominalValue('2')), -1);
    }
    assert.equal(a.multiply('0.2').value, '0.25');
    assert.equal(a.multiply('0').value, '0');
    assert.throws(() => a.multiply('-1'), /non-negative/);
    assert.throws(() => new Domain('-0.01'), /non-negative/);
    assert.equal(new Domain('0').value, '0');
    assert.equal(a.value, '1.25');
  });
}

void test('domain types remain distinct at runtime even when TypeScript is bypassed', () => {
  const quantity = new Quantity('1');
  const nominal = new NominalValue('1');
  const money = new Money('1', USD);
  const price = new Price('1', USD);
  assert.throws(() => quantity.add(nominal as unknown as Quantity), TypeError);
  assert.throws(
    () => nominal.compare(quantity as unknown as NominalValue),
    TypeError,
  );
  assert.throws(() => money.add(price as unknown as Money), TypeError);
  assert.throws(() => price.compare(money as unknown as Price), TypeError);
  assert.throws(
    () => Percentage.fromPercent('5').applyTo(quantity as unknown as Money),
    TypeError,
  );
  assert.throws(
    () => new FxRate(USD, ARS, '1450').convert(price as unknown as Money),
    TypeError,
  );
});

for (const [percent, ratio] of [
  ['0', '0'],
  ['5', '0.05'],
  ['100', '1'],
  ['-5', '-0.05'],
  ['150', '1.5'],
] as const) {
  void test(`Percentage keeps explicit percent/ratio semantics for ${percent}%`, () => {
    const value = Percentage.fromPercent(percent);
    assert.equal(value.toRatioString(), ratio);
    assert.equal(value.toPercentString(), percent);
    assert(value.equals(Percentage.fromRatio(ratio)));
    assert.equal(value.compare(Percentage.fromRatio(ratio)), 0);
    assert.equal(value.applyTo(new Money('100', ARS)).amount, percent);
  });
}

void test('Percentage factories cannot confuse 5 percent with ratio 5', () => {
  assert.equal(Percentage.fromRatio('5').toPercentString(), '500');
  assert.equal(
    Percentage.fromPercent('5').compare(Percentage.fromRatio('5')),
    -1,
  );
  assert.equal(
    Percentage.fromPercent('5').applyTo(new Money('1.01', USD)).amount,
    '0.0505',
  );
  assert.throws(
    () => Percentage.fromPercent(`0.${'0'.repeat(99)}1`),
    /exceeds/,
  );
});

void test('FX rate converts base to quote only, using an explicitly supplied rate', () => {
  const rate = new FxRate(USD, ARS, '1450.1234');
  assert.deepEqual(rate.convert(new Money('2.5', USD)).toJSON(), {
    amount: '3625.3085',
    currency: ARS,
  });
  assert.equal(rate.convert(new Money('-1', USD)).amount, '-1450.1234');
  assert.equal(rate.convert(new Money('0', USD)).amount, '0');
  assert.throws(
    () => rate.convert(new Money('1450', ARS)),
    /Currency mismatch/,
  );
  // A separately supplied reverse-direction rate is never inferred or looked up.
  const reverse = new FxRate(ARS, USD, '0.0005');
  assert.deepEqual(reverse.convert(new Money('2000', ARS)).toJSON(), {
    amount: '1',
    currency: USD,
  });
  for (const invalid of ['0', '-0', '-1'])
    assert.throws(() => new FxRate(USD, ARS, invalid));
  assert.throws(() => new FxRate(USD, USD, '1'), /must differ/);
});

const roundingCases: readonly [RoundingMode, string, string][] = [
  [RoundingMode.AwayFromZero, '3', '-3'],
  [RoundingMode.TowardZero, '2', '-2'],
  [RoundingMode.Ceiling, '3', '-2'],
  [RoundingMode.Floor, '2', '-3'],
  [RoundingMode.HalfUp, '3', '-3'],
  [RoundingMode.HalfDown, '2', '-2'],
  [RoundingMode.HalfEven, '2', '-2'],
  [RoundingMode.HalfCeiling, '3', '-2'],
  [RoundingMode.HalfFloor, '2', '-3'],
];
for (const [mode, positive, negative] of roundingCases) {
  void test(`rounding mode ${mode} is explicit and correct for positive and negative ties`, () => {
    const policy = { decimalPlaces: 0, mode };
    assert.equal(new Money('2.5', ARS).round(policy).amount, positive);
    assert.equal(new Money('-2.5', ARS).round(policy).amount, negative);
  });
}

void test('display formatting and explicit rounding never alter source or intermediate precision', () => {
  const policy = { decimalPlaces: 2, mode: RoundingMode.HalfEven };
  const money = new Money('1.005', ARS);
  assert.equal(money.format(policy), '1.00');
  assert.equal(money.round(policy).amount, '1');
  assert.equal(money.amount, '1.005');
  assert.equal(money.add(money).format(policy), '2.01');
  assert.equal(new Money('1.015', ARS).format(policy), '1.02');
  assert.equal(new Money('-0.001', ARS).format(policy), '0.00');
  assert.equal(
    new Money('1.005', ARS).format({
      decimalPlaces: 3,
      mode: RoundingMode.HalfUp,
    }),
    '1.005',
  );
  for (const value of [
    new Price('1.005', ARS),
    new Quantity('1.005'),
    new NominalValue('1.005'),
  ]) {
    assert.equal(value.format(policy), '1.00');
    assert.equal(value.round(policy).value, '1');
    assert.equal(value.value, '1.005');
  }
});

void test('rounding rejects missing/invalid policies rather than silently defaulting', () => {
  for (const policy of [
    undefined,
    null,
    {},
    { decimalPlaces: 2 },
    { mode: RoundingMode.HalfEven },
    { decimalPlaces: -1, mode: RoundingMode.HalfEven },
    { decimalPlaces: 101, mode: RoundingMode.HalfEven },
    { decimalPlaces: 1.5, mode: RoundingMode.HalfEven },
    { decimalPlaces: NaN, mode: RoundingMode.HalfEven },
    { decimalPlaces: '2', mode: RoundingMode.HalfEven },
    { decimalPlaces: 2, mode: 'toString' },
    { decimalPlaces: 2, mode: 6 },
  ])
    assert.throws(() =>
      new Money('1.234', ARS).round(policy as RoundingPolicy),
    );
});

void test('financial serialization is deterministic decimal strings with explicit dimensions', () => {
  const value = {
    money: new Money('1234567.890100', ARS),
    price: new Price('0.00000001', USD),
    quantity: new Quantity('1.2500'),
    nominal: new NominalValue('100.5'),
    percentage: Percentage.fromPercent('5'),
    fx: new FxRate(USD, ARS, '1450.00'),
  };
  const expected =
    '{"money":{"amount":"1234567.8901","currency":"ARS"},"price":{"value":"0.00000001","currency":"USD"},"quantity":{"value":"1.25"},"nominal":{"value":"100.5"},"percentage":{"ratio":"0.05"},"fx":{"base":"USD","quote":"ARS","rate":"1450"}}';
  assert.equal(JSON.stringify(value), expected);
  assert.equal(JSON.stringify(value), expected);
  assert.equal(
    JSON.stringify(new Money('-0.000', ARS)),
    '{"amount":"0","currency":"ARS"}',
  );
  const record = value.money.toJSON();
  assert(value.money.equals(new Money(record.amount, record.currency)));
  record.amount = '999';
  assert.equal(value.money.amount, '1234567.8901');
});

void test('all value objects are immutable and reject implicit numeric/default coercion', () => {
  const values = [
    new Money('1', ARS),
    new Price('1', ARS),
    new Quantity('1'),
    new NominalValue('1'),
    Percentage.fromPercent('1'),
    new FxRate(USD, ARS, '1'),
  ];
  for (const value of values) {
    assert(Object.isFrozen(value));
    assert.throws(() => Object.assign(value, { currency: USD }), TypeError);
    assert.throws(() => Number(value), /coercion/);
    assert.throws(() => Reflect.apply(String, undefined, [value]), /coercion/);
    assert.throws(() => value[Symbol.toPrimitive](), /coercion/);
  }
});

void test('external decimal configuration cannot change financial operations', () => {
  const previous = BigNumber.config();
  try {
    BigNumber.config({
      RANGE: [-1, 1],
      DECIMAL_PLACES: 0,
      ROUNDING_MODE: BigNumber.ROUND_DOWN,
    });
    assert.equal(new Money('1000.001', ARS).multiply('0.5').amount, '500.0005');
    assert.equal(Percentage.fromPercent('0.1').toRatioString(), '0.001');
    assert.equal(
      new Money('2.5', ARS).round({
        decimalPlaces: 0,
        mode: RoundingMode.HalfUp,
      }).amount,
      '3',
    );
  } finally {
    BigNumber.config(previous);
  }
});

void test('arithmetic agrees with an independent scaled-integer oracle', () => {
  for (let i = -20; i <= 20; i++) {
    const integer = BigInt(i);
    const amount = new Money(integer.toString(), USD).multiply('0.01');
    const result = amount.multiply('0.01').multiply('10000');
    assert.equal(result.amount, integer.toString());
    assert.equal(
      amount.add(amount).multiply('100').amount,
      (integer * 2n).toString(),
    );
  }
});
