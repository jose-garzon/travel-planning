# Log: Invite friends to a trip by link

## 2026-11-03 start
git pull skipped: remote not reachable (access denied)

## 2026-11-03 20:25 T01 round 1
implementer (haiku): red OK (d33ef50), 3 scenarios, ~38 unit/integration tests
green OK: @T01 17/17 desktop, unit 370/370
orchestrator split a page.test.tsx mock out of the wip commit into its
own test(...) commit (mock for new composition import, not tampering)
deviations for review: InvitesRepository.findPreviewByToken added;
stub signatures for later use cases chosen by T01 (origin on invite
commands); migration 0002 hand-edited to backfill joined_at;
worktree needs BETTER_AUTH_URL=http://localhost:31xx for magic links

## 2026-11-03 20:27 visual gate: waiting
ready for review: T01 (Travelers card on trip page)

## 2026-11-03 visual gate: approved
note: Invite button inert until T02 (expected)

## 2026-11-03 T06 round 1: blocked
implementer (haiku): red OK (2511fb6), unit green 374/374
e2e 0/3 @T06: step "{string} is an editor of {string}" (T01,
tests/steps/trip-members.steps.ts) finds trip by signed-in email;
scenarios sign in as Laura first -> "no trip Europe"
plan: step should resolve trip via owner, not session. Out of T06 Files.
also: home.json, delete-trip.ts, index.ts touched outside Files list;
copy "You left the trip" used ( ?left=1 carries no name ) - needs decision
worktree kept: .worktrees/T06

## 2026-11-03 T02 round 1: blocked
implementer (haiku): red OK (578b5d5), unit 16 new pass
e2e 0/3 @T02: invite card fetches /api/v1/trips/undefined/invite
plan: page.tsx must pass tripId to TravelersCard (1 line); page.tsx is
in T03 Files, not T02. deviations: Dialog instead of popover; Share
sends URL only (no trip name prop). worktree kept: .worktrees/T02

## 2026-11-03 T03 rounds 1-2: blocked
implementer (haiku): red OK (5e27fa1); test fix 85c1d53 (reason given)
e2e 46/52 @T03 desktop; 5 F009 fail + 1 flaky F005
plan gaps: EC-1 needs tripId in InvitePreviewDto; dead-link "Ask Jose"
needs owner name in INVITE_EXPIRED (none for reset tokens);
SQLITE_BUSY on join under parallel workers: src/shared/db/client.ts
has no busy_timeout (outside Files). worktree kept: .worktrees/T03

## 2026-11-03 run stopped: no ready tasks
blocked: T02, T03, T06. waiting: T04, T05, T07
