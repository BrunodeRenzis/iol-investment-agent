# Architecture

## High-level model

```text
External data (IOL / future feeds)
          ↓
market-data normalization + ingestion
          ↓
portfolio snapshots + persistent observations
          ↓
trading research
(indicators / strategies / signals / backtesting / paper trading)
          ↓
     ┌────┴────┐
     ↓         ↓
 deterministic AI advisory
 risk          review
     └────┬────┘
          ↓
recommendation / research output

FUTURE, SEPARATE PATH, ONLY AFTER PHASE 9 APPROVAL:
human-approved proposal -> risk validation -> preview -> explicit confirmation -> sandbox execution
Production requires a separate Phase 10 approval.
```

## Architectural style

Use a modular monolith until measured requirements justify separation. Avoid microservices in early phases.

The package/domain layout below is INTENDED and introduced incrementally by the roadmap; it does not imply all packages exist. Before Phase 9 is explicitly approved, NO broker-write code may exist, including sandbox and production. Research and paper trading never call broker write endpoints of any kind.

## Intended repository layout

```text
apps/
  api/
    src/modules/
      health/
      auth/
      portfolio/
      market/
      research/

packages/
  iol/
  market-data/
  portfolio/
  risk/
  trading/
    indicators/
    strategies/
    signals/
    backtesting/
    paper-trading/
    evaluation/
  scheduler/
  ai/
    contracts/
    openai/
    anthropic/
    committee/
  mcp/
  execution/   # ABSENT until explicitly approved Phase 9; sandbox-only then
```

## Domain boundaries

### IOL adapter

Owns authentication/token lifecycle, safe HTTP transport, typed provider schemas, error mapping, rate limits, and read-only operations. It contains no strategy/AI logic and no write methods before Phase 9 approval. Never invent undocumented IOL behavior: mark unknowns UNKNOWN and verify against official documentation or authorized read-only sandbox interaction before implementation. Financial/account endpoints require authentication and authorization before introduction, even on localhost; authorization fails closed.

Separate broker read/write permissions/scopes whenever supported; Step 3 verifies whether IOL offers true read-only credentials/scopes. A token without verified true read-only scopes is write-capable regardless of the adapter's interface. Isolate it strictly inside `packages/iol`, expose only a fixed allowlist of verified read-only endpoint paths, and enforce it with automated tests. No other package, scheduler, AI, MCP, trading research, or generic HTTP client may receive direct broker credentials/tokens. Future write credentials remain separate from read credentials whenever possible.

### Market data

Owns append-only raw observations, versioned corrected/normalized datasets, immutable backtest dataset references, and provenance. Preserve source/provider, exchange, ingestion, and information-availability timestamps. Historical decisions use information available at the decision time. Define staleness per instrument/data class; never silently manufacture/backfill missing real-time observations. Later historical imports are distinct/versioned. Instrument identity includes ticker/security, market, currency, settlement, and security/CEDEAR/bond identity; AL30, AL30D, and AL30C are not interchangeable.

### Portfolio

Owns balances, positions, normalized cost basis where available, snapshots, P&L representation, and asset/issuer/currency metadata.

### Risk

Deterministic code owns concentration, exposure, position constraints, future proposal validity, drawdown/portfolio controls, and enforceable risk rejection. AI has NO risk authority. Business/risk rules must be testable without network access.

### Trading research

Owns indicators, versioned strategies, signals, reproducible backtests, internal paper simulation, and outcome evaluation. It must never call broker write endpoints of any kind, including sandbox. Paper fills are internal records, never IOL writes. Enforce the human-controlled lifecycle in AGENTS.md and ADR-012, auditing every transition; agents only recommend promotions. Deterministic automation may reject strategies when objective rejection criteria fail, but cannot promote beyond BACKTESTED / VALIDATION_PENDING; humans authorize VALIDATED and every later promotion. Apply all safeguards in AGENTS.md section 13 and ADR-013, including prospective AI/news/LLM feature evaluation by default, full instrument identity and return basis, corporate-action/fixed-income adjustments, mandatory local/BYMA spread/slippage, market/liquidity/settlement realism, survivorship protection, protected holdouts, and retention of every backtest/parameter search including failures.

### Scheduler

Phase 2.5 introduces minimal read-only collection soon after persistence; Phase 6 matures research orchestration. Idempotency key = job type + scope/instrument + scheduled time slot, or documented equivalent. Use unique database constraints where appropriate, overlap locks/single-runner protection, and atomic deduplication so duplicate signals cannot produce duplicate paper trades. Record missed runs and observable failures; real-time gaps are not reconstructed snapshots. Provide timeouts, safe retries, rate limits, scheduler kill switch, and AI-call cost/token budgets before model jobs.

### AI

Owns provider-neutral advisory contracts, model adapters, validated structured opinions, and disagreement reports. NEVER put ANY secret in an LLM prompt; minimize/redact account identifiers and sensitive personal financial identifiers where possible. AI may only advise, critique, explain, or veto/escalate recommendations. It has NO authority over account/execution permissions, hard portfolio/risk limits, position sizing constraints, order validity, confirmation, or real-money execution; only deterministic code and explicit human authorization control these. An advisory AI veto must never block the emergency kill switch or risk-reducing user actions under deterministic controls.

### MCP

Expose narrow purpose-built tools such as `get_portfolio`, `get_balances`, `get_quote`, `get_exposure_summary`, `get_recent_signals`, and `get_strategy_performance`. Do not expose a generic IOL proxy, arbitrary HTTP/SQL, or shell access.

### Execution

The package remains ABSENT until explicitly approved Phase 9 and a completed threat-model review. Only sandbox execution may then be introduced; production requires separate Phase 10 approval and review. Research signals and deployment do not imply execution authority. A future path is `proposeOrder -> validateOrder -> applyRiskRules -> previewOrder -> explicitUserConfirmation -> verifyExactMatchAndExpiry -> executeConfirmedOrder -> audit`.

## Data precision

Before financial normalization, record an ADR choosing a decimal-safe arithmetic strategy. Define explicit concepts such as `Money`, `Currency`, `Price`, `Quantity`, `NominalValue`, `Percentage`, and `FxRate`. Do not use binary floating-point for critical financial arithmetic.

## Data persistence

Persistence should support portfolio snapshots, market observations, strategy definitions/versions, generated signals, backtest runs, paper trades, evaluation outcomes, and future audit events.

Every research result references an immutable dataset version, strategy/code version, information-availability timestamps, run parameters, complete instrument identity, and explicit return basis/currency with compatible benchmarks. Persist every backtest, including failed/discarded variants and parameter searches; protect holdout data from repeated optimization.

Before market-data storage/retention/redistribution, verify current IOL/provider terms and record permitted uses. Persistence requires least privilege, access controls, encryption at rest where supported, secure backups/recovery, retention rules, and data minimization. Append-only/versioned provenance follows the explicit retention policy; required deletions are audited, not disguised as revised evidence.

## Scheduler evolution

Phase 2.5 local collector: in-process schedule -> idempotent read-only job handler -> database, after persistence and before long prospective paper research.

Production 24/7 phase: scheduler -> durable queue -> workers -> database.

Add durable queueing only when operational requirements justify it. Before moving broker credentials or financial data off-machine or enabling 24/7 deployment, require explicit user approval, threat-model review, credential/secrets plan, database security, backup/recovery, network exposure review, and monitoring. This deployment gate applies whenever hosting is proposed and never grants broker-write permissions.

## Observability

Use structured logs, correlation IDs, safe provider error mapping, metrics for request latency/failures, job-run metadata, signal/backtest run IDs, and future immutable audit events. Never log secrets or complete IOL responses that may contain sensitive account data. Do not persist full AI prompts/responses with sensitive portfolio data unless the requirement is explicitly approved by the user and the data is protected.

## AI investment committee concept

The committee is advisory, not authoritative. Systematic signal + deterministic risk analysis + independent OpenAI and Claude opinions produce an agreement/disagreement report for the user. Preserve disagreement rather than forcing false consensus. Record AI opinions separately from actual strategy performance.

## Boundary validation

Reject unexpected fields in sensitive schemas where practical; apply OAuth state/PKCE and CSRF where applicable. Keep dependency versions pinned/locked, review major upgrades, and retain vulnerability scanning. Automated tests must NEVER call production trading endpoints. Agents must never silently weaken/change security; if required checks cannot run, state why.
