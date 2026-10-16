# Generic context for any new coding-agent chat

This repository is a personal IOL investment-assistant project.

The repository itself is the canonical context. Do not rely on prior chats.

Read:
- `AGENTS.md`
- `docs/PROJECT.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/ROADMAP.md`
- `docs/DECISIONS.md`

Key rules:
- read-only IOL first;
- no autonomous trading;
- no real order execution without deterministic checks and explicit human confirmation;
- no secrets in code/prompts/logs;
- no automatic commits or pushes;
- Codex and Claude may collaborate, but must not overwrite each other's unrelated changes.

Before working, inspect `git status` and state what you intend to change.
