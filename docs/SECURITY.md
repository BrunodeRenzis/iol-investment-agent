# Security model

## Security posture

The system is security-sensitive because it handles financial account information and may later gain transaction capabilities.

Default posture: **deny, minimize, isolate, audit**.

## Phase rules

### Phase 1 — read-only
Allowed:
- portfolio reads,
- balances,
- market data,
- read-only analytics.

Forbidden:
- real buy/sell,
- order cancellation,
- FCI subscribe/redeem,
- caución,
- stop-loss/take-profit,
- accepting declarations with legal effect.

### Later write phase
Must not begin until:
- sandbox tests exist,
- user explicitly approves the phase change,
- threat model is reviewed,
- confirmation workflow is implemented,
- idempotency is implemented,
- audit log is implemented,
- write scopes/credentials are isolated.

## Credentials

- Store secrets only in environment variables or a proper secret store.
- Never commit `.env`.
- Never expose IOL credentials to OpenAI, Anthropic, MCP consumers, frontend code, or logs.
- Use separate read-only and write-capable credentials/scopes when supported.
- Prefer OAuth consent/scoped integrations when available.
- Rotate compromised credentials immediately.

## Input validation

Validate:
- route params,
- query params,
- request bodies,
- IOL responses,
- MCP arguments,
- AI structured outputs.

Reject unexpected fields where practical for sensitive actions.

## LLM security

Treat model output as untrusted input.

An LLM may:
- summarize,
- analyze,
- propose.

An LLM may not:
- bypass risk checks,
- construct arbitrary broker requests,
- access raw credentials,
- authorize its own proposal,
- turn natural-language ambiguity into a real financial action.

Never put hidden credentials into model context.

## MCP security

- Expose narrow tools.
- Prefer read-only tools initially.
- Do not expose filesystem, shell, database admin, or arbitrary HTTP tooling through the investment MCP server.
- Authenticate clients.
- Authorize per tool.
- Log tool invocation metadata without logging secrets.
- Apply rate limits.

## Order confirmation design — future

Any real order requires:
- deterministic normalized order object,
- risk-check result,
- human-readable preview,
- explicit approval,
- short-lived confirmation token,
- exact-match validation between preview and execution,
- idempotency key,
- audit entry.

If anything changes after preview, require a new confirmation.

## Logging

Never log:
- passwords,
- refresh tokens,
- bearer tokens,
- session cookies,
- full authorization headers,
- unnecessary personal information.

Sanitize upstream error bodies.

## Dependencies

- Pin/lock dependencies.
- Review major upgrades.
- Run vulnerability scanning in CI.
- Prefer maintained libraries with small dependency trees.
- Avoid packages that duplicate simple standard-library functionality.

## Backup / persistence

If portfolio history is persisted:
- encrypt data at rest where supported,
- restrict database access,
- back up securely,
- define retention,
- avoid storing data that is not required.
