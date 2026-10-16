# Codex + Claude workflow

## Recommended default

Use one agent as the implementer and the other as reviewer.

For the initial project:
- **Codex: primary implementer**
- **Claude: independent reviewer**

This is not because one model is universally better. It prevents both agents from making overlapping edits and gives the project a repeatable review loop.

## Loop

1. Give Codex one scoped implementation task.
2. Codex edits and runs checks.
3. Do not commit yet.
4. Give Claude the diff/repo and ask for review only.
5. Review findings.
6. Ask Codex (or Claude, explicitly) to fix selected findings.
7. Run checks again.
8. User reviews `git diff`.
9. User commits manually.

## Parallel work

Only after the repo is stable.

If parallelizing:
- use different branches/worktrees;
- assign non-overlapping modules;
- never have both agents editing the same file set concurrently.

Example:
- worktree A: `feature/iol-auth`
- worktree B: `feature/risk-engine`

## Who should do what?

Codex is a good default for:
- repo-aware implementation,
- test-driven changes,
- targeted refactors,
- code review/fixes.

Claude is useful for:
- independent architecture review,
- long-context consistency checks,
- adversarial security review,
- alternative implementation proposals.

Swap roles whenever useful, but always state the role in the prompt.
