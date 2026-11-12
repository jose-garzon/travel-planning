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
