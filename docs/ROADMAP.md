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

## Phase 1 — financial foundations and IOL read-only

- [ ] local staged-file secret scanning
- [ ] explicit test discovery + fail on zero tests
- [ ] tighten remaining secret-file ignore patterns
- [ ] ADR for decimal-safe financial arithmetic
- [ ] financial value objects
- [ ] verify current official IOL read-only auth/integration requirements
- [ ] typed IOL client/auth adapter
- [ ] balances
- [ ] portfolio
- [ ] selected market quotes
- [ ] normalized internal models
- [ ] timeout/error policy
- [ ] fixture/mock tests
- [ ] prove no broker write interface exists

## Phase 2 — persistence and portfolio intelligence

- [ ] PostgreSQL
- [ ] portfolio snapshots
- [ ] selected market observations
- [ ] source/provenance/timestamps
- [ ] duplicate/stale-data handling
- [ ] allocation metrics
- [ ] issuer/sector/currency exposure
- [ ] concentration metrics
- [ ] P&L normalization
- [ ] deterministic portfolio risk rules
- [ ] authenticated reporting endpoints

## Phase 3 — trading research core

- [ ] `packages/trading`
- [ ] indicator contracts + initial indicators
- [ ] versioned strategy contract
- [ ] signal model
- [ ] persist strategies/versions/signals
- [ ] outcome tracking at declared horizons
- [ ] benchmark contracts
- [ ] first simple explainable strategy

## Phase 4 — reproducible backtesting

- [ ] reproducible dataset loader
- [ ] transaction-cost model
- [ ] slippage model where relevant
- [ ] look-ahead protection
- [ ] in-sample/out-of-sample support where relevant
- [ ] return/drawdown/hit-rate/profit-factor/risk-adjusted metrics
- [ ] benchmark comparison
- [ ] persist backtest runs
- [ ] strategy promotion criteria

## Phase 5 — paper trading

- [ ] paper account model
- [ ] simulated fills
- [ ] fees/slippage assumptions
- [ ] reuse strategy/risk interfaces
- [ ] open/closed paper positions
- [ ] paper P&L
- [ ] evaluation reports
- [ ] compare paper results with backtests

## Phase 6 — scheduler / autonomous observation

- [ ] `packages/scheduler`
- [ ] market calendar/timezone policy
- [ ] idempotent market-data jobs
- [ ] portfolio snapshot jobs
- [ ] strategy-evaluation jobs
- [ ] paper-trading update jobs
- [ ] daily research summary
- [ ] weekly strategy-performance review
- [ ] job metadata/failure reporting
- [ ] decide when durable queue/worker infrastructure is justified

## Phase 7 — read-only MCP

- [ ] authenticated MCP server
- [ ] portfolio/balance/quote/exposure tools
- [ ] recent-signal/performance tools
- [ ] confirm broker secrets never enter model context
- [ ] MCP audit metadata

## Phase 8 — AI advisory committee

- [ ] provider-neutral AI contracts
- [ ] OpenAI adapter
- [ ] Anthropic adapter
- [ ] structured output schemas
- [ ] independent-analysis mode
- [ ] disagreement/consensus report
- [ ] news/fundamental pipeline when reliable sources exist
- [ ] evaluate whether AI commentary adds measurable value

## Phase 9 — sandbox order proposal system

Requires explicit user approval before starting.

- [ ] normalized order proposal
- [ ] deterministic risk checks
- [ ] preview
- [ ] confirmation state machine
- [ ] confirmation expiry
- [ ] exact-match validation
- [ ] idempotency
- [ ] immutable audit events
- [ ] emergency kill switch
- [ ] sandbox-only execution

## Phase 10 — optional production execution

Do not start automatically. Requires explicit user decision, dedicated security review, operational runbook, production credential isolation, kill-switch testing, acceptable sandbox evidence, and a narrow definition of what can/cannot be automated.
