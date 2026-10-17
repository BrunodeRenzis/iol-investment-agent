import { type Currency, parseCurrency, requireSameCurrency } from './currency';
import {
  add,
  compare,
  format,
  multiply,
  parseDecimal,
  rejectCoercion,
  subtract,
} from './internal/decimal';
import type { RoundingPolicy } from './rounding';

export class Money {
  readonly #amount: string;
  readonly currency: Currency;

  constructor(amount: string, currency: Currency) {
    this.#amount = parseDecimal(amount);
    this.currency = parseCurrency(currency);
    Object.freeze(this);
  }

  get amount(): string {
    return this.#amount;
  }

  add(other: Money): Money {
    requireSameCurrency(this.currency, other.currency);
    return new Money(add(this.#amount, other.#amount), this.currency);
  }
  subtract(other: Money): Money {
    requireSameCurrency(this.currency, other.currency);
    return new Money(subtract(this.#amount, other.#amount), this.currency);
  }
  compare(other: Money): -1 | 0 | 1 {
    requireSameCurrency(this.currency, other.currency);
    return compare(this.#amount, other.#amount);
  }
  equals(other: Money): boolean {
    return this.compare(other) === 0;
  }
  multiply(scalar: string): Money {
    return new Money(
      multiply(this.#amount, parseDecimal(scalar)),
      this.currency,
    );
  }
  round(policy: RoundingPolicy): Money {
    return new Money(format(this.#amount, policy), this.currency);
  }
  format(policy: RoundingPolicy): string {
    return format(this.#amount, policy);
  }
  toJSON(): { amount: string; currency: Currency } {
    return { amount: this.#amount, currency: this.currency };
  }
  [Symbol.toPrimitive](): never {
    return rejectCoercion();
  }
}
