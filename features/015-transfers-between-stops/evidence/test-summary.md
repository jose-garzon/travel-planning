# Test summary (2026-11-12, feat/015-transfers-between-stops @ c3936d0)

- pnpm test (final): 389 passed, 5 failed in F003/F005/F009 under load; all 12 pass alone. F015 48/48 desktop+mobile.
  - F015 Edit and delete a transfer ("transfer shows AV9512")
  - F015 Join and leave an opt-in transfer (budget 25 COP)
  - F3 First-time name capture Examples #3, #4 (magic link, pre-existing)
- pnpm screenshots --grep @F015: 25/25 passed (after next-transfer move to home)
- pnpm lint: pass (5 warnings)
- pnpm typecheck: pass
- pnpm build: pass
- unit: 706 passed
