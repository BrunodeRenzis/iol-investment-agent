# Architecture

## High-level model

```text
External data (IOL / future feeds)
          ↓
market-data normalization + ingestion
          ↓
portfolio snapshots + persistent observations
          ↓
trading research
(indicators / strategies / signals / backtesting / paper trading)
          ↓
     ┌────┴────┐
     ↓         ↓
 deterministic AI advisory
 risk          review
     └────┬────┘
          ↓
recommendation / research output

FUTURE, SEPARATE PATH:
human-approved proposal -> risk validation -> preview -> explicit confirmation -> execution -> IOL
```

## Architectural style

Use a modular monolith until measured requirements justify separation. Avoid microservices in early phases.

## Intended repository layout

```text
apps/
  api/
    src/modules/
      health/
      auth/
      portfolio/
      market/
      research/

packages/
  iol/
  market-data/
  portfolio/
  risk/
  trading/
    indicators/
    strategies/
    signals/
    backtesting/
    paper-trading/
    evaluation/
  scheduler/
  ai/
    contracts/
    openai/
    anthropic/
    committee/
  mcp/
  execution/   # future only
```

## Domain boundaries

### IOL adapter

Owns authentication/token lifecycle, safe HTTP transport, typed provider schemas, error mapping, rate-limit behavior, and read-only account/market operations in early phases. It must not contain strategy or AI logic. Early interfaces should not expose write methods at all.

### Market data

Owns normalized quotes/bars, source metadata, exchange/provider/ingestion timestamps, duplicate/stale-data handling, and dataset provenance. Raw provider schemas should not leak throughout the application.

### Portfolio

Owns balances, positions, normalized cost basis where available, snapshots, P&L representation, and asset/issuer/currency metadata.

### Risk

Pure/deterministic where practical. Owns concentration, issuer/sector/currency exposure, max-position rules, future proposal impact, drawdown/portfolio constraints, and veto conditions. Hard risk rules never depend solely on LLM output.

### Trading research

Owns indicator functions, strategy definitions/versioning, signals, backtests, paper trades, and outcome evaluation. It must not call production broker write endpoints.

### Scheduler

Expresses recurring work such as market observation, portfolio snapshots, signal evaluation, paper-trading evaluation, and daily/weekly research summaries. Jobs must be idempotent and observable.

### AI

Owns provider-neutral contracts, OpenAI/Anthropic adapters, structured advisory responses, and disagreement/consensus reporting. AI receives normalized context, never broker credentials.

### MCP

Expose narrow purpose-built tools such as `get_portfolio`, `get_balances`, `get_quote`, `get_exposure_summary`, `get_recent_signals`, and `get_strategy_performance`. Do not expose a generic IOL proxy, arbitrary HTTP/SQL, or shell access.

### Execution

Future only. Research signals do not imply execution authority. A future path is `proposeOrder -> validateOrder -> applyRiskRules -> previewOrder -> explicitUserConfirmation -> verifyExactMatchAndExpiry -> executeConfirmedOrder -> audit`.

## Data precision

Before financial normalization, record an ADR choosing a decimal-safe arithmetic strategy. Define explicit concepts such as `Money`, `Currency`, `Price`, `Quantity`, `NominalValue`, `Percentage`, and `FxRate`. Do not use binary floating-point for critical financial arithmetic.

## Data persistence

Persistence should support portfolio snapshots, market observations, strategy definitions/versions, generated signals, backtest runs, paper trades, evaluation outcomes, and future audit events.

Every research result should be traceable to strategy version, dataset/version or observation range, execution timestamp, parameters, and code version where practical.

## Scheduler evolution

Early local phase: in-process schedule -> idempotent job handler -> database.

Production 24/7 phase: scheduler -> durable queue -> workers -> database.

Do not introduce Redis/BullMQ merely for architecture aesthetics. Add durable queueing when operational requirements justify it.

## Observability

Use structured logs, correlation IDs, safe provider error mapping, metrics for request latency/failures, job-run metadata, signal/backtest run IDs, and future immutable audit events. Do not log broker credentials, authorization headers, raw secrets, or unnecessary personal data.

## AI investment committee concept

The committee is advisory, not authoritative. Systematic signal + deterministic risk analysis + independent OpenAI and Claude opinions produce an agreement/disagreement report for the user. Preserve disagreement rather than forcing false consensus. Record AI opinions separately from actual strategy performance.
