# Roadmap

## Phase 0 — foundation

- [ ] Initialize Git repository.
- [x] Initialize NestJS workspace.
- [x] Enable TypeScript strict mode.
- [x] Add ESLint/formatter/typecheck scripts.
- [x] Add `.gitignore` and `.env.example`.
- [x] Add configuration validation.
- [x] Add health endpoint.
- [x] Add baseline unit tests.
- [x] Add CI that runs lint, typecheck, and tests.
- [x] Confirm no agent auto-commits or auto-pushes.

Local checks pass. The repository root is now
`C:\Users\Bruno\Desktop\iol-investment-agent`; Git initialization is pending
explicit user approval. Hosted CI will run after the user creates and publishes
the repository. Phase 1 has not started.

Exit criteria:
- project runs locally,
- checks pass,
- repository policies are in place.

## Phase 1 — IOL read-only

- [ ] Verify official IOL authentication options and access requirements.
- [ ] Create typed IOL HTTP client.
- [ ] Implement safe token lifecycle.
- [ ] Fetch account balances.
- [ ] Fetch portfolio.
- [ ] Fetch instrument quotes.
- [ ] Normalize external responses into domain models.
- [ ] Add timeout/retry policy.
- [ ] Add adapter tests with fixtures.
- [ ] Test against IOL sandbox or explicitly read-only access.

Exit criteria:
- portfolio can be read safely,
- no write endpoint exists in application code.

## Phase 2 — portfolio intelligence

- [ ] Add portfolio snapshots.
- [ ] Add concentration metrics.
- [ ] Add issuer/sector/currency exposure.
- [ ] Add P&L normalization.
- [ ] Add deterministic risk rules.
- [ ] Add reporting endpoint.

## Phase 3 — MCP read-only

- [ ] Implement authenticated MCP server.
- [ ] Expose narrow read-only tools.
- [ ] Connect Codex/ChatGPT.
- [ ] Connect Claude.
- [ ] Validate that no credentials enter model context.
- [ ] Add MCP audit metadata.

## Phase 4 — AI analysis

- [ ] Add provider-neutral AI interface.
- [ ] Add OpenAI adapter.
- [ ] Add Anthropic adapter.
- [ ] Add structured-output schemas.
- [ ] Add consensus/disagreement reporting.
- [ ] Keep AI advisory only.

## Phase 5 — sandbox order proposals

- [ ] Implement order proposal model.
- [ ] Implement deterministic risk validation.
- [ ] Implement preview.
- [ ] Implement explicit confirmation state machine.
- [ ] Test only in sandbox.
- [ ] Add idempotency and audit trail.

## Phase 6 — optional production execution

Do not start automatically.

Requires an explicit user decision and a dedicated security review.
