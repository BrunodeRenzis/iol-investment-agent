# Architecture

## High-level design

```text
Codex / ChatGPT --------\
                         \
                          -> MCP / API boundary -> NestJS core -> IOL adapter -> IOL
                         /
Claude ----------------/

                                  |
                                  +-> Risk engine
                                  +-> Portfolio normalization
                                  +-> Audit / telemetry
                                  +-> Persistence
```

## Architecture style

Start as a modular monolith.

Do not introduce microservices until there is a measured operational reason.

## Proposed repository layout

```text
apps/
  api/
    src/
      modules/
        health/
        portfolio/
        market/
        auth/
packages/
  iol/
    src/
      client/
      auth/
      portfolio/
      market/
  risk/
    src/
      concentration/
      limits/
      money/
  mcp/
    src/
      tools/
docs/
prompts/
```

## Boundaries

### IOL adapter
Responsible for:
- authentication/token handling,
- HTTP transport,
- mapping IOL errors,
- rate-limit handling,
- typed raw response schemas.

It must NOT contain portfolio strategy or AI logic.

### Portfolio domain
Responsible for:
- normalized positions,
- balances,
- P&L representation,
- currency/value abstractions,
- snapshots.

### Risk engine
Pure/deterministic where practical.
Responsible for:
- concentration,
- exposure,
- allocation limits,
- proposed-order impact checks,
- future hard guardrails.

The risk engine must never depend on an LLM response to decide whether a safety constraint passes.

### AI adapters
Future layer.
Responsible for:
- transforming normalized data into model-safe context,
- calling OpenAI/Anthropic,
- parsing structured responses,
- never receiving broker credentials.

### MCP layer
Expose only narrow, purpose-built tools.
Initial tools should be read-only, for example:
- `get_portfolio`
- `get_balances`
- `get_quote`
- `get_exposure_summary`

Do not expose a generic HTTP proxy to IOL.

## Order architecture — future only

A future write flow must be split into at least:

```text
proposeOrder()
      |
      v
validateOrder()
      |
      v
previewOrder()
      |
      v
explicitUserConfirmation()
      |
      v
executeConfirmedOrder()
      |
      v
audit()
```

The confirmation artifact should have a short expiry and bind:
- user,
- instrument,
- side,
- quantity,
- price/price type,
- settlement,
- currency,
- generated request ID.

No model can skip these steps.

## Data precision

Use decimal-safe arithmetic for:
- prices,
- quantities,
- nominal values,
- FX,
- interest,
- P&L,
- percentages used in risk limits.

Define explicit domain types such as:
- `Money`
- `Currency`
- `InstrumentId`
- `NominalValue`
- `Quantity`
- `Percentage`

## Observability

Use:
- structured logs,
- correlation IDs,
- sanitized errors,
- metrics for external API latency/failures,
- audit records for sensitive future actions.

Never store full prompts/responses if they contain sensitive portfolio information unless explicitly intended and protected.
