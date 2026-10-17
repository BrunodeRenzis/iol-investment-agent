# IOL Investment Agent

A secure, auditable personal investment platform integrating IOL data with systematic trading research, paper trading, deterministic risk controls, MCP, and advisory AI agents such as Codex/ChatGPT and Claude.

## Status

**Phase 0 complete: secure local backend foundation.**

Phase 1 Step 1 adds repository hardening only: manual staged secret scanning,
targeted secret ignores, and explicit test discovery. Later steps remain pending.

Documentation v2.1 is adopted as canonical after independent review. Operational plans remain subordinate to `AGENTS.md` for policy and accepted, non-superseded ADRs in `docs/DECISIONS.md` for architecture. Future implementation begins only with a user-selected step in financial foundations and **read-only IOL integration**.

Before Phase 9 is explicitly approved, **NO broker-write code may exist**, including sandbox and production. `packages/execution` remains **ABSENT**. Paper trading is entirely internal simulation with no broker writes.

## Product direction

```text
OBSERVE
market data / portfolio snapshots / scheduled collection
    ↓
RESEARCH
indicators / strategies / signals / backtesting / paper trading / AI review
    ↓
EXECUTE
risk checks / preview / explicit human approval / broker execution
```

Observation and research may be autonomous within an approved phase. Paper simulation may run autonomously only within an approved phase and for a human-approved strategy state. Research/paper code never calls broker write endpoints of any kind. Real-money execution may not be autonomous.

## Safety model

> Observation may be autonomous within an approved phase. Research may be autonomous within an approved phase. Paper trading may run autonomously only for a human-approved strategy state within an approved phase. Real-money execution may not be autonomous.

AI may only advise, critique, explain, or veto/escalate recommendations. It has NO authority over account/execution permissions, hard portfolio/risk limits, position sizing constraints, order validity, confirmation, or real-money execution. Only deterministic code and explicit human authorization control those capabilities. An AI veto is advisory and must never block the emergency kill switch or risk-reducing user actions under deterministic controls.

Financial/account endpoints require authentication and authorization before introduction, even on localhost. Never put ANY secret in an LLM prompt. Automated tests must NEVER call production trading endpoints. Each broker-write phase requires explicit user approval and threat-model review.

See `AGENTS.md` and `docs/SECURITY.md`.

## Local setup

```bash
npm ci
npm run build
npm start
```

`GET http://127.0.0.1:3000/health` returns the Phase 0 liveness response. No broker credentials are required for Phase 0.

## Development checks

```bash
npm run format
npm run check
npm run audit:dependencies
```

CI runs repository checks and Gitleaks scanning.

`npm test` removes stale `.test-dist`, compiles tests, and explicitly passes only
`apps/**/*.test.js` and `packages/**/*.test.js` from that output to Node's runner.
Zero compiled tests is an error. Helper JavaScript files are not test entry points.
Separate tooling tests also run; they cannot mask an empty application suite.

### Manual staged secret scan

Install [Gitleaks 8.30.1](https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1)
manually and verify the archive against the release's SHA-256 checksums. This
matches CI. Make the executable available on PATH or set `GITLEAKS_PATH` to its
absolute path; no installer or hook runs during `npm ci`.

```bash
npm run scan:staged
```

For a portable executable on Windows, set the path in the current PowerShell session:

```powershell
$env:GITLEAKS_PATH = 'C:\tools\gitleaks\gitleaks.exe'
npm run scan:staged
```

Run this explicitly after preparing your own staged changes and before committing.
It uses [Gitleaks staged-diff scanning](https://github.com/gitleaks/gitleaks/blob/v8.30.1/cmd/git.go)
with fully redacted findings. It scans staged additions, not unstaged/untracked
content or unchanged historical content; CI retains full-history scanning. An
empty staged diff reports no findings. Missing/wrong-version Gitleaks, scan errors,
and detected secrets return nonzero. The command never stages/unstages files,
installs hooks, changes Git configuration, or downloads software. Scanner detection
is best-effort; ignored filenames and a clean scan do not prove absence of secrets.

## Intended workspace boundaries

```text
apps/
  api/              HTTP composition root

packages/
  iol/              IOL transport/auth/read-only adapters
  market-data/      normalized quotes/bars/observations
  portfolio/        balances, positions, snapshots, P&L
  risk/             deterministic limits and exposure rules
  trading/          indicators, strategies, signals, backtests, paper trading
  scheduler/        scheduled observation/research jobs
  ai/               provider-neutral AI advisory layer
  mcp/              narrow read-only MCP tools
  execution/        ABSENT before explicitly approved Phase 9
```

Not every package exists yet. They are introduced incrementally by the roadmap.

## Strategy lifecycle

```text
IDEA
  ↓
SPECIFIED
  ↓
BACKTESTED
  ↓
VALIDATION_PENDING
  ↓
VALIDATED
  ↓
PAPER_TRADING
  ↓
REVIEW_PENDING
  ↓
REVIEWED
  ↓
ELIGIBLE_FOR_HUMAN_APPROVAL
```

Additional states: `REJECTED`, `SUSPENDED`, `RETIRED`. Autonomous research may reach BACKTESTED / VALIDATION_PENDING. A HUMAN promotes to VALIDATED and authorizes every subsequent promotion. Agents only recommend promotion. Deterministic automation may move a strategy to REJECTED when objective rejection criteria fail; rejection does not bypass any human promotion gate. Every transition is auditable and strategy edits create new versions. Eligibility never grants execution permission.

## Operational sequence

1. Phase 1: repository hardening without local hooks, decimal primitives, verified read-only IOL contracts and authenticated financial endpoints.
2. Phase 2: verify data-use terms, secure persistence and portfolio intelligence.
3. Phase 2.5: minimal scheduled read-only collection to accumulate forward data.
4. Phases 3–4: governed research and reproducible, bias-aware backtesting.
5. Phase 5: human-approved internal paper simulation.
6. Phase 6: mature scheduler/autonomous research within approved states.
7. Deployment gate: explicit approval and security review before off-machine/24/7 operation, whenever proposed; no broker-write permissions granted.
8. Phases 7–8: narrow read-only MCP and zero-authority AI advice.
9. Phase 9: separately approved and threat-modeled sandbox execution.
10. Phase 10: optional production execution under a separate approval and threat-model review.

Use `docs/MASTER_PLAN.md` for the high-level operational sequence, subordinate to `AGENTS.md` for policy and accepted ADRs in `docs/DECISIONS.md` for architecture. `ROADMAP.md` defines phases/gates and `IMPLEMENTATION_PLAN.md` the corresponding detailed steps.

## Documentation

Read in this order:

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

## Agent workflow

Codex and Claude may collaborate on the repository, but they should not modify the same files simultaneously unless explicitly coordinated.

The default workflow is: one agent implements, the other reviews, the user chooses which findings to accept, and the user commits.

Neither agent may commit, push, merge, or execute real-money operations by default.
