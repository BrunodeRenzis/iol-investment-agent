# Contributing

This repository may be edited by the user, Codex, and Claude.

## Before editing

1. Read `AGENTS.md`.
2. Read relevant docs.
3. Run `git status`.
4. Do not overwrite unrelated working-tree changes.
5. Keep tasks focused.

## Branches

Recommended:
- `feature/<short-name>`
- `fix/<short-name>`
- `refactor/<short-name>`
- `docs/<short-name>`

Agents must not create or switch branches unless the user asks or the current workflow explicitly requires it.

## Commits

Agents do not commit by default.

At task completion, provide a suggested Conventional Commit message:
- `feat(scope): ...`
- `fix(scope): ...`
- `refactor(scope): ...`
- `test(scope): ...`
- `docs(scope): ...`
- `chore(scope): ...`

The user performs the commit.

## Pull requests

Before proposing a merge:
- lint passes,
- typecheck passes,
- tests pass,
- security-sensitive changes are called out,
- no secrets are present,
- scope is coherent.

## Multi-agent coordination

Do not have Codex and Claude modify the same files concurrently.

Preferred workflow:
1. Agent A implements.
2. User saves/checks changes.
3. Agent B reviews the diff and tests.
4. Agent A or B applies targeted corrections.
5. User commits.

For true parallel work, use separate Git worktrees or branches with non-overlapping scopes.
