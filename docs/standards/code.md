# Code Standard

Base: Google TypeScript Style Guide, plus the rules below.
Tools enforce formatting and most rules. This file covers what tools
cannot, and explains why.

Tooling: Biome (format + lint), dependency-cruiser (boundaries),
TypeScript strict. Run `pnpm lint` and `pnpm typecheck`.


## Principles

1. **Readable beats clever.** Code is read far more than written.
2. **Small units.** Functions do one thing. Aim under ~30 lines; files
   under ~300. Past that, split.
3. **Make illegal states unrepresentable.** Prefer types and value
   objects over comments and runtime checks.
4. **No speculative generality.** Build for today's tasks.md, not a
   possible future. Three copies before an abstraction.
5. **Fail loud and early.** Validate inputs at boundaries. Never swallow
   errors.
6. Do not carry optional values when there is a risk of failure.


## Naming

- Names say intent, not type: `tripsByDate`, not `tripList`.
- Use the domain language from `feature.md` and the plan's Naming table.
  One concept, one name, everywhere.
- Booleans read as questions: `isPublished`, `hasStops`, `canEdit`.
- Functions are verbs: `calculateBudget`. Use cases are verb-noun
  functions: `createTrip`, `subscribeToActivity`.
- No abbreviations except universal ones (`id`, `url`, `api`).
- Casing: `camelCase` values and functions, `PascalCase` types and
  components, `kebab-case` file names, `SCREAMING_SNAKE` env vars.
- React: named exports for components; default export only where
  Next requires it (pages, layouts, route files).


## Functions

- Max 1 positional params. More: pass an object.
- No boolean flag params that switch behavior. Make two functions.
- Pure where possible. Side effects at the edges.
- Return early instead of nesting.


## Errors

- Expected failures (validation, not found, conflict) are typed results
  or domain errors with a stable `code`, not generic exceptions.
- Unexpected failures throw and are caught once, at the edge, logged
  with context, and mapped to a safe user message.
- Never leak internals (stack traces, SQL) to users.


## Comments

- Explain why, not what. If a comment explains what, rename instead.
- Link decisions: `// See ADR 0003`.
- No commented-out code. Git remembers.
- TODOs need an issue: `// TODO(#42): ...`.


## Dependencies

- Adding a runtime dependency requires a line in the plan's Decisions.
- Prefer the platform and standard library.
- Pin versions via lockfile. Lockfile is committed.


## Security

- Never commit secrets. Config via environment variables, documented in
  `CLAUDE.md` Gotchas.
- Validate and authorize every entry point.
- Parameterized queries only. Escape output by default.
