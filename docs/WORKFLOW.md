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

Then inspect `git status` and the relevant diff.

## Commit discipline

Agents do not commit by default. They may suggest Conventional Commit messages. The user performs the commit unless a single explicit Git action is authorized for that turn.

## Policy and operational gates

AGENTS.md controls policy and accepted, non-superseded ADRs control architecture. MASTER_PLAN.md is a subordinate operational sequence, not authority to implement another phase. Agents may never silently weaken/change security. Surface unknown IOL behavior, mark it UNKNOWN, and verify official documentation or authorized read-only sandbox behavior before implementation.

Before Phase 9 approval and threat-model review there is no broker-write code, including sandbox, and execution remains absent. Paper trading is internal simulation. Automated tests NEVER call production trading endpoints. Authentication/authorization precedes financial/account endpoints, including localhost. AI has zero protected-capability authority and cannot promote strategies; every promotion to VALIDATED or later is human-authorized and auditable. Deterministic automation may move a strategy to REJECTED when objective rejection criteria fail; this is not promotion and does not bypass the human gates (ADR-017). An AI veto is advisory and cannot block emergency kill switches or risk-reducing user actions under deterministic controls.

Start the minimal collector in Phase 2.5. Before off-machine/24/7 deployment, apply the explicit approval and security gate in ROADMAP.md/ADR-016. This never grants broker writes.

Local staged scanning is manually invoked with `npm run scan:staged` under ADR-015/ADR-018 after the user prepares the index; see README.md for the pinned Gitleaks prerequisite. No hooks are installed or Git hook configuration changed. Preserve the index. `npm test` explicitly discovers compiled `*.test.js` under apps/packages, fails on zero compiled tests, and also runs tooling regression tests. If required validation cannot run, state which check and why; never weaken a check to pass.
