# Performance Standard

Performance problems are **blockers** in review. Every plan.md declares
budgets; tests or tools measure them.


## Default budgets

Plans may tighten these, never loosen them without an ADR.

### Web (field-like, mid-tier mobile, 4G)

| Metric                          | Budget       |
| ------------------------------- | ------------ |
| Largest Contentful Paint (LCP)  | ≤ 2.5 s      |
| Interaction to Next Paint (INP) | ≤ 200 ms     |
| Cumulative Layout Shift (CLS)   | ≤ 0.1        |
| JS per route (gzip)             | ≤ 170 KB     |

### API

| Metric                          | Budget       |
| ------------------------------- | ------------ |
| p95 latency, read               | ≤ 200 ms     |
| p95 latency, write              | ≤ 400 ms     |
| Queries per request             | constant, not O(n) |


## Blockers (always)

- N+1 queries.
- Unbounded lists: every list endpoint paginates; every long UI list
  paginates or virtualizes.
- Missing index for a query the feature adds on a growing table.
- Blocking the main thread with heavy work during interaction.
- Loading a large dependency for a small use; no code splitting on a
  heavy route.
- Layout shift from images or async content without reserved space.
- Unnecessary re-renders of large trees on each keystroke.
- Work repeated in loops that could be done once.


## Measuring

- `@perf` scenarios assert budgets where measurable in tests.
- Lighthouse CI (`lighthouserc.json`) in every PR: LCP, CLS, TBT
  (proxy for INP in the lab), JS size per route, a11y score 100.
- Query count assertions in integration tests for list endpoints.
