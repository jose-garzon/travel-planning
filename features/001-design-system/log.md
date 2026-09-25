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

## 2026-09-24 T15 round 1
tester: 1 scenario, 7 unit tests, red OK (9167dd4)
- also added RTL `cleanup` to tests/setup/vitest.ui.ts (no vitest globals)
implementer (sonnet): green OK
reviewer: approved, 2 minor, 1 nit carried
- minor  src/app/_composition/i18n-types.d.ts:9  `AppConfig` lacks
  `Locale`; adding it needs a `hasLocale` guard in
  src/app/[locale]/page.tsx (not in any task's Files)
- minor  src/shared/ui/components/site-header.tsx:8  home link has no
  token focus ring / touch-target classes (still meets 2.5.8)
- nit    src/shared/ui/components/icon.tsx:2  merge duplicate imports

## 2026-09-24 T02 round 1
tester: 4 scenarios, 5 unit tests, red OK (e51254b)
- "Styleguide shell fits a narrow screen" passed before implementation
  (the 404 page does not overflow either)
implementer (sonnet): green OK
reviewer: approved, 3 minor, 1 nit carried
- minor  src/modules/styleguide/ui/sections/brand-section.tsx:4  each
  section repeats id/titleKey already in STYLEGUIDE_SECTIONS
- minor  src/modules/styleguide/ui/sections/sections.ts:17  titleKey
  not tied to messageKey by type
- minor  src/modules/styleguide/messages/load.ts:61  `?.default` + cast
  can hide a bad import
- nit    src/modules/styleguide/messages/es/tooltip.json:2  "Consejo"
  is an odd name for Tooltip

## 2026-09-24 T04 round 1
tester: 1 scenario, 41 unit tests; first red commit added production
  stubs (text.tsx, stack.tsx), sent back once; red OK (fc4b722)
implementer (sonnet): green OK
reviewer: approved, 2 nit carried
- nit  src/modules/styleguide/ui/demos/layout-demo.tsx:7  parallel
  FONT_SIZE_LABELS / FONT_SIZES lists can drift
- nit  src/modules/styleguide/ui/demos/layout-demo.tsx:27  token names
  render as <p>, could be <code>
