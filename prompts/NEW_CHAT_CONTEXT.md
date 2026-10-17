# Generic context for any new coding-agent chat

The repository is canonical context; do not rely on prior chats. Read in order:

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

AGENTS.md governs policy, accepted non-superseded ADRs govern architecture, and MASTER_PLAN.md is subordinate operational guidance.

Key rules:

- No broker-write code of any kind before explicit Phase 9 approval and threat-model review, including sandbox; execution package remains absent.
- Paper trading is internal simulation, never IOL writes. Automated tests NEVER call production trading endpoints.
- AI has zero risk/execution authority and cannot promote strategies; humans authorize VALIDATED and every later promotion.
- Financial/account endpoints require authentication/authorization before introduction, including localhost.
- No secrets in code/prompts/logs; no silent weakening of the security model.
- No staging, commits, pushes or history changes without explicit authorization.
- Preserve unrelated work and do not overlap agent edits.
- Report required checks that cannot run and why.

Before working, inspect `git status`, state the intended scope, and implement only the user-selected step.
