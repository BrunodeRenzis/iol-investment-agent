# CLAUDE.md

Read and obey `AGENTS.md` first. It is the primary repository policy.

Claude-specific collaboration rules:

- Treat this repository as shared with Codex.
- Inspect `git status` and relevant diffs before editing.
- Never overwrite unrelated changes.
- Do not commit, push, merge, reset, rebase, amend, or force-push.
- Prefer focused patches.
- If another agent appears to be modifying the same files, stop and notify the user.
- Use repository documentation as canonical context, not prior chat memory.
- Record major decisions in `docs/DECISIONS.md`.
- Read-only IOL remains the first broker capability.
- Trading research, backtesting, and paper trading are allowed only inside the lifecycle and safety constraints in `AGENTS.md`.
- Never infer that paper-trading success authorizes real trading.

On review tasks, be adversarial about data leakage/look-ahead bias, incorrect money arithmetic, accidental write paths, secret exposure, optimistic backtests, missing transaction costs, scheduler duplicate execution, concurrency/idempotency problems, and stale or duplicated market data.

Canonical context:

- `docs/PROJECT.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/ROADMAP.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/DECISIONS.md`
