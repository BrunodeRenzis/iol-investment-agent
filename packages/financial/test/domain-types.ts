import type {
  Money,
  Price,
  Quantity,
  NominalValue,
  Percentage,
  FxRate,
} from '../src';

type Assert<T extends true> = T;
type Distinct<A, B> = A extends B ? false : true;

// Compilation must fail if a refactor makes these domain types interchangeable.
export type DomainTypeChecks = [
  Assert<Distinct<Money, Price>>,
  Assert<Distinct<Price, Money>>,
  Assert<Distinct<Quantity, NominalValue>>,
  Assert<Distinct<NominalValue, Quantity>>,
  Assert<Distinct<Percentage, Quantity>>,
  Assert<Distinct<FxRate, Price>>,
  Assert<Distinct<number, ConstructorParameters<typeof Money>[0]>>,
  Assert<Distinct<number, Parameters<Money['multiply']>[0]>>,
];
