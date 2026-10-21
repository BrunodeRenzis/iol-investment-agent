# Step 4B — prepared user-run verification

**OFFLINE ADAPTER COMPLETE — REAL-CALL RUNNER PREPARED — REAL CALL NOT YET EXECUTED.**

Preparation and offline tests are authorized; real execution is NOT authorized by
this change. Step 4 remains open. This runbook follows AGENTS.md, ADR-017,
ADR-020/ADR-021/ADR-022/ADR-025 and IOL_CONTRACT.md. Agents never request, receive or use real
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
NODE_TLS_REJECT_UNAUTHORIZED, NODE_EXTRA_CA_CERTS, NODE_USE_SYSTEM_CA, NODE_USE_ENV_PROXY, HTTPS_PROXY,
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
limit. The optional refresh_token has a dedicated 16,384-character limit and is
discarded after validation; overflow ends the session without retry. Other optional
token-response strings retain their existing bound. The 64 KiB body cap is unchanged. No token
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

## Restricted action-1 enum fingerprint (ADR-026)

Only a rejected instrument.tipo string with kind enum during action 1 may add
rejectedEnumFingerprint to the stopped-session JSON. The payload still fails with
invalid_payload and the session ends; do not proceed to action 2 or retry.

The output is entirely closed vocabulary, never the received wire value:

- A unique diagnostic fold to one of the 49 V2 security types reports that
  canonical member, casing (all_upper/all_lower/first_upper/first_lower/mixed),
  separators (none/underscore/space/mixed), and padded (boolean).
- Multiple matches reports only foldsToV2Member ambiguous. The two documented
  obligations-negotiables spellings collide; no member is selected.
- No match reports only foldsToV2Member none and charset
  ascii_letters/ascii_word/other. No casing, separators or length is reported.
- Non-ASCII, controls or more than 64 characters reports only none / other;
  the value is not truncated or Unicode-normalized.

Folding lowercases and removes ASCII spaces/underscores for diagnostics only.
Uniform-case labels take precedence; first_upper/first_lower compare against the
canonical case pattern with only its initial letter forced to that case.
Padded means an ASCII space at either edge. ascii_word covers letters, digits and
underscores. No arbitrary string, body, header, symbol, hash or token is emitted.
Portfolio/account/balance/auth/quote failures and other instrument fields retain
their existing diagnostics without this fingerprint.

Share only the sanitized JSON, never a payload or credential. The fingerprint
does not print the wire string, but some combinations can uniquely identify it:
ADR-027 proves this for titulosPublicos / first_upper / none / false and separately
authorizes only TitulosPublicos -> titulosPublicos. It is inferred production
evidence, not documentary evidence. Other unknown values remain UNKNOWN unless
separately established. A fingerprint never authorizes an alias automatically;
further changes require separate evidence, review and a new ADR.
The existing incident/waiting policy still applies after this stopped session.

## Session disposal and incident procedure

### Authentication diagnostics (ADR-025)

Authentication failures expose only a fixed category, a closed local stage and,
when a response was received, an optional integer httpStatus in 100–599. Stages:

| stage           | Local fact                                                         |
| --------------- | ------------------------------------------------------------------ |
| before_request  | No authentication fetch was invoked.                               |
| request         | Fetch was invoked; no response status has been processed.          |
| response_status | Response received; redirect/status checks are running.             |
| response_body   | HTTP 200 passed status checks; media type/body/UTF-8 processing.   |
| token_payload   | Body text obtained; JSON/schema/token/session-lifetime validation. |

An empty body text reaches token_payload and fails JSON validation; a null body
fails at response_body. An opaque redirect has no reportable HTTP status (status 0
is omitted). An already-followed redirect can report response_status with 200;
it is still rejected. Late responses after abort do not change the reported facts.

The following mapping applies to authentication, not the unchanged GET transport:

| Cause                                                                                                 | category               |
| ----------------------------------------------------------------------------------------------------- | ---------------------- |
| Fetch rejection/synchronous exception, body stream failure                                            | network_failure        |
| Actual 10-second authentication timer                                                                 | timeout                |
| External abort (including SIGINT/runner timer), exhausted local lifetime, discarded credential handle | session_aborted        |
| 3xx, redirected response, opaqueredirect                                                              | redirect_rejected      |
| Token endpoint HTTP 401                                                                               | authentication_failure |
| HTTP 403                                                                                              | authorization_failure  |
| Other non-200 HTTP status (including 400, 429, 500)                                                   | unexpected_status      |
| Invalid local credential input, media type/body size/UTF-8/JSON/schema/token fields                   | invalid_payload        |

No provider error body is interpreted: HTTP 401 is not proof of an incorrect
password. Missing/malformed/oversized access_token now yields invalid_payload at
token.access_token, using missing/type/null/range/malformed as applicable. Other
token schema diagnostics use only token.refresh_token, token.token_type,
token.expires_in, token.unknown and the existing generic roots. Unknown field
names/values are never emitted. No token lengths, URLs, response bodies, headers,
reason phrases or exception messages appear.

These facts prove neither remote issuance, remote validity nor revocation.
They cannot establish refresh lifetime or guarantee all remote tokens expired.
The same one-POST, zero-retry/refresh/re-login policy and all limits remain.

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
The runner selects only the following fixed warnings from local diagnostic facts:

- before_request:
  “No se envió la solicitud de autenticación. No se instaló ninguna sesión local.”
- request:
  “No se instaló sesión local. No se sabe si IOL recibió la solicitud ni si emitió un token. Tratar el intento como potencialmente activo y seguir la política de espera del runbook antes de reintentar.”
- response_status with a reportable non-200 status:
  “IOL respondió con error HTTP y no se instaló sesión local. No reintentar automáticamente; revisar el resultado antes de un nuevo intento aprobado.”
- response_body/token_payload with HTTP 200:
  “IOL respondió HTTP 200 pero la respuesta fue rechazada localmente. Un token remoto pudo haberse emitido y debe tratarse como potencialmente activo. No reintentar; seguir la política de espera o revocación oficial del runbook. dispose() no revoca tokens.”

An opaque redirect or already-followed HTTP 200 at response_status uses the
conservative request warning; it must not falsely claim an HTTP error status.
The before_request warning concerns only this attempt, not earlier remote sessions.
No warning asserts that an HTTP rejection proves no token was issued.

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
