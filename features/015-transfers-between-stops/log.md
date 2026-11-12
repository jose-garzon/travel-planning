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
