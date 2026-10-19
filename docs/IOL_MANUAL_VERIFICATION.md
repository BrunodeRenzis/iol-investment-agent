# Step 4 — future user-run verification

**NOT AUTHORIZED OR EXECUTED BY THIS IMPLEMENTATION.** The adapter is complete
offline; Step 4 remains open until the real-call acceptance gate is satisfied.
This runbook is subordinate to AGENTS.md, ADR-017/ADR-020 and IOL_CONTRACT.md.
No credentials should be generated, requested, pasted or shared now.

## Prerequisites before any authenticated request

1. Obtain independent review of the offline diff and tests, then Bruno's explicit
   approval for a local, user-run, four-operation read-only verification session.
   Confirm the intended personal API account/access entitlement locally. Do not
   use Swagger's Try it out UI or assume the homo UI points to an isolated sandbox.
2. Resolve/document the runtime authentication policy using official evidence:
   credential source, token expiry/revocation, refresh/reuse/concurrency and
   re-login handling. Password persistence remains undecided and unimplemented.
   An explicitly approved short-lived in-memory session without persistence or
   automatic refresh/re-login may be considered; it is not silently selected here.
   Verify true read-only scope availability; if absent or still unverified,
   document the write-capable assumption and containment before proceeding.
3. Review local timeout/no-retry behavior and an approved single-request operating
   limit against known API terms/runtime limitations. Unknown quotas/error shapes
   are not invented: unexpected status stops the session; no automated probing,
   intentional auth failures or retries are allowed. Collection/storage rights
   remain a separate gate; this verification does not create a dataset.
4. In a separately approved change, add/review a manual runner **inside
   `packages/iol`**, with hidden local credential input and package-private live
   wiring. It must use the existing strict transport with built-in fetch, never
   expose credentials to another package, and issue exactly one chosen named
   operation per explicit user action. Add offline tests before enabling it.
   No such runner/live factory currently exists; `npm start` only starts health.
   Do not improvise a generic HTTP proxy or use credentials in command arguments,
   shell history, environment dumps, debug logs or agent prompts.
5. Run `npm ci`, `npm run check` and `npm run audit:dependencies`. Confirm redirect
   mode is manual, no retries, only the four allowlisted GET paths, no request or
   raw-response logging, and no automatic request on startup. Disable shell
   transcription/debug capture for the approved private session.

## Exact manual request sequence after those prerequisites

Bruno runs each action locally and explicitly decides whether to proceed to the
next. No agent runs authenticated requests. The least sensitive reads come first.
All requests use exactly `https://api.invertironline.com`; no query string.

| Order | Named action                     | Exact path / checks                                                                                                                                                                                               |
| ----- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `getInstrument('bCBA', 'AL30')`  | `GET /api/v2/bCBA/Titulos/AL30`; verify returned market/symbol, country, security type, currency and settlement enum shape. AL30 is a routing example, not a recommendation or guaranteed availability.           |
| 2     | `getQuoteDetail('bCBA', 'AL30')` | `GET /api/v2/bCBA/Titulos/AL30/CotizacionDetalle`; verify the same identity, exact numeric token preservation, optional/null fields and raw timestamp text. Do not infer freshness/timezone or executable prices. |
| 3     | `getAccountState()`              | `GET /api/v2/estadocuenta`; verify field names/types and distinct tipo/moneda/liquidacion contexts locally. Account numero must be discarded. Do not share balances, totals or a full DTO.                        |
| 4     | `getPortfolio('argentina')`      | `GET /api/v2/portafolio/argentina`; verify country, empty/nonempty shape, title identity and numeric types locally. Do not share holdings, quantities, costs or valuations.                                       |

If AL30 is unavailable, stop; a different officially confirmed symbol requires a
new explicit user action after review. Do not enumerate symbols or markets. A US
portfolio request is optional only under a separate explicit user action and
verified account entitlement, using canonical `estados_Unidos`; it is not an
automatic fifth request.

Stop immediately on any redirect, non-200 response, timeout, invalid payload,
unexpected casing/shape/nullability, identity mismatch or credential exposure.
Do not bypass allowlist/schema validation to finish the session. A failed operation
must not cause the next operation, token refresh or a retry. Dispose of the local
session/token according to the approved revocation/lifetime policy; on credential
exposure, stop and rotate/revoke through the official mechanism.

## Evidence safe to share

The future runner must emit only an allowlisted diagnostic summary: operation
name, fixed result/error category, reviewed HTTP status if available, field-name
and type/presence findings, and pass/fail for numeric/identity checks. No token,
Authorization, username/password, cookie, account number, DNI/CUIT, email,
balances, holdings, quantities or complete raw/decoded response may appear.

Inspect the summary locally before sharing. Describe a schema mismatch using field
names and synthetic replacement values only; keep all account identifiers removed.
Do not paste a raw payload for troubleshooting. Record the verification date and
sanitized outcome in IOL_CONTRACT.md after review; unknown semantics remain UNKNOWN.
Only then decide whether Step 4's acceptance criteria are satisfied. Step 5,
persistence, scheduling and broker writes remain separately gated.
