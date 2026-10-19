# IOL contract research — Phase 1 Step 3 correction

Updated **2026-10-18** in the real repository working tree. Step 3 researched the
official contract; Step 4 now implements its four initial reads offline (ADR-020).
No real credentials or authenticated account calls have been used.
This evidence register is subordinate to `AGENTS.md` and accepted ADRs.

**OFFLINE ADAPTER COMPLETE — REAL CALL VERIFICATION PENDING.** Official public
Swagger supplies the four initial read contracts. Step 4 implements their
allowlist, strict DTOs, lossless numeric parsing and private transport with mocks.
The public factory is offline-only; real verification follows
[IOL_MANUAL_VERIFICATION.md](IOL_MANUAL_VERIFICATION.md). This is not readiness for
unrestricted broker calls, Step 5 aggregation, persistent collection or broker
writes. Runtime verification gates remain below.

Step 4B (ADR-021) adds **REAL-CALL RUNNER PREPARED — REAL CALL NOT YET EXECUTED**.
Private password grant and a separate local runner are prepared with offline
tests only; public factory remains offline. No new provider evidence or real
response has been obtained. Five-minute in-memory policy, hidden input, discarded
refresh token, no automatic refresh/re-login/retry and operation-specific safe
summaries reduce the first session's scope without resolving provider unknowns.
Review, explicit real-session approval, entitlement/limits/incident checks and
sanitized user-run acceptance remain required. Step 4 is still open.

ADR-022 adds offline final preflight and privacy controls without new provider
evidence: runtime restrictions, ordered reads, safe schema diagnostics, no exact
portfolio counts and a shared 16,384-character access-token bound. Failure after
possible issuance does not prove revocation or expiry; follow the manual runbook's
incident/waiting policy using the access lifetime already documented by source A.
**REAL CALL NOT YET EXECUTED.** All provider unknowns below remain unresolved.

## Evidence labels and correction

- **VERIFIED** means supported by the cited official contract, not live-tested.
- **UNKNOWN — must be verified** marks unresolved runtime or semantic facts.
- **DEFERRED** means intentionally outside the initial adapter or approved phase.

The earlier draft incorrectly marked published REST routes/models unknown because
its retrieval attempts missed the public Swagger URLs. Both specifications and the
developer documentation were retrieved during this correction. An HTTP 403 from
one client is not proof a public document is unavailable. The obsolete V1 portfolio
example and operational-history routes have been removed from the Step 4 candidate.

## Official sources and provenance

Only official IOL sources are implementation evidence. Public specification and
HTML requests used no authentication. No Try it out action was executed. No public
example credentials, personal identifiers or full account payloads were copied into
this repository. Temporary downloaded documentation was inspected outside the tree;
all project-document edits were applied in this real working tree, not another copy.

| ID  | Official source / type                                                                           | Role and section                                                                  | Accessed   | Freshness caveat                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| V1  | [Versión API 1.0](https://api.invertironline.com/v1/swagger), Swagger 2.0 JSON                   | `/token`, `TokenRequest`, `APIToken`; comparison                                  | 2026-10-18 | `info.version=v1`; 15 paths, 28 definitions; no release date. Retrieved with ordinary curl after another client returned 403.            |
| V2  | [Versión API 2.0](https://api.invertironline.com/v2/swagger), Swagger 2.0 JSON                   | Initial read paths, response models, enums, excluded families                     | 2026-10-18 | `info.version=v2`; 48 paths, 70 definitions; published schema is not a runtime compatibility guarantee.                                  |
| D   | [IOL APIs DOC](https://developers.invertironline.com/), public Postman documentation             | Personal-account/title examples, auth, casing comparison                          | 2026-10-18 | Public HTML and its linked collection retrieved; mixed personal/advisor sections and old/synthetic examples, not a release-dated schema. |
| A   | [API authentication](https://api.invertironline.com/Help/Autenticacion)                          | Password/refresh flow and bearer header                                           | 2026-10-17 | Title says API V1; interpret with V1/V2, not as authority for obsolete resource paths.                                                   |
| H   | [API Help](https://api.invertironline.com/Help)                                                  | Activation, real-environment warning, sandbox description                         | 2026-10-17 | Undated explanatory page.                                                                                                                |
| E   | [Documentación API](https://www.invertironline.com/documentacion-api)                            | Documentation entry and API terms prerequisite                                    | 2026-10-17 | API-specific terms link leads to login; no account login performed.                                                                      |
| P   | [API product page](https://www.invertironline.com/api)                                           | Advertised quotes/history/portfolio capabilities                                  | 2026-10-17 | Marketing, not endpoint freshness or SLA evidence.                                                                                       |
| T   | [Términos y Condiciones de Uso](https://iol.invertironline.com/Home/terminos_y_condiciones)      | Varios; Prohibición de retransmisión de datos; simulator terms; Anexo C clause 52 | 2026-10-18 | States February 2025 update; API/market-license applicability still needs verification.                                                  |
| C   | [CCL help](https://iol.invertironline.com/User/Articulo?articleId=35978418268571&search=True)    | AL30/D/C context                                                                  | 2026-10-17 | Undated UI help, not REST identity schema.                                                                                               |
| L   | [Dólar CCL — EEUU](https://www.invertironline.com/productos/dolar-ccl1)                          | Conflicting legacy availability/settlement statements                             | 2026-10-17 | Apparently stale, internally inconsistent; no operative rule inferred.                                                                   |
| U   | [¿Cómo comprar un activo?](https://iol.invertironline.com/User/Articulo?articleId=4417744781595) | UI CI/normal settlement                                                           | 2026-10-18 | UI terminology, not automatic REST-enum equivalence.                                                                                     |
| S   | [Homo documentation UI](https://api.homo.invertironline.com/)                                    | HTML `swashbuckleConfig`, warning                                                 | 2026-10-18 | Actual UI points Swagger discovery to production; hostname does not establish isolation.                                                 |
| M   | [MCP technical documentation](https://mcp.invertironline.com/documentacion-tecnica)              | Read-only consent comparison                                                      | 2026-10-17 | Different interface; no inference about REST scopes.                                                                                     |

D's public HTML links this [official-domain collection](https://developers.invertironline.com/api/collections/18774084/UVRDH5q5?environment=12208684-be9e51e8-ec17-4909-943b-0f3b460b7e0a&segregateAuth=true&versionTag=latest).
Its collection auth is bearer; personal reads, title reads and trading examples
also declare bearer. No credential example values are evidence of permissions.

SHA-256 of raw downloaded Swagger response files, before JSON parsing or text
reformatting (2026-10-18; not hashes of PowerShell-reserialized content):

| Source | SHA-256                                                            |
| ------ | ------------------------------------------------------------------ |
| V1     | `9258310a591b47a1ffc20d1b998f4d3f632c8e9a6268fd622d3464984e746a84` |
| V2     | `4c6ae0125218984a652cda7ebbfbb5dfe526357147d3d044d87c4bedd0884cf9` |

Hashes identify research snapshots, not an IOL release signature. Re-fetch and
compare before future implementation; review upstream changes, never auto-adopt.

## VERIFIED — authentication and token boundary

V1 publishes `POST /token` on `https://api.invertironline.com` with body
`TokenRequest`: string fields `username`, `password`, `grant_type`, `refresh_token`;
only `grant_type` is schema-required. A documents form-urlencoded password and
refresh grants, a bearer Authorization header, and a 15-minute access lifetime.
The refresh example supplies `refresh_token` and `grant_type=refresh_token` without
username/password. Conditional runtime requirements cannot be inferred solely from
Swagger's required array. Token creation is separate from the read data allowlist.

`APIToken` has string `access_token`, `token_type`, `refresh_token`, `.issued`,
`.expires`, `.refreshexpires`, and integer(int32) `expires_in` (V1). Presence of a
field is not proof of its full lifecycle/clock semantics. Password re-login or
storage, refresh lifetime/rotation and exact `.refreshexpires` semantics remain
**UNKNOWN — must be verified**.

Neither downloaded Swagger declares REST `securityDefinitions`/OAuth scopes or
operation security requirements. D/A establish bearer usage; D applies the same
bearer model to trading examples. This does not prove identical effective token
permissions or that scopes cannot exist. **REST permissions/scopes = UNKNOWN —
must be verified; treat every REST token as WRITE-CAPABLE.** M documents read-only
consent for MCP only. No MCP connection or alternate auth design is adopted here.

## VERIFIED — initial Step 4 route inventory and candidate allowlist

All four entries bind origin **`https://api.invertironline.com`** (HTTPS, default
port, no alternate host), method **GET**, and the exact case-sensitive path template
shown below. V2 supplies schemas; D/A supply bearer-auth evidence. Missing Swagger
security declarations do not mean anonymous access. All four are read-only by their
published retrieval contract, not by assuming every GET is safe.

| Exact path template                                     | Required path parameters / official enum constraints                                                     | Allowed query parameter names | 200 response model       | Evidence                                                        |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------ | --------------------------------------------------------------- |
| `/api/v2/estadocuenta`                                  | None                                                                                                     | None                          | `EstadoCuentaModel`      | V2 `MiCuenta_EstadoCuenta`; D Mi Cuenta Estado Cuenta           |
| `/api/v2/portafolio/{pais}`                             | `pais`: `estados_Unidos`, `argentina`                                                                    | None                          | `PortafolioModel`        | V2 `MiCuenta_Portafolio`; D Mi Cuenta Portafolio                |
| `/api/v2/{mercado}/Titulos/{simbolo}`                   | `mercado`: `bCBA`, `nYSE`, `nASDAQ`, `aMEX`, `bCS`, `rOFX`; `simbolo`: string, no enum/pattern specified | None                          | `TituloModel`            | V2 `Titulos_Titulos`; D Titulos Titulos                         |
| `/api/v2/{mercado}/Titulos/{simbolo}/CotizacionDetalle` | Same market enum; `simbolo`: string, no enum/pattern specified                                           | None                          | `CotizacionDetalleModel` | V2 `Titulos_CotizacionConSimbolo`; D Titulos Cotizacion Detalle |

V2 marks these operations `deprecated=false`, with no request body/query/pagination
parameters and only a 200 response. That is verified documentation, not proof of
unlimited/unpaginated runtime results or a complete error contract. Pagination,
truncation, nullability and runtime shape remain verification questions. Model
properties generally lack required arrays; do not invent field-presence guarantees.

Implemented Step 4 enforcement binds **trusted origin + method + exact path template +
allowed path values/enums + allowed query names**. None means an empty query
allowlist, including denial of unexpected query keys. The symbol's unrestricted
schema string is not permission for arbitrary URLs or path segments: Step 4 accepts
only 1–32 uppercase ASCII letters/digits, without encoding or normalization. This
is a local routing grammar, not an exhaustive IOL guarantee or current-symbol list.
All documented market/country enums above are accepted with exact V2 spelling.

Reject anything outside the tuple **before network access**, including method
substitution, extra path segments, encoded traversal and alternate origins. Disable
redirect following by default or prove every redirect still satisfies the full
tuple; redirects must never escape the trusted origin or leak bearer credentials.
Use offline tests with transport spies. No generic authenticated HTTP capability.
This allowlist is implemented and tested offline; it has not been live-verified.

## VERIFIED — accounts, balances and portfolio

V2 `EstadoCuentaModel` returns `cuentas: CuentaModel[]`, `estadisticas:
EstadisticaModel[]` and numeric `totalEnPesos`. `CuentaModel` includes sensitive
string `numero`, `tipo`, `moneda`, `estado`, numeric `disponible`, `comprometido`,
`saldo`, `titulosValorizados`, `total`, `margenDescubierto`, and `saldos: SaldoModel[]`.
Account state enum: `operable`, `cerrada`, `bloqueada`; it grants this adapter no
execution permissions.

`CuentaModel.tipo` enum, preserving published casing:

- `inversion_Argentina_Pesos`
- `inversion_Argentina_Dolares`
- `inversion_Estados_Unidos_Dolares`
- `administrada_Argentina_Pesos`
- `administrada_Argentina_Dolares`
- `administrada_Estados_Unidos_Dolares`

The separate `moneda` enum includes `peso_Argentino`, `dolar_Estadounidense`, `real`,
`peso_Mexicano`, `peso_Chileno`, `yen`, `libra`, `euro`, `peso_Peruano`,
`peso_Colombiano`, `peso_Uruguayo`. This broader provider enum does not extend the
financial package's supported currencies; unsupported values must fail closed.

**VERIFIED:** account `tipo` distinguishes Argentina and US dollar account
categories even though both can use `dolar_Estadounidense`. Preserve at least
**account tipo + moneda + liquidacion** on broker balances, along with required
account provenance if multiple accounts exist. Do not merge categories because
currency matches. `SaldoModel` exposes `saldo`, `comprometido`, `disponible`,
`disponibleOperar` and its own liquidation enum.

**UNKNOWN — must be verified:** Argentina dollars' equivalence to MEP, US dollars'
equivalence to CCL/cable for valuation, `administrada_*` meaning, and FX/source/time
basis of `totalEnPesos`. No totals or conversions may be inferred from field names.

`PortafolioModel` has `pais` and `activos: PosicionModel[]`. Positions include
`cantidad`, `comprometido`, `ultimoPrecio`, `ppc`, `valorizado`, variation/gain fields,
`titulo: TituloModel`, and `parking: ParkingModel`. Economic definitions, availability
and valuation methodology not established by the schema remain unknown.

`Currency = ARS | USD` remains a generic domain primitive, not permission to sum all
broker USD balances. Additional account/settlement context belongs outside Currency
in Step 5's verified normalization model. No Step 3 change to `packages/financial`.

## VERIFIED — separate settlement vocabularies and instrument fields

| V2 location                                                                    | Published vocabulary                                        |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `TituloModel.plazo`, `CotizacionDetalleModel.plazo`, quote query `model.plazo` | `t0`, `t1`, `t2`, `t3`                                      |
| `SaldoModel.liquidacion`                                                       | `inmediato`, `hrs24`, `hrs48`, `hrs72`, `otro`, `masHrs72`  |
| `OperacionModel.plazo` (history model, deferred)                               | `sinValor`, `a72horas`, `a24horas`, `inmediata`, `a48horas` |

Keep these vocabularies separate. The ambiguous Cotizacion query description says
`T0 = Inmediato`, `T+1 = 24 Horas`, but also `T+2 = 72 Horas`. Record that internal
inconsistency; do not silently repair it or turn it into a universal mapping.
Cross-model/UI equivalence (including `t0 == inmediato == CI`) remains
**UNKNOWN — must be verified**. U describes CI/24-hour normal settlement; L contains
older 48-hour/parking statements. Neither resolves the full REST mapping.

`TituloModel` explicitly includes `simbolo`, `descripcion`, `pais`, `mercado`,
`tipo`, `plazo`, `moneda`. Its market/country enums match the candidate above;
`tipo` has a larger, mixed-case security-type enum (including `oPCIONES`, `cEDEARS`,
`titulosPublicos`, `aCCIONES`); the complete authoritative set is V2
`definitions.TituloModel.properties.tipo.enum`, not those four examples.

No ISIN, numeric immutable security ID, maturity or denomination field is declared
in that model; this is a model limitation, not a claim no IOL service supplies one.
`CotizacionDetalleModel` additionally has `laminaMinima`, `lote`, `cantidadMinima`;
these names alone do not establish denomination or executable lot rules.
A future composite key must preserve market/country/settlement/currency context.

C documents AL30, AL30D and AL30C as distinct symbols with pesos/dollars/foreign
settlement contexts. Do not infer an exact underlying-security identity link or
interchangeability from suffixes. C and L disagree on CCL availability/parking/hours;
those operational claims are not used to define the adapter contract.

## VERIFIED — quote fields and numeric representation

V2 `CotizacionDetalleModel` provides `ultimoPrecio`, `apertura`, `maximo`, `minimo`,
`cierreAnterior`, `variacion`, `puntosVariacion`, `montoOperado`, `volumenNominal`,
`precioPromedio`, `cantidadOperaciones`, `fechaHora`, `puntas`, identity and `plazo`.
`cierreAnterior` is a previous-close field, not evidence of a current final close.
`PuntasModel` has `cantidadCompra`, `precioCompra`, `precioVenta`, `cantidadVenta`:
bid/ask prices and quantities per entry. Sorting, depth, units and missing-level
semantics require confirmation. Do not reconstruct missing bid/ask or treat
`ultimoPrecio` as an executable price.

`fechaHora` is string(date-time). Exchange/provider/request meaning, actual timezone,
clock accuracy, staleness and production delay guarantees are **UNKNOWN — must be
verified**. Marketing real-time claims in P are not per-endpoint freshness guarantees.
Future collection must capture ingestion time separately and never relabel it as
exchange time; missing observations remain gaps.

V2 uses JSON **number(double)** for account/balance amounts, `totalEnPesos`, position
quantities/prices/gains and bid/ask price/quantity fields. `volumenNominal` is
**integer(int32)** in `CotizacionDetalleModel` but **number(double)** in
`CotizacionModel`. Preserve this schema discrepancy; do not silently truncate or
assume all quantities are integers. Provider internal precision/rounding remains
**UNKNOWN — must be verified**.

**Step 4 requirement and implementation:** retain raw JSON numeric token text losslessly;
never route critical financial values through ordinary JS binary floating-point
`Number`, including `JSON.parse`/`response.json()` followed by `String(number)`.
Convert the preserved textual value directly into string-based financial primitives.
Step 4 explicitly rejects all exponent notation and bounds plain decimal tokens
to 100 integer/100 fractional digits instead of rounding. Pinned lossless-json
4.3.2 plus a lexical-number callback produces string-backed DTOs; int32 fields use
exact lexical/range checks and remain strings. ADR-020 records the selection and
offline precision regressions. No financial primitive API or economic semantic
conversion changes. This applies ADR-019.

## VERIFIED — official casing differences

D's Estado de Cuenta example uses `Inversion_Argentina_Pesos`, `Peso_Argentino`,
`Inmediato`; V2 uses `inversion_Argentina_Pesos`, `peso_Argentino`, `inmediato`.
D portfolio examples use `Argentina`, `NYSE`, `ACCIONES`; V2 spells corresponding
enums `argentina`, `nYSE`, `aCCIONES`. Advisor examples are comparison evidence,
not interchangeable personal-account contracts.

Do not silently lowercase everything, ignore enums or invent aliases. Step 4
accepts exact V2 enum spelling only, preserving accepted values unchanged and
rejecting documentation-example aliases rather than guessing a mapping. Confirm actual personal-account
shape/casing through a sanitized USER-RUN read-only verification before real calls
are enabled. No agent uses real credentials.

## Exclusions, collision risk and deferred reads

V2 confirms **GET and DELETE share `/api/v2/operaciones/{numero}`**. Therefore path
alone, method alone and family name alone are insufficient safety classifications.
Both history reads (`/api/v2/operaciones` and its numbered route) are deferred from
the first adapter because they are not needed for the four initial capabilities.
The destructive method is recorded only to explain denial, not to implement it.

Exclude all non-allowlisted routes, including these V2 families/paths:

- `/api/v2/operar/`, `/api/v2/OperatoriaSimplificada/` (including operational GETs).
- `/api/v2/asesores/`, `/api/v2/Asesor/`, including `test-inversor`.
- `/api/v2/cotizaciones-orleans*` and `/api/v2/cotizaciones-orleans-panel*`.
- Operational MEP quote routes under `/api/v2/Cotizaciones/MEP`.
- `/api/v2/Notificacion` and `/api/v2/datos-perfil`.

This is an exclusion boundary, not a claim that every route in each family writes.
No write payloads/implementation instructions are documented. The stale V1
`/api/micuenta/miportafolio` example is historical evidence only, never a candidate.

`datos-perfil` returns `PerfilClienteModel` containing `dni`, `cuitCuil`, `email`,
`numeroCuenta`, names and account/profile flags. It stays excluded unless a future
explicit requirement justifies the exposure. `CuentaModel.numero` must also be
minimized and redacted from logs; no account identifiers go to model prompts unless
an explicitly approved future use requires it, with minimization/protection.
Secrets must NEVER go to prompts, regardless of approval for non-secret data.

### Ambiguous Cotizacion — deferred

V2 path `/api/v2/{Mercado}/Titulos/{Simbolo}/Cotizacion` has placeholders but declares
`mercado` and `simbolo` as required **query** parameters, plus required query
`model.simbolo`, `model.mercado` and optional `model.plazo`. Their precedence and
interaction are **UNKNOWN — must be verified**. Preserve the actual placeholder
casing; do not invent missing path-parameter definitions. Exclude this route and
use the clearer `CotizacionDetalle` candidate. That candidate declares no query
parameter to choose settlement; validate returned `plazo`, do not add one by guess.

### Historical prices — verified route, deferred use

V2 documents GET
`/api/v2/{mercado}/Titulos/{simbolo}/Cotizacion/seriehistorica/{fechaDesde}/{fechaHasta}/{ajustada}`:
market enum as above, string symbol, date-time string date bounds, and `ajustada`
values `ajustada` / `sinAjustar`; response `CotizacionModel[]`, no query parameters.
This corrects the former false negative about route availability. It stays outside
the initial candidate. Adjustment algorithms, coverage, revision/correction policy,
timezone, completeness and pagination/truncation remain unverified.

## Security and sandbox consequences

Credentials stay exclusively inside `packages/iol`; no portfolio, scheduler, AI,
MCP, trading research or generic HTTP utility may receive them. A narrow adapter
must not export tokens or generic requests. Token acquisition/refresh is a separate
private, fixed-origin auth boundary, not caller-accessible data allowlist access.
Fail closed, sanitize errors and never log complete sensitive responses.

H documents a sandbox with simulated operations and separate accounts. More
specifically, S's retrieved HTML sets `swashbuckleConfig.rootUrl` to
`https://api.invertironline.com` and discovery paths to `v1/swagger|v2/swagger`, and
warns of real effects. **Try it out from that UI must not be assumed sandbox-safe.**
The actual isolated environment's credentials, host, read coverage and data provenance
remain unknown and are unnecessary for offline Step 4 design. No sandbox write
call or pre-approved-Phase-9 broker-write code is authorized. Automated tests NEVER
call production trading endpoints; execution package remains absent.

## Data rights and automation

T's **Varios / Uso del Servicio** limits material to noncommercial use.
**Prohibición de retransmisión de datos**, within **Anexo A — Política de Uso del
Servicio**, conditions retransmission/publication on written author consent and
separately prohibits retransmitting, distributing or reproducing supplied ByMA
information. These headings identify the clauses without relying on rendered list
numbering.

T's **Simulador de Inversiones — Términos y condiciones de uso** discusses robotic,
repetitive, automatic/programmed techniques in its participation/disqualification
conditions. Its approximately 20-minute quote delay is **simulator-specific**, not
a production API guarantee. **Anexo C — Política de Apertura de Cuenta, clause 52**
also permits account blocking for robotic/repetitive/programmed/automatic techniques
used for fraudulent purposes at IOL's judgment. Neither clause is interpreted here
as a blanket ban on every API automation or as a collection license.

Storage, caching, retention, derived data, display, redistribution and commercial/
noncommercial API rights remain **UNKNOWN — must be verified** under applicable
API terms and market licenses. Persistent automated collection remains contractually/
legally gated; verification is required before Phase 2 market-data storage and
Phase 2.5 collection. User approval alone cannot override provider rights. No login,
terms acceptance or scraping of financial observations occurred in this research.

## UNKNOWN — grouped by the gate they affect

Every unresolved fact in this section is **UNKNOWN — must be verified**; where IOL
provides no guarantee, document that limitation and an explicit defensive project
policy rather than inventing provider behavior.

### Step 4 design

The four initial route/schema definitions are verified and implemented offline
under ADR-020. Numeric parsing, exact casing and deterministic allowlist tests are
implemented. The local minimum required fields and optional/null policy are
documented in `packages/iol/README.md`; these are defensive choices, not proof of
runtime guarantees. Offline success does not authorize real-account access.

### Resolve during Step 4 before real broker calls

Step 4B selects a conservative local policy (ADR-021), not verified provider
behavior: one password grant and a short in-memory session, no refresh/re-login,
stop on any unexpected status/shape. API activation, 2FA behavior and real response
content-type also remain UNKNOWN. The runner's JSON media-type and token-shape
requirements can reject live responses; do not weaken them to finish a session.

- Refresh lifetime, rotation/reuse/concurrency, `.refreshexpires` semantics,
  revocation, password re-login requirements and whether password storage is needed.
- Actual 400/401/404/429 and other error bodies, invalid-instrument/parameter behavior,
  Retry-After, quotas, retry and timeout policy. V2 candidate routes document only
  success; examples in another interface do not establish these runtime contracts.
- Explicit enum casing handling and lossless parsing are implemented/tested offline
  under ADR-020. Actual casing, required/nullable fields and payload completeness
  still need user-run verification. No permissive fallback.
- Verify quote-detail `volumenNominal` representation/range against its documented
  int32 contract during the gated user-run session. Step 4 retains strict int32
  behavior; the excluded CotizacionModel's double field does not change it.
- Sanitized **USER-RUN** read-only response-shape verification. The user retains
  credentials locally and supplies only explicitly sanitized evidence, never tokens
  or private payloads to agents. No agent-run authenticated calls.
- Cotizacion ambiguity must be resolved before adding that route; it can remain
  excluded without blocking the four initial reads. Verify returned quote context.

### Block Step 5 aggregation

MEP/CCL valuation interpretation of account `tipo`, `administrada_*`, cross-vocabulary
settlement mapping, and `totalEnPesos` FX/basis. Preserve `tipo + moneda + liquidacion`
and account provenance; do not collapse USD contexts or change Currency by assumption.

### Block Phase 2.5 and later (and earlier storage where applicable)

Storage/collection/redistribution rights; API rate limits; timestamp meaning/timezone;
real-time/delay and staleness guarantees; historical adjustment semantics; corrections,
revisions and coverage. Data-use rights also gate Phase 2 storage. Rate/error safety
must already be handled before Step 4 real calls; unattended collection requires its
own approved operating limits, not reuse of an unverified assumption.

### Future / non-blocking for initial design

Isolated sandbox details, Phase 9 write behavior and MCP-specific behavior. No future
phase is authorized here. Immutable security-ID/ISIN enrichment and underlying-symbol
relationships need later evidence before use, but need not block preserving raw
composite instrument fields during adapter design.

## Evidence matrix and ADR disposition

| Topic                                         | Status / source              | Consequence                                                              |
| --------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| Initial account/portfolio/title/detail routes | VERIFIED — V2 and D          | Four constrained reads implemented offline; live verification pending.   |
| Token request/response fields                 | VERIFIED — V1/A              | Lifecycle unknowns remain pre-live gates.                                |
| REST read-only scopes                         | UNKNOWN — must be verified   | Treat all REST tokens as write-capable; ADR-017 isolation.               |
| Dollar account categories / settlement enums  | VERIFIED — V2                | Preserve distinct fields; semantic equivalences remain Step 5 questions. |
| Bid/ask, quote values, numeric formats        | VERIFIED — V2                | Lossless text ingestion; no inferred execution price/precision.          |
| Casing discrepancy / GET–DELETE collision     | VERIFIED — V2 versus D / V2  | Explicit casing policy; full-tuple denial tests.                         |
| Homo UI production root                       | VERIFIED — S                 | UI is not proof of sandbox safety.                                       |
| Data-use restrictions / automation clauses    | VERIFIED wording/context — T | Permission for planned persistent collection remains unverified.         |

Step 3 required no new ADR. Step 4 adds ADR-020 for the offline adapter boundary,
lossless parser dependency and local validation policies, applying ADR-017,
ADR-019 and ADR-013. Historical accepted text is unchanged. Step 4 adds package
source/tests and the pinned parser/lockfile, but no financial HTTP endpoint,
collector, trading, scheduler, MCP, AI or broker writes. Token acquisition was
absent in the Step 4 baseline; Step 4B adds only the private manual password-grant
preparation under ADR-021, without executing it against IOL.
