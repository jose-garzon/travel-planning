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

## 2026-09-26 T13 round 1 review
implementer (haiku): green OK (37940c4); @T13+@T02 12/12
reviewer: 2 major, 6 minor, 3 nit
- major  brand-section.tsx:25  wordmark direction text missing
- major  es/brand.json:4  meaning is a calque, not natural es-CO
- minor  es copy (añadir→agregar, "Guardar el viaje"), Text translateId,
  duplicated Do/Don't markup; nits: what-comments, Stack as article

## 2026-09-26 T13 round 2
implementer (haiku): fixed both majors and most minors (5e3e302);
  @T13+@T02 12/12
reviewer: 1 major, 1 minor, 1 nit
- major  brand-section.tsx:29  `@ts-expect-error` on a dynamic key
  disables key checking; type the key as a literal union
- minor  en/brand.json:6  wordmarkDirection not sentence case
- nit    brand-section.tsx:46  wordmark row lacks `wrap`

## 2026-09-26 T13 round 3
implementer (haiku): typed voice keys, no `@ts-expect-error`, sentence
  case, wrap (9ec3477); @T13+@T02 12/12
reviewer: approved, 1 minor carried
- minor  es/brand.json:6  «Parche» capitalized while describing a
  lowercase wordmark; reword ("En minúsculas, «parche» en Fredoka…")
merged: squash (this commit); regression done tags + smoke 37/37, unit 138/138

## 2026-09-26 T08 round 1
tester: 2 outlines, 6 unit tests (8f08bee); red not rerun by
  orchestrator (implementer already on the worktree port)

## 2026-09-26 T03 round 1
tester: 15 scenarios/outlines (60 runs), 0 unit tests, red OK (c1eb50d)
implementer (sonnet): 4 plugins, biome.json, router rule; rebased onto
  feature tip, @T03 60/60, whole-repo lint clean (0fb039a)
reviewer: 4 major, 3 minor, 2 nit
- major  .dependency-cruiser.cjs:5  FORCE_COLOR hack in config; real
  defect in tests/steps/support/process.ts (tester fixes)
- major  no-inline-style/tailwind-arbitrary/raw-js grit: `.` misses
  newlines, multi-line code bypasses rules; use `(?s)`
- minor  raw-css: multi-line decl; `var(--color-white)` false positive
- minor  follow-up (plan): arbitrary properties `hover:[color:red]`
  escape every rule

## 2026-09-26 T08 round 1 (green)
implementer (sonnet): Radix tooltip, demo, messages (2afc3b2, rebased)
- orchestrator: @T08 flaked once (Escape/blur, toHaveText) in a
  combined run; 3 reruns 3/3. Sent to reviewer to find the owner
reviewer: 1 blocker, 2 major (test), 1 minor, 1 nit
- blocker tooltip.tsx:35  keyboard focus on off-screen trigger:
  global `scroll-behavior: smooth` (globals.css, T01) scrolls, Radix
  closes tooltip on ancestor scroll ~20ms after open (probe 25/25)
- major  tooltip.steps.ts:20  "I see the tooltip" passes on one poll
- major  interaction.steps.ts:44  refocus is a no-op, blur check empty
- minor  message key `tip` should be `content` (plan example)
- decision: fix in Tooltip (open state guarded while trigger focused,
  except Escape). globals.css left alone (not T08's file); follow-up:
  consider dropping global smooth scroll in favor of T11's JS scroll.
- exception: tester allowed to edit tests/steps/interaction.steps.ts
  (T06's file) for the refocus fix

## 2026-09-26 T03 round 2
tester: harness disables color (3638876)
implementer (sonnet): hack removed, `(?s)` in plugins, named-color
  guard (8be511c); @T03 60/60, lint clean, no `errored:`
reviewer: approved, 1 minor carried
- minor  raw-css-values.grit:21  `color:red` (no space) missed; the
  formatter inserts the space, so formatted code is safe
- follow-up (plan): arbitrary properties `hover:[color:red]` escape
  every rule
merged: squash (this commit); regression done tags + smoke 97/97, unit 138/138, lint clean

## 2026-09-26 resume
- workflow skills updated mid-run (context packets, single end-of-
  feature review replaces per-round tester+reviewer). Committed
  pending workflow/doc changes (08f0e41, 634d551) before resuming.
- resumed T05: TEST_SHA f80e2cb, uncommitted green work in progress
  (theme.ts, theme-toggle.tsx untracked; layout.tsx, site-header.tsx
  modified) kept as-is.
- resumed T08: TEST_SHA fe7dde3, wip 7d676e5 kept; uncommitted step
  fixes (interaction.steps.ts, tooltip.steps.ts) for the prior
  reviewer's blocker/major findings kept as-is.
- T07: worktree/branch had no test(...) commit (never started);
  removed and recreated fresh from feature tip.
- Batch: T05 (resume), T07 (fresh), T08 (resume). T16 waits for a
  free slot.

## 2026-09-26 T05 round 1 (resumed)
implementer (sonnet): found theme.ts/theme-toggle.tsx already correct;
  layout.tsx wired cookies/parseTheme but never rendered data-theme;
  header.themeToggle.* messages missing entirely — added both (0488258)
orchestrator verified: e2e @T05 10/10 (desktop), unit 16/16, clean tree
merged: squash

## 2026-09-26 T08 round 2 (resumed)
implementer (sonnet): guarded Tooltip open state while trigger has
  focus (ancestor-scroll from T01 smooth-scroll no longer closes it
  early), fixed flaky steps, renamed message key tip→content (e3bd5f1
  test, 6091fa2 wip)
orchestrator verified: e2e @T08 2/2, unit 6/6, @T06 regression 5/5,
  clean tree
merged: squash

## 2026-09-26 T07 round 1 (fresh, then a commit-hygiene fix)
implementer (sonnet): Input with error state; found stacking
  `animate-fade-in` + `motion-safe:animate-shake` on one node makes
  the later rule fully replace the CSS `animation` shorthand instead
  of both running — split the two classes across the error row and
  its icon+text span (documented in input.tsx) (a632b42 test,
  b4e3f96 wip)
- orchestrator: wip commit had silently edited input.test.tsx
  (destructured `ids[0]`/`ids[1]`, dropped `toHaveLength(2)`); sent
  back
implementer: reset to TEST_SHA content, needed `as string` for
  `noUncheckedIndexedAccess`; committed that alone as
  `test(design-system): T07 fix ids indexing under
  noUncheckedIndexedAccess` (acefe5e)
orchestrator verified: e2e @T07 3/3, unit 10/10, typecheck clean
merged: squash

## 2026-09-26 visual gate: waiting
Gate was overdue: T02/T04/T06/T13 already merged UI before this run
without one. Captured all done UI tasks together
(@T01|@T02|@T04|@T05|@T06|@T07|@T08|@T13|@T15), both projects:
desktop 31/31, mobile 29/29.
evidence/gate/: 6 images
- home-desktop.png / home-mobile.png — home page, header + wordmark
- styleguide-brand-dark-desktop.png — Brand section, dark theme
- styleguide-brand-light-mobile.png — Brand section, light theme,
  nav wrapped (mobile width)
- styleguide-primitives-desktop.png — Primitives section: Button
  (loading/disabled), Input (default/hover/focus/disabled/error),
  Tooltip (open, describing its trigger)
- styleguide-nav-narrow-mobile.png — section nav wraps on a narrow
  screen, no horizontal scroll

## 2026-09-26 visual gate: change requests (round 1 of 2)
User rejected. Requests split:
- already scheduled, not regressions: Card/Dialog missing (T09/T10,
  todo), Color/Type/Spacing/RadiusShadow/Motion/Icons sections empty
  (T12, todo — spec says title-only until then), palette not
  matching docs/styleguide.md (T16, todo), nav no active state (T11,
  blocked), button demo not in a row (T14, todo — plan already flags
  this file for T14 specifically)
- real gaps, fixing now: header/home-page x-padding mismatch,
  sections have no visual rhythm (docs/styleguide.md "Space usage
  guide" wants 8-16 between them), page h1 unstyled
Spawned implementer (sonnet) directly on feat/001-design-system for
the three real items.

## 2026-09-26 visual gate: fix round 1
implementer (sonnet): home `<main>` gets `px-4`; styleguide h1 →
  `mt-8 mb-8 text-3xl text-accent`; StyleguideSection → `mt-16
  border-t border-border pt-16 first:mt-0 first:border-t-0
  first:pt-0` (fae9cda)
orchestrator verified: e2e @T01|@T02|@T04|@T05|@T06|@T07|@T08|@T13|
  @T15|@smoke 34/34 desktop, re-captured evidence/gate/ (desktop
  31/31, mobile 29/29)
visual gate: waiting (round 2 of 2)

## 2026-09-26 visual gate: change requests (round 2 of 2, final)
User repeated the already-scheduled items (Card/Dialog, T12 section
content, nav active-state, button row). Asked the user directly
whether to fast-track those now or keep the normal per-task pipeline
(AskUserQuestion) — chose the normal pipeline; those stay on
T09/T10/T11/T12/T14/T16 as already logged, no further discussion.
Three new, real, in-scope items this round:
- dividers were missing on the first top-level section and on every
  demo sub-section inside Primitives (only the top-level
  section-to-section gap had one from round 1)
- sticky nav touches the viewport top edge once scrolled
- Tooltip content has `sideOffset=0` (Radix default) and no arrow —
  no gap or visual link to its trigger
This is the last gate round (loop cap 2); after verifying this fix,
remaining out-of-scope requests stay logged against their tasks and
the run continues at Step 1 regardless of further gate feedback.

## 2026-09-26 visual gate: fix round 2
implementer (sonnet): removed first-section divider exemption; added
  same divider class to all 6 Primitives demo sub-sections; nav
  `md:pt-6`; Tooltip `sideOffset={8}` + `<Arrow className="fill-text">`
  (cc0b443)
orchestrator verified: e2e @T01|@T02|@T04|@T05|@T06|@T07|@T08|@T13|
  @T15|@smoke 34/34, typecheck clean, re-captured evidence/gate/
  (desktop 31/31, mobile 29/29)
Loop cap reached (2/2 gate-fix rounds). Any further gate feedback
gets logged and carried to the PR; run continues at Step 1
regardless.
visual gate: waiting (final)
