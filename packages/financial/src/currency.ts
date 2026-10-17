export const Currency = Object.freeze({ ARS: 'ARS', USD: 'USD' } as const);
export type Currency = (typeof Currency)[keyof typeof Currency];

export function parseCurrency(value: unknown): Currency {
  if (value !== Currency.ARS && value !== Currency.USD) {
    throw new TypeError('Unsupported currency');
  }
  return value;
}

export function requireSameCurrency(left: Currency, right: Currency): void {
  if (left !== right)
    throw new TypeError('Currency mismatch; explicit FX required');
}
