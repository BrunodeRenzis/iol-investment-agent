# Architecture Decision Record Index

This is the single architecture decision log. AGENTS.md controls policy; accepted, non-superseded ADRs govern architecture within that policy. MASTER_PLAN.md is subordinate operational guidance. Historical decision text is preserved below; explicit supersession and clarification records determine current requirements.

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

**Clarified by:** ADR-010.
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

**Clarified by:** ADR-015. Test discovery is superseded by ADR-018; the no-local-hooks policy is retained.
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

The six decisions from the former Documentation v2 import appendix are incorporated
below as ADR-004 through ADR-009. The appendix was removed after verifying all its
unique content was merged; this log is the only decision source. These decisions
describe future capabilities and do not authorize implementation of another phase.
Documentation v2.1 adds ADR-010 through ADR-016, superseding weaker historical
lifecycle, AI-authority and scheduler language where explicitly indicated.

## ADR-004 — Observation/research autonomy is separate from execution authority

**Status:** Accepted

**Clarified by:** ADR-012.

**Date:** 2026-10-16

### Context

The platform should collect data and evaluate strategies unattended without granting authority to move real money.

### Decision

Observation, analysis, backtesting, signal generation, and paper trading may eventually run autonomously. Real-money execution requires a separate capability boundary and explicit human confirmation.

### Consequences

Schedulers and AI agents cannot gain broker write authority merely because they generate recommendations.

## ADR-005 — Strategies use a governed lifecycle

**Status:** Superseded by ADR-012; original decision text retained for history.

**Date:** 2026-10-16

### Context

LLMs can produce persuasive investment explanations that are not supported by measured results.

### Decision

Every strategy follows `IDEA -> SPECIFIED -> BACKTESTED -> VALIDATED -> PAPER_TRADING -> REVIEWED -> ELIGIBLE_FOR_HUMAN_APPROVAL`. Strategy modifications produce a new version.

### Consequences

Signals/results become traceable, losing outcomes are preserved, and no strategy is promoted solely because an AI model expresses high confidence.

## ADR-006 — AI is advisory, not the deterministic trading engine

**Status:** Superseded by ADR-011; original decision text retained for history.

**Date:** 2026-10-16

### Decision

Deterministic code owns portfolio limits, money arithmetic, specified strategy rules, and execution guards. OpenAI and Anthropic operate behind a provider-neutral advisory interface.

## ADR-007 — Start with simple explainable strategies

**Status:** Accepted

**Date:** 2026-10-16

### Decision

Initial strategies use explicit, testable inputs such as returns, moving averages, RSI, volatility, and volume features. The first objective is correctness/reproducibility/evaluation, not maximum historical return.

## ADR-008 — Scheduler starts simple and becomes durable only when justified

**Status:** Superseded by ADR-014; original decision text retained for history.

**Date:** 2026-10-16

### Decision

Use a simple in-process scheduler during local research if sufficient. Introduce durable queue/worker infrastructure before dependable 24/7 operation when requirements justify it.

## ADR-009 — Financial calculations require decimal-safe arithmetic

**Status:** Superseded/resolved by accepted ADR-019; original proposed decision text retained.

**Date:** 2026-10-16

### Decision

Select a maintained decimal-safe TypeScript library before financial normalization begins. Phase 1 must compare alternatives, choose one, document rounding rules, and add tests.

## ADR-010 — Broker-write phase gate and authenticated data boundary

**Status:** Accepted

**Date:** 2026-10-17

### Context

Documentation v2 ambiguously prohibited only reachable production writes and deferred some authentication until exposure beyond loopback.

### Decision

Before Phase 9 is explicitly approved, NO broker-write code may exist, including sandbox AND production. `packages/execution` must remain ABSENT, not merely disabled. Research and paper-trading code must never call broker write endpoints of any kind, even after an execution phase exists. Paper trading is entirely internal simulation with no IOL writes or sandbox orders.

Phase 9 requires explicit user approval and threat-model review BEFORE sandbox-only broker-write implementation. Production requires separate Phase 10 approval and threat-model review. Automated tests must NEVER call production trading endpoints. Future authorized execution requires deterministic validation/risk checks, preview, explicit human confirmation, expiry/exact binding, fail-closed authorization, idempotency, immutable audit and an emergency kill switch; never blindly retry orders.

ADR-002's authentication requirement is retained and clarified: authentication AND authorization must precede introduction of financial/account endpoints, including localhost/loopback. Public liveness remains non-sensitive.

### Consequences

This clarifies ADR-002/ADR-004 without granting execution authority. Sandbox is not an exception to the pre-Phase-9 code prohibition. Documentation, deployment, research and strategy eligibility do not authorize a new phase.

## ADR-011 — Zero AI risk or execution authority

**Status:** Accepted; supersedes ADR-006.

**Date:** 2026-10-17

### Decision

AI has NO authority over account permissions, execution permissions, hard portfolio/risk limits, position sizing constraints, order validity, confirmation, or real-money execution. Only deterministic code and explicit human authorization control these capabilities; neither joint nor delegated AI authority is permitted.

AI may only advise, critique, explain, or veto/escalate a recommendation. Its veto is advisory and must never block the emergency kill switch or risk-reducing user actions. Such actions remain subject to deterministic controls, explicit human authorization and approved phase boundaries; no write bypass is created.

### Consequences

Models cannot authorize their own outputs, modify protected capabilities, promote strategies, or receive any secrets. Consensus does not create authority.

## ADR-012 — Human-controlled strategy promotion

**Status:** Accepted; supersedes ADR-005 and clarifies ADR-004 autonomy.

**Clarified by:** ADR-017 (deterministic rejection replaces only the historical exclusive-human rejection restriction; promotion gates remain unchanged).

**Date:** 2026-10-17

### Decision

`IDEA -> SPECIFIED -> BACKTESTED -> VALIDATION_PENDING -> VALIDATED -> PAPER_TRADING -> REVIEW_PENDING -> REVIEWED -> ELIGIBLE_FOR_HUMAN_APPROVAL`

Additional states: `REJECTED`, `SUSPENDED`, `RETIRED`.

Autonomous research may reach BACKTESTED / VALIDATION_PENDING. A HUMAN is required to promote to VALIDATED and for EVERY promotion after VALIDATED, including PAPER_TRADING, REVIEW_PENDING, REVIEWED and ELIGIBLE_FOR_HUMAN_APPROVAL. Agents may recommend promotion but cannot perform it; deterministic application code enforces recorded human authorization.

Every transition is auditable with actor, authorization, previous/new state, strategy version, UTC time, reason and evidence. Deterministic safety controls may suspend unsafe operation without waiting for an AI opinion. Humans control rejection, retirement and resumption; agents only recommend. Resumption never bypasses human promotion gates; retirement is terminal for that version.

Strategy edits create a new version at IDEA or SPECIFIED without inherited approval. Preserve prior versions, evidence, signals and outcomes.

### Consequences

Autonomous research cannot certify its own results. After human entry into PAPER_TRADING, simulation may run within approved limits; later promotions still require humans. Eligibility is not execution permission.

## ADR-013 — Immutable research evidence and Argentine-market realism

**Status:** Accepted; supplements ADR-007 and ADR-009.

**Date:** 2026-10-17

### Decision

Raw observations are append-only. Corrections create provenance-linked records, corrected/normalized datasets are versioned, and backtests reference immutable dataset versions. Maintain source/provider timestamp, exchange timestamp, ingestion timestamp and "information available at" timestamp; historical decisions use actual information availability. Define staleness policies per instrument/data class. Never silently manufacture/backfill real-time observations; late historical imports are separately labeled/versioned.

Historical LLM-generated features are forbidden from ordinary backtests unless the exact model and data available at the historical instant can be reproduced without future knowledge. Default AI/news/LLM-derived feature evaluation is prospective forward/paper testing, not retrospective.

Instrument identity distinguishes ticker/security, market, currency, settlement term, and relevant security/CEDEAR/bond identity. AL30, AL30D and AL30C are not interchangeable observations. Every performance result declares return basis/currency, such as ARS nominal, USD MEP, USD CCL or real/inflation-adjusted terms, and uses compatible benchmarks with explicit timestamped conversions.

Treat dividends, splits, CEDEAR ratio changes, bond coupons, amortizations, accrued interest where relevant, and adjusted/unadjusted prices explicitly. Model bid/ask, spreads, slippage, liquidity/volume, settlement, market hours, halts/suspensions, and commissions/taxes where applicable. Spread/slippage handling is MANDATORY for local/BYMA instruments; missing inputs must be disclosed, never silently treated as zero.

Persist EVERY backtest run, including discarded/failed variants, and parameter searches. Do not erase failed experiments. Protect holdout/out-of-sample data from repeated optimization and record access/reuse. Address look-ahead and survivorship bias with point-in-time universes and delisted/inactive instruments where available; disclose coverage, sample-size and regime limitations.

### Consequences

Results must be reproducible and comparable; favorable narratives cannot replace evidence. Legal/contractual retention and required deletions follow ADR-016: audit removal and mark unavailable datasets rather than silently rewriting history.

## ADR-014 — Early collector and bounded scheduler operations

**Status:** Accepted; supersedes ADR-008.

**Date:** 2026-10-17

### Decision

Phase 2 provides secured persistence and portfolio intelligence; Phase 2.5 starts minimal read-only collection soon afterward, BEFORE long prospective paper research. Phase 6 matures autonomous research orchestration. An in-process local collector is sufficient initially; add durable queue/workers only when justified for dependable operation.

Job idempotency key = job type + scope/instrument + scheduled time slot, or an equivalent documented natural key. Apply unique database constraints where appropriate, overlap locks/single-runner protection and atomic deduplication. A duplicate signal must not create duplicate paper trades.

Record missed runs, retries and observable failures. Missing real-time observations are gaps, not silently reconstructed snapshots. Jobs require bounded timeouts, safe idempotent retries, rate-limit awareness, market calendar/timezone, a scheduler kill switch, and explicit AI-call cost/token budgets before scheduled model calls in their approved phase.

### Consequences

Real forward data accumulates early. Scheduling grants neither strategy promotion nor broker-write authority. Off-machine/24/7 deployment has a separate mandatory security gate under ADR-016.

## ADR-015 — Staged secret scan without local hooks

**Status:** Accepted; clarifies and retains ADR-003's no-local-hooks decision.

**Date:** 2026-10-17

### Decision

A future local staged-file secret scan is a manually invoked command that reads the staged index without staging, rewriting, or unstaging files. Retain Gitleaks CI. Do not install hooks or modify Git hook configuration, including through dependency-install scripts.

### Consequences

This resolves the staged-scanning plan without changing the no-hooks policy; no supersession of that restriction is needed. Any future hook policy requires an explicit user-approved superseding ADR before implementation. This documentation task installs no scanning command or hook.

## ADR-016 — Security restoration, data terms and deployment gate

**Status:** Accepted; supplements ADR-002/ADR-003 and all future phases.

**Clarified by:** ADR-017 (explicit user approval for sensitive AI prompt/response persistence).

**Date:** 2026-10-17

### Decision

NEVER put ANY secret in an LLM prompt. Minimize/redact account identifiers and sensitive personal financial identifiers before model calls where possible. Never log complete IOL responses that may contain sensitive account data. Do not persist full prompts/responses containing sensitive portfolio data unless explicitly required and protected.

Never invent undocumented IOL behavior. Mark unknown behavior UNKNOWN and verify against official documentation or authorized read-only sandbox interaction before implementation; this does not permit pre-Phase-9 writes. Agents may never silently weaken/change the security model. Business/risk rules must be testable without network access. If any required validation cannot run, the agent must say which check and why.

Before market-data persistence or redistribution, check current IOL/provider terms for storage, historical retention and redistribution, recording permitted uses and unresolved restrictions. Persistence requires least privilege, access controls, encryption at rest where supported, secure backups/recovery, retention rules and data minimization. Required deletions must be audited and affected dataset versions marked unavailable, never silently rewritten or selectively erased to conceal failed research.

Authorization fails closed. Sensitive schemas reject unexpected fields where practical; use OAuth state/PKCE and CSRF where applicable. Pin/lock dependencies, review major upgrades and retain vulnerability scanning.

Moving broker credentials or financial data off the local machine is a security-boundary change. BEFORE deployment, including 24/7 operation, require explicit user approval, threat-model review, credential/secrets plan, database security, backup/recovery, network exposure review and monitoring. This gate applies whenever hosting is proposed, not only after Phase 6. Deployment never grants broker-write permissions; Phase 9 and Phase 10 retain their own separate approval/threat-model gates.

### Consequences

Early collection remains local until deployment is explicitly approved. Operational readiness does not authorize financial writes. AGENTS.md governs policy; accepted ADRs govern architecture; MASTER_PLAN.md remains subordinate operational guidance.

## ADR-017 — Credential containment and final policy clarifications

**Status:** Accepted; supplements ADR-010, clarifies ADR-012 and ADR-016.

**Date:** 2026-10-17

### Context

The final independent-review cleanup requires explicit provider-scope verification, user approval for sensitive AI persistence, and deterministic rejection without granting automated promotion. Existing accepted decision text is retained as history, with clarification pointers.

### Decision

Broker read and write permissions/scopes must be separated whenever the provider supports it. Step 3 explicitly verifies whether IOL offers true read-only credentials/scopes; the answer remains UNKNOWN until verified. If unavailable, treat the token as write-capable even if the adapter is read-only. Until verified otherwise, unknown capability is treated as write-capable too.

In that case isolate the token strictly inside `packages/iol`, expose only a fixed allowlist of verified read-only endpoint paths, and add automated tests enforcing it. Never pass the credential/token to scheduler, AI, MCP, trading research, or a generic HTTP client. No other package may obtain direct broker credentials. Future write credentials must be separate from read credentials whenever possible. No containment rule authorizes broker-write code before approved Phase 9.

Full AI prompts/responses containing sensitive portfolio information may be persisted only when the requirement is explicitly approved by the user and the data is protected. An agent or model cannot approve that requirement. This clarifies ADR-016; all secret, minimization, access and retention safeguards remain in force.

Deterministic automation MAY move a strategy to REJECTED when objective rejection criteria fail. Record criteria, evidence and the audited transition. This replaces only ADR-012's historical exclusive-human rejection restriction; humans may also reject strategies. AI recommendations do not authorize deterministic transitions. Automation may NOT promote beyond BACKTESTED / VALIDATION_PENDING. Human approval remains mandatory for VALIDATED and every later promotion, as well as resumption. Rejection cannot be used to bypass those gates.

### Consequences

Research may be autonomous within an approved phase. Paper trading may run autonomously only within an approved phase and for a human-approved strategy state. Real-money execution may not be autonomous. All existing phase and execution prohibitions remain intact.

Documentation v2.1 is adopted as canonical after independent review and user acceptance. AGENTS.md remains authoritative for policy, accepted non-superseded ADRs for architecture, and MASTER_PLAN.md for subordinate operational sequencing. This adoption does not authorize another implementation phase.

## ADR-018 — Explicit test discovery and manual staged secret scanning

**Status:** Accepted; supersedes only ADR-003's default/recursive Node discovery and implements ADR-015. Historical decision text is preserved.

**Date:** 2026-10-17

### Context

Phase 1 Step 1 hardens repository tooling without adding financial capabilities.
Implicit test discovery can execute helpers or succeed with no tests. Local secret
scanning must not install hooks or mutate the developer's index.

### Decision

Keep deletion of stale `.test-dist` before compilation. Recursively enumerate
regular compiled `*.test.js` files under `.test-dist/apps` and
`.test-dist/packages`, sort them, and pass their explicit paths to Node's test
runner. Do not follow symlinks or execute helper files as test entry points. Fail
nonzero when there are no compiled tests, or when compilation/test execution fails.
Run separately discovered `scripts/test/**/*.test.mjs` tooling regressions after
the application suite; those tests cannot satisfy the zero-application-tests guard.

Provide `npm run scan:staged`, an explicit wrapper for Gitleaks 8.30.1 (the CI-pinned
version) using `git --staged`, full redaction and nonzero failure codes. Require a
manually installed, checksum-verified executable on PATH or at `GITLEAKS_PATH`.
Check its version and fail closed if missing, incompatible or interrupted. No
automatic downloads, install lifecycle scripts, Git configuration changes or hooks.
The wrapper and scanner read staged changes without staging, rewriting or
unstaging files. CI remains unchanged and scans full history.

### Consequences

Future app/package tests are picked up by filename rather than a maintained list.
Scratch tests verify zero-test failure, nested discovery, helper exclusion and
failure propagation. Scanner tests verify invocation and failure handling without
requiring Gitleaks for the ordinary application checks. Staged scanning requires
the explicit local prerequisite and examines added diff content, not all working
files or unchanged history. An empty staged diff has no findings. It supplements
CI and careful handling of secrets; it cannot guarantee secret absence.

Targeted ignores cover Ed25519/ECDSA/DSA private-key names, PuTTY private keys,
token text files and secret YAML suffixes without ignoring ordinary YAML or source
files. No part of this decision authorizes later Phase 1 steps or broker writes.

## ADR-019 — Broker-independent exact financial primitives

**Status:** Accepted; resolves and supersedes ADR-009 without rewriting its original decision.

**Date:** 2026-10-17

### Context and alternatives

Phase 1 Step 2 needs decimal-safe domain values before any broker normalization.
Candidate comparison used official APIs, changelogs and npm metadata, inspected
2026-10-17. Release activity is evidence of maintenance, not a guarantee; all three
are mature MIT-licensed libraries with no runtime dependencies.

| Candidate           | Precision / rounding                                                                                                                        | TypeScript / footprint                                                                                         | Assessment                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| decimal.js 10.6.0   | Significant-digit precision rounds arithmetic results, including addition/multiplication; nine rounding modes.                              | Bundled declarations; broader scientific/transcendental API. npm unpacked size 284,347 bytes.                  | Strong general calculator, but preventing silent ordinary-arithmetic rounding requires additional precision management. Latest published version 2025-07-06.                                         |
| big.js 7.0.1        | Exact addition/subtraction/multiplication; decimal-place limits for division-like operations; four rounding modes.                          | Smallest candidate; npm unpacked size 58,948 bytes; no bundled declarations (needs external TypeScript types). | Simple financial API and useful strict input/conversion mode; lacks explicit ceiling/floor rounding modes. Changelog release 2025-04-21, with CI and prior strict-mode fixes.                        |
| bignumber.js 11.1.5 | Exact addition/subtraction/multiplication; decimal-place settings affect division-like operations; nine rounding modes and isolated clones. | Bundled CommonJS/ESM declarations; npm unpacked size 500,493 bytes including multiple distributions/types.     | Best match for exact basic arithmetic, explicit boundary rounding and TypeScript without an extra type package. Latest published version 2026-07-05; 2026 changes include typed API tests and fixes. |

All support string construction, decimal comparison/equality methods and explicit
formatting; ordinary JS object equality is identity, not numerical equality.
All can expose JS-number conversions, so none alone enforces our domain policy.
Their permissive parsing/notation and JSON defaults also need a controlled wrapper.
All can represent money, FX, percentages, prices, nominal values and fees; none
supplies currency/unit semantics. npm unpacked sizes are installation footprint,
not measured runtime memory or minified bundle size. No browser bundler or
performance claim is introduced; correctness is decisive.

Primary references:

- [decimal.js README](https://github.com/MikeMcl/decimal.js) and [API](https://mikemcl.github.io/decimal.js/).
- [big.js README](https://github.com/MikeMcl/big.js), [API](https://mikemcl.github.io/big.js/) and [7.0.1 changelog](https://github.com/MikeMcl/big.js/blob/v7.0.1/CHANGELOG.md).
- [bignumber.js API](https://mikemcl.github.io/bignumber.js/) and [11.1.5 changelog](https://github.com/MikeMcl/bignumber.js/blob/v11.1.5/CHANGELOG.md).
- Official npm metadata via `npm view <package>@<version> dist.unpackedSize types dependencies --json` and `npm view <package> version time --json`.

### Decision

Pin `bignumber.js` **11.1.5** as the sole runtime dependency of a new
`packages/financial` / `@iol-agent/financial` workspace. This is a focused,
broker-independent shared domain boundary, added incrementally to the intended
layout. It does not belong in `packages/iol`, and no financial HTTP route or broker
adapter is introduced. Build JavaScript and declarations with the existing `tsc`.
Expose only Currency, parseCurrency, Money, Price, Quantity, NominalValue, Percentage,
FxRate and the explicit rounding policy/modes at the package root. Keep shared
decimal internals private; no generic public DecimalValue or raw library export.

Use an isolated library clone and exact addition/subtraction/multiplication and
decimal shifts. Accept only validated plain decimal strings: reject JS numbers,
scientific notation, whitespace, malformed/non-finite input and alternate bases.
Bound inputs and results to 100 integer digits and 100 fractional digits; reject
excess rather than silently round. No JS binary floating point for critical
arithmetic. JS numeric metadata (comparison signs/scale counts) is permitted.
Immutable values reject implicit coercion and provide no `toNumber` API.

Currency initially supports only ARS/USD. Money is signed; Price, Quantity and
NominalValue are non-negative, including zero/fractions. Quantity is currency-free;
NominalValue represents face units and is not share quantity. Instrument currency,
denomination/price basis and tick constraints remain later metadata. Same-currency
Money arithmetic/comparison and Price comparison reject mismatch, including
equality; no implicit FX. Percentage stores a ratio with distinct `fromPercent`
and `fromRatio` factories: 5% = 0.05. Negative and >100% percentages are allowed
mathematically; this grants no risk permissions. `applyTo(Money)` returns just the
percentage amount. FX explicitly means quote units per one base unit; USD/ARS 1450
means 1 USD = 1450 ARS. Conversion requires base-currency Money. No inferred rate,
inverse, division, lookup, price-times-quantity rule or market identification.

Rounding is always an explicit boundary choice. `format({ decimalPlaces, mode })`
produces display text without changing the object; `round(...)` returns a new
same-domain value for a verified boundary. Require both scale (0..100) and one of
nine named modes; no universal two-decimal scale or settlement default. No
intermediate rounding. Cash settlement rules and provider/tick precision remain
UNKNOWN until verified IOL/market metadata. A future division API must first define
its non-terminating-result precision and rounding contract.

Serialization uses fresh plain JSON records with decimal **strings**, currency
and FX direction as appropriate, no exponent, no insignificant trailing zeros,
and normalized `"0"`. Provider numerical precision is retained within the bounds;
original textual scale is not. Preserve that separately in later provenance when
needed. See `packages/financial/README.md` for the complete type/JSON conventions
and examples; the policy in this ADR is authoritative.

### Consequences and tradeoffs

The wrapper prevents accidental number inputs, currency mixing, implicit numeric
coercion and cross-domain substitution. Type and runtime tests enforce those
boundaries and run without network/database/provider access. The exact arithmetic
model avoids silent rounding but rejects out-of-range results and deliberately
omits division/inversion until a precision contract is needed. This means the
API is intentionally narrower than the decimal library.

bignumber.js has a larger installed distribution than big.js and a shared upstream
maintainer concentration with the other candidates. Pinning, lockfile review,
offline regression tests and vulnerability scanning remain required. No claim is
made that these primitives encode IOL/BYMA validity, settlement, FX market basis,
fees/taxes or permissions. Those await verified contracts and separately selected
steps. All pre-Phase-9 prohibitions remain in force.
