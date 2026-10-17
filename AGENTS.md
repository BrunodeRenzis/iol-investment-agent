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

**Observation may be autonomous.**

**Research may be autonomous.**

**Paper trading may be autonomous.**

**Real-money execution may NOT be autonomous.**

An AI model may recommend, critique, rank, summarize, veto, or propose. An AI model may never independently authorize or execute a real-money operation.

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
- NEVER log secrets.
- NEVER include broker credentials in prompts sent to an LLM.
- NEVER expose IOL credentials to MCP clients.
- NEVER place secrets in tracked files.
- `.env` and secret-like files must remain ignored.
- `.env.example` contains placeholders only.
- If a secret is exposed, stop and recommend rotation before continuing.
- Minimize personally identifying financial information sent to external model providers.

## 5. Financial-operation safety

Default mode is **READ-ONLY**.

Until a future phase is explicitly approved, the repository must contain no reachable production path for buy/sell orders, cancellations, caución, FCI subscriptions/redemptions, stop-loss/take-profit execution, transfers/withdrawals, or other real-money broker writes.

A future real-order lifecycle must be:

`intent -> deterministic validation -> risk checks -> preview -> explicit human confirmation -> exact-match validation -> execution -> audit`

Requirements: idempotency key, confirmation expiry, exact binding of instrument/side/quantity-or-nominal/price-or-price-type/currency/market/settlement, fail closed on ambiguity, no blind retry of an order, immutable audit event, and emergency kill switch.

## 6. Trading research safety

Trading research is allowed, but it must remain separate from execution.

No strategy is eligible for real-money use unless it has a written hypothesis, explicit entry/exit/position-sizing/risk rules, reproducible historical data, backtest results, transaction-cost assumptions, slippage assumptions where relevant, protection against look-ahead bias, in-sample/out-of-sample separation where appropriate, benchmark comparison, drawdown analysis, a versioned definition, paper-trading results, documented limitations, and explicit human promotion.

LLM confidence is not evidence of strategy quality. Never modify a strategy retroactively to hide losing signals. Strategy changes require a new version.

## 7. Strategy lifecycle

Allowed lifecycle:

`IDEA -> SPECIFIED -> BACKTESTED -> VALIDATED -> PAPER_TRADING -> REVIEWED -> ELIGIBLE_FOR_HUMAN_APPROVAL`

Real execution is a separate capability and is not implied by eligibility.

Every generated signal should record strategy version, observation/data timestamp, instrument, signal type, intended horizon, relevant features/indicator values, AI advisory context if any, later outcomes at configured horizons, and whether the signal was paper-traded.

## 8. AI responsibilities

AI may be used for news/fundamental summarization, hypothesis generation, research critique, anomaly explanation, portfolio commentary, code implementation/review, and structured advisory opinions.

AI may not be the sole authority for order validity, portfolio hard limits, position sizing limits, maximum drawdown controls, account permissions, or production execution.

Treat model output as untrusted input and validate structured outputs.

A useful asymmetric policy: an AI/risk reviewer MAY veto or escalate a proposal; an AI reviewer may NOT independently authorize real-money execution.

## 9. Architecture rules

Start as a modular monolith. Avoid premature microservices.

Keep these domains separated:

- `apps/api`: HTTP composition root and user-facing API.
- `packages/iol`: broker integration.
- `packages/market-data`: normalized market observations and time-series contracts.
- `packages/portfolio`: normalized positions, balances, snapshots, and P&L.
- `packages/risk`: deterministic risk rules.
- `packages/trading`: indicators, strategies, signals, backtesting, and paper trading.
- `packages/scheduler`: collection/research scheduling abstractions.
- `packages/ai`: provider-neutral AI analysis and provider adapters.
- `packages/mcp`: narrow MCP tools.
- `packages/execution`: future order-preview/execution boundary; must remain absent or disabled until explicitly approved.

Do not put substantial business logic in controllers. Do not create generic broker proxies or arbitrary HTTP MCP tools. Keep external providers behind typed adapters.

## 10. Market-data rules

- Store timestamps explicitly and use UTC internally.
- Preserve source and collection timestamp.
- Distinguish exchange time, provider time, and ingestion time.
- Do not silently fill missing bars or quotes.
- Detect duplicate and stale data.
- Make scheduled collection idempotent.
- Respect broker/provider rate limits.
- Raw observations should be traceable to normalized records.
- Do not assume IOL alone will provide every data type needed for research.

## 11. Scheduler and background jobs

Background observation is expected eventually. Jobs must be idempotent, observable, retry-safe, rate-limit aware, bounded by timeouts, resilient to missed runs, and explicit about market timezone/calendar.

Do not blindly retry non-idempotent financial writes.

An in-process scheduler is acceptable for early local research. Before dependable 24/7 operation, use durable persistence and a production-suitable queue/worker design.

## 12. Money and numerical correctness

- TypeScript strict mode.
- No `any` unless justified.
- Prefer `unknown` plus validation.
- Never use naïve binary floating-point for money, nominal values, FX, accrued interest, fees, or risk-limit arithmetic.
- Choose and document a decimal strategy before financial normalization.
- Currency, nominal, quantity, price, and percentage are distinct concepts.
- Never infer an FX rate.
- Define rounding explicitly.
- Preserve broker precision when available.

## 13. Backtesting requirements

Backtests must use reproducible datasets; record strategy and dataset version; avoid future leakage/look-ahead bias; account for commissions/costs when material; model realistic entry timing and slippage where material; separate parameter selection from evaluation where appropriate; report benchmark performance; report total return, annualized return where meaningful, volatility, maximum drawdown, hit rate, profit factor, and risk-adjusted metrics where meaningful; and disclose sample-size and market-regime limitations.

Do not optimize a strategy solely for the best historical result. Prefer robustness over parameter perfection.

## 14. Paper trading requirements

Paper trading must reuse the same strategy and risk interfaces intended for future order proposals.

Paper trades must record proposal time, simulated fill assumptions, entry/exit, fees/slippage assumptions, realized/unrealized P&L, reason for exit, and strategy version.

Paper results must never be represented as real returns.

## 15. Testing

For every material change, add/update unit tests, test failure paths, mock IOL/OpenAI/Anthropic in automated tests, never test automated flows against production trading endpoints, test timeouts/malformed data/authorization failures/idempotency, test deterministic risk rules explicitly, and test that any future order flow cannot execute without confirmation.

Before completion run relevant formatter, lint, typecheck, tests, build, targeted integration checks, and dependency/security checks. Do not weaken tests or rules merely to obtain green CI.

## 16. Security

Use least privilege and default deny. Read-only broker permissions first. Authenticate financial-data endpoints. Authorize MCP tools per capability. Rate-limit exposed surfaces. Sanitize errors. Use safe HTTP timeouts. Validate all external inputs and provider responses. Avoid unnecessary dependencies. Keep audit/telemetry free of secrets. Keep research ingestion isolated from execution authority.

## 17. Multi-agent collaboration

Codex and Claude are collaborators, not authorities. Preferred default: one agent implements, the other reviews, the user decides, and the user commits.

Do not have both agents edit the same files simultaneously. For parallel work, use separate branches/worktrees and non-overlapping scopes.

## 18. Change discipline

Before broad changes: restate the task, inspect `git status`, summarize the implementation plan, and identify files/modules affected. Avoid unrelated refactors. Record material architecture/security decisions in `docs/DECISIONS.md`.

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
