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

Canonical reading order:

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

MASTER_PLAN.md is subordinate to AGENTS.md and accepted ADRs. Review all sandbox/production broker-write prohibitions, zero AI authority, human promotion gates, local authentication, immutable data/backtesting evidence, scheduler controls, and deployment gates. Agents must never silently weaken/change the security model. If required validation cannot run, state why.
