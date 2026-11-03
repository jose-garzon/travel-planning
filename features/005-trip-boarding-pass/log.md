# Log: Create a trip with a boarding-pass form and see it on home

## 2026-10-26 20:25 T01 round 1
implementer (sonnet): red OK (4b36a15 D-6, c6068bf), 4 scenario runs, 6 test files
green OK: 29/29 e2e desktop (@F3 + @T01), 260 unit
env: worktree needs DATABASE_AUTH_TOKEN=local for migrate and
BETTER_AUTH_URL=http://localhost:3101 for magic-link e2e
deviations (for review):
- ui/index.ts exports types only (dep rule); schema via index.ts
- GET /api/v1/trips ignores cursor/limit (nextCursor null)
- POST uses UTC today; tz cookie read deferred to T03
- "Trip created" is role=status on home via ?created=1
- currency list renders after hydration (ICU mismatch)
merged: a2ad5da (biome warnings: unused import get-home-trips.ts:2,
noDocumentCookie time-zone-cookie.tsx:19)

## 2026-10-26 20:28 visual gate: waiting
ready for review: T01 (/trips/new form, home next trip + other trips)

## 2026-11-02 Redesign: metro line world

The patch/denim world was replaced by a metro line world (DESIGN.md,
chosen in an /impeccable direction round). The boarding-pass form and
carousel became a route line. feature.md, plan.md, tasks.md and
tests.feature were updated: AC-3 now requires a city list on focus
(new @T02 scenario, EC-14), AC-7 to AC-9 describe the line, "Add leg"
became "Add stop". T01's form and home were restyled in place.

## 2026-11-02 Home as a timeline

Home now lists every trip as a same-size timeline row (next trip first,
then upcoming, then "Past trips"), each with its route as a short line
of station codes and its next step. UC-2 and AC-7 to AC-9 updated; the
full station-by-station line moves to the trip page (T05 form).
T04 keeps the current-stop rules, shown on the next trip's row.

## 2026-11-03 10:05 T03 round 1
implementer (sonnet): red OK (5beef27), 6 scenarios, 24 unit tests
green OK (verified: 55 unit, @T03 e2e desktop)
notes: legs 2+ From read-only Input; tz cookie (D-5) not wired

## 2026-11-03 10:15 T04 round 1
implementer (sonnet): red OK (1b8a442), 6/7 @T04 desktop pass
blocked: plan gap. "Current stop follows today" Example #3 (legs -5,-1,
expects current BCN) contradicts "Past trips move to other trips" and
feature.md current-stop rules. Fix the example (2nd leg after today).
also outside Files: shared/ui/tokens.css, tests/steps/support/trips.ts
worktree kept: .worktrees/T04

## 2026-11-03 10:40 T02 rounds 1-2
implementer (sonnet): red OK, green OK; round 2 = rebase onto T03
(conflict in leg-fields.tsx). verified: 80 unit, @T02|@T03 desktop 58
open: /trips/new <=170 KB gzip not measured (Lighthouse CI)
extra files: trips/index.ts (searchCities), leg-fields.tsx (exclude)

## 2026-11-03 10:42 visual gate: waiting
ready for review: T01 (still unanswered), T02 city combobox, T03
multi-leg form. T04 blocked (plan gap).

## 2026-11-03 visual gate: approved

## 2026-11-03 T05 round 1
implementer (sonnet): red OK (14ac63e), 4 scenarios, 21 unit/integration
test fix commit 67d2677 (nav mock Link; reason given)
verified: 101 trips unit, @T02|@T03|@T05 desktop 72 passed
extra files: use-route-editor.ts (initial legs), ports.ts
deviation: after delete shows "Trip deleted" + home link, not redirect
(AC-11); home page not in Files

## 2026-11-03 feature review
reviewer: 2 blocker, 3 major, 3 minor, 1 nit
- blocker city-combobox.tsx:56 edit page shows empty saved cities
- blocker trips/[tripId]/page.tsx:23 notFound gives default English 404
- major   form.json:26 "Add a leg" vs spec "Add stop"/"Add return home"
- major   trip-form.tsx:246 delete does not go home (AC-11)
- major   api trips/[tripId]/route.ts:26 error messages not localized
- minor   drizzle repo:62 update hard-codes role owner
- minor   trip-form.tsx:236 discard uses full reload
- minor   api cities/route.ts:14 q has no length cap
- nit     /trips/new JS budget unmeasured

## 2026-11-03 blocker recheck
fix round 1: efc03a1 test, d5b912f fix. verified: 103 unit, 72 e2e desktop
reviewer: both blockers resolved, approved
- minor  trips/[tripId]/page.tsx:23 soft 404 (200); move to not-found.tsx
