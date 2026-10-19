// Exact Swagger casing only. No implicit case folding or inferred aliases.
export const IOL_COUNTRIES = Object.freeze([
  'argentina',
  'estados_Unidos',
] as const);
export const IOL_MARKETS = Object.freeze([
  'bCBA',
  'nYSE',
  'nASDAQ',
  'aMEX',
  'bCS',
  'rOFX',
] as const);
export type IolCountry = (typeof IOL_COUNTRIES)[number];
export type IolMarket = (typeof IOL_MARKETS)[number];
