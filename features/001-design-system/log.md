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

## 2026-09-26 resume
- T06 found with tester commit and uncommitted partial green, status
  still `todo`. Rebased task branch onto feature tip (picks up
  per-worktree e2e ports); TEST_SHA now 78b50e5. Resumed at 3b.
- Batch: T06 (resume), T03, T11. Parallel now that ports differ.

## 2026-09-26 T06 round 1 (resumed)
implementer (sonnet): 7/9 e2e, 17/17 unit; added unconditional
  `outline-focus` (outline-color was transitioning) and `py-3`
  (scale-97 active preview dropped height below 44)
- claimed test wrong: primitives.steps.ts reads first cell per row,
  T06/T07/T09 tables are one row; interaction.steps.ts:85 TS18048
reviewer: both claims valid; tester sent back to fix steps

## 2026-09-26 T11 round 1
tester: 3 scenarios, 0 unit tests, red OK (43ac9f1)
implementer (sonnet): SectionNav client component per plan (d1ccb93);
  @T02 8/8, @T11 2/6
- page height 757px < 800px viewport: no scroll room, Motion heading
  pinned at 202px; IntersectionObserver never fires
blocked: plan: T11 depends on T02 only, but its scroll scenarios need
  section content from later tasks. Worktree kept; implementation
  likely passes once content lands (rebase and rerun @T11).
tester: fixed steps (6dd397e): flatten state table, focusToken guard;
  then (dfbde63) snapshot adds `scale`/`translate`/`rotate` (Tailwind
  v4 `scale-97` sets `scale`, not `transform`). TEST_SHA dfbde63
implementer: green OK (e2e 9/9, unit 17/17, typecheck, lint)
reviewer: 3 major, 2 minor, 1 nit
- major  button.tsx:32  hover/active classes apply when disabled/loading
- major  button.tsx:92  no opacity pulse under reduced motion
- major  button.tsx:85  loading submit/reset button still submits form
- minor  button.tsx:97  loading without icon grows (label width shifts)
- minor  button.tsx:45  labelHidden 44px drops to 42.68 under scale-97
- nit    tests/steps/button.steps.ts:9  Loading figure not region-scoped
- note: reviewer suggested a unit test for loading submit; tests locked,
  left for the PR

## 2026-09-26 T06 round 2
implementer (sonnet): fixed round-1 majors + labelHidden minor
  (89b43a2); added `"use client"` (onClick now always a function).
  e2e 9/9, unit 17/17
- orchestrator: round 2 introduced arbitrary Tailwind values
  (`min-h-[calc(...)]`, `motion-reduce:[animation:...]`); sent to
  reviewer with that concern

## 2026-09-26 T13 round 1
tester: 1 outline (2 examples), 0 unit tests (44754a4); sent back once:
  required aria-label on decorative Do/Don't icons (duplicate
  announcement); now labels via visible text. red OK (a007b67)
reviewer: 1 blocker, 1 major, 1 minor
- blocker button.tsx:57  arbitrary `min-*-[calc()]`; also inert (cx
  does not merge, `min-h-touch` wins)
- major   button.tsx:117  arbitrary `[animation:...]` (D-3); regex gap
- minor   button.tsx:1  `"use client"` accepted; server callers can't
  pass `icon`
- follow-up (plan): labelHidden 44px drops to 42.68 under scale-97 in
  an Active preview; needs a token or no scale on labelHidden
- follow-up (tokens.css): add looping `--animate-pulse` for loading
  spinner under reduced motion; T06 uses `animate-fade-in` for now
- follow-up (T03): tailwind-arbitrary regex misses `variant:[prop:v]`

## 2026-09-26 T06 round 3
implementer (sonnet): reverted arbitrary sizing, spinner uses
  `motion-reduce:animate-fade-in`, comment on `"use client"` (b3f4a39)
reviewer: approved, 1 minor carried
- minor  button.tsx:1  comment reason inverted: the client boundary is
  what stops server callers passing `icon`
- nit    tests/steps/button.steps.ts:9  (round 1) Loading figure not
  region-scoped
merged: squash (this commit); regression @T01|@T15|@T02|@T04|@T06|@smoke 33/33, unit 138/138
