# Step 4B — prepared user-run verification

**OFFLINE ADAPTER COMPLETE — REAL-CALL RUNNER PREPARED — REAL CALL NOT YET EXECUTED.**

Preparation and offline tests are authorized; real execution is NOT authorized by
this change. Step 4 remains open. This runbook follows AGENTS.md, ADR-017,
ADR-020/ADR-021 and IOL_CONTRACT.md. Agents never request, receive or use real
credentials and never execute an authenticated verification session.

## Prerequisites before a real session

1. Independently review the adapter, private password-grant boundary, runner,
   terminal handling, output projections and offline tests. Obtain Bruno's explicit
   approval for the specific local manual session. The runner's typed acknowledgment
   does not substitute for that review/approval.
2. Bruno confirms personal API activation/access entitlement and applicable manual
   request restrictions through official channels. REST scopes remain UNKNOWN;
   treat the token as WRITE-CAPABLE. Confirm official revocation/incident options
   without inventing a revocation endpoint or 2FA flow. Do not use Swagger Try it
   out; the homo UI does not prove sandbox isolation.
3. Use a separate private terminal/process without recording, shell transcription,
   debug/preload hooks, crash/heap dumps or HTTP tracing. Broker secrets NEVER go
   in .env, environment, CLI arguments, history, files, logs or prompts. Do not run
   through an agent. The runner does not read env/files and rejects explicit CLI/
   Node options; process-level instrumentation still requires a trusted runtime.
4. Run `npm ci`, `npm run check`, `npm run audit:dependencies`. On Windows with
   PowerShell script restrictions, use `npm.cmd` for the same commands. Check
   hidden-input behavior locally with synthetic input before real credentials;
   starting and exiting requires no credentials or authentication request.
5. Review the local limits: one explicit auth action, then at most four separately
   chosen reads, each once; no retry/refresh/re-login or polling. The whole session
   lasts at most five minutes from startup, with an earlier token deadline derived
   conservatively from positive expires_in. Both boundaries time out at ten
   seconds. These are local safeguards, not IOL quota/lifetime guarantees.

Collection/storage/redistribution rights remain a separate gate. This procedure
does not create a dataset or permit persistence of financial observations.

## Launch only after review and explicit real-session approval

Build output is produced by `npm run check` / `npm run build`. From the repository:

```text
npm run iol:verify:manual
```

This launches only `packages/iol/dist/manual.js` in its own local process.
`npm start` still starts the health-only API using .env for general settings;
the API never imports the runner and rejects IOL environment keys except
`IOL_READ_ONLY`. No broker secret belongs in either process's environment.

The runner makes NO request at startup. Input/output must be a TTY; pipes and
redirected output are refused. All input is hidden, including username and actions.
Type manually; pasted/batched text, control sequences and unsupported terminal
input stop the session. Backspace is supported. `salir` exits at an action prompt;
Ctrl+C cancels, including during hidden input. No readline/shell input history.

An explicit `AUTENTICAR SESION APROBADA` action prompts privately for username and
password and sends at most one `POST https://api.invertironline.com/token`.
The form has only username, password and grant_type=password. Auth is separate:
the four-GET allowlist still rejects /token and POST. No redirects.
Password references are released immediately after form construction; the form
is not cached. A strictly validated access token stays private in memory. The
refresh token is discarded; expiry or any auth error ends the session.

## One explicit action per read

Recommended order (never automatically chained):

| Action | Operation     | Fixed path                                        | Local checks                                                                   |
| ------ | ------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| `1`    | instrument    | `GET /api/v2/bCBA/Titulos/AL30`                   | Identity matches request; exact V2 enums, currency and settlement present.     |
| `2`    | quote detail  | `GET /api/v2/bCBA/Titulos/AL30/CotizacionDetalle` | Identity, numeric lexemes, optional/null fields, puntas, int32 volumenNominal. |
| `3`    | account state | `GET /api/v2/estadocuenta`                        | Structure and separate tipo/moneda/liquidacion contexts; numero discarded.     |
| `4`    | portfolio     | `GET /api/v2/portafolio/argentina`                | Country, holding/title structure and numeric types.                            |

All use exactly `https://api.invertironline.com`, without queries. AL30 is a fixed
routing example, not a recommendation or availability guarantee. If unavailable,
stop; a different symbol or US portfolio requires a separately reviewed change
and explicit approval. No symbol/market enumeration. Each action can be selected
once; repeating or entering any other action stops without a read. Completing
four actions exits; stopping earlier is allowed and leaves acceptance incomplete.

Stop on any redirect, non-200 status (including 401/429), timeout, invalid UTF-8,
content-type mismatch, oversized payload, unexpected casing/shape/nullability,
identity mismatch or suspected exposure. No permissive fallback, error-body dump,
retry, refresh, automatic next action or probe.

## Sanitized evidence only

Each successful operation emits an operation-specific JSON summary with fixed
operation/status labels, preselected field names, presence/null counts, type labels,
collection counts and parser/schema/identity validation results. It NEVER prints
token/Authorization, username/password, cookies, account numbers, DNI/CUIT/email,
balances, holding identities, quantities, prices, timestamps or complete payloads.
Failure emits a fixed category only. Unknown field names/casing values are not
echoed; they may themselves contain sensitive text.

`lossless_validated` means the response passed the lossless parser and strict
schema; synthetic offline tests establish lexeme preservation. It is not evidence
of provider economic precision, freshness or executable prices. No actual financial
lexemes are shown for manual comparison. No schema-failure diagnostic bypass is
provided; any future diagnostic expansion requires review.

Inspect the summary locally before sharing. Record date, selected operation and
sanitized outcome in IOL_CONTRACT.md after review. Retain unresolved semantics as
UNKNOWN. Only then decide whether Step 4 acceptance is satisfied; Step 5 remains
separately gated.

## Session disposal and incident procedure

Completion, salir, cancellation, expiry or error clears reachable credential/token
references and aborts outstanding requests. End the process. JavaScript and the
HTTP stack may retain copies until collection: no cryptographic memory wipe or
provider-side revocation is claimed. No password/token is persisted.

If exposure is suspected, stop; do not paste logs/payloads or retry. Use verified
IOL security/support channels to revoke sessions/tokens and rotate affected
credentials as applicable. No revocation API is assumed or implemented. Document
only sanitized incident facts and obtain review/new approval before resuming.

## Runtime unknowns still open

Refresh lifetime/rotation/reuse/concurrency, revocation, 2FA behavior, API activation,
real error bodies, 429/Retry-After behavior, quotas, actual enum casing/nullability,
scientific notation, volumenNominal representation/range, actual response
content-type and true read-only REST scopes remain unverified. .refreshexpires
is validated only as an optional string, never interpreted. No refresh operation
is present. Data rights, valuation/MEP/CCL and settlement semantics remain separate
blockers for later phases.
