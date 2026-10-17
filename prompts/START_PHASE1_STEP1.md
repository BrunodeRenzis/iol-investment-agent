Read `AGENTS.md`, `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/ROADMAP.md`, and `docs/DECISIONS.md`. Inspect `git status`.

Implement only **Implementation Plan Step 1 — Phase 1 hardening**.

Scope:

- add local staged-file secret scanning in a developer-friendly way;
- tighten remaining `.gitignore` secret patterns;
- make test discovery explicit;
- make tests fail if zero test files are discovered;
- keep the existing Phase 0 behavior unchanged.

Do not implement IOL, financial primitives, trading, scheduler, AI, MCP, or broker writes yet. Do not commit, push, merge, rebase, reset, or stage files.

Run all relevant checks and end with the repository standard completion sections from `AGENTS.md`.
