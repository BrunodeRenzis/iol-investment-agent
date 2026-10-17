# IOL Investment Agent

A secure, auditable personal investment platform integrating IOL data with systematic trading research, paper trading, deterministic risk controls, MCP, and advisory AI agents such as Codex/ChatGPT and Claude.

## Status

**Phase 0 complete: secure local backend foundation.**

The next implementation work is focused on financial-domain foundations and **read-only IOL integration**.

There is currently **no production trading capability**.

## Product direction

```text
OBSERVE
market data / portfolio snapshots / scheduled collection
    ↓
RESEARCH
indicators / strategies / signals / backtesting / paper trading / AI review
    ↓
EXECUTE
risk checks / preview / explicit human approval / broker execution
```

The first two levels may eventually run autonomously. Real-money execution may not.

## Safety model

> Observation may be autonomous. Research may be autonomous. Paper trading may be autonomous. Real-money execution may not be autonomous.

AI models may analyze and propose. Deterministic code owns hard risk rules. Future real-money orders require an explicit user confirmation flow.

See `AGENTS.md` and `docs/SECURITY.md`.

## Local setup

```bash
npm ci
npm run build
npm start
```

`GET http://127.0.0.1:3000/health` returns the Phase 0 liveness response. No broker credentials are required for Phase 0.

## Development checks

```bash
npm run format
npm run check
npm run audit:dependencies
```

CI runs repository checks and Gitleaks scanning.

## Intended workspace boundaries

```text
apps/
  api/              HTTP composition root

packages/
  iol/              IOL transport/auth/read-only adapters
  market-data/      normalized quotes/bars/observations
  portfolio/        balances, positions, snapshots, P&L
  risk/             deterministic limits and exposure rules
  trading/          indicators, strategies, signals, backtests, paper trading
  scheduler/        scheduled observation/research jobs
  ai/               provider-neutral AI advisory layer
  mcp/              narrow read-only MCP tools
  execution/        future gated execution boundary
```

Not every package exists yet. They are introduced incrementally by the roadmap.

## Strategy lifecycle

```text
IDEA
  ↓
SPECIFIED
  ↓
BACKTESTED
  ↓
VALIDATED
  ↓
PAPER_TRADING
  ↓
REVIEWED
  ↓
ELIGIBLE_FOR_HUMAN_APPROVAL
```

Eligibility still does not grant autonomous execution.

## Near-term implementation

1. harden local Git/secret/test workflow;
2. define decimal-safe financial primitives;
3. implement read-only IOL access;
4. normalize portfolio and quote data;
5. persist market observations and portfolio snapshots;
6. build deterministic risk metrics;
7. add indicators and strategy contracts;
8. add reproducible backtesting;
9. add paper trading;
10. add scheduled data collection;
11. expose narrow read-only MCP tools;
12. add OpenAI and Anthropic advisory adapters;
13. consider execution only after a separate security review.

See `docs/ROADMAP.md` and `docs/IMPLEMENTATION_PLAN.md`.

## Documentation

Read in this order:

1. `AGENTS.md`
2. `docs/PROJECT.md`
3. `docs/ARCHITECTURE.md`
4. `docs/SECURITY.md`
5. `docs/IMPLEMENTATION_PLAN.md`
6. `docs/ROADMAP.md`
7. `docs/DECISIONS.md`
8. `docs/WORKFLOW.md`

## Agent workflow

Codex and Claude may collaborate on the repository, but they should not modify the same files simultaneously unless explicitly coordinated.

The default workflow is: one agent implements, the other reviews, the user chooses which findings to accept, and the user commits.

Neither agent may commit, push, merge, or execute real-money operations by default.
