# IOL read-only adapter

**OFFLINE ADAPTER COMPLETE — REAL CALL VERIFICATION PENDING.** Phase 1 Step 4
implements the four verified read contracts under ADR-020. It does not complete
Step 4's real-call acceptance gate. See [contract evidence](../../docs/IOL_CONTRACT.md)
and the [future manual verification procedure](../../docs/IOL_MANUAL_VERIFICATION.md).

## Boundary and usage

The package root exports `createOfflineIolAdapter`, `IolReadOnlyAdapter`, four
provider DTO types, the country/market constants and types, and sanitized errors.
The factory takes synthetic raw JSON fixtures, not credentials or a transport:

```typescript
import { createOfflineIolAdapter } from '@iol-agent/iol';

const iol = createOfflineIolAdapter({
  portfolio: '{"pais":"argentina","activos":[]}',
});
const portfolio = await iol.getPortfolio('argentina');
```

Fixture keys are `accountState`, `portfolio`, `instrument`, and `quoteDetail`.
Each fixture supplies one operation's response; missing fixtures fail. All four
operations use the same validation/parser/DTO pipeline as the internal adapter.
The public factory cannot perform network access. The API application does not
import this package or expose financial endpoints.

The internal authenticated transport requires an explicitly injected `fetch`;
tests supply mocks only. It has no global/default fetch, live factory, credential
loader, `/token` acquisition, refresh, password persistence or re-login logic.
Future live wiring and credential acquisition must stay inside this package and
pass the documented review/user-run gate. Other packages may obtain only the
four-operation facade, never a credential-bearing transport or generic request.
Package exports deny internal subpaths; this is an application boundary, not an
OS sandbox against malicious code with filesystem/process access.

## Exact allowlist

Only origin `https://api.invertironline.com`, method `GET`, and these paths:

| Operation                        | Path                                                    |
| -------------------------------- | ------------------------------------------------------- |
| `getAccountState()`              | `/api/v2/estadocuenta`                                  |
| `getPortfolio(country)`          | `/api/v2/portafolio/{pais}`                             |
| `getInstrument(market, symbol)`  | `/api/v2/{mercado}/Titulos/{simbolo}`                   |
| `getQuoteDetail(market, symbol)` | `/api/v2/{mercado}/Titulos/{simbolo}/CotizacionDetalle` |

No query keys, fragments, trailing/duplicate slashes, encoded path characters or
extra path/parameter names are accepted. Validation precedes network access and
URL normalization; it is not prefix matching. No alternate origin, HTTP scheme,
port spelling, hostname casing, subdomain or localhost override is accepted.
All redirects, including same-origin redirects, fail; `fetch` uses `redirect:
'manual'`. There are no automatic retries, including for 401/429.

Canonical inputs and response enums use exact V2 Swagger spelling only:

- `pais`: `argentina`, `estados_Unidos`.
- `mercado`: `bCBA`, `nYSE`, `nASDAQ`, `aMEX`, `bCS`, `rOFX`.
- `simbolo`: 1–32 ASCII uppercase letters/digits. This is a conservative local
  routing restriction, not an official exhaustive symbol grammar or a list of
  currently traded instruments. Dotted/punctuated symbols require later verified
  policy changes; no implicit encoding, trimming or case conversion occurs.

Response enums also use exact V2 spelling, including account/security types,
currencies and the separate balance versus instrument settlement vocabularies.
Documentation-example aliases are deliberately unsupported pending live evidence.
Instrument/detail market and symbol, and portfolio country, must match the request.
Settlement is preserved from the response, never chosen through an invented query.

## Numeric parsing and DTOs

Pinned `lossless-json` 4.3.2 parses JSON grammar. Its `parseNumber` callback receives
raw numeric token text and creates an internal lexical wrapper, without JS Number
conversion. Schema decoders return decimal **strings**, retaining scale and signed
zero. Neither `JSON.parse` nor `response.json()` is used on broker data. Regex is
used only on individual parser-recognized numeric tokens, never to parse raw JSON.

Plain decimal tokens support at most 100 integer and 100 fractional digits.
All exponent notation is deliberately rejected, as are malformed/non-finite,
oversized or quoted numeric values. Rejection is explicit, never rounding. These
are local bounds aligned with ADR-019, not provider precision guarantees.
Verified `int32` fields require lexical integers and exact signed 32-bit range
checks using BigInt; they remain strings. In particular, `volumenNominal` is int32
in the supported detail model; the excluded `CotizacionModel` documents double.
`cantidadOperaciones`, `laminaMinima`, `lote`, `cantidadMinima`, statistics counts
and parking's `disponibleInmediato` likewise retain their int32 contract.

Conflicting duplicate JSON keys fail. The pinned parser accepts identical duplicate
values; schema validation still applies to the resulting value. Unknown schema
fields fail, including prototype-related fields. Objects/arrays are frozen.
Response bodies are bounded to 1 MiB with strict UTF-8 decoding, arrays to 10,000
entries and strings to 4,096 characters. These are local resource controls.

Swagger lacks required/nullability guarantees. The local minimum accepted shape is:

- Account state: `cuentas` array; each account requires `tipo` and `moneda`; each
  supplied balance requires `liquidacion`.
- Portfolio: `pais` and `activos`; each holding requires `titulo`.
- Instrument and holding title: `simbolo`, `mercado`, `pais`, `tipo`, `plazo`, `moneda`.
- Quote detail: the same identity; `ultimoPrecio` is optional and null-preserving.
  A quote may contain bid/ask data without a last trade. No last price is synthesized
  from bid, ask or midpoint; empty or one-sided `puntas` remains as supplied.

Other documented fields accept omission/null; omission and null are preserved,
never replaced with zero/empty values. Required fields cannot be null. This
fail-closed minimum is an application choice, not a claim that IOL guarantees it.
Actual presence/nullability/casing must be verified before live activation.

`CuentaModel.numero` is validated when present and discarded before returning the
DTO. Other account context stays separate: no summation, MEP/CCL inference,
currency mapping, P&L calculation or normalization is performed. If later account
identity is needed, introduce a reviewed minimal provenance design in Step 5.
Timestamp text remains raw; no exchange-time, timezone or freshness claim is made.
Missing bid/ask stays missing, and last price is never treated as executable.

The DTOs remain IOL-specific, not domain objects. Verified numeric strings can
later feed `packages/financial` directly; an offline regression demonstrates
exact string-to-Quantity conversion. No production Money/Price conversion is
introduced until units, currency and account/settlement context are verified.

## Credentials, errors and limits

Unknown REST scopes mean every token is treated as write-capable. Internally,
the transport holds only a private in-memory `#token`, with no getter and safe
JSON/inspection representations. It constructs Authorization only for validated
requests. No real token is loaded by this implementation or its tests.

There are no payload logs. Errors expose only fixed codes: `allowlist_rejection`,
`invalid_payload`, `network_failure`, `timeout`, `authentication_failure`,
`authorization_failure`, `unexpected_status`, `redirect_rejected`, and
`offline_fixture_missing`. External messages, causes and error bodies are dropped.
HTTP 401/403 are categorized by status; undocumented error bodies are not parsed.
The local timeout defaults to 10 seconds, bounded to 1–30,000 ms internally;
timeout aborts the request. This is not an IOL SLA or a quota/retry contract.

Private fields and narrow exports prevent accidental credential exposure through
the supported API; they cannot protect secrets against arbitrary malicious code
inside the same process. Future trusted live wiring must not inject a fetch
implementation that ignores manual redirects or captures credentials.

## Validation

`npm test` discovers `packages/iol/test/*.test.ts` after compilation through the
existing explicit test harness. Fixtures are synthetic schema examples, never
copied private responses. Adversarial tests cover route/method/origin rejection
before network, malformed symbols, redirects, numeric precision, strict schemas,
response identity, secret-safe errors/inspection, package exports and timeout.
Only mocks are used for IOL transport. `npm run check` also builds this package's
JavaScript/declarations; `npm run audit:dependencies` audits the lockfile.
