# Implementation plan

Implement one user-selected step at a time, validate it, obtain independent review when material, and leave commits to the user. This detailed plan follows the phases in ROADMAP.md and the high-level sequence in MASTER_PLAN.md; AGENTS.md and accepted ADRs take precedence.

## Global gates

Before explicitly approved Phase 9 and its threat-model review, NO broker-write code may exist, including sandbox/production; `packages/execution` remains ABSENT. Research/paper code never calls broker-write endpoints. Automated tests NEVER call production trading endpoints. AI has zero protected-capability authority; its veto is advisory and cannot block the kill switch or risk-reducing user actions subject to deterministic controls. Required checks that cannot run must be reported with reasons.

## Step 1 — Phase 1 repository hardening

Add a manually invoked staged-file secret scan that reads the index without staging/changing it; retain the no-local-hooks policy under ADR-015. Tighten secret patterns, make test discovery explicit and fail on zero tests. Keep Phase 0 behavior unchanged. Do not install hooks or modify Git hook configuration.

Implemented in Step 1: `npm run scan:staged` uses pinned Gitleaks against staged
changes with redaction; setup remains explicit (README.md). Tests clean `.test-dist`,
discover only compiled `*.test.js` under apps/packages, and fail if none exist.
Tooling regressions cover discovery, helper exclusion, failures and scanner
invocation. ADR-018 records these choices.

## Step 2 — Phase 1 financial numeric primitives

Resolve proposed ADR-009, compare decimal-safe libraries, document rounding, and test explicit Currency, Money, Price, Quantity, NominalValue, Percentage and FxRate concepts. Business/risk rules must be testable offline.

Implemented in Step 2: ADR-019 resolves ADR-009, comparing decimal.js, big.js and
bignumber.js and choosing pinned bignumber.js 11.1.5 in `packages/financial`.
Immutable domain types use ARS/USD, validated decimal strings, exact arithmetic
with explicit resource bounds, ratio-based percentages, directional FX and string
JSON serialization. Display/settlement rounding requires explicit scale and mode;
provider precision and settlement rules remain unverified. Offline edge-case and
type-separation tests accompany the public API; see `packages/financial/README.md`.
No IOL, endpoint or other Step 3+ implementation is included.

## Step 3 — Phase 1 verify IOL contract and data terms

Verify current official auth, read-only endpoints, rates, token lifecycle, and sandbox behavior. Explicitly verify whether IOL offers true read-only credentials/scopes and supports separating broker read/write permissions. Future write credentials must be separate from read credentials whenever possible. If true read-only scopes are unavailable, treat the token as write-capable even though the adapter is read-only; unknown capability is also treated as write-capable until verified. Record the verified scope limitations and required containment before adapter implementation. Never invent undocumented behavior; mark UNKNOWN until verified against official documentation or authorized read-only sandbox interaction before implementation. Verify storage, historical retention, and redistribution terms before market-data persistence/redistribution.

## Step 4 — Phase 1 read-only IOL adapter

Use typed validated schemas, safe auth/token handling, timeouts, sanitized errors and fixtures/mocks. No write methods or strategy logic. Never log complete IOL responses that may contain sensitive account data.

Separate broker read/write permissions/scopes whenever supported. If true read-only credentials/scopes are unavailable or unverified, treat the token as write-capable, isolate it strictly inside `packages/iol`, expose only a fixed allowlist of verified read-only endpoint paths, and add automated tests enforcing that allowlist. Never pass the credential/token to scheduler, AI, MCP, trading research, or a generic HTTP client. No other package may obtain direct broker credentials; expose only the narrow IOL adapter. This containment does not authorize broker-write code.

## Step 5 — Phase 1 authentication and portfolio normalization

Implement authentication and fail-closed authorization BEFORE introducing financial/account endpoints, even on localhost/loopback. Add normalized balances/positions/cost/P&L models and protected read-only endpoints. Reject unexpected sensitive fields where practical; apply OAuth state/PKCE and CSRF where applicable.

## Step 6 — Phase 2 market-data normalization

Identify ticker/security, market, currency, settlement and security/CEDEAR/bond identity; AL30/AL30D/AL30C are not interchangeable. Preserve source, exchange, ingestion and information-availability times; define per-class staleness, provenance, duplicate/gap handling and versioned normalization.

## Step 7 — Phase 2 secured persistence

After verifying data-use terms, introduce PostgreSQL, least privilege, access controls, encryption at rest where supported, secure backups/recovery, retention and minimization. Persist snapshots, append-only raw observations and versioned normalized/corrected datasets; research references immutable versions. Never silently backfill real-time gaps.

## Step 8 — Phase 2 deterministic risk

Build allocation/exposure/concentration and hard constraints independent of LLMs, with offline tests and authenticated reports. Only deterministic code and explicit human authorization control hard limits and permissions.

## Step 9 — Phase 2.5 minimal collector

Schedule already verified read-only collection soon after persistence, before long prospective paper research. Use job type + scope/instrument + scheduled slot keys (or documented equivalent), unique constraints where appropriate, overlap locks/single-runner protection, rate/time bounds and a scheduler kill switch. Record missed runs and observable failures; missing real-time observations remain gaps.

## Step 10 — Phase 3 research contracts and governance

Introduce versioned strategy/indicator/signal/horizon/evaluation contracts incrementally. Enforce:

`IDEA -> SPECIFIED -> BACKTESTED -> VALIDATION_PENDING -> VALIDATED -> PAPER_TRADING -> REVIEW_PENDING -> REVIEWED -> ELIGIBLE_FOR_HUMAN_APPROVAL`

Add REJECTED, SUSPENDED and RETIRED. Automation may reach BACKTESTED / VALIDATION_PENDING only. A human promotes to VALIDATED and authorizes every later promotion; agents recommend only. Audit each transition; edits create new versions. Deterministic automation MAY move a strategy to REJECTED when objective rejection criteria fail, with auditable criteria/evidence; this is not a promotion and grants no authority beyond BACKTESTED / VALIDATION_PENDING. Human approval remains required for VALIDATED and every later promotion. Use ADR-012 as clarified by ADR-017 for rejection/suspension/resumption rules.

## Step 11 — Phase 3 explainable strategy

Start with explicit, testable returns, moving averages, momentum, RSI, volatility and volume features. Prioritize reproducibility and evaluation over historical optimization.

## Step 12 — Phase 3 signal history

Preserve all signals, including losing/rejected ones, versions, complete instrument identity, information available at signal time, declared horizons and later outcomes. Define compatible benchmark/return-basis contracts.

## Step 13 — Phase 4 reproducible backtests

Implement all AGENTS.md section 13 and ADR-013 safeguards: immutable dataset versions and information availability, no look-ahead, default prospective AI/news/LLM evaluation (historical exception requires exact reproducible model/data without future knowledge), full Argentine-market identity, explicit return basis/currency and compatible benchmarks, dividends/splits/CEDEAR ratios/coupons/amortizations/accrued interest and adjusted/unadjusted series.

Model bid/ask, spreads, slippage, liquidity/volume, settlement, hours, halts/suspensions, commissions/taxes where applicable. Spread/slippage handling is mandatory for local/BYMA instruments. Address survivorship bias. Protect holdout/out-of-sample data from repeated optimization, record searches, and persist EVERY run including discarded/failed variants. Never erase failed experiments.

## Step 14 — Phase 4 human validation gate

Prepare evidence and recommendations for human promotion to VALIDATED; agents cannot promote. Human authorization is also required for PAPER_TRADING and every later promotion. Preserve review evidence and transition audit.

## Step 15 — Phase 5 internal paper simulation

After human promotion, simulate accounts/fills internally with no IOL or sandbox writes. Reuse strategy/risk contracts without execution adapters. Record realistic fills/costs/return basis and compare prospective results with backtests. Deduplicate signals atomically so they cannot create duplicate paper trades. Label results simulated.

## Step 16 — Phase 6 mature scheduler

Extend the early collector to approved research/simulation jobs. Keep natural idempotency keys, unique constraints, overlap locks, missed-run/failure records, gap integrity, timeouts, safe retries, rate limits and kill switch. Define cost/token budgets before any scheduled AI calls in their approved phase.

## Step 17 — off-machine / 24/7 deployment gate

Before moving broker credentials or financial data off-machine, obtain explicit user approval and complete threat-model review, secrets plan, database security, backup/recovery, network exposure review and monitoring. Apply this gate earlier if deployment is proposed earlier. Justify durable workers/queueing; deployment grants no broker-write permissions.

## Step 18 — Phase 7 read-only MCP

Expose narrow authenticated/authorized tools with safe audit metadata and rate limits. No arbitrary HTTP/SQL/shell and no broker credentials or other secrets in model context.

## Step 19 — Phase 8 AI advisory layer

Use provider-neutral OpenAI/Anthropic adapters and validated structured outputs. AI may only advise, critique, explain, or veto/escalate recommendations. It has NO authority over account/execution permissions, hard risk/portfolio limits, position sizing constraints, order validity, confirmation or real-money execution. Its advisory veto cannot block kill switch or risk-reducing user actions under deterministic controls. NEVER send ANY secret in prompts; minimize/redact sensitive identifiers.

## Step 20 — Phase 8 independent committee

Preserve independent opinions/disagreements as minimal safe artifacts and measure advisory value. Do not persist full sensitive prompts/responses unless the requirement is explicitly approved by the user and the data is protected. Enforce cost/token budgets; no strategy promotion by agents.

## Step 21 — Phase 9 sandbox execution

Only after explicit user approval and threat-model review may broker-write code and the execution package be introduced. Implement sandbox-only proposals, deterministic validation/risk, preview, explicit human confirmation, expiry/exact binding, idempotency, immutable audit and emergency kill switch. Test only authorized sandbox writes, never production trading endpoints.

## Step 22 — Phase 10 production decision

A separate human governance decision and threat-model review, not an automatic promotion. Require accepted sandbox evidence, isolated credentials, operational readiness and narrow approved controls. No autonomous real-money execution.
