# Log: Account creation, sign-in and home page

## 2026-09-27 setup
branch feat/3-signup-signin-home created off main
issue #3 labeled phase:in-progress

## 2026-09-27 T00 round 1
implementer (sonnet): red OK (efbc542), 1 e2e scenario + 1 integration
test. green OK (ca17b26).
verified: @T00 e2e (desktop) 1/1, unit 215/215, typecheck clean, lint
clean (2 pre-existing warnings unrelated), db:generate/migrate clean.
implementer self-resolved two plan gaps instead of stopping (told not
to): (1) Better Auth requires a 4th core table `account`, missing from
plan.md's data model — added, additive, confirmed by runtime error.
(2) `getHomeTripsSummary`'s contract said `userId` but its port takes
email, and `trips` cannot read `user` data across the module boundary
— added `email` to `CurrentUser`, changed the use case's param to
`email`. Both additive/consistent, no naming conflicts; verified
in-code and accepted rather than blocking. plan.md corrected to match.
merged: f6d15c0
post-merge: main checkout needed `pnpm install` + `pnpm db:migrate`
(new deps/migration only existed in the worktree) — unit tests then
215/215.

## 2026-09-27 visual gate: waiting
ready for review: T00 (landing page at `/`, static shells for
name-capture and home — not yet interactive, that's T01/T02/T03).

## 2026-09-27 visual gate: change requests (round 1)
user: mobile-only layout, doesn't look good on desktop; center
content; add a big animated logo above the title; add a catchy
product description inviting sign-in; make desktop look good.
spawning implementer (sonnet) on feat/3-signup-signin-home directly.
fixed: 56bdb7d. verified: typecheck/lint clean, @T00 e2e 1/1, unit
215/215.

## 2026-09-27 visual gate: waiting
ready for re-review: landing page centered, desktop layout, big
animated wordmark above title, catchy tagline added.

## 2026-09-27 visual gate: change requests (round 2, last fix round)
user: center `<main>` vertically; desktop two-column layout, left ~1/3
reserved space for an image (user adds it later, leave placeholder
only), right column content capped to ~1/3 max-width and centered;
reduce title line-height (looks too separate at 2 lines); no vertical
scroll on mobile. spawning implementer (sonnet) on
feat/3-signup-signin-home directly. Max fix rounds (2) reached after
this — further feedback carries to the PR, not another round.
mid-round addition: also asked for no desktop scroll + main max-width
1/3; folded into the same round before commit.
fixed: d7df20b. verified myself: typecheck/lint clean, @T00 e2e 1/1,
unit 215/215, no vertical scroll at 375x667 or 1440x900 (headless
check against localhost:3000). Main itself isn't capped to 1/3 width
(it spans both columns); the hero content wrapper inside the right
column is (lg:max-w-md), per the implementer's documented reasoning
in the component.

## 2026-09-27 visual gate: waiting (fix rounds exhausted)
ready for re-review. This was the 2nd/last fix round per skill's cap
— any further layout feedback now gets logged for the PR rather than
another round.

## 2026-09-27 visual gate: further feedback (carried to PR, no round 3)
user still not satisfied with landing-screen.tsx layout:
- `<main>` height should be exactly `100vh` minus the header's height
  (70px), not content-sized/flex-centered as round 2 left it.
- Desktop: the content div should have max-width 1/3 of the *available*
  space and be centered within its 2/3-wide column (round 2 used
  `lg:max-w-md`, a fixed rem value, not a proportional 1/3 of the
  column).
Per /feat-apply's 2-fix-round cap, not spawning a 3rd round now.
Carrying this to the PR description as open feedback for follow-up.
Continuing to Step 1 (T01/T02/T03, now unblocked by T00).

## 2026-09-27 T01/T02/T03 round 1 (parallel batch)
started T01, T02, T03 together (no Files overlap). Worktrees
.worktrees/T01-T03, ports 3101-3103.

## 2026-09-28 T03 round 1
implementer (sonnet): red OK (010fb5e; two follow-up test(...) fix
commits with reasons: f805608 invalid date comparison, 3245871
locale-scoped step). green OK (0c48fba).
verified myself: typecheck/lint clean, @T03 e2e 6/6, unit 224/224, no
test tampering (impl commit touched no test files), scope matches
Files list + anticipated step-def/support files.
notable: past trips dropped entirely (not listed in otherTrips, so
past-only -> full empty state per EC-4); Colombia trip fixed to a
2027 date to match the AC-14 scenario's exact expected string (D-4
never pinned dates); EmptyTripsState is a client component
(buttonClasses is client-only, same as ThemeToggle); e2e session
seeding via a new tests/steps/support/session.ts (direct DB
insert + cookie, since no UI sign-in flow exists yet for T01/T02 to
have built). No plan gap.
merged: 74c5127. post-merge unit tests: 224/224.
worktree/branch T03 removed.
