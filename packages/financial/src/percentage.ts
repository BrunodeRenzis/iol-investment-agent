import {
  compare,
  parseDecimal,
  rejectCoercion,
  shift,
} from './internal/decimal';
import { Money } from './money';

export class Percentage {
  readonly #ratio: string;
  private constructor(ratio: string) {
    this.#ratio = parseDecimal(ratio);
    Object.freeze(this);
  }
  static fromPercent(percent: string): Percentage {
    return new Percentage(shift(parseDecimal(percent), -2));
  }
  static fromRatio(ratio: string): Percentage {
    return new Percentage(ratio);
  }
  toRatioString(): string {
    return this.#ratio;
  }
  toPercentString(): string {
    return shift(this.#ratio, 2);
  }
  compare(other: Percentage): -1 | 0 | 1 {
    return compare(this.#ratio, other.#ratio);
  }
  equals(other: Percentage): boolean {
    return this.compare(other) === 0;
  }
  applyTo(money: Money): Money {
    if (!(money instanceof Money))
      throw new TypeError('Percentage application requires Money');
    return money.multiply(this.#ratio);
  }
  toJSON(): { ratio: string } {
    return { ratio: this.#ratio };
  }
  [Symbol.toPrimitive](): never {
    return rejectCoercion();
  }
}
