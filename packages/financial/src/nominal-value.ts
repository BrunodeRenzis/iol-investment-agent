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

export class NominalValue {
  readonly #value: string;
  constructor(value: string) {
    this.#value = nonNegative(parseDecimal(value));
    Object.freeze(this);
  }
  get value(): string {
    return this.#value;
  }
  add(other: NominalValue): NominalValue {
    return new NominalValue(add(this.#value, other.#value));
  }
  subtract(other: NominalValue): NominalValue {
    return new NominalValue(subtract(this.#value, other.#value));
  }
  multiply(scalar: string): NominalValue {
    return new NominalValue(
      multiply(this.#value, nonNegative(parseDecimal(scalar))),
    );
  }
  compare(other: NominalValue): -1 | 0 | 1 {
    return compare(this.#value, other.#value);
  }
  equals(other: NominalValue): boolean {
    return this.compare(other) === 0;
  }
  round(policy: RoundingPolicy): NominalValue {
    return new NominalValue(format(this.#value, policy));
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
