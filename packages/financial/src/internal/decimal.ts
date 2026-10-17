import BigNumber from 'bignumber.js';
import { RoundingMode, type RoundingPolicy } from '../rounding';

// Private configuration: external BigNumber.config changes cannot affect us.
// No division is exposed; plus/minus/times/shiftedBy are exact.
const Decimal = BigNumber.clone({
  DECIMAL_PLACES: 100,
  ROUNDING_MODE: BigNumber.ROUND_HALF_EVEN,
  RANGE: [-1000, 1000],
  STRICT: true,
});
const maxIntegerDigits = 100;
const maxDecimalPlaces = 100;
const decimalPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

export function parseDecimal(input: string): string {
  // Bound work before regex/parsing. Do not echo potentially sensitive inputs.
  if (
    typeof input !== 'string' ||
    input.length > 202 ||
    input.trim() !== input ||
    !decimalPattern.test(input)
  ) {
    throw new TypeError('Expected a bounded plain decimal string');
  }
  const [integer = '', fraction = ''] = input.replace(/^-/, '').split('.');
  if (integer.length > maxIntegerDigits || fraction.length > maxDecimalPlaces) {
    throw new RangeError(
      'Financial decimal exceeds 100 integer or 100 fractional digits',
    );
  }
  return checked(new Decimal(input));
}

function checked(value: BigNumber): string {
  if (
    !value.isFinite() ||
    value.e === null ||
    value.e >= maxIntegerDigits ||
    (value.decimalPlaces() ?? Infinity) > maxDecimalPlaces
  ) {
    throw new RangeError(
      'Financial result exceeds 100 integer or 100 fractional digits',
    );
  }
  return value.isZero() ? '0' : value.toFixed();
}

export function nonNegative(value: string): string {
  if (value.startsWith('-')) throw new RangeError('Value must be non-negative');
  return value;
}

export function add(left: string, right: string): string {
  return checked(new Decimal(left).plus(right));
}
export function subtract(left: string, right: string): string {
  return checked(new Decimal(left).minus(right));
}
export function multiply(left: string, right: string): string {
  return checked(new Decimal(left).times(right));
}
export function shift(value: string, places: number): string {
  return checked(new Decimal(value).shiftedBy(places));
}
export function compare(left: string, right: string): -1 | 0 | 1 {
  const result = new Decimal(left).comparedTo(right);
  if (result === null) throw new RangeError('Cannot compare non-finite values');
  return result;
}

const modes: Readonly<Record<RoundingMode, BigNumber.RoundingMode>> =
  Object.freeze({
    [RoundingMode.AwayFromZero]: BigNumber.ROUND_UP,
    [RoundingMode.TowardZero]: BigNumber.ROUND_DOWN,
    [RoundingMode.Ceiling]: BigNumber.ROUND_CEIL,
    [RoundingMode.Floor]: BigNumber.ROUND_FLOOR,
    [RoundingMode.HalfUp]: BigNumber.ROUND_HALF_UP,
    [RoundingMode.HalfDown]: BigNumber.ROUND_HALF_DOWN,
    [RoundingMode.HalfEven]: BigNumber.ROUND_HALF_EVEN,
    [RoundingMode.HalfCeiling]: BigNumber.ROUND_HALF_CEIL,
    [RoundingMode.HalfFloor]: BigNumber.ROUND_HALF_FLOOR,
  });

export function format(value: string, policy: RoundingPolicy): string {
  if (
    !policy ||
    !Number.isInteger(policy.decimalPlaces) ||
    policy.decimalPlaces < 0 ||
    policy.decimalPlaces > maxDecimalPlaces ||
    typeof policy.mode !== 'string' ||
    !Object.hasOwn(modes, policy.mode)
  ) {
    throw new TypeError(
      'Rounding requires 0..100 decimal places and an explicit mode',
    );
  }
  const fixed = new Decimal(value).toFixed(
    policy.decimalPlaces,
    modes[policy.mode],
  );
  const rounded = new Decimal(fixed);
  checked(rounded);
  // Canonical positive zero, including rounding a small negative amount to zero.
  return rounded.isZero() ? fixed.replace(/^-/, '') : fixed;
}

export function rejectCoercion(): never {
  throw new TypeError(
    'Implicit financial coercion is forbidden; use explicit methods or serialization',
  );
}
