# Decisions to append to docs/DECISIONS.md

These supplied ADRs have been appended to `docs/DECISIONS.md`, preserving all
existing Phase 0 ADRs. Their original identifiers ADR-002 through ADR-007 were
renumbered to ADR-004 through ADR-009 to avoid collisions. The headings below use
the final identifiers; do not append them again if already present in the log.

## ADR-004 — Observation/research autonomy is separate from execution authority

**Status:** Accepted

**Date:** 2026-10-16

### Context

The platform should collect data and evaluate strategies unattended without granting authority to move real money.

### Decision

Observation, analysis, backtesting, signal generation, and paper trading may eventually run autonomously. Real-money execution requires a separate capability boundary and explicit human confirmation.

### Consequences

Schedulers and AI agents cannot gain broker write authority merely because they generate recommendations.

## ADR-005 — Strategies use a governed lifecycle

**Status:** Accepted

**Date:** 2026-10-16

### Context

LLMs can produce persuasive investment explanations that are not supported by measured results.

### Decision

Every strategy follows `IDEA -> SPECIFIED -> BACKTESTED -> VALIDATED -> PAPER_TRADING -> REVIEWED -> ELIGIBLE_FOR_HUMAN_APPROVAL`. Strategy modifications produce a new version.

### Consequences

Signals/results become traceable, losing outcomes are preserved, and no strategy is promoted solely because an AI model expresses high confidence.

## ADR-006 — AI is advisory, not the deterministic trading engine

**Status:** Accepted

**Date:** 2026-10-16

### Decision

Deterministic code owns portfolio limits, money arithmetic, specified strategy rules, and execution guards. OpenAI and Anthropic operate behind a provider-neutral advisory interface.

## ADR-007 — Start with simple explainable strategies

**Status:** Accepted

**Date:** 2026-10-16

### Decision

Initial strategies use explicit, testable inputs such as returns, moving averages, RSI, volatility, and volume features. The first objective is correctness/reproducibility/evaluation, not maximum historical return.

## ADR-008 — Scheduler starts simple and becomes durable only when justified

**Status:** Accepted

**Date:** 2026-10-16

### Decision

Use a simple in-process scheduler during local research if sufficient. Introduce durable queue/worker infrastructure before dependable 24/7 operation when requirements justify it.

## ADR-009 — Financial calculations require decimal-safe arithmetic

**Status:** Proposed

**Date:** 2026-10-16

### Decision

Select a maintained decimal-safe TypeScript library before financial normalization begins. Phase 1 must compare alternatives, choose one, document rounding rules, and add tests.
