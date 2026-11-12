# Log: Transfers between destinations

## 2026-11-12 14:46 T01 round 1
implementer (sonnet): red OK (9d9a7ef), 3 scenarios, 96 unit tests
test fix a0c1728 (separate commit, reason: routeChanged case used wrong gap kind)
green OK: 3/3 @F015 @T01 desktop, 595 unit
extra files: i18n-types.d.ts (typecheck), city-index.test.ts
notes for later: Gap.from/to always set (no null); openTransferSheet has
action edit|delete + prefill; DTO cost in minor units; transfers with gap
beyond route returned routeChanged but not rendered.
agent noted: 15 non-F015 e2e failures (003/009 magic link), unchecked vs main

## 2026-11-12 14:47 visual gate: waiting
ready for review: T01 (trip page: gaps, transfer cards)

## 2026-11-12 visual gate: changes (round 1)
user: "getting to *" gaps took too much space, broke city rhythm.
fix: gap is a stretch of the route line under the station dots (dashed
empty, solid with transfers); transfers are compact rows; empty gap is
one line (mobile: question is the Add button, Find options icon-only;
desktop: question text + "+ Add" + "Find options").
note: Add / Find options inert until T02 / T05 (listeners not built).

## 2026-11-12 visual gate: approved

## 2026-11-12 T03 round 1
implementer (sonnet): red OK (c135c55), 4 scenarios, 8 unit/integration
green OK: 4/4 @F015 @T03 desktop, 602 unit
extra files: transfers/index.ts (transferCosts export), transfer-card.tsx
(id="transfer-<id>" anchor for budget links)
migration 0007_flights_to_transfers.sql; budget rows show "incl. X transfers"
open: agent still lists `flights` category until T05 lands

## 2026-11-12 T04 round 1: blocked (plan gap)
implementer (haiku) stopped before tests. Missing from T04 Files:
- transfer-card.tsx must mount JoinTransferToggle for opt-in transfers
- TransfersRepository + drizzle repo: add/remove transfer_participant
- transfers/index.ts + _composition/trip-context.ts: setTransferParticipation
TRANSFER_NOT_OPT_IN already registered by T01. Worktree kept (.worktrees/T04).

## 2026-11-12 T05 round 1
implementer (sonnet): red OK (ba5ca41), 2 scenarios, 4 unit
"Find options and approve one" passes; "No options found" fails at its
last step: needs T02 TransferSheetHost (plan dep gap T05 → T02). Held
until T02 merges, then rebase and rerun.
open for PR: AssistantDock (mobile drawer) does not open on
askAssistantForGap; file outside T05 list.

## 2026-11-12 T04 unblocked
owner approved: Files += transfer-card.tsx, ports.ts, drizzle repo, transfers/index.ts, trip-context.ts. Depends on T06 (card). T05 now depends on T02.

## 2026-11-12 T06 round 1
implementer (sonnet): red OK (e829fad), 3 scenarios, 25 unit
green OK: 3/3 @F015 @T06 + T01/T03 regression desktop, 627 unit
extra files: domain/transfer.ts (isPast param narrowed), steps
transfers.steps.ts + support/today.ts (shift dates to real clock; in red commit)

## 2026-11-12 T02 round 1
implementer (sonnet): red OK (5bb0caf), 7 scenarios, ~37 unit
green failed: 0/7 e2e (strict label clash "Departure time"; save POST never sent; edit click timeout)
round 2 sent with output; rebase onto feature branch (T03, T06 merged)
extra files: ports.ts, schemas.ts, drizzle repo, index.ts, create-transfer.ts, entries, page.tsx (mount sheet)

## 2026-11-12 T06 merged: f000997

## 2026-11-12 T02 round 2
implementer (sonnet): rebased on T03+T06; green OK: 7/7 @T02, 17/17 F015 desktop, 665 unit
product fixes: sheet scrolls (max-h-sheet; Save was off-screen), outbound gap prefills From = origin
test commits (reasoned): exact labels, hydration-safe Add click, real T03 budget step,
tz fill for seeded trips, money() thousands, duration step maps "9 hr 30 min" → "9h 30m"
open for PR: scenario says "9 hr 30 min", card shows compact "9h 30m"

## 2026-11-12 T02 merged: a560f6a

## 2026-11-12 T05 round 2
rebased onto T02; e2e fails: duplicate step "the transfer form shows from..." (agent + form steps). Sent back.

## 2026-11-12 T04 restarted (Files extended)

## 2026-11-12 T04 blocked again (plan gap)
implementer (haiku) stopped before red: card gets no viewerId / member count, so aria-pressed and "n of m" impossible. Needs page.tsx + transfer-gap.tsx (+ DTO option). Worktree kept, clean.

## 2026-11-12 T05 round 2
test commit b218ab5 drops duplicate step (T02 owns it). green OK: 19/19 F015 desktop for T01,T02,T03,T05,T06; 670 unit
open for PR: AssistantDock mobile drawer does not open on Find options

## 2026-11-12 visual fix
user: edit/delete icon buttons too close → gap-2 on card actions

## 2026-11-12 T04 unblocked (orchestrator decision)
option 1: viewerId + memberCount as props page → TransferGap → TransferCard → toggle (no API change). Files += page.tsx, transfer-gap.tsx. Model haiku → sonnet (scope grew).
T07 Files += assistant-dock.tsx (mobile drawer on Find options).

## 2026-11-12 T04 rounds 1-2
implementer (sonnet): red OK (e82fc39); round 2 moved step edit into its own test commit
green OK: 21/21 F015 desktop (T01-T06), unit pass on feature branch
test commits: zero-total = Transfers row absent; join step opens trip
props: tripId, viewerId, memberCount page → gap → card (join prop); card.json join strings

## 2026-11-12 fix after T04 merge
next-transfer-card suite failed (card → toggle → router import). f2c5961 moves formatTime/formatDay to ui/format-time.ts. 684 unit green.

## 2026-11-12 T07 round 1
implementer (sonnet): red OK (5a4bec8), 3 scenarios, 3 unit; green OK 24/24 F015 desktop
spoken duration "1 hr 25 min" (Intl short); es "sale 09:40, llega 11:05"; dock opens mobile drawer on Find options
note: axe checked on gap/card pages; sheet + next-up not axe-checked in both locales; one flaky T01 run under load

## 2026-11-12 T07 merged: c3936d0

## 2026-11-12 feature verification
test all: 390 passed, 4 failed under load (F015 edit/delete, F015 join budget, F3 name capture x2); all pass alone (2 reruns)
lint pass (5 warnings, 1 ours: budget-costs.tsx unused SELECT_CLASSES), typecheck pass, build pass
screenshots: 24/24 F015 → evidence/screenshots

## 2026-11-12 feature review
reviewer: 8 blocker, 8 major, 10 minor, 1 nit → fix round 1 on blockers
blockers: B1 javascript:/data: links (transfer link, agent sourceUrl); B2 edit
resets rate to 1; B3 foreign cost w/o rate stored 1:1 (agent sends no rate);
B4 agent transfers lack tz (wrong duration); B5 gap Add label-in-name; B6 join
toggle label-in-name; B7 sheet loses focus on save/delete/close; B8 orphan
transfers (gap beyond route) never rendered
majors (carried to PR):
- major  create/update-transfer: gap index not checked against route gaps
- major  domain/transfer.ts:101 overnight arrival without date rejected
- major  transfer-form: arrival-before-departure is a form alert, not a field error
- major  form.json: save/delete error copy differs from spec
- major  join-transfer-toggle: optimistic override never cleared
- major  budget-card.tsx:147 truncates transfer label (EC-11)
- major  duration step maps "9 hr 30 min" → "9h 30m"; update tests.feature
- major  AC-12 axe not run on sheet, next up, join toggle (en/es)
minors: agent link target, Find options only in empty gaps, joined count
includes leavers, next-transfer duplicates instantOf, countdown UTC day,
countdown wording, mid-trip leg to origin = return, agent prompt omits return
gap, transfers read twice per render, required copy; nit: gap landmarks
follow-up: budget module rate ?? "1" same pattern as B3

## 2026-11-12 fix round 1
implementer (sonnet): 7ea9001..90fb1e1, all 8 blockers addressed
note: B1 production code (shared/kernel/http-url.ts + schemas) landed inside test commit 2b2c735
agent panel refuses foreign-currency transfer approvals (asks to add with a rate)
route-changed group: display only (edit/delete need a gap) → reviewer to judge
verification: F015 48/48 desktop+mobile; pnpm test 389 passed, 5 failed (F003, F005, F009
under load; 12/12 pass alone); lint 0 errors; typecheck, build pass; unit 712

## 2026-11-12 blocker recheck
reviewer: B1-B8 resolved except B8 actions: Edit/Delete dead in "Route changed" group → fix round 2
new major (carried to PR): agent refuses foreign-priced transfer suggestions and they have no Edit; AC-7 narrowed
minor: Safari mouse click does not focus buttons, so focus return may fall to body

## 2026-11-12 fix round 2
implementer (sonnet): b2e3346, 2e1c399 (tests), 66e8d02 (fix): Edit/Delete work on route-changed transfers
verification: 715 unit, F015 48/48 desktop+mobile, typecheck pass
reviewer recheck B8b: resolved. 0 blockers open.
note: "moves edit to matching gap" unit test does not exercise the name-match path
