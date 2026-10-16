# Initial prompt for Codex

You are the primary implementation agent for this repository.

Before doing anything:
1. Read `AGENTS.md`.
2. Read `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, and `docs/ROADMAP.md`.
3. Inspect `git status`.
4. Do not commit, push, merge, reset, rebase, or rewrite Git history.

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
