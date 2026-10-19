# Step 4B — prepared user-run verification

**OFFLINE ADAPTER COMPLETE — REAL-CALL RUNNER PREPARED — REAL CALL NOT YET EXECUTED.**

Preparation and offline tests are authorized; real execution is NOT authorized by
this change. Step 4 remains open. This runbook follows AGENTS.md, ADR-017,
ADR-020/ADR-021/ADR-022 and IOL_CONTRACT.md. Agents never request, receive or use real
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
   through an agent. Before any prompt, the runner checks only runtime environment
   variable names, inspector state and explicit Node options (ADR-022). No env
   values, broker credentials or files are read. See the runtime preflight below.
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

## Runtime and terminal preflight (ADR-022)

Use ordinary PowerShell or Windows Terminal. Do NOT use JavaScript Debug Terminal,
VS Code Auto Attach or any debugger. Git Bash/mintty is not compatible when Node
does not expose a real TTY. Both input/output TTY checks run before credentials;
terminal failures use terminal_unavailable, runtime restrictions runtime_rejected.

The preflight inspects environment variable names only and rejects presence,
including empty values and lowercase aliases, of NODE_OPTIONS,
NODE_TLS_REJECT_UNAUTHORIZED, NODE_EXTRA_CA_CERTS, NODE_USE_ENV_PROXY, HTTPS_PROXY,
HTTP_PROXY, ALL_PROXY, NODE_V8_COVERAGE, SSLKEYLOGFILE, NODE_REDIRECT_WARNINGS,
VSCODE_INSPECTOR_OPTIONS and VSCODE_JS_DEBUG_OPTIONS. It also rejects an active
inspector.url() or any process.execArgv option, including inspect/inspect-brk,
require/import and loaders/hooks. No values or environment dumps are printed.
Checks repeat immediately before authentication and each read. Use a clean normal
terminal if blocked; never bypass the check. This cannot undo an already executed
malicious preload or attest a trusted OS/runtime.

## Launch only after review and explicit real-session approval

The command rebuilds packages/iol with the pinned local compiler before launching;
a failed build stops execution, so stale dist output is never silently used.
Compilation makes no network request. From the repository:

```text
npm run iol:verify:manual
```

After successful compilation this launches `packages/iol/dist/manual.js` in its
own local process.
`npm start` still starts the health-only API using .env for general settings;
the API never imports the runner and rejects IOL environment keys except
`IOL_READ_ONLY`. No broker secret belongs in either process's environment.
If an older local .env contains IOL\_\* credential/client/origin placeholders, remove
those entries before starting the API, even if empty. Keep only IOL_READ_ONLY=true.
Do not print their values or ask an agent to inspect that file.

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

Access-token validation uses the same dedicated 16,384-character ASCII bearer
limit as the read transport. It does not use the generic string decoder's 4,096
limit. Other optional token-response strings retain their existing bound. No token
is printed on acceptance or rejection. These are local limits, not IOL guarantees.

## One explicit action per read

Mandatory order (never automatically chained):

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
only in order 1 -> 2 -> 3 -> 4; skipping, repeating or entering another action
stops without that read. Each next step still requires explicit confirmation. Completing
four actions exits; stopping earlier is allowed and leaves acceptance incomplete.

Stop on any redirect, non-200 status (including 401/429), timeout, invalid UTF-8,
content-type mismatch, oversized payload, unexpected casing/shape/nullability,
identity mismatch or suspected exposure. No permissive fallback, error-body dump,
retry, refresh, automatic next action or probe.

## Sanitized evidence only

Each successful operation emits an operation-specific JSON summary with fixed
operation/status labels, preselected field names, boolean presence/null indicators,
type labels, none/present collection indicators and validation results. Exact
account/holding/depth counts and per-field occurrence counts are never printed. It NEVER prints
token/Authorization, username/password, cookies, account numbers, DNI/CUIT/email,
balances, holding identities, quantities, prices, timestamps or complete payloads.
Schema failure emits a fixed category plus only a known schema path (for example
quoteDetail.ultimoPrecio or accountState.cuentas[].moneda) and a closed kind:
missing, null, type, enum, exponent, range, unknown_fields or malformed. Arrays use
[] with no indices. Unknown fields reveal only their category, never names,
values or counts. Casing mismatches report enum, never the rejected string.
Unrecognized paths fall back to payload; no arbitrary error metadata is copied.

`lossless_validated` means the response passed the lossless parser and strict
schema; synthetic offline tests establish lexeme preservation. It is not evidence
of provider economic precision, freshness or executable prices. No actual financial
lexemes are shown for manual comparison. Sanitized diagnostics never permit a
schema-validation bypass; any expansion of paths/kinds requires review.

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

### Failure during or after possible token issuance

If POST /token may have reached IOL but the runner fails before establishing the
local session (including timeout, malformed/oversized response, rejected token,
content-type mismatch or cancellation), treat a remote token as potentially
active. Terminate the runner and follow the incident procedure; do NOT retry
authentication automatically or immediately start another manual attempt.
The runner emits a fixed warning when auth was attempted without a local session.

Before another approved manual attempt, respect the officially documented access
lifetime recorded in IOL_CONTRACT.md source A (15 minutes), measured from the
latest possible issuance, or use an official revocation mechanism if subsequently
verified. If the issuance window/applicable lifetime cannot be established, seek
official guidance before another attempt. No revocation endpoint or capability is
invented. dispose(), process exit and the local five-minute session limit do NOT
revoke a remote token or prove it expired.

## Offline test network limitation

Tests use injected synthetic responses and temporary numeric-loopback servers.
No IOL request is part of testing. A global external-network guard was evaluated
but not installed: patching fetch alone would not cover HTTP/net/TLS, native code
or subprocesses. The harness does not guarantee denial of every future external
attempt. An OS/CI egress policy would require a separately reviewed implementation.

## Runtime unknowns still open

Refresh lifetime/rotation/reuse/concurrency, revocation, 2FA behavior, API activation,
real error bodies, 429/Retry-After behavior, quotas, actual enum casing/nullability,
scientific notation, volumenNominal representation/range, actual response
content-type and true read-only REST scopes remain unverified. .refreshexpires
is validated only as an optional string, never interpreted. No refresh operation
is present. Data rights, valuation/MEP/CCL and settlement semantics remain separate
blockers for later phases.
