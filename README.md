# IOL Investment Agent

A secure, auditable investment-assistant backend that integrates IOL with AI assistants such as Codex/ChatGPT and Claude.

## Current project phase

**Phase 0: local backend foundation.**

No production trading capability should be implemented or enabled yet.

## Local setup

The project root is `C:\Users\Bruno\Desktop\iol-investment-agent`, containing
`AGENTS.md`, `apps/`, `packages/`, `docs/`, `prompts/`, and `package.json` directly.
Run the following commands there using Node.js 22.16+ on the 22.x line or Node.js
24.x, and npm 10+:

```sh
npm ci
npm run build
npm start
```

Use `npm install` when intentionally updating dependencies and review the resulting
`package-lock.json`. Use `npm ci` for reproducible local and CI installs.

`GET http://127.0.0.1:3000/health` returns `{"status":"ok"}`. It is a liveness
endpoint, with no broker or database connectivity checks. No credentials are
needed. It is limited to 60 requests per minute per client IP.

`npm start` optionally loads `.env` from the project root using Node's built-in
environment-file support. Existing environment variables take precedence. The
default configuration works without an `.env` file. If needed, copy
`.env.example` to `.env` and edit only the application settings; leave future
integration placeholders empty.

| Variable        | Default       | Validation                             |
| --------------- | ------------- | -------------------------------------- |
| `NODE_ENV`      | `development` | `development`, `test`, or `production` |
| `HOST`          | `127.0.0.1`   | Only `127.0.0.1` in Phase 0            |
| `PORT`          | `3000`        | Integer from 1 through 65535           |
| `IOL_READ_ONLY` | `true`        | Only the literal `true` in Phase 0     |

Invalid configuration prevents startup. Errors name the invalid field without
echoing its value. The application ignores future IOL, database, and AI settings.
Phase 0 has no broker access, financial data, or order execution paths.

## Development checks

```sh
npm run format
npm run check
npm run audit:dependencies
```

`check` runs formatting verification, type-aware linting, strict typechecking,
unit and local HTTP integration tests, and the production build. Individual
commands are `format:check`, `lint`, `typecheck`, `test`, and `build`. Tests use
Node's built-in test runner and an ephemeral loopback port; they make no external
service calls. Each test run removes only the generated `.test-dist` directory,
compiles application and package sources/tests, and automatically discovers
compiled `*.test.js` files. Name new tests `*.test.ts` under `apps/*/test`,
`apps/*/src`, or anywhere under `packages/*`.

GitHub Actions runs one check suite and dependency audit, plus a separate Gitleaks
scan of the full fetched Git history with redacted output. CI runs for pull
requests and pushes to `main`/`master`, with timeouts and superseded-run cancellation.
No developer hooks are installed. `.gitignore` excludes environment files,
private keys, credential files, and local Claude settings; `.env.example` remains
trackable with empty credential placeholders.

## Workspace boundaries

- `apps/api`: NestJS HTTP composition, configuration, health, and request logging.
- `packages/iol`: reserved for broker transport and typed adapters.
- `packages/risk`: reserved for deterministic domain rules without NestJS dependencies.
- `packages/mcp`: reserved for narrowly scoped tools after the core is stable.

The reserved packages are private workspace placeholders, with no runtime
exports or integrations. See `docs/DECISIONS.md` for the Phase 0 tooling and
security choices. The only current route is public liveness on loopback;
authentication and authorization must precede any future financial-data route.
Request logs contain a server-generated correlation ID, status, and duration,
never request headers, URLs, bodies, or credentials.

## Documentation

Read in this order:

1. `AGENTS.md`
2. `docs/PROJECT.md`
3. `docs/ARCHITECTURE.md`
4. `docs/SECURITY.md`
5. `docs/ROADMAP.md`
6. `docs/DECISIONS.md`

## Agent workflow

Both Codex and Claude may work on this repository, but not on the same task/files simultaneously unless coordinated by the user.

Neither agent may commit, push, merge, or execute real-money operations by default.
