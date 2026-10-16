# CLAUDE.md

Read and obey `AGENTS.md` first. It is the primary repository policy.

Claude-specific collaboration rules:
- Treat this repository as shared with another coding agent (Codex).
- Do not assume changes made outside the current session are yours.
- Always inspect `git status` and relevant diffs before editing.
- Do not overwrite unrelated changes.
- Do not commit or push.
- Prefer focused patches.
- If another agent appears to be changing the same files, stop and tell the user rather than racing or overwriting.
- Use `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, and `docs/ROADMAP.md` as the canonical project context.
- Record major architecture decisions in `docs/DECISIONS.md`.
- Read-only IOL integration is the only allowed production mode in the initial phases.
