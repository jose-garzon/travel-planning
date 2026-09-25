# Log: Design system

## 2026-09-24 setup
- No SSH access to origin: skipped `git pull`; branch
  `feat/001-design-system` already existed, reused.
- Issue label was `phase:refining`; set `phase:in-progress`.
- Tasks run one at a time: every worktree's e2e run uses port 3000
  with `reuseExistingServer`, so parallel tasks would test each
  other's dev server.

## 2026-09-24 T01 round 1
tester: 3 scenarios (+ smoke), 67 unit tests, red OK (c9344c2)
- bddgen fails repo-wide on steps of later tasks; orchestrator had
  implementer add `missingSteps: "fail-on-run"` to playwright.config.ts
implementer (sonnet): claimed test wrong (support/tokens.ts threw on
  `var()` to tokens defined by next/font, not @theme)
reviewer: claim valid; tester fixed helper (dff5c89)

## 2026-09-24 T01 round 2
implementer (sonnet): dropped font var fallbacks from @theme; green OK
- e2e @T01|@smoke 12/12, unit 66/66, typecheck, lint pass
reviewer: approved, no findings
