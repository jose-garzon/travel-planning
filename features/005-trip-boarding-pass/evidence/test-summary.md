# Test summary (feature 005)

- Unit (`pnpm test:unit`): 347 passed.
- E2E @F005, desktop dev: 25 passed. Production build (CI=1,
  desktop + mobile): 50 passed.
- Full e2e in dev mode is flaky on feature 003 (magic link) under
  parallel load, and fails on 003 in a production-mode run; not
  touched by this feature.
- `pnpm lint`: 0 errors, 6 warnings. `pnpm lint:deps`, `pnpm
  typecheck`, `pnpm build`: pass.
- Lighthouse not run (no full Chrome in WSL).
