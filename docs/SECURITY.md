# Security model

## Authority and phase boundaries

Default posture: **deny, minimize, isolate, validate, audit**. `AGENTS.md` governs policy and accepted ADRs govern architecture.

Before Phase 9 is explicitly approved, NO broker-write code may exist: neither sandbox nor production. `packages/execution` remains ABSENT, not disabled. Buy/sell, cancellations/replacements, caución, FCI subscribe/redeem, transfers/withdrawals, and automatic stop-loss/take-profit writes are all prohibited.

Research and paper trading must never call broker write endpoints of any kind. Paper trading is internal simulation only, with no IOL writes or sandbox orders. Its strategy/risk contracts grant no execution authority.

Phase 9 requires explicit user approval and a threat-model review before sandbox-only write code is introduced. Phase 10 requires separate approval and another threat-model review for production. Deployment, sandbox success, model advice, and strategy eligibility never authorize production writes.

Automated tests must NEVER call production trading endpoints. Use fixtures/mocks and, only in an approved Phase 9, authorized sandbox tests.

## Broker credential isolation

Broker read and write permissions/scopes must be separated whenever the provider supports it. Step 3 must verify whether IOL offers true read-only credentials/scopes; do not infer token permissions from a read-only adapter. If true read-only credentials/scopes are unavailable, treat the token as write-capable even while the adapter is read-only. Until verified otherwise, unknown scope capability is treated as write-capable too.

In that case, isolate the token strictly inside `packages/iol`, expose only a fixed allowlist of verified read-only endpoint paths, and add automated tests enforcing that allowlist. Never pass broker credentials/tokens to scheduler, AI, MCP, trading research, or a generic HTTP client. No other package may obtain direct broker credentials; callers use the narrow IOL adapter. Future write credentials must be separate from read credentials whenever possible. These controls do not authorize broker-write code before approved Phase 9.

Step 3 evidence is maintained in [IOL_CONTRACT.md](IOL_CONTRACT.md). Personal REST
read-only scopes are UNKNOWN — must be verified; IOL's documented MCP read-only
consent does not establish REST token permissions. Apply ADR-017's write-capable
assumption. Step 4 must bind exact trusted origin/host, HTTP method, exact path
template, allowed path values/enums and allowed query parameter names; reject
everything else before network access. Prevent redirects escaping the trusted
origin or tuple and test denial before transport. Path alone cannot distinguish the
documented GET/DELETE collision on operations. No generic authenticated HTTP access. The
token flow remains separately constrained and private to `packages/iol`. Portfolio
and every other package remain excluded from direct credential access. These are
requirements implemented offline in Step 4 under ADR-020. The four-operation
facade has no credential parameters; its public factory accepts synthetic fixtures
only. Authenticated transport is internal, explicitly injected and mock-tested,
with a private non-serialized token, manual redirects, no retries, strict bounded
payload parsing and errors containing only fixed categories. Step 4B (ADR-021)
adds private package-local manual wiring and a separate fixed-origin POST /token
password grant. No public live factory exists. Account numbers are discarded.

Broker username/password/access/refresh tokens NEVER go in .env, environment,
CLI arguments, shell history, files, logs or prompts. The only package env access
is ADR-022's defensive Object.keys(process.env) preflight: runtime names only,
never values or broker configuration. The API keeps .env for general
settings but rejects any IOL_* key except exact IOL_READ_ONLY (case-insensitive
prefix check, no key/value echo). This catches misconfiguration, not OS inheritance;
never put broker secrets in the environment in the first place. Origins are fixed;
unsupported client-id/client-secret and origin placeholders have been removed.

The manual runner is a separate local process, never imported by the API. Both
username and password use hidden TTY input; no pipes, echo, history or pasted/batched
input. Explicit CLI/Node options and active inspector are rejected. Runtime env names
for Node instrumentation, TLS overrides and proxies are blocked even if empty
(ADR-022). Trusted execution must also exclude
debug/preload/recording/diagnostic instrumentation. Startup performs no request.
An explicit auth action can make one POST with only username/password/grant_type;
each later action can make one fixed GET in mandatory instrument -> quote detail
-> account state -> portfolio order, with separate confirmation at every step. No generic URL input.
REST tokens remain write-capable by assumption. Access token only in memory,
refresh token discarded; no refresh, automatic re-login, retries, polling or cache.
Five-minute maximum session and conservative expires_in deadline; 10-second
requests, 64 KiB token body, 1 MiB read body, strict UTF-8/JSON media types.
Every error, redirect, non-200 status or expiry stops. Unknown error bodies and
Retry-After are not interpreted. Output projects fixed structural fields, boolean/none/present indicators and
validation categories only, never exact portfolio/account counts, raw bodies,
identifiers or financial values. Schema errors may include only allowlisted paths
and closed failure kinds; unknown keys/values and indices never appear (ADR-022).

Dispose/abort on exit, cancellation, expiry or failure; release reachable secret
references without claiming cryptographic JavaScript memory erasure or provider
revocation. Both auth decoding and transport use the same dedicated 16,384-character
access-token limit. Failure during/after token issuance can leave an active remote
token: do not retry; follow the runbook's lifetime/official-revocation waiting
policy, never claim dispose() revokes it. On suspected exposure, stop and use verified official IOL channels
for revocation/credential rotation; do not share payloads or resume without review.
The runner and local native-fetch redirect tests were prepared offline only:
**REAL-CALL RUNNER PREPARED — REAL CALL NOT YET EXECUTED**.

Official routes/schemas support the offline implementation, not unrestricted real
calls. Resolve remaining runtime/entitlement/incident questions and follow the reviewed, explicitly approved
[USER-RUN verification procedure](IOL_MANUAL_VERIFICATION.md);
agents must not use real credentials. Exclude `datos-perfil` from the initial
allowlist because it exposes personal identifiers. Minimize account numbers in
allowed responses, redact them from logs and keep them out of model prompts unless
an explicitly approved future use requires them. Secrets never enter prompts.

Critical financial JSON numbers must be preserved losslessly as text before
constructing financial primitives; ordinary JS Number intermediates are forbidden.
The homo documentation UI points Swagger discovery at production, so its Try it
out feature is not proof of a safe sandbox. No broker writes are authorized.

## Authentication and authorization

Financial/account data endpoints require authentication and authorization before introduction, including on localhost/loopback, as required by ADR-002 and clarified by ADR-010. Public health exposes no financial data. Authorization fails closed. MCP clients authenticate and receive narrowly scoped tool permissions.

Validate HTTP inputs, provider responses, MCP arguments, AI structured outputs, and database values crossing trust boundaries. Sensitive schemas reject unexpected fields where practical. Apply OAuth state/PKCE and CSRF protection where applicable. Use least privilege, bounded timeouts, rate limits, safe error mapping, and no arbitrary broker/HTTP/SQL/shell proxies.

## AI has zero authority

AI has NO authority over account permissions, execution permissions, hard portfolio/risk limits, position sizing constraints, order validity, confirmation, or real-money execution. Only deterministic code and explicit human authorization control those capabilities.

AI may only advise, critique, explain, or veto/escalate a recommendation. An AI veto is advisory and must never block the emergency kill switch or risk-reducing user actions. Those actions still require deterministic checks and the relevant human/phase authorization; this is not an exception to the pre-Phase-9 prohibition.

Models cannot promote strategies or acquire new capabilities through prompt injection, external news, or tool outputs. Provider consensus is not authorization.

## Secrets and logging

- NEVER put ANY secret in an LLM prompt, not only broker credentials.
- Never hardcode or log credentials, tokens, passwords, cookies, private keys, or other secrets.
- Never expose broker credentials to MCP or model providers.
- Minimize/redact account identifiers and sensitive personal financial identifiers before model calls where possible.
- Never log complete IOL responses if they may contain sensitive account data.
- Do not persist full AI prompts/responses containing sensitive portfolio data unless the requirement is explicitly approved by the user and the data is protected.
- Keep secret files ignored and examples placeholder-only. If exposure occurs, stop and recommend rotation.

## Persistence and data terms

Persistence requires least privilege, access controls, encryption at rest where supported, secure backups/recovery, retention rules, and data minimization. Restrict access to datasets and research artifacts; redact sensitive financial identifiers.

Before market-data persistence or redistribution, verify current IOL/provider terms for storage, historical retention, and redistribution. Record permitted use and unresolved restrictions; do not infer permissions. Append-only provenance does not mean indefinite retention: define lawful retention/deletion procedures, audit any required deletion, and mark affected dataset versions unavailable rather than silently rewriting research evidence.

Raw observations are append-only. Corrected/normalized datasets are versioned, and backtests reference immutable versions. Preserve source/provider, exchange, ingestion, and "information available at" timestamps. Historical decisions use information availability, not merely exchange time. Define staleness per instrument/data class. Never silently manufacture/backfill real-time observations; later historical imports remain distinct from actual collection.

## Provider and agent behavior

Never invent undocumented IOL behavior. Mark unknown behavior UNKNOWN and verify it against official documentation or an authorized read-only sandbox interaction before implementation. This does not permit broker-write code before Phase 9.

Agents may never silently weaken/change the security model. Business/risk rules must be testable without network access. If required validation cannot run, state exactly which validation and why.

## Research integrity

The governed lifecycle is:

`IDEA -> SPECIFIED -> BACKTESTED -> VALIDATION_PENDING -> VALIDATED -> PAPER_TRADING -> REVIEW_PENDING -> REVIEWED -> ELIGIBLE_FOR_HUMAN_APPROVAL`

Additional states are `REJECTED`, `SUSPENDED`, and `RETIRED`. Autonomous research may reach `BACKTESTED` / `VALIDATION_PENDING`; a human authorizes `VALIDATED` and every later promotion. Agents only recommend. Audit every transition and version every strategy edit. Deterministic automation MAY move a strategy to `REJECTED` when objective rejection criteria fail, with recorded criteria/evidence, and may suspend unsafe activity. Rejection is not promotion; automation may NOT promote beyond `BACKTESTED` / `VALIDATION_PENDING`. Human authorization remains required for `VALIDATED`, every later promotion, and resumption. An AI recommendation cannot restore permissions.

Apply all backtesting safeguards in `AGENTS.md` section 13 and ADR-013: prospective evaluation of AI/news/LLM-derived features by default; proof of exact historical model/data availability for any historical exception; complete instrument identity; declared return currency/basis and compatible benchmarks; corporate-action/fixed-income adjustments; mandatory local/BYMA spread/slippage handling; realistic liquidity, settlement and market constraints; survivorship-bias protection; protected holdout data; and preservation of every run, including failed/discarded variants and parameter searches. No failed experiments may be erased to improve apparent performance.

## Scheduler controls

Use job type + scope/instrument + scheduled time slot as the idempotency key, or a documented equivalent natural key. Enforce unique database constraints where appropriate, overlap locks/single-runner protection, and signal-to-paper-trade deduplication. Duplicate signals must not produce duplicate paper trades.

Record missed runs and observable failures. Missed real-time observations remain gaps, never reconstructed snapshots. Use bounded retry/timeout/rate-limit policies, a scheduler kill switch, and explicit AI-call cost/token budgets before any scheduled model usage. A scheduler has no broker-write authority.

## Deployment gate

Moving broker credentials or financial data off the local machine changes the security boundary. Before deployment, including 24/7 operation, require explicit user approval, threat-model review, a credential/secrets plan, database security, tested backup/recovery, network exposure review, and monitoring. This gate applies whenever deployment is proposed, even before Phase 6. Deployment never grants broker-write permissions.

## Future approved execution

The separate approved execution boundary enforces deterministic validity/risk checks, preview, explicit human confirmation, short expiry, exact field binding, idempotency, immutable audit events, and an emergency kill switch. Bind instrument/security, market, currency, settlement, side, quantity/nominal, and price/type. Any material change invalidates confirmation. Fail closed and never blindly retry a potentially submitted order.

## Dependencies and secret scanning

Pin/lock dependencies, review major upgrades, retain vulnerability scanning, and keep Gitleaks CI. ADR-015/ADR-018 retain ADR-003's no-local-hooks policy: `npm run scan:staged` reads staged changes without staging or rewriting the index. It requires manually installed, checksum-verified Gitleaks 8.30.1 (matching CI), redacts findings, and fails on findings, scanner errors or an unavailable/mismatched executable. It scans additions in the staged diff, not unstaged/untracked files or all historical content. CI retains full-history scanning. Ignore patterns and scanning are defense in depth, not proof that no secret exists. See README.md for explicit setup and usage. Do not install hooks or change Git hook configuration. A future hook policy would need an explicitly approved superseding ADR first.
