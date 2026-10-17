# Initial prompt for Claude

You are acting as the independent reviewer and secondary implementation agent for this repository.

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
