# 0008. UI-only modules; `src/app` is a router

Date: 2026-09-24
Status: accepted


## Context

Next.js private folders (`_components`, `_sections`) let UI live
under `src/app` next to routes. That spreads screen code across the
router, outside the module boundaries that dependency-cruiser
enforces. Some screens have no business rules at all (the
`/styleguide` page of feature #1), so they do not fit a
domain/service/data module either.


## Decision

- `src/app` is a router. It holds only Next route files (`page`,
  `layout`, `loading`, `error`, `global-error`, `not-found`,
  `template`, `default`, `route`), `globals.css` and
  `_composition/` (wiring). No component folders.
- Rule `app-is-a-router` in `.dependency-cruiser.cjs`: files in
  `src/app` may not import non-route `.tsx` files in `src/app`.
- A screen owned by one capability lives in that capability's
  module under `ui/`. A screen with no business rules gets a
  **UI-only module**: `ui/`, `messages/` and `index.ts`, no
  `domain`, `service` or `data`. `styleguide` is the first.
- UI used by every page (root header) lives in
  `src/shared/ui/components/`.
- A module may split its messages into
  `messages/<locale>/<part>.json` when parallel tasks would
  otherwise edit one file. Its `index.ts` exports the loader;
  `_composition/i18n-request.ts` merges it.


## Consequences

- Pages are a few lines: metadata plus one module component.
- Every screen is covered by module boundary rules.
- One more module in the table; UI-only modules still need an ADR
  or a line in the feature plan that creates them.
