# Financial primitives

`@iol-agent/financial` is a broker-independent domain package introduced in Phase 1
Step 2. It has no NestJS, IOL, network, database, trading or model dependencies.
Its only runtime dependency is pinned `bignumber.js` 11.1.5, hidden behind the
package's root exports. Build with `npm run build`; tests are discovered by the
root `npm test` command. ADR-019 records the library comparison and policy.

## Public API and semantics

| Type         | Construction                                                    | Meaning and valid states                                                                                                                                                        | JSON                                                |
| ------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Currency     | `Currency.ARS`, `Currency.USD`, `parseCurrency(unknown)`        | Closed, case-sensitive ARS/USD set; extending it requires an explicit change.                                                                                                   | `"ARS"` or `"USD"`                                  |
| Money        | `new Money("123.45", Currency.ARS)`                             | Signed amount, including zero; debt/loss/refund amounts are allowed.                                                                                                            | `{ "amount": "123.45", "currency": "ARS" }`         |
| Price        | `new Price("1.234567", Currency.USD)`                           | Non-negative quote value, including zero. Not interchangeable with Money. No assumed cash precision or tick size.                                                               | `{ "value": "1.234567", "currency": "USD" }`        |
| Quantity     | `new Quantity("1.25")`                                          | Non-negative units/shares/contracts; fractional and zero allowed. Currency-free. Signed positions are a separate future domain.                                                 | `{ "value": "1.25" }`                               |
| NominalValue | `new NominalValue("100.5")`                                     | Non-negative face-value units, including fractional/zero; distinct from share quantity. Currency, denomination and quote-per-nominal basis belong to later instrument metadata. | `{ "value": "100.5" }`                              |
| Percentage   | `Percentage.fromPercent("5")` or `Percentage.fromRatio("0.05")` | Stores a dimensionless ratio: 5% = 0.05. Negative and above-100% values are valid; no risk limits are implied.                                                                  | `{ "ratio": "0.05" }`                               |
| FxRate       | `new FxRate(Currency.USD, Currency.ARS, "1450")`                | Positive quote units per one base unit: 1 USD = 1450 ARS. Base and quote must differ.                                                                                           | `{ "base": "USD", "quote": "ARS", "rate": "1450" }` |

Money supports `add`, `subtract`, `multiply` by a dimensionless decimal string,
`compare` (-1/0/1), and `equals`. All binary Money operations, including equality,
throw on currency mismatch. Price comparisons/equality do the same. Quantity and
NominalValue support same-type addition/subtraction/comparison and non-negative
scalar multiplication; negative inputs or subtraction results throw. Private
fields keep these classes distinct in TypeScript and at runtime.

Percentage provides `toRatioString`, `toPercentString`, comparison/equality, and
`applyTo(Money)` for an exact percentage amount (for example a fee). It does not
add that amount to a balance automatically. `fromRatio("5")` means 500%, not 5%.
FX `convert(Money)` accepts only base-currency Money and returns quote-currency
Money. It never infers a rate or direction. No inverse or division API exists in
this step; a future non-terminating division must define an explicit precision
and rounding boundary before it is exposed.

Price has no price-times-quantity shortcut: quote basis, nominal multipliers,
tick sizes, settlement and instrument identity must be verified later. A currency
pair alone also does not establish an MEP/CCL rate, provenance, timestamp or spread;
callers will need verified market metadata before these primitives serve pricing.

## Parsing and calculation limits

Financial numeric inputs must be strings, both in TypeScript and at runtime.
Accepted syntax is a minus sign if needed, `0` or an integer without leading zeros,
and an optional decimal point followed by digits. Examples: `"0"`, `"-1.25"`,
`"1234.56"`. Reject whitespace (including trailing newlines), plus signs, empty
strings, NaN/Infinity, scientific notation, binary/hex prefixes, grouping separators,
`.5`, `1.`, `01`, JS numbers and arbitrary objects. No trimming or sanitization.
Scientific input can be reconsidered through an explicit later contract change.

Inputs permit at most 100 integer digits and 100 fractional digits, including
fractional trailing zeros. A length check bounds parsing work. Calculations use
exact decimal addition, subtraction, multiplication and base-10 shifts in a
private library clone; **no intermediate rounding** occurs. Results outside the
same numeric bounds throw instead of truncating, underflowing to zero or becoming
infinite. Percentage scale conversions obey those bounds too. These are technical
resource limits, not assertions about provider precision or allowed order sizes.

No critical arithmetic uses JS binary floating point. JS numbers are used only
for non-financial metadata such as decimal-place counts and comparison outcomes.
There is no public `toNumber` or raw decimal-library export. Implicit coercion
(including `Number(value)`, operator coercion and implicit string conversion)
throws. Explicit string access/JSON is available; callers must not convert those
strings to JS numbers for financial arithmetic.

## Rounding and serialization

- Internal calculation: exact within the stated bounds; overflow/excess fractional
  precision throws. No global significant-digit rounding or automatic cents.
- Display: Money, Price, Quantity and NominalValue `format(policy)` return a fixed
  decimal string without changing the value. Do not parse a display string back
  into an intermediate calculation.
- Settlement/cash or another verified boundary: `round(policy)` returns a new
  same-type value. The caller must supply both `decimalPlaces` (integer 0..100)
  and `mode`. No universal settlement scale or rounding mode is assumed.
- Provider precision: all accepted numerical digits are preserved. Canonical
  serialization drops insignificant trailing zeros and normalizes negative zero;
  preserve the provider's original text/declared scale separately in future
  authorized provenance metadata if needed. Inputs beyond the bounds are rejected.

`RoundingMode` exposes AwayFromZero, TowardZero, Ceiling, Floor, HalfUp, HalfDown,
HalfEven, HalfCeiling and HalfFloor. HalfUp resolves a tie away from zero; HalfDown
toward zero; HalfEven to the nearest even last digit; HalfCeiling/HalfFloor toward
positive/negative infinity on ties. All modes are tested for both signs. A boundary
must choose its policy explicitly; half-even is not an invented broker rule.

```ts
import {
  Currency,
  Money,
  Percentage,
  RoundingMode,
} from '@iol-agent/financial';

const amount = new Money('1.01', Currency.ARS);
const fee = Percentage.fromPercent('5').applyTo(amount); // exact 0.0505 ARS
const display = fee.format({ decimalPlaces: 2, mode: RoundingMode.HalfEven });
// display: "0.05"; fee.amount remains "0.0505"
```

All objects are immutable; operations return new instances. `toJSON()` returns
fresh plain records using decimal strings, plain base-10 notation, no exponent,
no insignificant trailing zeros, and `"0"` for all zero values. Property names
encode amount/value/ratio/rate and include currency/direction where applicable.
Serialization carries the numeric value, not provider formatting precision.
