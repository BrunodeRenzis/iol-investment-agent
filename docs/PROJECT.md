# Project definition

## Goal

Build a personal investment platform that can securely read IOL account data, collect market observations, analyze the portfolio, research measurable trading strategies, paper-trade them, and expose selected capabilities to AI assistants.

The long-term system may prepare real-money orders, but no model may independently authorize or execute them.

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
4. Deterministic risk rules take precedence over LLM opinions.
5. Strategies must be measurable and reproducible.
6. Backtests must account for bias and realistic trading assumptions.
7. Paper trading precedes any consideration of real execution.
8. Human approval is mandatory for real financial actions.
9. Full auditability.
10. Minimum privilege.
11. External providers remain replaceable adapters.
12. Financial values must be precise and explicit.

## V1 scope

V1 is read-only and research-oriented. The user can securely retrieve balances and portfolio from IOL, retrieve normalized market quotes, inspect normalized positions, persist portfolio snapshots, persist selected market observations, calculate concentration/exposure, inspect basic technical indicators, evaluate strategy signals without real execution, and ask AI assistants to analyze normalized data without receiving broker secrets.

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
- portfolio optimization controlled solely by an LLM
- microservices without an operational need

## Success criteria for the read-only foundation

The backend can run locally, authenticate safely with IOL in an approved read-only configuration, fetch balances/portfolio/selected quotes, normalize responses into explicit domain models, persist selected observations safely, expose authenticated read-only endpoints, pass automated checks, and contain no real-order execution path.

## Success criteria for the research foundation

The system can build a reproducible dataset, calculate indicators deterministically, version strategy rules, generate traceable signals, backtest without known look-ahead leakage, compare against a benchmark, persist paper trades, evaluate signal outcomes over time, and keep AI commentary separate from measured strategy performance.
