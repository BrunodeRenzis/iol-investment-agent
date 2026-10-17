import { type Currency, parseCurrency, requireSameCurrency } from './currency';
import {
  compare,
  format,
  nonNegative,
  parseDecimal,
  rejectCoercion,
} from './internal/decimal';
import type { RoundingPolicy } from './rounding';

export class Price {
  readonly #value: string;
  readonly currency: Currency;

  constructor(value: string, currency: Currency) {
    this.#value = nonNegative(parseDecimal(value));
    this.currency = parseCurrency(currency);
    Object.freeze(this);
  }

  get value(): string {
    return this.#value;
  }
  compare(other: Price): -1 | 0 | 1 {
    requireSameCurrency(this.currency, other.currency);
    return compare(this.#value, other.#value);
  }
  equals(other: Price): boolean {
    return this.compare(other) === 0;
  }
  round(policy: RoundingPolicy): Price {
    return new Price(format(this.#value, policy), this.currency);
  }
  format(policy: RoundingPolicy): string {
    return format(this.#value, policy);
  }
  toJSON(): { value: string; currency: Currency } {
    return { value: this.#value, currency: this.currency };
  }
  [Symbol.toPrimitive](): never {
    return rejectCoercion();
  }
}
