# Tasks: Invite friends to a trip by link

Plan: ./plan.md
Tests: ./tests.feature
Status: approved

Status values: todo | doing | done | blocked

Parallel batches:

```
T01 → T02, T03, T06 → T04, T05 → T07
```

Critical path: T01 → T03 → T05 → T07 (4 of 7; T07 is hardening).

Shared-file rule: T01 creates every new message file (`{}`), all new
error codes, `index.ts` wiring, ports, both repositories and a stub
file for every use case (final signature, body throws "not
implemented: T0x"). Later tasks only fill their own use-case files.
Each task has its own step file.


## T01. See who is traveling (walking skeleton)

Status: todo
Depends on: -
Model: haiku
Scenarios: @T01
Covers: AC-8, EC-8

Files:
- `src/shared/db/schema/trips.ts` (`editor` role, `joined_at`, `trip_invite`)
- `src/shared/db/migrations/*` (generated)
- `src/modules/trips/domain/invite.ts` + `.test.ts`
- `src/modules/trips/domain/membership.ts` + `.test.ts`
- `src/modules/trips/domain/trip.ts` (role type)
- `src/modules/trips/service/ports.ts`
- `src/modules/trips/service/schemas.ts` (DTOs from plan)
- `src/modules/trips/service/list-trip-members.ts` + `.test.ts`
- `src/modules/trips/service/get-trip-access.ts` + `.test.ts`
- `src/modules/trips/service/{get-or-create-invite,reset-invite,get-invite-preview,join-trip,remove-member,leave-trip}.ts` (stubs)
- `src/modules/trips/data/drizzle-members-repository.ts` + `.integration.test.ts`
- `src/modules/trips/data/drizzle-invites-repository.ts` + `.integration.test.ts`
- `src/modules/trips/data/drizzle-trips-repository.ts` (role, joined_at on create)
- `src/modules/trips/index.ts`
- `src/modules/trips/messages/load.ts`
- `src/modules/trips/messages/{en,es}/{members,invite,join}.json` (new)
- `src/modules/trips/messages/{en,es}/errors.json` (all new codes)
- `src/modules/trips/ui/members/travelers-card.tsx` + `.test.tsx`
- `src/modules/trips/ui/members/member-row.tsx`
- `src/modules/trips/ui/entries/members.ts`
- `src/modules/auth/index.ts` (`getUserProfiles`)
- `src/app/_composition/trip-members.ts`
- `src/app/_composition/api-errors.ts`
- `src/app/api/v1/trips/[tripId]/members/route.ts` (GET)
- `src/app/[locale]/trips/[tripId]/page.tsx` (Travelers card)
- `docs/product.md` (D-6)
- `tests/steps/support/trips.ts` (`seedMember`, `seedInvite`)
- `tests/steps/trip-members.steps.ts` (new)

Steps:
1. Schema + migration; domain rules with unit tests.
2. Ports, repositories (all methods in plan Contracts, incl. capped
   insert and replace-invite) with integration tests (EC-3 race,
   query counts).
3. Stubs for the six later use cases; `createMembersApi` wiring.
4. `listTripMembers`, members GET, Travelers card (desktop card, mobile
   bar, alone state, "Invite" button with no action yet).

Done when:
- [ ] Scenarios tagged @T01 pass
- [ ] Repository integration tests cover cap race and ≤ 2 queries
- [ ] `pnpm lint:deps` passes (no trips → user table query)
- [ ] Existing #5 scenarios still pass

Notes:
- T06 owns home toast params because EC-5 needs `removed`; T05
  reuses them, so T05 depends on T06.
- Error-response helper extracted from `trips/[tripId]/route.ts`; that
  file switches to it.


## T02. Share the invite link (create, copy, share, reset)

Status: todo
Depends on: T01
Model: haiku
Scenarios: @T02
Covers: AC-1, AC-2, AC-3 (new link half)

Files:
- `src/modules/trips/service/get-or-create-invite.ts` + `.test.ts`
- `src/modules/trips/service/reset-invite.ts` + `.test.ts`
- `src/modules/trips/ui/members/invite-card.tsx` + `.test.tsx`
- `src/modules/trips/ui/members/travelers-card.tsx` (open Invite card)
- `src/modules/trips/messages/{en,es}/invite.json`
- `src/app/api/v1/trips/[tripId]/invite/route.ts`
- `src/app/api/v1/trips/[tripId]/invite/reset/route.ts`
- `tests/steps/trip-invite.steps.ts` (new)

Done when:
- [ ] Scenarios tagged @T02 pass
- [ ] Component tests: Share hidden without Web Share API; copy
      failure selects link and shows error copy
- [ ] Editor gets 403 on both endpoints (route test)


## T03. Join a trip from the link (signed in)

Status: todo
Depends on: T01
Model: haiku
Scenarios: @T03
Covers: AC-3 (old link half), AC-4, AC-6, AC-7, EC-1, EC-3, EC-4,
EC-7, EC-9, EC-10

Files:
- `src/modules/trips/service/get-invite-preview.ts` + `.test.ts`
- `src/modules/trips/service/join-trip.ts` + `.test.ts`
- `src/modules/trips/ui/join/join-screen.tsx` + `.test.tsx`
- `src/modules/trips/ui/join/invite-expired-screen.tsx`
- `src/modules/trips/ui/join/trip-full-screen.tsx`
- `src/modules/trips/ui/index.ts`
- `src/modules/trips/messages/{en,es}/join.json`
- `src/app/api/v1/invites/[token]/route.ts`
- `src/app/api/v1/invites/[token]/join/route.ts`
- `src/app/[locale]/join/[token]/page.tsx`
- `src/app/[locale]/trips/[tripId]/page.tsx` (`joined`/`already`
  toasts; D-4 removed redirect)
- `tests/steps/trip-join.steps.ts` (new)

Done when:
- [ ] Scenarios tagged @T03 pass
- [ ] Unit tests: expired, reset, unknown, deleted trip → `INVITE_EXPIRED`


## T04. Join from the link when signed out

Status: todo
Depends on: T03, T06
Model: haiku
Scenarios: @T04
Covers: AC-5, UC-3 3a

Files:
- `src/modules/auth/ui/components/magic-link-form.tsx` + `.test.tsx`
- `src/modules/auth/ui/components/landing-screen.tsx` (uses form)
- `src/modules/auth/ui/hooks/use-request-magic-link.ts` (`callbackURL`)
- `src/modules/auth/ui/index.ts`
- `src/app/[locale]/join/[token]/page.tsx` (sign-in slot)
- `src/app/[locale]/join/[token]/accept/route.ts` + `.test.ts`
- `src/app/[locale]/page.tsx` (name capture honors `next`)
- `tests/steps/trip-join-signed-out.steps.ts` (new)

Done when:
- [ ] Scenarios tagged @T04 pass
- [ ] Unit test: `next` rejects absolute and `//` URLs
- [ ] #3 sign-in scenarios still pass


## T05. Remove a member and leave a trip

Status: todo
Depends on: T03, T06
Model: haiku
Scenarios: @T05
Covers: AC-9, AC-10, EC-2

Files:
- `src/modules/trips/service/remove-member.ts` + `.test.ts`
- `src/modules/trips/service/leave-trip.ts` + `.test.ts`
- `src/modules/trips/ui/members/member-row.tsx` (Remove, Leave)
- `src/modules/trips/ui/members/member-row.test.tsx`
- `src/modules/trips/messages/{en,es}/members.json`
- `src/app/api/v1/trips/[tripId]/members/[userId]/route.ts`
- `tests/steps/trip-members-remove.steps.ts` (new)

Done when:
- [ ] Scenarios tagged @T05 pass
- [ ] Unit tests: owner cannot leave, editor cannot remove others


## T06. Editors edit the trip

Status: todo
Depends on: T01
Model: haiku
Scenarios: @T06
Covers: AC-11, EC-5, EC-6

Files:
- `src/modules/trips/service/update-trip.ts` + `.test.ts`
- `src/modules/trips/service/delete-trip.test.ts` (editor 403)
- `src/modules/trips/ui/form/trip-form.tsx` (no Delete for editor;
  PATCH 404 → home `?removed=1`)
- `src/modules/trips/ui/form/trip-form.edit.test.tsx`
- `src/app/[locale]/page.tsx` (`left`/`removed` toast params)
- `src/modules/trips/ui/components/home-screen.tsx` (those toasts)
- `tests/steps/trip-editor.steps.ts` (new)

Done when:
- [ ] Scenarios tagged @T06 pass
- [ ] Home shows "You left {trip}" and "You're no longer in this
      trip" for `?left=1` / `?removed=1` (component test)


## T07. Invite from the "Trip created" toast, offline and i18n hardening

Status: todo
Depends on: T02, T04, T05, T06
Model: haiku
Scenarios: @T07
Covers: UC-1 2a, AC-11 (API 403 sweep), offline state, EC-9 (es
copy), a11y pass

Files:
- `src/modules/trips/ui/form/trip-form.tsx` (`created` carries trip id)
- `src/modules/trips/ui/components/home-screen.tsx` ("Invite friends" action)
- `src/modules/trips/messages/{en,es}/home.json`
- `src/modules/trips/ui/members/use-is-online.ts` + `.test.ts`
- `src/modules/trips/ui/members/{invite-card,member-row}.tsx` (offline)
- `src/modules/trips/ui/join/join-screen.tsx` (offline)
- `src/app/[locale]/trips/[tripId]/page.tsx` (`?invite=1`)
- `tests/steps/trip-members-hardening.steps.ts` (new)

Done when:
- [ ] Scenarios tagged @T07 pass
- [ ] Full `@F009` run passes


## Coverage

| Criterion | Task(s)  | Scenario(s)                                       |
| --------- | -------- | ------------------------------------------------- |
| AC-1      | T02      | Owner opens the invite link                       |
| AC-2      | T02      | Owner copies the invite link                      |
| AC-3      | T02, T03 | Owner resets the link; A reset link shows expired |
| AC-4      | T03      | Signed-in visitor joins                           |
| AC-5      | T04      | Signed-out visitor signs in and joins (outline)   |
| AC-6      | T03      | Dead links show the expired page (outline)        |
| AC-7      | T03      | A full trip cannot be joined                      |
| AC-8      | T01      | Members see who is traveling; alone state         |
| AC-9      | T05      | Owner removes a member                            |
| AC-10     | T05      | Editor leaves the trip                            |
| AC-11     | T06, T07 | Editor edits but cannot manage; Editor cannot call owner actions |
| EC-1      | T03      | Member opens the link (outline: owner, editor)    |
| EC-2      | T05      | Removed member rejoins with a valid link          |
| EC-3      | T01      | repository integration test (race)                |
| EC-4      | T03      | Link reset while on the join page                 |
| EC-5      | T06      | Removed while editing                             |
| EC-6      | T06      | Two editors save at once                          |
| EC-7      | T03      | Dead links outline (deleted trip)                 |
| EC-8      | T01      | Long names are truncated                          |
| EC-9      | T03, T07 | Join page in the visitor's locale                 |
| EC-10     | T03      | Signed-in visitor joins (any account)             |
| UC-1 2a   | T07      | Invite from the Trip created toast                |
| offline   | T07      | Actions disabled offline                          |
