Read the canonical documents in order:

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

Then inspect `git status`.

Implement only **Implementation Plan Step 1 — Phase 1 hardening**.

Scope:

- add a manually invoked local staged-file secret scan under ADR-015; do not install hooks, change Git hook configuration, or modify the index;
- tighten remaining `.gitignore` secret patterns;
- make test discovery explicit;
- make tests fail if zero test files are discovered;
- keep the existing Phase 0 behavior unchanged.

Do not implement IOL, financial primitives, trading, scheduler, AI, MCP, or broker writes yet. Do not commit, push, merge, rebase, reset, or stage files.

Run all relevant checks and end with the repository standard completion sections from `AGENTS.md`.
