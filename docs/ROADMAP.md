# Roadmap

## Phase 0 — secure foundation

Status: **COMPLETE**

- [x] NestJS foundation
- [x] TypeScript strict mode
- [x] health endpoint
- [x] configuration validation
- [x] logging/rate limiting baseline
- [x] lint/format/typecheck/tests/build
- [x] reproducible lockfile
- [x] Git/GitHub repository
- [x] Gitleaks CI
- [x] read-only/no-trading guardrails
- [x] repository documentation and agent constraints

## Gates applying to every phase

Phase numbers describe scope, not permission. Before explicit Phase 9 approval and threat-model review, NO broker-write code may exist, sandbox or production, and `packages/execution` is ABSENT. Paper trading is internal simulation with no broker writes. Automated tests NEVER call production trading endpoints. Financial/account endpoints require authentication/authorization before introduction, including localhost.

AI has NO authority over account/execution permissions, hard portfolio/risk limits, position sizing constraints, order validity, confirmation, or real-money execution. It may only advise, critique, explain, or veto/escalate a recommendation; its advisory veto cannot block the emergency kill switch or risk-reducing user actions under deterministic controls.

## Phase 1 — financial foundations and IOL read-only

- [x] manually invoked local staged-file secret scan, retaining no local hooks (ADR-015/ADR-018)
- [x] explicit test discovery + fail on zero tests
- [x] tighten remaining secret-file ignore patterns
- [x] resolve ADR-009 through ADR-019: decimal-safe arithmetic, explicit rounding and financial value objects in `packages/financial`
- [x] record corrected Step 3 Swagger v1/v2 research, hashes, conflicts and phase-specific gaps in [IOL_CONTRACT.md](IOL_CONTRACT.md)
- [x] verify initial read route/schema contracts and documented token fields for offline Step 4 design; runtime questions remain separately gated
- [ ] Step 3 explicitly verifies whether IOL offers true read-only credentials/scopes; separate read/write permissions whenever supported
- [x] treat unknown REST scopes as write-capable; no real credentials loaded
- [x] isolate mock-tested token handling inside `packages/iol`; enforce four verified read paths with automated denial-before-network and redirect tests (ADR-020)
- [x] no credential-bearing public API or credentials in another package; Step 4B private manual wiring stays inside packages/iol
- [ ] check current IOL data terms for storage, historical retention, and redistribution before persistence/redistribution
- [x] offline typed read-only adapter for account state, portfolio, instrument and quote detail; exact V2 enums and lossless JSON numeric strings (ADR-020)
- [x] Step 4B auth/runtime policy and manual runner prepared with offline tests (ADR-021); no real session executed
- [ ] independent review, explicit real-session approval and sanitized USER-RUN acceptance; Step 4 remains open
- [ ] authentication/authorization before ANY financial/account endpoint, including loopback
- [ ] normalized models, sensitive-schema field rejection, OAuth state/PKCE and CSRF where applicable
- [x] bounded local timeout/no-retry policy, safe errors and synthetic offline adapter fixtures/tests
- [x] no broker-write code or execution package in the current implementation

Step 4: **OFFLINE ADAPTER COMPLETE — REAL CALL VERIFICATION PENDING**. Lossless
parsing, explicit enum casing, allowlist and transport are tested offline only.
Step 4B: **REAL-CALL RUNNER PREPARED — REAL CALL NOT YET EXECUTED** (ADR-021).
Real calls require independent review, explicit session approval and the
[USER-RUN procedure](IOL_MANUAL_VERIFICATION.md), including entitlement, manual
limits and incident checks. Credentials use hidden terminal input, never env/CLI;
private password grant and short in-memory token use are prepared. Refresh token
is discarded. No persistence, automatic refresh/re-login, retries or public live factory.
Future write credentials must remain separate from read credentials whenever possible.
Personal REST scopes remain UNKNOWN — must be verified; MCP permissions cannot
substitute. Bind exact origin/host + method + path template + allowed path values/
enums + allowed query names, with denial-before-network tests and no redirect escape.
Step 5 preserves account `tipo + moneda + liquidacion`; USD aggregation remains
forbidden until MEP/CCL semantics, settlement mapping and valuation basis are verified.
API/data-use rights remain unresolved and must be established before Phase 2
market-data persistence or Phase 2.5 collection, not inferred from public access.

## Phase 2 — persistence and portfolio intelligence

- [ ] approved data-use/retention/redistribution terms recorded before market-data storage
- [ ] PostgreSQL with least privilege, access controls, encryption at rest where supported, backups/recovery, retention and minimization
- [ ] portfolio snapshots and append-only raw market observations
- [ ] versioned corrected/normalized datasets and immutable research dataset references
- [ ] source, exchange, ingestion, and information-availability timestamps
- [ ] full instrument/security, market, currency, settlement and CEDEAR/bond identity
- [ ] per-instrument/data-class staleness, duplicates and gaps; no silent real-time backfill
- [ ] allocation, exposure, concentration, P&L and deterministic risk rules
- [ ] authenticated reporting endpoints, including localhost

## Phase 2.5 — minimal market-data collector

Begin soon after persistence, BEFORE long prospective paper research, to accumulate real forward data.

- [ ] minimal read-only collector; schedule only manually verified collection
- [ ] market calendar/timezone, provider rate limits, bounded timeouts/retries
- [ ] key = job type + scope/instrument + scheduled time slot, or documented equivalent
- [ ] unique database constraints where appropriate; overlap locks/single-runner protection
- [ ] record missed runs and observable failures; gaps are never reconstructed snapshots
- [ ] scheduler kill switch; retain source/provenance and immutable data rules
- [ ] no research/AI/broker-write capabilities added merely to support collection

## Phase 3 — trading research core

- [ ] incrementally introduce `packages/trading`, indicators, versioned strategies and signals
- [ ] record every signal, strategy version and declared-horizon outcomes
- [ ] complete instrument identity, return basis/currency and compatible benchmark contracts
- [ ] governed lifecycle with VALIDATION_PENDING and REVIEW_PENDING, plus REJECTED/SUSPENDED/RETIRED
- [ ] automation reaches at most BACKTESTED / VALIDATION_PENDING; HUMAN promotes to VALIDATED and every later state
- [ ] deterministic automation may move a strategy to REJECTED when objective rejection criteria fail; record criteria/evidence and never treat rejection as promotion
- [ ] audit every transition; agents recommend only; strategy edits create new versions
- [ ] first explainable strategy

## Phase 4 — reproducible backtesting

- [ ] immutable/versioned dataset loader using information available at each historical decision
- [ ] historical LLM-derived features forbidden unless exact historical model/data can be reproduced without future knowledge; default AI/news/LLM feature evaluation is prospective forward/paper testing
- [ ] distinguish ticker/security, market, currency, settlement and CEDEAR/bond identity; never interchange AL30, AL30D and AL30C
- [ ] declare return basis/currency for every result: ARS nominal, USD MEP, USD CCL or real/inflation-adjusted, with compatible benchmarks and explicit conversions
- [ ] dividends, splits, CEDEAR ratio changes, bond coupons, amortizations, accrued interest where relevant, adjusted/unadjusted series
- [ ] bid/ask, spreads, slippage, liquidity/volume constraints, settlement, market hours, halts/suspensions, commissions/taxes where applicable
- [ ] mandatory spread/slippage handling for local/BYMA instruments
- [ ] look-ahead and survivorship-bias controls, point-in-time universes and documented delisting/coverage limitations
- [ ] protected holdout/out-of-sample datasets, separated optimization/evaluation and recorded parameter searches
- [ ] persist EVERY backtest run, including discarded/failed variants; never erase failed experiments
- [ ] benchmark and return/drawdown/hit-rate/profit-factor/risk-adjusted metrics
- [ ] human validation and human authorization for entry to paper trading

## Phase 5 — internal paper trading

- [ ] human promotion to PAPER_TRADING before autonomous simulation
- [ ] internal accounts/fills only, NO IOL writes and NO sandbox orders
- [ ] reuse strategy/risk interfaces without broker-write adapters
- [ ] realistic fills, fees, spreads/slippage, liquidity and settlement assumptions
- [ ] duplicate signals cannot create duplicate paper trades
- [ ] paper positions/P&L with explicit basis; prospective evidence labeled simulated
- [ ] human promotions through REVIEW_PENDING, REVIEWED and ELIGIBLE_FOR_HUMAN_APPROVAL

## Phase 6 — mature scheduler / autonomous research

Extend the Phase 2.5 collector; do not postpone initial collection until this phase.

- [ ] scheduled portfolio, signal, approved paper and evaluation jobs
- [ ] natural idempotency keys, unique constraints, overlap protection and deduplication
- [ ] missed-run records, gaps, observable failures, safe retry/timeout/rate limits
- [ ] scheduler kill switch and daily/weekly research summaries
- [ ] explicit AI-call cost/token budgets before any later approved model calls
- [ ] justified durable queue/workers and operational monitoring
- [ ] human strategy-state gates remain enforced

## Deployment gate — before off-machine or 24/7 operation

This is an explicit security gate, not an automatic consequence of Phase 6. It applies earlier too if credentials or financial data would leave the local machine.

- [ ] explicit user approval
- [ ] threat-model review
- [ ] credential/secrets plan
- [ ] database security
- [ ] tested backup/recovery
- [ ] network exposure review
- [ ] monitoring and incident response

Deployment never grants broker-write permissions. See ADR-016.

## Phase 7 — read-only MCP

- [ ] narrow authenticated/authorized portfolio, balance, quote, exposure, signal and performance tools
- [ ] no arbitrary HTTP/SQL/shell proxies; no secrets in model context
- [ ] safe MCP audit metadata and rate limits

## Phase 8 — AI advisory committee

- [ ] provider-neutral OpenAI/Anthropic advisory contracts and validated schemas
- [ ] zero protected-capability authority; advisory veto cannot block kill switch or risk reduction
- [ ] independent opinions and preserved disagreements
- [ ] no secrets in prompts; identifier minimization/redaction; protected minimal artifact retention
- [ ] full AI prompts/responses containing sensitive portfolio data may be persisted only when the requirement is explicitly approved by the user and the data is protected
- [ ] prospective AI/news feature evaluation by default and explicit cost/token budgets
- [ ] measure advisory value separately from strategy performance

## Phase 9 — sandbox execution

BEFORE any broker-write code or `packages/execution` exists: explicit user approval and threat-model review.

- [ ] sandbox-only execution boundary separated from research/paper code
- [ ] future write credentials separate from read credentials whenever possible; raw broker credentials remain strictly inside `packages/iol`
- [ ] deterministic order/risk checks; explicit human preview/confirmation
- [ ] expiry, exact-match binding, fail-closed authorization and idempotency
- [ ] immutable audit events and tested emergency kill switch
- [ ] sandbox-only tests; automated tests NEVER call production trading endpoints

## Phase 10 — optional production execution

Separate explicit user approval and threat-model review are mandatory. Require isolated credentials, narrow permissions, accepted sandbox evidence, operational runbook, backups/monitoring and tested kill switch. No autonomous real-money execution. Strategy eligibility, deployment and AI advice do not authorize this phase.
