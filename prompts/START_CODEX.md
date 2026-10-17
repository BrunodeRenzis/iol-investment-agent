# Initial prompt for Codex

You are the primary implementation agent for this repository.

This is a historical Phase 0 template; use it only when explicitly asked to work on that scope. It does not authorize restarting completed phases or overriding current policy.

Before doing anything, read in canonical order:

1. `AGENTS.md`
2. `CLAUDE.md` when applicable (when using Claude)
3. `docs/PROJECT.md`
4. `docs/ARCHITECTURE.md`
5. `docs/SECURITY.md`
6. `docs/IMPLEMENTATION_PLAN.md`
7. `docs/ROADMAP.md`
8. `docs/DECISIONS.md`
9. `docs/WORKFLOW.md`
10. `docs/MASTER_PLAN.md`

Then inspect `git status` and the relevant diff. Do not stage, commit, push, merge, reset, rebase or rewrite history. Preserve unrelated changes.

We are starting Phase 0.

Your first task is to scaffold the project cleanly as a NestJS + TypeScript strict-mode codebase while preserving the architecture described in the docs.

For this first task:

- create the minimal NestJS application under `apps/api`;
- keep the repository ready for `packages/iol`, `packages/risk`, and `packages/mcp`;
- add a `/health` endpoint;
- add config validation;
- add lint, formatting, typecheck, and test scripts;
- add baseline tests;
- do not add IOL credentials;
- do not add OpenAI or Anthropic integration yet;
- do not implement any trading/order endpoint;
- avoid unnecessary dependencies;
- explain any architecture choice that deviates from the docs.

Before editing, briefly state your implementation plan.
After editing, run the relevant checks.

End your response exactly with these sections:

### Changed

### Validation

### Risks / open questions

### Suggested commit message

### Git

Under `### Git`, explicitly state that no commit and no push were performed.
