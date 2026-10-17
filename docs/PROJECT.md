# Project definition

## Goal

Build a personal investment platform that can securely read IOL account data, collect market observations, analyze the portfolio, research measurable trading strategies, paper-trade them, and expose selected capabilities to AI assistants.

The long-term system may prepare orders only through a separately approved execution capability. Before Phase 9 is explicitly approved, NO broker-write code may exist, including sandbox and production, and `packages/execution` remains ABSENT. Paper trading is internal simulation with no IOL or other broker writes; research never calls broker write endpoints of any kind.

## Product identity

This is not merely "a chatbot connected to IOL." It is a personal market-intelligence system, portfolio analytics engine, systematic strategy research environment, backtesting and paper-trading platform, AI-assisted investment research layer, and future human-approved execution interface.

## Primary user

One personal account initially. Multi-user SaaS behavior is out of scope until explicitly introduced.

## Initial stack

- TypeScript
- NestJS
- PostgreSQL when persistence begins
- a decimal-safe arithmetic library chosen via ADR
- official IOL API and/or official IOL MCP where appropriate
- MCP for narrow internal tools
- provider-neutral OpenAI and Anthropic adapters
- GitHub Actions
- Gitleaks

Scheduler/worker infrastructure should start simple and become durable only when 24/7 operation requires it.

## Product principles

1. Read first; write much later.
2. The repository is the shared memory between AI coding agents.
3. Observation and research are independent from execution.
4. AI has zero risk/execution authority; only deterministic code and explicit human authorization control protected capabilities.
5. Strategies must be measurable and reproducible.
6. Backtests must account for bias and realistic trading assumptions.
7. Paper trading precedes any consideration of real execution.
8. Human approval is mandatory for real financial actions.
9. Full auditability.
10. Minimum privilege.
11. External providers remain replaceable adapters.
12. Financial values must be precise and explicit.

## V1 scope

V1 is read-only and research-oriented. The user can securely retrieve balances and portfolio from IOL, retrieve normalized market quotes, inspect normalized positions, persist portfolio snapshots, persist selected market observations, calculate concentration/exposure, inspect basic technical indicators, evaluate strategy signals without real execution, and ask AI assistants to analyze normalized data without receiving ANY secrets. Account identifiers and sensitive personal financial identifiers are minimized/redacted before model calls where possible.

## Trading research scope

The trading research subsystem will support indicator calculation, versioned strategies, generated signals, historical evaluation, benchmark comparison, backtesting, paper trading, and outcome tracking at defined horizons.

Initial strategies should be simple and explainable before complex AI-driven approaches are attempted.

## Explicit non-goals for early phases

- autonomous real-money trading
- high-frequency trading
- ultra-low-latency execution
- hidden/black-box strategy promotion
- multi-broker routing
- copy/social trading
- AI authority over account/execution permissions, hard portfolio/risk limits, position sizing constraints, order validity, confirmation, or real-money execution
- microservices without an operational need

## Success criteria for the read-only foundation

The backend can run locally, authenticate safely with IOL in an approved read-only configuration, fetch balances/portfolio/selected quotes, normalize responses into explicit domain models, persist selected observations safely, require authentication/authorization before introducing any financial/account endpoint, including localhost/loopback; expose read-only endpoints, pass automated checks, and contain no real-order execution path.

## Success criteria for the research foundation

The system can build a reproducible dataset, calculate indicators deterministically, version strategy rules, generate traceable signals, backtest without known look-ahead leakage, compare against a benchmark, persist paper trades, evaluate signal outcomes over time, and keep AI commentary separate from measured strategy performance.

## Governance and research evidence

AI may only advise, critique, explain, or veto/escalate a recommendation. Its veto is advisory and never blocks the emergency kill switch or risk-reducing user actions under deterministic controls. Autonomous research may reach BACKTESTED / VALIDATION_PENDING; humans authorize VALIDATED and every later promotion. Deterministic automation may move strategies to REJECTED when objective rejection criteria fail; this does not allow promotion beyond BACKTESTED / VALIDATION_PENDING. Every transition is auditable and every strategy edit creates a new version. Use the full lifecycle and exit states in AGENTS.md and ADR-012.

Research evidence follows AGENTS.md section 13 and ADR-013: immutable datasets and information-availability timestamps, prospective AI/news/LLM feature evaluation by default, full Argentine-market instrument identity (AL30/AL30D/AL30C are not interchangeable), explicit return basis/currency and compatible benchmarks, corporate-action/fixed-income adjustments, mandatory local/BYMA spreads/slippage, realistic liquidity/settlement/hours/halts/costs, survivorship-bias controls, protected holdouts, and every backtest/search preserved, including failures.

## Data collection and deployment gates

Before persistence/redistribution, verify current IOL terms for storage, historical retention, and redistribution. Do not invent IOL behavior; unknowns remain UNKNOWN until verified against official documentation or authorized read-only sandbox interaction before implementation.

Phase 2 supplies secured persistence and portfolio intelligence; Phase 2.5 starts minimal scheduled read-only collection to accumulate real forward data before paper research. Raw observations are append-only, corrections/normalizations are versioned, and missed observations remain gaps. Phase 6 matures scheduler operations, with the idempotency, overlap, deduplication, kill-switch and AI budget controls in ADR-014.

Moving broker credentials/financial data off-machine is a security-boundary change. The separate deployment gate requires user approval, threat-model review, secrets plan, database security, backup/recovery, network exposure review, and monitoring; it grants no broker-write permissions. Persistence follows least privilege, encryption at rest where supported, access controls, backups, retention, and minimization. Phase 9 and Phase 10 each require their own approval and threat-model review.
