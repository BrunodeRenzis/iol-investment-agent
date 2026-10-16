# AGENTS.md — Global repository instructions

These instructions apply to the entire repository unless a deeper `AGENTS.md` explicitly overrides them.

## 1. Core mission

Build a secure, auditable investment-assistant platform around IOL (InvertirOnline) with:
- NestJS as the primary backend framework.
- Read-only IOL integration first.
- MCP exposure only after the core backend is stable.
- AI assistants (Codex / ChatGPT / Claude) as analysis and implementation helpers, not as autonomous financial operators.
- Explicit human approval before any real-money action.

The system must be designed so that a language model can propose actions, but cannot directly execute real trades without deterministic checks and explicit user confirmation.

## 2. Non-negotiable safety constraints

### Git and repository safety
- NEVER commit automatically.
- NEVER push automatically.
- NEVER merge automatically.
- NEVER rebase, reset, force-push, amend, or rewrite Git history unless the user explicitly requests that exact operation.
- NEVER delete branches, tags, remote refs, or stashes without explicit user approval.
- Before any destructive Git command, explain the command and ask for approval.
- You MAY create/edit files, run tests, run linters, inspect diffs, and suggest commit messages.
- At the end of a coding task, show:
  1. files changed,
  2. tests/checks run,
  3. unresolved issues,
  4. suggested commit message,
  5. `git status` summary.
- Leave the actual `git add`, `git commit`, `git push`, and merge actions to the user unless the user explicitly authorizes one specific action in that turn.

### Secrets and credentials
- NEVER hardcode credentials, tokens, passwords, API keys, refresh tokens, account IDs, private keys, cookies, bearer tokens, or personal data.
- NEVER print secrets in logs.
- NEVER include secrets in prompts sent to an LLM.
- NEVER place secrets in tracked files.
- Use environment variables and secret managers.
- `.env` must be ignored by Git.
- `.env.example` must contain placeholders only.
- Redact tokens if they appear in logs or debugging output.
- If a secret is accidentally exposed, stop and recommend rotation before continuing.

### Financial-operation safety
- Default mode is READ-ONLY.
- No real-money buy, sell, caución, FCI subscription/redemption, stop loss, take profit, or any other operation may be executed automatically.
- No AI model may receive direct authority to call a production trading endpoint.
- Any future real-order flow must follow:
  1. user intent,
  2. deterministic validation,
  3. preview,
  4. explicit confirmation,
  5. execution,
  6. audit log.
- Every order request must be idempotent.
- Every real-money operation must have an audit trail.
- Sandbox must be used before enabling any production write operation.
- Production write scopes must remain disabled until explicitly enabled by the user in a later project phase.
- If there is ambiguity about quantity, currency, settlement term, instrument, market, price type, or order side, do not execute.

## 3. Architecture rules

- Prefer modular monolith architecture first.
- Avoid premature microservices.
- Keep domain logic independent from transport/framework details where practical.
- External APIs must be isolated behind adapters.
- IOL-specific code belongs under a dedicated IOL integration module/package.
- AI-provider-specific code must be behind interfaces/adapters.
- Risk checks must be deterministic code, never solely LLM judgment.
- Business rules must be testable without network access.
- No controller may contain substantial business logic.
- No service should become a "god service".
- Prefer explicit DTOs and schemas over loose objects.
- Validate all external inputs.
- Fail closed on authorization and trading permissions.
- Prefer composition over inheritance.
- Keep public interfaces small.

Suggested top-level responsibilities:
- `apps/api`: NestJS HTTP/API composition root.
- `packages/iol`: IOL client, auth, portfolio/market adapters.
- `packages/risk`: deterministic portfolio and order risk rules.
- `packages/mcp`: MCP server/tool exposure.
- `docs`: architecture, security, ADRs, runbooks.

## 4. Coding standards

- TypeScript strict mode.
- No `any` unless justified in code comments and review notes.
- Prefer `unknown` + validation over `any`.
- Use meaningful domain names.
- Avoid boolean arguments when an enum/value object is clearer.
- Avoid hidden side effects.
- Use dependency injection through interfaces/tokens.
- Keep functions small enough to understand and test.
- Use UTC internally for timestamps; convert only at boundaries.
- Use decimal-safe handling for money; do not use naïve floating-point arithmetic for financial calculations.
- Currency, nominal value, quantity, price, and percentages must be represented explicitly.
- Never assume ARS/USD conversion rates; obtain or pass them explicitly.
- Add structured logging with request/correlation IDs.
- Do not log full IOL responses if they can contain sensitive account data.

## 5. Testing requirements

For every material change:
- Add or update unit tests.
- Add integration tests for external adapters where useful.
- Mock external IOL/OpenAI/Anthropic calls in automated tests.
- Never run tests against production trading endpoints.
- Prefer sandbox or fixtures.
- Test failure paths, timeouts, retries, malformed responses, authorization failures, and idempotency.
- Risk rules require explicit tests.
- Any future order flow requires tests proving that execution cannot occur without confirmation.

Before declaring a task complete, run the relevant:
- formatter,
- linter,
- typecheck,
- unit tests,
- targeted integration tests.

If a check cannot be run, state why.

## 6. Security requirements

Follow least privilege and default-deny.
- Read-only credentials/scopes by default.
- Production write permissions must be separable from read permissions.
- Rate-limit exposed endpoints.
- Apply authentication and authorization at backend boundaries.
- Use CSRF protection where applicable.
- Validate redirects and OAuth state/PKCE where applicable.
- Do not trust data from IOL, MCP clients, browsers, webhooks, or LLMs without validation.
- Set reasonable HTTP timeouts.
- Retry only idempotent operations unless a safe idempotency mechanism exists.
- Never retry a potentially submitted order blindly.
- Dependency updates must be reviewed for security impact.
- Avoid unnecessary dependencies.
- Do not expose stack traces or sensitive internal details in production responses.

## 7. AI-agent behavior

Codex and Claude are collaborators, not authorities.
They may:
- inspect code,
- implement features,
- write tests,
- review diffs,
- suggest architecture,
- produce migration plans.

They may NOT:
- commit/push/merge by default,
- change the project safety model silently,
- weaken tests to make CI pass,
- disable security checks for convenience,
- invent undocumented IOL behavior,
- execute real financial operations.

When uncertain about IOL behavior, mark it as unknown and require verification against official documentation or sandbox.

## 8. Change discipline

Before broad refactors:
- summarize the problem,
- propose the smallest coherent change,
- identify files/modules affected.

Do not perform unrelated cleanup in the same task unless necessary.
Do not introduce a new library when the standard library or current dependencies are adequate.
Document non-obvious architectural decisions in `docs/DECISIONS.md`.

## 9. Completion format for agents

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
