# Tasks: Transfers between destinations

Plan: ./plan.md
Tests: ./tests.feature
Status: approved

Status values: todo | doing | done | blocked

Parallel batches:

```
T01 → T02, T03, T05, T06 → T04 → T07
```

Critical path: T01 → T03 → T04 → T07 (4 of 7; T07 is hardening).

Shared-file rule: T01 creates every new message file (`{}` except
its own keys), all new error codes, the module `index.ts` wiring,
ports, the repository, `transfer-events.ts` and a stub for every later
use case and component (final signature; use cases return
`not implemented: T0x`, components render null). Later tasks fill
only their own files. Each task has its own step file.


## T01. See and add transfers in route gaps (walking skeleton)

Status: done
Depends on: -
Model: sonnet
Scenarios: @T01
Covers: AC-1, EC-5, EC-8

Files:
- `scripts/build-cities.ts` (GeoNames timezone column → `tz`)
- `src/modules/trips/data/cities.json` (regenerated)
- `src/modules/trips/data/city-index.ts` (`timeZoneOf`)
- `src/modules/trips/index.ts` (`getTripContext` adds `route`)
- `src/shared/db/schema/transfers.ts`, `src/shared/db/schema/index.ts`
- `src/shared/db/migrations/*` (generated)
- `src/shared/ui/duration.ts` + `.test.ts` (new, TDD: localized duration per feature.md "1h 25m" / "1 h 25 min")
- `src/shared/ui/transfer-events.ts` + `.test.ts`
- `src/modules/transfers/domain/transfer.ts` + `.test.ts`
- `src/modules/transfers/domain/gaps.ts` + `.test.ts`
- `src/modules/transfers/service/ports.ts`
- `src/modules/transfers/service/schemas.ts`
- `src/modules/transfers/service/list-transfers.ts` + `.test.ts`
- `src/modules/transfers/service/create-transfer.ts` + `.test.ts`
- `src/modules/transfers/service/{update-transfer,delete-transfer,set-transfer-participation,transfer-costs}.ts` (stubs)
- `src/modules/transfers/data/drizzle-transfers-repository.ts` + `.integration.test.ts`
- `src/modules/transfers/index.ts`
- `src/modules/transfers/messages/load.ts`
- `src/modules/transfers/messages/{en,es}/{gap,card,form,next}.json`
- `src/modules/transfers/ui/components/transfer-gap.tsx` + `.test.tsx`
- `src/modules/transfers/ui/components/transfer-card.tsx` + `.test.tsx`
- `src/modules/transfers/ui/components/{transfer-sheet-host,join-transfer-toggle,next-transfer-card}.tsx` (stubs)
- `src/modules/transfers/ui/entries/transfers.ts`
- `src/app/_composition/trip-context.ts` (transfers API)
- `src/app/_composition/i18n-request.ts`
- `src/app/_composition/api-errors.ts` (all new codes)
- `src/modules/trips/messages/{en,es}/errors.json` (all new codes)
- `src/app/api/v1/trips/[tripId]/transfers/route.ts` (GET, POST)
- `src/app/[locale]/trips/[tripId]/page.tsx` (gaps between stops)
- `tests/steps/support/transfers.ts` (`seedTransfer`)
- `tests/steps/transfers.steps.ts`

Steps:
1. Delete-check: stop if untracked `0006_amusing_darwin.sql` still
   exists (plan Risks).
2. Add `tz` to the city build and regenerate; route with tz in trip
   context.
3. Schema + migration; domain (`gapsOf`, duration via instants,
   sorting, `outsideWindow`) with unit tests.
4. Ports, repository, list and create use cases, GET/POST routes.
5. Stubs; `TransferGap` (empty slot with "+ Add" and "Find options"
   firing events; "Find options" only when the agent is enabled) and
   `TransferCard` read view; page renders gaps before, between and
   after stops.

Done when:
- [x] Scenarios tagged @T01 pass
- [x] Unit tests cover gaps for 1, 2, n legs, with and without return
- [x] Repository list ≤ 2 queries
- [x] Every city with a GeoNames entry has `tz`
- [x] `pnpm lint:deps` passes; existing scenarios still pass

Notes:
- Copy the pattern of `modules/itinerary` (index wiring, Args type).
- Scenarios seed transfers through POST (`seedTransfer`).
- `TransferCard` already has Edit and Delete buttons firing
  `openTransferSheet` (edit) so T02 never edits the card.


## T02. Add, edit and delete a transfer by hand

Status: done
Depends on: T01
Model: sonnet
Scenarios: @T02
Covers: AC-2, AC-3, AC-4, EC-2, EC-3, EC-4, EC-10

Files:
- `src/modules/transfers/ui/components/transfer-sheet-host.tsx` + `.test.tsx`
- `src/modules/transfers/ui/components/transfer-form.tsx` + `.test.tsx`
- `src/modules/transfers/ui/components/time-zone-field.tsx`
- `src/modules/transfers/service/update-transfer.ts` + `.test.ts`
- `src/modules/transfers/service/delete-transfer.ts` + `.test.ts`
- `src/modules/transfers/domain/transfer.ts` (validation) + `.test.ts`
- `src/modules/transfers/messages/{en,es}/form.json`
- `src/app/api/v1/trips/[tripId]/transfers/[transferId]/route.ts`
- `tests/steps/transfer-form.steps.ts`

Steps:
1. Domain validation: required fields, arrival after departure, DST
   and date-line duration tests.
2. Update (version check) and delete use cases; PATCH, DELETE.
3. Sheet listens to `openTransferSheet`; form prefilled from gap;
   tz field shown only when a city has no tz; currency/rate as in the
   budget form; edit/delete from the card; delete confirmation.

Done when:
- [x] Scenarios tagged @T02 pass
- [x] Unit tests: DST change, date-line crossing, "+1" offset
- [x] Stale version returns 409 and shows the conflict warning


## T03. Transfers in the budget, flights migrated

Status: done
Depends on: T01
Model: sonnet
Scenarios: @T03
Covers: AC-5, AC-10, AC-11, EC-7

Files:
- `src/modules/transfers/service/transfer-costs.ts` + `.test.ts`
- `src/modules/budget/domain/budget.ts` + `.test.ts`
- `src/modules/budget/service/ports.ts`
- `src/modules/budget/service/schemas.ts`
- `src/modules/budget/service/use-cases.ts` + `.test.ts`
- `src/modules/budget/index.ts`
- `src/modules/budget/ui/components/budget-card.tsx`
- `src/modules/budget/ui/components/budget-costs.tsx`
- `src/modules/budget/messages/{en,es}/budget.json`
- `src/shared/db/schema/budget.ts` (enum without flights)
- `src/shared/db/migrations/*` (flights → transfers SQL)
- `src/shared/db/migrations/flights-to-transfers.integration.test.ts`
- `src/app/_composition/trip-context.ts` (budget port)
- `docs/product.md` (Core concepts, Budget rules)
- `tests/steps/transfer-budget.steps.ts`

Steps:
1. `transferCosts` (≤ 2 queries).
2. Budget domain: `transfers` category; all → every member, opt-in
   → participants still on the trip.
3. Remove `flights` from categories, schemas and the form.
4. Migration per plan "Data model", tested on seeded rows (totals
   equal before and after).
5. Transfers group in the budget card linking to `#transfer-<id>`.

Done when:
- [x] Scenarios tagged @T03 pass
- [x] Migration test: per-person and shared flights, null stop
- [x] POST budget item with `flights` → 400


## T04. Join an opt-in transfer

Status: done
Depends on: T01, T03, T06 (shares transfer-card.tsx)
Model: sonnet
Scenarios: @T04
Covers: AC-6, EC-6

Files:
- `src/modules/transfers/service/set-transfer-participation.ts` + `.test.ts`
- `src/modules/transfers/ui/components/join-transfer-toggle.tsx` + `.test.tsx`
- `src/app/api/v1/trips/[tripId]/transfers/[transferId]/participation/route.ts`
- `tests/steps/transfer-join.steps.ts`
- `src/modules/transfers/ui/components/transfer-card.tsx` (mount `JoinTransferToggle` on opt-in transfers)
- `src/modules/transfers/service/ports.ts` (participant add/remove)
- `src/modules/transfers/data/drizzle-transfers-repository.ts` + `.integration.test.ts`
- `src/modules/transfers/index.ts` (`setTransferParticipation`)
- `src/app/_composition/trip-context.ts` (wiring)
- `src/app/[locale]/trips/[tripId]/page.tsx` (pass `viewerId`, `memberCount` to `TransferGap`)
- `src/modules/transfers/ui/components/transfer-gap.tsx` (+ `.test.tsx`; thread props to the card)

Steps:
1. Use case; PUT/DELETE route (copy activity subscription route).
2. Toggle with `aria-pressed` and "n of m"; refresh budget.

Done when:
- [x] Scenarios tagged @T04 pass
- [x] Joining an "all" transfer returns 400 `TRANSFER_NOT_OPT_IN`


## T05. Find transfer options with the agent

Status: done
Depends on: T01, T02 ("No options" scenario ends in the T02 form)
Model: sonnet
Scenarios: @T05
Covers: AC-7

Files:
- `src/modules/agent/domain/suggestion.ts` + `.test.ts`
- `src/modules/agent/service/ask-agent.ts` + `.test.ts`
- `src/modules/agent/data/claude-agent-model.ts`
- `src/modules/agent/ui/components/agent-panel.tsx`
- `src/modules/agent/ui/components/agent-reply.tsx`
- `src/modules/agent/messages/{en,es}/chat.json`
- `tests/steps/transfer-agent.steps.ts`

Steps:
1. `TransferSuggestion`; drop `flights` from budget suggestions;
   prompt and `suggest` tool accept transfers with the gap index.
2. Panel listens to `askAssistantForGap`: opens, sends prompt.
3. Transfer cards: charge mode switch (default all), approve → POST
   transfers with `link = sourceUrl`.
4. No transfer options: "No options found. Add it yourself" + "+ Add"
   firing `openTransferSheet`.

Done when:
- [x] Scenarios tagged @T05 pass (agent model faked in e2e, as today)


## T06. Next up card and route-change flags

Status: done
Depends on: T01
Model: sonnet
Scenarios: @T06
Covers: AC-8, AC-9, EC-1, EC-9

Files:
- `src/modules/transfers/domain/next-transfer.ts` + `.test.ts`
- `src/modules/transfers/ui/components/next-transfer-card.tsx` + `.test.tsx`
- `src/modules/transfers/ui/components/transfer-card.tsx` + `.test.tsx`
- `src/modules/transfers/messages/{en,es}/next.json`
- `src/modules/transfers/messages/{en,es}/card.json`
- `src/app/[locale]/trips/[tripId]/page.tsx` (next up card)
- `tests/steps/transfer-next.steps.ts`

Steps:
1. `nextTransfer(transfers, now)` and countdown days, clock passed in.
2. Card shows "Route changed. Check from/to", "Check details"
   (`needsReview`) and past transfers muted.
3. Next up card on top of the trip page, links to the transfer.

Done when:
- [x] Scenarios tagged @T06 pass
- [x] Unit tests: past, today, date-only, tie on time


## T07. Accessibility and i18n hardening

Status: todo
Depends on: T02, T03, T04, T05, T06
Model: sonnet
Scenarios: @T07
Covers: AC-12, EC-11

Files:
- `src/modules/transfers/ui/components/*.tsx` (fixes only)
- `src/modules/transfers/messages/{en,es}/*.json` (fixes only)
- `tests/steps/transfer-hardening.steps.ts`
- `src/modules/agent/ui/components/assistant-dock.tsx` (open the mobile drawer on `askAssistantForGap`)

Steps:
1. Card sentence label in en and es; keyboard and focus flow.
2. Long names wrap; Spanish copy fits.

Done when:
- [ ] Scenarios tagged @T07 pass
- [ ] axe passes on gap, sheet, card, next up in both locales


## Coverage

| Criterion | Task(s) | Scenario(s)                                     |
| --------- | ------- | ----------------------------------------------- |
| AC-1      | T01     | Gaps show transfers or an empty slot            |
| AC-2      | T02     | Add a transfer with from and to prefilled       |
| AC-3      | T02     | Duration across time zones                      |
| AC-4      | T02     | Arrival before departure / date outside gap     |
| AC-5      | T03     | All-travelers transfer in every budget          |
| AC-6      | T04     | Join and leave an opt-in transfer               |
| AC-7      | T05     | Find options and approve one                    |
| AC-8      | T06     | Next up card with countdown                     |
| AC-9      | T06     | Route change flags a transfer                   |
| AC-10     | T03     | Flights become transfers                        |
| AC-11     | T03     | Transfers group in the budget                   |
| AC-12     | T07     | Transfer read as one sentence                   |
| EC-1      | T06     | Route change flags a transfer                   |
| EC-2      | T02     | Duration across time zones                      |
| EC-3      | T02     | Duration across time zones (+1)                 |
| EC-4      | T02     | Transfer without times                          |
| EC-5      | T01     | Several transfers sorted by departure           |
| EC-6      | T04     | Opt-in nobody joined costs nothing              |
| EC-7      | T03     | Member leaves, all-travelers total shrinks      |
| EC-8      | T01     | One-destination trip gaps                       |
| EC-9      | T06     | Past transfer is muted and not next up          |
| EC-10     | T02     | Cost in another currency                        |
| EC-11     | T07     | Long city names wrap                            |
