# Security model

## Security posture

This system handles sensitive financial information and may eventually gain transaction capabilities. Default posture: **deny, minimize, isolate, validate, audit**.

## Capability phases

### Read-only broker phase

Allowed: balances, portfolio, market data, portfolio analytics, research signals, backtesting, paper trading.
Forbidden: real buy/sell, cancel/replace, FCI subscribe/redeem, caución, transfers/withdrawals, automatic stop-loss/take-profit execution.

### Future sandbox execution phase

May only begin after explicit user approval and must include a deterministic order model, risk checks, preview, confirmation state machine, idempotency, audit events, and sandbox-only broker adapter.

### Future production execution phase

Must not begin automatically after sandbox success. Requires a separate explicit decision and security review.

## Capability separation

Keep broker read access, research, MCP, AI advisory, and future broker write access separated. Where possible, use separate credentials/scopes for read and write. The AI layer must never possess broker write credentials.

## Credentials

Store secrets only in environment variables or an appropriate secret manager. Never commit `.env`, send credentials to OpenAI/Anthropic, expose credentials through MCP, or log authorization headers/tokens/private keys. Rotate compromised credentials immediately.

## Input and provider validation

Validate HTTP inputs, IOL responses, timestamps, quote freshness, MCP arguments, AI structured output, and database values crossing trust boundaries. Treat provider data as untrusted external input.

## Market-data integrity

Protect against stale quotes, duplicate observations, missing bars, malformed timestamps, timezone errors, accidental future data, and silent schema changes. Backtests must reject or explicitly report invalid datasets.

## LLM security

Models may summarize, analyze, propose, critique, and veto/escalate. Models may not bypass hard risk checks, authorize their own proposals, construct arbitrary broker HTTP requests, access broker secrets, change execution permissions, or silently promote strategies into production.

Prompt injection from external news/content must not create new tool permissions.

## MCP security

Expose narrow tools, authenticate clients, authorize per capability, prefer read-only tools, apply rate limits, log safe invocation metadata, and do not expose filesystem/shell/arbitrary DB administration/arbitrary HTTP through the investment MCP server.

## Scheduler security

A scheduler may autonomously collect allowed data, calculate indicators, run backtests, run paper trading, evaluate previous signals, and create advisory reports. It may not autonomously trigger production financial writes.

## Future real-order confirmation design

Any real order requires a normalized deterministic order object, deterministic risk result, human-readable preview, explicit user approval, short-lived confirmation token, exact-match validation between preview and execution, idempotency key, immutable audit event, and emergency kill switch. If any material field changes after preview, require new confirmation.

## Secret scanning

CI should continue running Gitleaks. Early Phase 1 hardening should add a local staged-file secret scan or equivalent pre-commit protection without silently mutating developer machines.

## Research integrity as safety

A misleading backtest can cause financial harm even when code is secure. Therefore forbid look-ahead bias, document survivorship/data limitations, include costs/slippage assumptions, preserve failed signals, version strategy changes, separate optimization from evaluation, and label simulated results clearly.
