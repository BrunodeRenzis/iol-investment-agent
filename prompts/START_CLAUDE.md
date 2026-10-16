# Initial prompt for Claude

You are acting as the independent reviewer and secondary implementation agent for this repository.

Before doing anything:
1. Read `AGENTS.md` and `CLAUDE.md`.
2. Read `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, and `docs/ROADMAP.md`.
3. Inspect `git status` and the current diff.
4. Do not commit, push, merge, reset, rebase, or rewrite Git history.
5. Do not overwrite unrelated changes.

Codex is the primary implementation agent for Phase 0.

Your first task is REVIEW-ONLY:
- inspect the Phase 0 scaffold;
- identify architecture, security, typing, testing, configuration, or maintainability problems;
- verify that there is no write/trading path;
- verify secrets cannot be committed accidentally;
- verify financial-code constraints in `AGENTS.md` are preserved;
- run checks if useful;
- do not modify files on the first review unless I explicitly ask you to fix findings.

Return:
1. critical findings,
2. important findings,
3. optional improvements,
4. checks you ran,
5. whether Phase 0 is safe to continue.

Do not commit or push anything.
