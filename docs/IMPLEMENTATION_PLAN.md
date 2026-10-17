# Implementation plan

Complete one step, validate it, review it with the second agent when material, then let the user commit. Do not combine unrelated phases merely because they are technically possible.

## Step 1 — Phase 1 hardening

Add staged-file secret scanning, tighten remaining secret patterns, make test discovery explicit, make tests fail if zero tests are found, and keep the Phase 0 behavior unchanged.

Suggested primary: Codex. Suggested reviewer: Claude.

## Step 2 — financial numeric primitives

Compare maintained decimal-safe TypeScript libraries, record an ADR, create explicit value objects (`Money`, `Currency`, `Price`, `Quantity`, `NominalValue`, `Percentage`, `FxRate`), define rounding behavior, and write extensive unit tests.

## Step 3 — verify IOL integration contract

Use current official IOL documentation to verify authentication, read-only capabilities, rate limits, portfolio/balance/quote endpoints, sandbox behavior, and token lifecycle. Document only verified behavior. Do not implement write methods.

## Step 4 — IOL read-only adapter

Build typed client, auth/token boundary, timeout policy, safe error mapping, read-only interfaces, fixtures, and mocks. No trading/business logic in the adapter.

## Step 5 — portfolio normalization

Create internal models for balances, instruments, positions, cost information, currency, and normalized P&L where supported. Add appropriately authenticated read-only endpoints before exposing sensitive financial data beyond loopback.

## Step 6 — market-data normalization

Create normalized quote/OHLC/volume/source/timestamp/freshness models. Prevent stale or duplicate observations from being silently accepted.

## Step 7 — persistence

Introduce PostgreSQL. Persist portfolio snapshots, market observations, and provenance metadata. Add migrations and integration tests.

## Step 8 — deterministic portfolio risk

Implement allocation, issuer/sector/currency exposure, concentration, and configurable hard limits. Keep the risk package independent of LLMs.

## Step 9 — trading research contracts

Introduce `packages/trading` and define Indicator, Strategy, StrategyVersion, Signal, Horizon, StrategyParameters, and EvaluationResult.

## Step 10 — first explainable indicators/strategy

Start simple: moving averages, returns/momentum, RSI, volatility, and volume features. Build one explicit strategy whose behavior can be unit-tested. The goal is architecture correctness, not maximum returns.

## Step 11 — signal history and evaluation

Persist every generated signal, evaluate outcomes at predeclared horizons, never delete losing signals, and support queries such as all BUY signals for an instrument, 1d/7d/30d outcomes, and performance by strategy version.

## Step 12 — backtesting engine

Implement reproducible backtests with known dataset range, strategy version, parameter snapshot, costs, realistic timing, look-ahead protection, benchmark, and risk metrics. Have Claude perform an adversarial bias review.

## Step 13 — paper trading

Create simulated account/orders/fills. Reuse strategy and risk contracts. Do not introduce production execution code. Run strategies prospectively long enough to compare with backtests.

## Step 14 — scheduler

Only after data collection and strategy evaluation work manually. Schedule market-data collection, portfolio snapshots, signal generation, paper updates, and signal outcome evaluation. Ensure idempotency.

## Step 15 — 24/7 deployment

Choose hosting, add production database, decide whether durable queue/worker infrastructure is required, add monitoring/alerting, and define backup/recovery. Do not expose broker write permissions.

## Step 16 — MCP

Expose narrow read-only tools so ChatGPT/Codex and Claude query the same backend. Keep broker credentials server-side.

## Step 17 — OpenAI + Anthropic advisory layer

Add providers behind a common interface. Initially use them to review portfolio concentration, strategy assumptions, current signal context, and research risks. Measure value instead of assuming it.

## Step 18 — AI investment committee

Run models independently. Store each opinion, reasons, disagreements, and final human-facing synthesis. Do not average opinions into false certainty.

## Step 19 — sandbox order proposal

Only after explicit user approval. Implement proposal/preview/confirmation/audit in sandbox.

## Step 20 — production decision

This is a governance decision, not an automatic roadmap checkbox. Reassess whether real execution should exist at all and, if so, under what narrow constraints.
