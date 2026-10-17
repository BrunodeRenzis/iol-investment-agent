# Codex + Claude workflow

## Default roles

- **Codex:** primary implementation agent
- **Claude:** independent reviewer/adversarial checker

Roles may be swapped per task. The purpose is to prevent overlapping edits and create a repeatable review loop.

## Standard loop

1. User selects one implementation step.
2. Codex reads canonical docs and implements only that scope.
3. Codex runs checks.
4. No commit is made.
5. Claude reviews the diff and relevant tests.
6. User chooses findings to accept.
7. Codex or Claude applies targeted fixes.
8. Checks run again.
9. User reviews `git diff`.
10. User commits manually.

## Review specialization

Ask Claude to be particularly adversarial for security changes, authentication, broker integration, financial arithmetic, backtesting correctness, look-ahead/data leakage, scheduler concurrency, idempotency, and future order flows.

Ask Codex to be particularly explicit about changed files, tests, architectural deviations, migration effects, and public interfaces.

## Parallel work

Do not parallelize until boundaries are stable. When useful, use different branches/worktrees and assign non-overlapping packages. Never have both agents modify the same files concurrently.

## Repository context

New agent sessions should read `AGENTS.md`, `CLAUDE.md` when using Claude, `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/ROADMAP.md`, and `docs/DECISIONS.md`.

## Commit discipline

Agents do not commit by default. They may suggest Conventional Commit messages. The user performs the commit unless a single explicit Git action is authorized for that turn.
