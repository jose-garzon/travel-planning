# Test summary (feature 009)

- Unit (`pnpm test:unit`): 444 passed.
- E2E `pnpm test` (desktop + mobile, dev): 344 passed, 2 failed.
  - Failing: F005 "Adding legs chains cities" and "Same city in
    different legs" (desktop). Pass alone; fail in every full run
    this session. A comparison run on `main` was inconclusive (port
    mix-up), so it is not proven pre-existing. Open for review.
  - Flaky under load, pass alone: F005 "Edit a trip", F009 "Two
    editors save at once", F3 name capture a11y (missing title on
    cold compile).
- E2E @F009, both projects: 70 passed (after mobile disclosure fix).
- `pnpm lint`: 0 errors, 5 warnings. `pnpm lint:deps`, `pnpm
  typecheck`, `pnpm build`: pass.
- Screenshots: `pnpm screenshots --grep @F009`, 35 passed; selection
  in `screenshots/`.
- Lighthouse not run (no full Chrome in WSL).
