Read the canonical documents in order:

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

Inspect `git status` before editing. This task is documentation-only.

Apply only the supplied, user-approved documentation changes:

1. Preserve unrelated local edits and existing ADR decision text.
2. Append material decisions directly to `docs/DECISIONS.md` with unique identifiers and explicit supersession; do not recreate an ADR import appendix.
3. Keep canonical reading lists and roadmap/implementation/master-plan ordering consistent.
4. MASTER_PLAN.md is subordinate to AGENTS.md for policy and accepted ADRs for architecture.
5. Do not modify application code, dependencies, or create packages, trading code, or broker writes.
6. Do not stage, commit, push, merge, rebase or reset.
7. Run Markdown formatting/document checks and `npm run check`; state why any required validation cannot run.
8. Show the final documentation diff summary.

Return the requested completion format, or the standard AGENTS.md format if none was specified, and explicitly state no commit or push was performed.
