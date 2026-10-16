# Project definition

## Goal

Build a personal investment-assistant platform that can securely read the user's IOL account, normalize portfolio/market data, calculate portfolio risk, and expose selected capabilities to AI assistants.

The project should eventually support ChatGPT/Codex and Claude through a shared backend/MCP layer, while keeping sensitive credentials and execution authority outside the language models.

## Primary user

One personal account initially. Multi-user support is out of scope for the first versions.

## Initial stack

- TypeScript
- NestJS
- PostgreSQL when persistence is needed
- Official IOL API and/or official IOL MCP where appropriate
- MCP server for selected internal tools
- OpenAI and Anthropic adapters only after the deterministic core is stable
- Git for version control

## Non-goals for V1

- Autonomous trading
- High-frequency trading
- Algorithmic execution without confirmation
- Portfolio optimization based solely on LLM output
- Social/copy trading
- Multi-broker support
- Mobile app
- Microservices
- Production write access to IOL

## Product principles

1. Read first, write much later.
2. Human approval for financial actions.
3. Deterministic risk rules before model recommendations.
4. Full auditability.
5. Minimum privilege.
6. Provider independence: OpenAI/Anthropic should be replaceable adapters.
7. Financial values must be precise and explicit.
8. The repo and documentation are the shared memory across agents.

## V1 user stories

- As a user, I can authenticate securely with IOL in read-only mode.
- As a user, I can retrieve my balances and portfolio.
- As a user, I can see normalized positions independent of IOL's raw schema.
- As a user, I can retrieve a quote for an instrument.
- As a user, I can calculate concentration by asset, issuer, currency, and asset class.
- As a user, I can inspect historical snapshots of my portfolio after persistence is introduced.
- As a user, I can ask an AI assistant to analyze the normalized read-only data without exposing IOL credentials to the model.

## Success criteria for first milestone

The backend can:
- start locally,
- authenticate against a safe IOL environment or read-only production access,
- fetch portfolio data,
- normalize it,
- expose it through a local authenticated endpoint,
- pass tests,
- contain no real-order execution path.
