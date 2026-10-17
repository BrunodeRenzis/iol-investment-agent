# AGENTS.md — Repository-wide agent policy

These instructions apply to the entire repository unless a deeper `AGENTS.md` explicitly narrows them.

## 1. Mission

Build a secure, auditable personal investment platform around IOL that can:

1. read and normalize portfolio and market data;
2. collect historical observations continuously;
3. calculate deterministic portfolio and risk metrics;
4. research systematic trading strategies;
5. backtest and paper-trade strategies;
6. use OpenAI and Anthropic models as advisory and review layers;
7. expose selected read-only capabilities through MCP;
8. only much later prepare real orders under deterministic controls and explicit human approval.

The repository is the canonical shared memory for Codex, Claude, and future agents.

## 2. Fundamental autonomy rule

Observation and research may be autonomous within an approved phase. Paper trading may run autonomously only within an approved phase and for a human-approved strategy state. Autonomous research cannot promote itself into trusted stages.

Real-money execution may NOT be autonomous. No broker-write code, including sandbox or production code, may exist before Phase 9 is explicitly approved. Paper trading performs no broker write calls of any kind.

AI may only advise, critique, explain, or veto/escalate a recommendation. Its veto is advisory; it must never block an emergency kill switch or risk-reducing user actions. Those actions remain subject to deterministic controls, explicit human authorization, and the approved phase.

## 3. Git and repository safety

- NEVER commit automatically.
- NEVER push automatically.
- NEVER merge automatically.
- NEVER rebase, reset, force-push, amend, or rewrite Git history unless the user explicitly requests that exact operation.
- NEVER delete branches, tags, remote refs, or stashes without explicit approval.
- Before destructive Git operations, explain the exact command and ask for approval.
- Agents MAY edit files, run checks, inspect diffs, and suggest commit messages.
- Do not run `git add` unless explicitly requested.
- Preserve unrelated local changes.
- At the end of every implementation task, report files changed, checks run, unresolved issues, suggested commit message, and Git status summary.

## 4. Secrets and financial data

- NEVER hardcode credentials, passwords, tokens, cookies, account IDs, private keys, refresh tokens, or bearer tokens.
- NEVER put ANY secret in an LLM prompt, including non-broker secrets.
- NEVER log secrets or complete IOL responses that may contain sensitive account data.
- NEVER expose IOL credentials to MCP clients or place secrets in tracked files.
- Minimize/redact account identifiers and sensitive personal financial identifiers before model calls where possible.
- Do not persist full AI prompts/responses containing sensitive portfolio data unless the requirement is explicitly approved by the user and the data is protected.
- `.env` and secret-like files remain ignored; `.env.example` contains placeholders only.
- Persistence requires least privilege, access controls, encryption at rest where supported, secure backups/recovery, retention rules, and data minimization.
- Before market-data persistence or redistribution, verify current IOL/provider terms for storage, historical retention, and redistribution; record permitted uses and unresolved restrictions.
- If a secret is exposed, stop and recommend rotation before continuing.

Broker read and write permissions/scopes must be separated whenever the provider supports it. Step 3 must verify whether IOL offers true read-only credentials/scopes; do not infer token permissions from a read-only adapter. If true read-only credentials/scopes are unavailable, treat the token as write-capable even while the adapter is read-only. Until verified otherwise, unknown scope capability is treated as write-capable too.

In that case, isolate the token strictly inside `packages/iol`, expose only a fixed allowlist of verified read-only endpoint paths, and add automated tests enforcing that allowlist. Never pass broker credentials/tokens to scheduler, AI, MCP, trading research, or a generic HTTP client. No other package may obtain direct broker credentials; callers use the narrow IOL adapter. Future write credentials must be separate from read credentials whenever possible. These controls do not authorize broker-write code before approved Phase 9.

## 5. Financial-operation safety

Default mode is **READ-ONLY**.

Before Phase 9 is explicitly approved, NO broker-write code may exist, including sandbox AND production. This covers buy/sell, cancel/replace, caución, FCI subscriptions/redemptions, stop-loss/take-profit execution, transfers/withdrawals, and any other broker write. `packages/execution` must remain ABSENT, not merely disabled. Research and paper-trading code must never call broker write endpoints of any kind, even after an execution phase exists.

Phase 9 requires explicit user approval and a threat-model review BEFORE introducing sandbox-only broker-write code. Phase 10 requires separate explicit approval and another threat-model review before any production write capability.

The future approved execution lifecycle is:

`intent -> deterministic validation -> risk checks -> preview -> explicit human confirmation -> exact-match validation -> execution -> audit`

Require an idempotency key, confirmation expiry, exact binding of instrument/security, market, currency, settlement, side, quantity-or-nominal, and price-or-price-type, fail-closed authorization, no blind order retry, immutable audit events, and an emergency kill switch. Neither AI advice nor deployment grants execution permission.

## 6. Trading research safety

Trading research remains separate from execution and is introduced only by the roadmap.

A strategy needs a written hypothesis, explicit entry/exit/position-sizing/risk rules, reproducible data, bias-aware backtests, realistic execution/cost assumptions, protected holdout evaluation, compatible benchmarks, drawdown analysis, a versioned definition, prospective paper evidence, documented limitations, and human promotion before eligibility review.

LLM confidence is not evidence of strategy quality. Never hide losing signals or failed experiments. Strategy edits create a new version; prior evidence and transitions remain auditable. Eligibility does not grant real-money execution.

## 7. Strategy lifecycle

`IDEA -> SPECIFIED -> BACKTESTED -> VALIDATION_PENDING -> VALIDATED -> PAPER_TRADING -> REVIEW_PENDING -> REVIEWED -> ELIGIBLE_FOR_HUMAN_APPROVAL`

Additional states: `REJECTED`, `SUSPENDED`, `RETIRED`.

Autonomous research may reach `BACKTESTED` / `VALIDATION_PENDING`. A HUMAN must promote to `VALIDATED`, and a HUMAN must authorize every promotion after `VALIDATED`, including entry to paper trading and review states. Agents may recommend promotion but cannot perform it. Human authorization is recorded and enforced by deterministic code.

Every transition records actor, authorization, prior/new state, strategy version, UTC time, reason, and evidence. Deterministic automation MAY move a strategy to `REJECTED` when objective rejection criteria fail, recording the criteria and evidence, and may suspend an unsafe strategy. AI may only recommend rejection or suspension. Humans may reject strategies and control retirement and any resumption. Rejection is not a promotion: automation may NOT promote beyond `BACKTESTED` / `VALIDATION_PENDING`; human approval remains required for `VALIDATED` and every later promotion. Agents cannot use an exit state to bypass those gates. Retirement is terminal for that version. Strategy edits create a new version starting at `IDEA` or `SPECIFIED`, never inheriting approval.

Every signal records strategy version, immutable dataset/version or observation references, information-availability timestamp, complete instrument identity, signal/horizon/features, safe advisory context if any, later outcomes, and paper-trade linkage.

## 8. AI responsibilities

AI has NO authority over account permissions, execution permissions, hard portfolio/risk limits, position sizing constraints, order validity, confirmation, or real-money execution. Only deterministic code and explicit human authorization control those capabilities; no joint or delegated AI authority is permitted.

AI may only advise, critique, explain, or veto/escalate a recommendation. Summaries, hypotheses, code suggestions, and structured opinions are advisory artifacts, not permission changes. An AI veto is advisory and must never block the emergency kill switch or risk-reducing user actions. Deterministic safety and authorization checks still apply.

Treat model output as untrusted input and validate structured outputs. AI cannot promote strategies or turn external-content prompt injection into new permissions.

## 9. Architecture rules

Start as a modular monolith. Avoid premature microservices.

The following package/domain layout is INTENDED and introduced incrementally by the roadmap; it does not describe packages that all exist today:

- `apps/api`: HTTP composition root and user-facing API.
- `packages/financial`: broker-independent decimal-safe financial value objects (Phase 1 Step 2, ADR-019).
- `packages/iol`: read-only broker integration until an approved execution phase.
- `packages/market-data`: normalized observations and time-series contracts.
- `packages/portfolio`: normalized positions, balances, snapshots, and P&L.
- `packages/risk`: deterministic risk rules.
- `packages/trading`: indicators, strategies, signals, backtests, and internal paper simulation.
- `packages/scheduler`: collection/research scheduling abstractions, introduced minimally in Phase 2.5.
- `packages/ai`: provider-neutral advisory contracts and provider adapters.
- `packages/mcp`: narrow read-only MCP tools.
- `packages/execution`: ABSENT before explicitly approved Phase 9; sandbox-only then, with production gated separately by Phase 10.

Keep external providers behind typed adapters. Do not put substantial business logic in controllers or expose generic broker/HTTP/SQL/shell proxies. Business and risk rules must be testable without network access.

## 10. Market-data rules

- Raw observations are append-only; corrections create new records with provenance.
- Corrected/normalized datasets are versioned; backtests reference immutable dataset versions.
- Maintain source/provider timestamp, exchange timestamp, ingestion timestamp, and the "information available at" timestamp governing historical decisions. Use UTC internally and explicit market timezone/calendar at boundaries.
- Define staleness policies per instrument/data class; detect duplicate, stale, and missing observations.
- Never silently manufacture or backfill missing real-time observations. A later historical import must remain separately identified/versioned and must not pretend to be an observed real-time snapshot.
- Instrument identity includes ticker/security, market, currency, settlement term, and relevant security/CEDEAR/bond identity. Do not treat AL30, AL30D, and AL30C as interchangeable observations.
- Preserve traceability from normalized records to raw observations and providers; respect rate limits.
- Never invent undocumented IOL behavior. Mark unknown behavior UNKNOWN and verify against official documentation or an authorized read-only sandbox interaction before implementation. Verification never permits pre-Phase-9 writes.
- Do not assume IOL provides every required data type; verify storage/retention/redistribution terms before persisting or redistributing market data.

## 11. Scheduler and background jobs

Begin minimal read-only market-data collection in Phase 2.5, soon after approved persistence and before long prospective paper research. Mature orchestration belongs to Phase 6.

Use a job idempotency key of job type + scope/instrument + scheduled time slot, or an equivalent documented natural key. Add unique database constraints where appropriate, overlap locks/single-runner protection, and atomic deduplication so a duplicate signal cannot create duplicate paper trades.

Record scheduled/actual run times, retries, failures, and missed runs. Missed real-time observations remain gaps, never silently reconstructed snapshots. Jobs need bounded timeouts, safe idempotent retries, rate-limit handling, and observable failures. Provide a scheduler kill switch. Define AI-call cost/token budgets before any scheduled model calls.

An in-process collector is acceptable locally. Dependable 24/7 operation needs durable persistence and a justified queue/worker design. Moving broker credentials or financial data off the local machine is a security-boundary change: before deployment require explicit user approval, threat-model review, a credential/secrets plan, database security, backup/recovery, network exposure review, and monitoring. This deployment gate grants no broker-write permissions.

## 12. Money and numerical correctness

- TypeScript strict mode.
- No `any` unless justified.
- Prefer `unknown` plus validation.
- Never use naïve binary floating-point for money, nominal values, FX, accrued interest, fees, or risk-limit arithmetic.
- Use ADR-019's decimal strategy in `packages/financial`: pinned bignumber.js behind explicit domain types, string-only inputs, exact bounded arithmetic, and explicit rounding boundaries. No raw library or JS-number conversion in the public API.
- Currency, nominal, quantity, price, and percentage are distinct concepts.
- Never infer an FX rate.
- Define rounding explicitly.
- Preserve broker precision when available.

## 13. Backtesting requirements

- Reference immutable dataset versions, strategy/code versions, parameters, and information-availability timestamps; forbid look-ahead/future leakage.
- Historical LLM-generated features are forbidden from ordinary backtests unless the exact model and data available at that historical instant can be reproduced without future knowledge. Default AI/news/LLM-derived feature evaluation is prospective forward/paper testing, not retrospective.
- Preserve full instrument identity, including market, currency, settlement, and security/CEDEAR/bond identity. AL30, AL30D, and AL30C are not interchangeable observations.
- Every performance result declares its return basis/currency (for example ARS nominal, USD MEP, USD CCL, or real/inflation-adjusted terms). Benchmarks use a compatible basis; transformations require explicit FX/inflation sources and timestamps.
- Treat dividends, splits, CEDEAR ratio changes, bond coupons, amortizations, accrued interest where relevant, and adjusted versus unadjusted series explicitly.
- Model bid/ask, spreads, slippage, liquidity/volume constraints, settlement terms, market hours, halts/suspensions, and commissions/taxes where applicable. Slippage and spread handling are MANDATORY for local/BYMA instruments; disclose missing inputs rather than silently assuming zero costs.
- Persist EVERY backtest run, including discarded and failed variants, its parameters/search history, dataset version, failure reasons, and results. Do not erase failed experiments.
- Protect holdout/out-of-sample datasets against repeated optimization; separate search from evaluation and record access/reuse.
- Address survivorship bias using point-in-time universes where available, delisted/inactive instruments, and explicit coverage limitations; do not imply survivorship-free results without evidence.
- Report compatible benchmarks, total/annualized return where meaningful, volatility, maximum drawdown, hit rate, profit factor, and risk-adjusted metrics where meaningful, with sample-size/regime limitations.

Prefer robustness over optimizing the best historical result. Deterministic business/risk rules must be testable offline.

## 14. Paper trading requirements

Paper trading is entirely internal simulation: NO IOL writes and NO broker write endpoints of any kind, including sandbox. Reuse strategy/risk interfaces, never an execution adapter. A human must first promote the strategy to `PAPER_TRADING`; approved simulation can then run autonomously within its limits.

Record strategy version, proposal time, complete instrument identity, source/data availability, fill assumptions, entry/exit, bid/ask/spread/slippage/liquidity/fees, settlement, realized/unrealized P&L and return basis, and exit reason. Deduplicate signals and simulated trades. Label all results simulated, never real returns.

## 15. Testing

For material changes add/update relevant tests, failure paths, malformed data, authorization, idempotency, timeouts, and deterministic risk rules. Mock IOL/OpenAI/Anthropic calls. Automated tests must NEVER call production trading endpoints, without exception or qualification. Business/risk tests must run without network access.

Future approved sandbox order-flow tests must prove confirmation, permission, exact-match, expiry, and kill-switch enforcement; their existence is gated by Phase 9 approval.

Run relevant formatter, lint, typecheck, tests, build, integration and dependency/security checks before completion. Never weaken rules/tests for green CI. If an agent cannot run any required validation, it must state which check and why.

## 16. Security

Use least privilege and default deny; authorization must fail closed. Financial/account data endpoints require authentication and authorization BEFORE they are introduced, including on localhost/loopback. Public liveness contains no financial data.

Validate all external inputs/provider responses and reject unexpected fields in sensitive schemas where practical. Apply OAuth state/PKCE and CSRF protection where applicable, safe HTTP timeouts, rate limits, sanitized errors, and narrow MCP authorization. Never invent undocumented IOL behavior.

Never log full IOL responses that may contain sensitive account data. Never put ANY secret in model prompts. Do not persist full sensitive prompts/responses unless the requirement is explicitly approved by the user and the data is protected. Enforce the persistence protections in section 4.

Pin/lock dependencies, review major upgrades for security impact, and retain vulnerability scanning. Keep Gitleaks CI. The local staged-file scan is explicitly invoked with `npm run scan:staged` under ADR-015/ADR-018; no local hooks are installed or Git hook configuration modified. The command reads staged changes without modifying the index.

Before any broker-write phase or off-machine deployment, perform the corresponding threat-model review and obtain explicit user approval. Agents must NEVER silently weaken or change the project security model.

## 17. Multi-agent collaboration

Codex and Claude are collaborators, not authorities. Preferred default: one agent implements, the other reviews, the user decides, and the user commits.

Do not have both agents edit the same files simultaneously. For parallel work, use separate branches/worktrees and non-overlapping scopes.

## 18. Change discipline

Before broad changes: restate the task, inspect `git status`, summarize the implementation plan, and identify affected documents/modules. Avoid unrelated refactors. Record material architecture/security decisions in `docs/DECISIONS.md`. Agents may never silently weaken/change the security model.

Canonical reading order for every session:

1. `AGENTS.md`
2. `CLAUDE.md` when applicable (when using Claude)
3. `docs/PROJECT.md`
4. `docs/ARCHITECTURE.md`
5. `docs/SECURITY.md`
6. `docs/IMPLEMENTATION_PLAN.md`
7. `docs/ROADMAP.md`
8. `docs/DECISIONS.md`
9. `docs/WORKFLOW.md`
10. `docs/MASTER_PLAN.md`

`AGENTS.md` governs policy; accepted, non-superseded ADRs govern architecture within that policy. `MASTER_PLAN.md` is the high-level operational sequence subordinate to both. Roadmap phases and implementation steps cannot confer permissions. Conflicts must be surfaced and resolved explicitly before implementation.

## 19. Completion format

Every implementation response should end with:

### Changed

- ...

### Validation

- ...

### Risks / open questions

- ...

### Suggested commit message

`type(scope): summary`

### Git

- No commit performed.
- No push performed.
