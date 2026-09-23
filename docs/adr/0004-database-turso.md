# 0004. SQLite via Turso (libSQL) with Drizzle

Date: 2026-09-22
Status: accepted


## Context

Preference for SQLite. Vercel functions have an ephemeral filesystem,
so a local SQLite file cannot persist in production.


## Decision

- Turso (hosted libSQL, SQLite compatible) in production.
- Local development: `file:local.db`. Tests: in-memory SQLite.
- Drizzle ORM and drizzle-kit migrations in
  `src/shared/db/migrations/`.


## Consequences

- Same SQL dialect everywhere; no Docker needed locally.
- Free-tier limits apply; revisit if usage grows.
- Network latency to Turso counts toward API budgets; choose a region
  close to the Vercel region.
