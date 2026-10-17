import {
  add,
  compare,
  format,
  multiply,
  nonNegative,
  parseDecimal,
  rejectCoercion,
  subtract,
} from './internal/decimal';
import type { RoundingPolicy } from './rounding';

export class Quantity {
  readonly #value: string;
  constructor(value: string) {
    this.#value = nonNegative(parseDecimal(value));
    Object.freeze(this);
  }
  get value(): string {
    return this.#value;
  }
  add(other: Quantity): Quantity {
    return new Quantity(add(this.#value, other.#value));
  }
  subtract(other: Quantity): Quantity {
    return new Quantity(subtract(this.#value, other.#value));
  }
  multiply(scalar: string): Quantity {
    return new Quantity(
      multiply(this.#value, nonNegative(parseDecimal(scalar))),
    );
  }
  compare(other: Quantity): -1 | 0 | 1 {
    return compare(this.#value, other.#value);
  }
  equals(other: Quantity): boolean {
    return this.compare(other) === 0;
  }
  round(policy: RoundingPolicy): Quantity {
    return new Quantity(format(this.#value, policy));
  }
  format(policy: RoundingPolicy): string {
    return format(this.#value, policy);
  }
  toJSON(): { value: string } {
    return { value: this.#value };
  }
  [Symbol.toPrimitive](): never {
    return rejectCoercion();
  }
}
