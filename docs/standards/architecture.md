# Architecture Standard

Based on Clean Architecture (Robert C. Martin). The goal: business rules
that do not know about frameworks, databases or UI, so each can change
or be tested alone.


## Layers

```
  ┌───────────────────────────────────────────────┐
  │ presentation   UI, HTTP handlers, CLI         │
  │  ┌─────────────────────────────────────────┐  │
  │  │ infrastructure  DB, APIs, queues, files │  │
  │  │  ┌───────────────────────────────────┐  │  │
  │  │  │ application   use cases, ports    │  │  │
  │  │  │  ┌─────────────────────────────┐  │  │  │
  │  │  │  │ domain  entities, rules     │  │  │  │
  │  │  │  └─────────────────────────────┘  │  │  │
  │  │  └───────────────────────────────────┘  │  │
  │  └─────────────────────────────────────────┘  │
  └───────────────────────────────────────────────┘
```

| Layer          | Contains                          | May import           |
| -------------- | --------------------------------- | -------------------- |
| domain         | entities, value objects, rules    | nothing outside      |
| application    | use cases, ports (interfaces)     | domain               |
| infrastructure | port adapters: DB, HTTP clients   | application, domain  |
| presentation   | UI, controllers, route handlers   | application, domain  |

Wiring (composition root) is the only place that knows every layer.


## Rules

1. **Dependencies point inward.** An inner layer never imports an outer
   one. Enforced by a lint rule (TBD per stack).
2. **Use cases are the API of the app.** Presentation calls use cases,
   never repositories or the DB directly.
3. **One use case, one action.** `CreateTrip`, `AddStopToTrip`. Not
   `TripService` with 20 methods.
4. **Ports belong to the application.** The use case defines the
   interface it needs (`TripRepository`); infrastructure implements it.
5. **Domain is pure.** No I/O, no framework types, no clock or random
   calls; pass them in.
6. **Cross boundaries with plain data.** Use cases return DTOs, not ORM
   models or framework objects.
7. **Validate at the edge, enforce in the domain.** Presentation checks
   shape; domain enforces invariants.
8. **Organize by feature, then by layer.** Top-level folders are
   business capabilities (`trips/`, `bookings/`), each with its layers.


## Folder shape

```
src/
  <capability>/
    domain/
    application/
    infrastructure/
    presentation/
  shared/            only truly shared kernel (ids, money, result)
  main/              composition root, config, wiring
```

Exact paths: TBD per stack, recorded in `CLAUDE.md` Layout.


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

Write an ADR when a choice is hard to reverse or affects many features:
new dependency, storage, auth model, API style, layer exception.
