# IOL Investment Agent — Master Implementation Plan

_Last updated: 2026-10-17_

## Authority and current status

This is the high-level operational sequence, subordinate to `AGENTS.md` for policy and accepted, non-superseded ADRs in `docs/DECISIONS.md` for architecture. `ROADMAP.md` defines phase scope/gates; `IMPLEMENTATION_PLAN.md` provides corresponding detailed steps. A plan is never permission to start another phase.

- Phase 0: complete.
- Documentation v2.1: adopted as canonical after independent review and user acceptance; operational plans remain subordinate to AGENTS.md and accepted ADRs.
- App remains read-only, with no broker-write code, execution package, MCP or AI runtime.
- Phase 1 Step 1: repository hardening implemented; later steps remain pending. No financial capability, dependencies, packages, hooks or deployment added by Step 1.

## Documentation v2.1 canonical adoption

Documentation v2.1 is adopted as canonical after independent review. The final clarifications requested by the user are incorporated; the documentation-review and user-acceptance gates are complete. This status grants no permission to begin another phase.

AGENTS.md remains the policy authority, accepted non-superseded ADRs remain the architectural authority, and this master plan remains subordinate operational guidance. Future changes still follow review and validation; commits/pushes remain user-controlled, and hosted CI must remain green.

The former ADR appendix is fully merged and removed. DECISIONS.md is the only decision log.

## Global safety boundaries

Before Phase 9 is explicitly approved and its threat model reviewed, NO broker-write code may exist, sandbox or production, and `packages/execution` remains ABSENT. Research/paper code never calls broker write endpoints of any kind. Paper trading is internal simulation with no IOL writes or sandbox orders. Automated tests must NEVER call production trading endpoints.

AI has NO authority over account/execution permissions, hard portfolio/risk limits, position sizing constraints, order validity, confirmation or real-money execution. It may only advise, critique, explain, or veto/escalate recommendations. Its veto is advisory and never blocks the emergency kill switch or risk-reducing user actions under deterministic controls. Only deterministic code and explicit human authorization control protected capabilities.

Authentication/authorization must exist BEFORE any financial/account endpoint, even on localhost. Never put ANY secret in model prompts; minimize/redact sensitive identifiers. Never invent IOL behavior; mark unknowns UNKNOWN and verify official documentation or authorized read-only sandbox behavior before implementation.

## Phase 1 — Financial foundations + IOL read-only

### Steps 1–2: Repository hardening and decimal-safe primitives

Add a manually invoked staged-file secret scan without installing hooks or changing Git hook configuration (ADR-015), tighten ignored secret patterns, make discovery explicit and fail on zero tests. Resolve ADR-009 and test Currency, Money, Price, Quantity, NominalValue, Percentage and FxRate with explicit rounding.

Step 1 is implemented by `npm run scan:staged`, targeted ignore patterns and the
explicit compiled-test runner (ADR-018). Gitleaks setup is manual; see README.md.
Step 2 and financial primitives are still pending separate scope approval.

### Steps 3–4: Verify contract, then implement read-only adapter

Step 3 explicitly verifies whether IOL offers true read-only credentials/scopes, alongside official auth/token lifecycle, endpoints, rate limits and sandbox behavior. Separate read/write permissions/scopes whenever supported; future write credentials must be separate whenever possible. If read-only scope capability is unavailable or unverified, treat the token as write-capable even with a read-only adapter. Step 4 isolates it strictly inside `packages/iol`, permits only a fixed allowlist of verified read-only endpoint paths, and adds automated allowlist enforcement tests. No other package, scheduler, AI, MCP, trading research, or generic HTTP client may obtain direct broker credentials. Check IOL terms for storage, historical retention and redistribution before persistence/redistribution. Then implement typed read-only schemas, safe transport/auth, timeouts, sanitized errors and mocks/fixtures. No write methods.

### Step 5: Authentication + portfolio normalization

Authenticate and authorize financial/account endpoints before introduction, including localhost. Fail closed; validate sensitive fields, OAuth state/PKCE and CSRF where applicable. Normalize balances/positions and supported cost/P&L.

## Phase 2 — Persistence + portfolio intelligence

### Steps 6–7: Market-data domain and secured PostgreSQL

Identify ticker/security, market, currency, settlement and CEDEAR/bond identity. AL30, AL30D and AL30C are not interchangeable. Verify permitted data uses first.

Preserve append-only raw observations, corrected/normalized dataset versions, immutable backtest references, source/exchange/ingestion/information-availability timestamps, per-class staleness and explicit gaps. Never silently backfill real-time observations. Apply least privilege, encryption at rest where supported, access controls, backups/recovery, retention and minimization.

### Step 8: Deterministic risk engine

Implement allocation/exposure/concentration and hard constraints without AI authority, using offline tests and authenticated reporting.

## Phase 2.5 — Minimal market-data collector

### Step 9: Accumulate real forward data early

Begin soon after persistence and BEFORE long prospective paper research. Schedule manually verified read-only collection. Key each job by job type + scope/instrument + scheduled time slot, or documented equivalent. Use unique constraints where appropriate, overlap locks/single-runner protection, rate limits, bounded timeouts/retries, observable failures, missed-run records and a scheduler kill switch. Missed observations remain gaps.

## Phase 3 — Trading research core

### Steps 10–12: Contracts, first explainable strategy, signal history

Introduce intended trading contracts incrementally. Use explicit measurable indicators and persist every signal/version/outcome, including losing or rejected signals.

The lifecycle is:

`IDEA -> SPECIFIED -> BACKTESTED -> VALIDATION_PENDING -> VALIDATED -> PAPER_TRADING -> REVIEW_PENDING -> REVIEWED -> ELIGIBLE_FOR_HUMAN_APPROVAL`

Additional states: `REJECTED`, `SUSPENDED`, `RETIRED`. Autonomous research may reach BACKTESTED / VALIDATION_PENDING; a HUMAN promotes to VALIDATED and authorizes EVERY later promotion. Agents only recommend. Audit every transition; strategy edits create new versions without inherited approval. Deterministic automation MAY move a strategy to REJECTED when objective rejection criteria fail, recording the criteria/evidence. This is not a promotion: automation may NOT promote beyond BACKTESTED / VALIDATION_PENDING; VALIDATED and every later promotion still require human approval. Use ADR-012 as clarified by ADR-017 for rejection, suspension, retirement and human resumption.

## Phase 4 — Backtesting

### Step 13: Reproducible engine and safeguards

Apply AGENTS.md section 13 and ADR-013 in full:

- Immutable dataset versions and information-availability timestamps; no look-ahead.
- Historical LLM-generated features forbidden unless exact historical model/data are reproducible without future knowledge. Default AI/news/LLM-derived evaluation is prospective forward/paper testing.
- Full instrument/market/currency/settlement/security identity.
- Explicit return basis/currency: ARS nominal, USD MEP, USD CCL or real/inflation-adjusted; compatible benchmarks.
- Dividends, splits, CEDEAR ratio changes, bond coupons, amortizations, accrued interest where relevant and adjusted/unadjusted series.
- Bid/ask, spreads, slippage, liquidity/volume, settlement, market hours, halts/suspensions and commissions/taxes where applicable. Spread/slippage handling is mandatory for local/BYMA instruments.
- Survivorship-bias controls and coverage/delisting limitations.
- Protected holdout/out-of-sample evaluation and recorded parameter searches.
- EVERY backtest preserved, including discarded/failed variants; never erase failed experiments.

### Step 14: Human validation

Present evidence for human promotion to VALIDATED, then separately human-authorized PAPER_TRADING. Agents cannot promote; later review promotions also require human authorization.

## Phase 5 — Paper trading

### Step 15: Internal simulation only

After human promotion, simulate fills internally with fresh data and explicit bid/ask/spread/slippage/liquidity/fees/settlement assumptions. No broker writes, including sandbox. Duplicate signals cannot create duplicate paper trades. Record explicit return basis and label simulated results.

## Phase 6 — Mature scheduler / autonomous research

### Step 16: Extend the early collector

Schedule approved research/simulation tasks with natural keys, unique constraints, overlap protection, missed-run/failure records, gap integrity, timeouts/retries and kill switch. Define AI-call cost/token budgets before scheduled model calls in their approved phase. Justify durable queue/workers for dependable operation.

## Deployment gate — before off-machine / 24/7 operation

### Step 17: Explicit security-boundary approval

Before broker credentials or financial data leave the local machine, require explicit user approval, threat-model review, credential/secrets plan, database security, backup/recovery, network exposure review and monitoring. Apply this gate earlier if hosting is proposed earlier. Deployment does NOT grant broker-write permissions.

## Phase 7 — Read-only MCP

### Step 18: Narrow authenticated tools

Expose scoped portfolio/balance/quote/risk/signal/performance tools. No arbitrary HTTP/SQL/shell, no secrets in model context, and safe audit metadata.

## Phase 8 — AI advisory committee

### Steps 19–20: Provider-neutral advice and independent review

Use OpenAI/Anthropic behind advisory contracts with validated outputs, independent opinions, preserved disagreements and cost/token budgets. AI has no protected-capability authority. Store only necessary safe artifacts; do not persist full sensitive prompts/responses unless the requirement is explicitly approved by the user and the data is protected. Measure advice prospectively and separately from strategy performance.

## Phase 9 — Sandbox execution

### Step 21: Approved sandbox-only capability

Explicit user approval AND threat-model review are required before any broker-write code or execution package exists. Implement deterministic validation/risk, preview, explicit human confirmation, expiry/exact binding, fail-closed authorization, idempotency, audit and emergency kill switch. Research/paper modules remain unable to write to brokers. Automated tests NEVER call production trading endpoints.

## Phase 10 — Optional production execution

### Step 22: Separate governance decision

Require separate explicit approval and threat-model review, isolated credentials, tested kill switch, runbook, monitoring and accepted sandbox evidence. Eligibility, deployment and model recommendations do not grant execution authority. No autonomous real-money execution.

## Standard collaboration loop

User selects one scoped step; Codex implements and validates; Claude independently reviews; user chooses findings; targeted corrections are validated; user reviews the diff and commits/pushes manually. Never overlap edits or silently change the security model.

## New-session bootstrap

Read in order:

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
