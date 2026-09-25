# Architecture Standard

Feature modules with layers inside, based on Clean Architecture.
Goal: each business capability can be read, changed and tested alone,
and business rules never depend on frameworks or storage.

Enforced by dependency-cruiser (`.dependency-cruiser.cjs`,
`pnpm lint:deps`). A violation fails CI.


## Big picture

```
  src/app/          ◄── composition: routes, pages, API, wiring
     │   │
     │   ▼
     │  src/modules/<feature>/     ◄── one per business capability
     │      │                          never import each other
     ▼      ▼
  src/shared/       ◄── design system, db, i18n, kernel, config
                        imports nothing from app or modules
```

- `app` may import `shared` and the **public API** of any module.
- A module may import only itself and `shared`.
- `shared` imports only `shared`.

If two modules need to talk, the app layer connects them (see
"Crossing modules"). If both need the same concept, it moves to
`shared/kernel`.


## Modules

| Module         | Owns                                               |
| -------------- | -------------------------------------------------- |
| `auth`         | sessions, sign in (magic link), current user       |
| `trips`        | trip, members, roles, invites                      |
| `destinations` | cities in a trip with date ranges                  |
| `itinerary`    | activities scheduled on days, participants         |
| `budget`       | cost items, categories, splits, totals             |
| `agent`        | LLM agent: prompts, tools, search, suggestions     |
| `styleguide`   | `/styleguide` screen (UI-only, ADR 0008)           |

New modules need an ADR.


## Layers inside a module

```
src/modules/trips/
  domain/           entities, value objects, rules. Pure.
  service/          use cases + ports (interfaces the service needs)
  data/             port implementations: Drizzle repositories, APIs
  ui/
    components/     React components (presentational)
    hooks/          client hooks (data fetching, local state)
    index.ts        public client API
  messages/         en.json, es.json (namespace = module name)
  index.ts          public server API: wires data into service
```

A module has only the layers it needs. A UI-only module (no
business rules, ADR 0008) has `ui/`, `messages/` and `index.ts`.
Messages may be split into `messages/<locale>/<part>.json`.

Dependency direction:

```
  ui ──(types only)──► service ──► domain
                         ▲
  data ──────────────────┘ (implements ports)
```

| Layer    | May import                             | Must not import       |
| -------- | -------------------------------------- | --------------------- |
| domain   | domain, `shared/kernel`                | everything else       |
| service  | domain, `shared/kernel`, `shared/config` | data, ui, `shared/db` |
| data     | service (ports), domain, `shared/db`   | ui                    |
| ui       | domain, service **types**, `shared/ui`, `shared/i18n` | data, `shared/db` |
| index.ts | anything in its module, `shared`       | other modules         |

Outside a module, only `modules/<m>/index.ts` (server) and
`modules/<m>/ui/index.ts` (client) may be imported.


## Rules

1. **Domain is pure.** No I/O, no framework, no `Date.now()` or random.
   Pass clocks and ids in.
2. **One use case, one action.** `createTrip`, `inviteMember`,
   `subscribeToActivity`. Not a `TripService` with 20 methods.
3. **Ports belong to the service.** The use case declares what it
   needs (`TripRepository`, `ActivityCostsReader`); `data/` or the app
   layer provides it.
4. **Use cases return plain DTOs**, never Drizzle rows.
5. **Validate at the edge, enforce in the domain.** Route handlers
   parse with Zod; domain guards invariants.
6. **Authorization lives in use cases.** Every use case that touches a
   trip checks the caller's role (owner, editor, viewer).
7. **UI gets data through props or the API**, never by calling data or
   service code directly. Server components in `app/` call the
   module's `index.ts` and pass results down.
8. **Server-only code imports `server-only`.** `data/`, `index.ts`,
   `shared/db`, `shared/config`.


## Crossing modules

Modules never import each other. Two ways to connect them:

### 1. Ports wired in the app layer (default)

The consumer declares a port in its service. The app layer adapts
the provider's public API to it.

```ts
// modules/budget/service/ports.ts
export interface ActivityCostsReader {
  listForTrip(tripId: TripId): Promise<ActivityCost[]>;
}

// app/_composition/budget.ts
import { createBudgetModule } from "@/modules/budget";
import { itinerary } from "@/modules/itinerary";

export const budget = createBudgetModule({
  activityCosts: {
    listForTrip: (tripId) => itinerary.listActivityCosts(tripId),
  },
});
```

Typical ports:
- `TripAccess` (role of a user in a trip): used by every module,
  provided by `trips`.
- `ActivityCostsReader`: `budget` ← `itinerary`.
- `ItineraryWriter`, `BudgetWriter`: `agent` ← `itinerary`, `budget`
  (apply approved suggestions).

### 2. Shared kernel

Concepts with identical meaning everywhere: `TripId`, `UserId`,
`Money`, `Currency`, `DateRange`, `Result`, domain error base. Small
and stable. If it has behavior specific to one feature, it does not
belong here.


## Shared

```
src/shared/
  kernel/     ids, Money, DateRange, Result, errors (pure)
  ui/         design system: tokens, primitives on Radix
  db/         Drizzle client, schema (one file per module), migrations
  i18n/       routing, navigation, shared messages
  config/     env validation (Zod)
```

**Why DB tables live in `shared/db/schema/`:** one SQLite database,
and foreign keys cross modules (`activity.trip_id → trip.id`).
Defining tables in modules would force cross-module imports. Each
module owns its file (`schema/trips.ts`) and only its own `data/`
layer queries those tables by convention; the reviewer checks this.


## App layer

```
src/app/
  [locale]/            pages and layouts (server components)
  api/v1/              route handlers: parse → use case → respond
  _composition/        wiring modules together, i18n request config
src/proxy.ts           locale routing (Next 16 "proxy", formerly middleware)
```

`src/app` is a router (ADR 0008): only Next route files
(`page`, `layout`, `loading`, `error`, `global-error`,
`not-found`, `template`, `default`, `route`), `globals.css` and
`_composition/`. No `_components` or other UI folders. Screen UI
lives in a module's `ui/`; UI on every page (root header) lives in
`src/shared/ui/components/`. Rule `app-is-a-router` enforces it.

Route handlers and pages stay thin: no business logic.


## API

- Public, versioned: `/api/v1/...`. Future native clients use it.
- Request and response schemas in Zod, shared with the client.
- Errors: `{ "error": { "code": "TRIP_NOT_FOUND", "message": "..." } }`
  with a stable `code` per domain error.
- Server Actions allowed only as thin callers of the same use cases.


## Architecture Decision Records

Project-wide decisions go in `docs/adr/NNNN-title.md`:

```
# NNNN. Title

Date: YYYY-MM-DD
Status: proposed | accepted | superseded by NNNN

## Context
## Decision
## Consequences
```

Write one when a choice is hard to reverse or affects many features:
new dependency, storage, auth, API style, new module, layer exception.
