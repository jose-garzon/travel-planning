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
