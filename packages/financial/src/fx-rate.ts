import { type Currency, parseCurrency, requireSameCurrency } from './currency';
import { nonNegative, parseDecimal, rejectCoercion } from './internal/decimal';
import { Money } from './money';

export class FxRate {
  readonly base: Currency;
  readonly quote: Currency;
  readonly #rate: string;

  // rate = quote units per one base unit. No inferred direction or inverse.
  constructor(base: Currency, quote: Currency, rate: string) {
    this.base = parseCurrency(base);
    this.quote = parseCurrency(quote);
    if (this.base === this.quote)
      throw new TypeError('FX currencies must differ');
    this.#rate = nonNegative(parseDecimal(rate));
    if (this.#rate === '0') throw new RangeError('FX rate must be positive');
    Object.freeze(this);
  }
  get rate(): string {
    return this.#rate;
  }
  convert(money: Money): Money {
    if (!(money instanceof Money))
      throw new TypeError('FX conversion requires Money');
    requireSameCurrency(this.base, money.currency);
    return new Money(money.multiply(this.#rate).amount, this.quote);
  }
  toJSON(): { base: Currency; quote: Currency; rate: string } {
    return { base: this.base, quote: this.quote, rate: this.#rate };
  }
  [Symbol.toPrimitive](): never {
    return rejectCoercion();
  }
}
