export const RoundingMode = Object.freeze({
  AwayFromZero: 'away-from-zero',
  TowardZero: 'toward-zero',
  Ceiling: 'ceiling',
  Floor: 'floor',
  HalfUp: 'half-up',
  HalfDown: 'half-down',
  HalfEven: 'half-even',
  HalfCeiling: 'half-ceiling',
  HalfFloor: 'half-floor',
} as const);
export type RoundingMode = (typeof RoundingMode)[keyof typeof RoundingMode];

export interface RoundingPolicy {
  readonly decimalPlaces: number;
  readonly mode: RoundingMode;
}
