# Architecture Decision Record Index

Use this file for important project decisions.

Format:

## ADR-XXX — Title

**Status:** Proposed | Accepted | Rejected | Superseded  
**Date:** YYYY-MM-DD

### Context

Why the decision is needed.

### Decision

What was chosen.

### Consequences

Benefits, tradeoffs, risks.

---

## ADR-001 — Modular monolith first

**Status:** Accepted

### Context

The project is initially a single-user personal investment assistant.

### Decision

Use a modular monolith in NestJS instead of microservices.

### Consequences

Lower operational complexity, easier local development, easier auditing, and sufficient separation through modules/packages.

## ADR-002 — Minimal Phase 0 workspace and local boundary

**Status:** Accepted
**Date:** 2026-10-16

### Context

The first implementation needs a runnable NestJS application and independently
reserved integration/domain boundaries without implementing later phases.

### Decision

Use npm workspaces with a single lockfile, NestJS 11 with its Express adapter,
strict TypeScript compiled with `tsc`, ESLint, and Prettier. Pin direct dependencies
and generate a lockfile during the initial install to lock transitive dependencies.
Keep the compatible NestJS 11 major explicit;
future major upgrades require review. Node.js 22.16+ (22.x) or 24.x is the runtime
baseline. Use Nest's built-in JSON ConsoleLogger rather than adding a logging
library. Use Node's test runner, assertions, and fetch instead of Jest/Supertest.

Use Node's environment-file loader and a small pure configuration validator
provided through an explicit Nest injection token. This avoids config/schema
dependencies for four scalar settings. Invalid configuration fails before the
HTTP listener is opened. Read-only mode cannot be disabled through configuration.

Bind only to IPv4 loopback in Phase 0 and expose public liveness with no financial
data. Use Nest's throttler guard (60 requests per minute per client IP), bounded
HTTP timeouts, and generated correlation IDs with allowlisted request log fields.
Do not parse request bodies yet: there are no body-accepting endpoints. Introduce
authentication, authorization, and DTO validation before data endpoints or any
change to this local-only boundary. In-memory rate limits suit this single-process
phase; they are not a distributed limit.

### Consequences

This preserves the documented modular monolith and package responsibilities.
There are no architectural deviations. Future portfolio, market, and auth modules
are deferred rather than scaffolded with empty services. Package placeholders
have no public runtime exports until a later phase defines their contracts and
builds. There is no database, broker, AI, or MCP runtime dependency.

Build with `npm run build` before `npm start`; no Nest CLI or live-reload dependency
is needed. Baseline tests compile separately and exercise the same application
factory as production. CI scans the locked dependencies. Existing agent policy
documents and prompt templates are excluded from automatic formatting to avoid
unrelated changes.

The supplied directory has no Git metadata. Git initialization requires explicit
user approval; no history or repository state is created by this task.

## ADR-003 — Repository root and Phase 0 validation

**Status:** Accepted
**Date:** 2026-10-16

### Decision

Flatten the two starter wrapper directories into the existing workspace root,
`C:\Users\Bruno\Desktop\iol-investment-agent`. Preserve local `.claude` settings
and ignore `settings.local.json`. Verify moves by hashing file contents and remove
only empty wrappers. Any future `git init` must run at this workspace root and
requires separate user approval.

Retain the existing dependency majors and generate the npm lockfile. Tests clean
their generated output before compilation and use Node's recursive discovery in
that output directory, including future package tests. Top-level test registration
promises are explicitly marked `void`: the Node test runner owns their lifecycle
and reports failures. Async assertions and cleanup within tests remain awaited.

CI uses `npm ci`, bounded job durations, and one suite per trigger. Push checks
are limited to `main`/`master` to avoid repeating feature-branch PR checks. A
version-pinned Gitleaks CLI, verified against its release checksums, scans the
full fetched history with redacted output. It installs only into the CI runner's
temporary directory, with no local hooks or additional account license required.
See the [Gitleaks CLI documentation](https://github.com/gitleaks/gitleaks).

### Consequences

Source and CI paths now resolve directly from the workspace root. IDE tabs that
point to the old nested paths must be reopened. Git initialization remains a
separate approval step. Phase 1 capabilities and all financial writes remain absent.

## Documentation v2 integration note

ADR-001 through ADR-003 above preserve the original Phase 0 decisions and their
historical context. Git has since been initialized with explicit user approval;
the repository is now on `master` with `origin/master` configured. Statements
above about pending Git initialization describe the state when those ADRs were
written, not the current repository state.

The six decisions supplied in `docs/DECISIONS_V2_APPEND.md` are incorporated below
as ADR-004 through ADR-009 to avoid reusing existing identifiers. These decisions
describe future capabilities and do not authorize implementation of another phase.

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
