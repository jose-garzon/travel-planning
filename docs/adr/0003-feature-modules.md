# 0003. Feature modules with internal layers

Date: 2026-09-22
Status: accepted


## Context

Code must stay understandable as features grow, and agents working in
parallel must not step on each other.


## Decision

Code is split into feature modules (`src/modules/<feature>`) with
layers inside (`domain`, `service`, `data`, `ui`). Modules never
import each other. The app layer (`src/app`) composes them through
ports; truly common concepts live in `src/shared`. Rules are enforced
by dependency-cruiser in CI and pre-push.

Database tables live in `src/shared/db/schema/` (one file per module)
because foreign keys cross modules.

See `docs/standards/architecture.md`.


## Consequences

- More wiring code in `src/app/_composition/`. Accepted for isolation.
- Each module's tests run without other modules.
- Parallel tasks in different modules rarely conflict.
- Tables in shared is a known exception: the reviewer checks that a
  module queries only its own tables.
