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

## 2026-11-02 21:28 visual gate: approved
user waived gate; T01 UI reviewed by user.

## 2026-11-02 21:34 T03 round 1
implementer (sonnet): red OK (9a54176), 6 scenarios, 13 unit tests; green OK
merged. Note: touched city-combobox.tsx (defaultValue prop) outside Files.

## 2026-11-02 21:42 T02 round 2
implementer (sonnet): red OK (15afb3d), 4 scenarios, 26 unit tests; rebased on T03, combobox listbox renamed (test fixture fix commit)
merged. /trips/new gzip JS ~200 KB by implementer count (T01 baseline 198 KB); 170 KB budget unverified (carried to PR). /cities got extra params exclude, region.

## 2026-11-02 21:43 T04 round 1
implementer (sonnet): red OK (04e08b1), 4 scenarios/7 examples, 23 unit tests; one test-fix commit (expectation BAR not BCN)
merged. For PR: 1-day grace so a non-return trip ends the day after its last leg (needed by example -5/-1); newest tokens.css utility outside Files; next trip shows full line (per tests.feature), others compact. Lighthouse CLS not run.

## 2026-11-02 21:51 T05 round 1
implementer (sonnet): red OK (185fed0), 4 scenarios, 14 unit + 4 integration tests; green OK
merged. For PR: no separate offline message (reuses save-failed text); focus-return not unit-tested; Cancel link moved into TripForm.

## 2026-11-02 22:10 feature review
reviewer: 0 blocker, 4 major, 5 minor, 1 nit (carried to PR; targeted review)
- major  evidence: no screenshot of the edit page (misleading one removed)
- major  drizzle-trips-repository.ts:92  update reloads via first member row; pass caller userId before #6 adds members
- major  api/v1/cities/route.ts:12  extra params exclude/region and short-q popular list not in plan contract
- major  /trips/new JS budget (170 KB) and Lighthouse CLS not measured; implementer count ~200 KB
- minor  Trip.role typed too wide (casts in update-trip/delete-trip); [tripId] route uses UTC today, not tz cookie; API error messages English only; 1-day grace rule not in feature.md; no offline message / focus-return test

## 2026-11-03 T04 dropped
user rejected the home trip line design. AC-7..AC-9, EC-12, EC-13 moved
to out of scope; @T04 scenarios removed from tests.feature. Home keeps
the T01 timeline rows.
