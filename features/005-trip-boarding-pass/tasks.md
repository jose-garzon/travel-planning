# Tasks: Create a trip by drawing its route, and see it on home

Plan: ./plan.md
Tests: ./tests.feature
Status: approved

Status values: todo | doing | done | blocked

Parallel batches:

```
T01 → T02, T03, T04 → T05
```

Critical path: T01 → T03 → T05 (3 of 5).

Shared-file rule: T01 creates every `trips` message file listed below
(empty `{}` where unused) and the loader, so later tasks only edit
their own file. Each task has its own step file.


## T01. Create a trip (happy path, real storage)

Status: done
Depends on: -
Model: sonnet
Scenarios: @T01
Covers: AC-1, AC-6, EC-11

Files:
- `src/shared/db/schema/trips.ts` (new: `trip`, `trip_member`,
  `trip_leg`)
- `src/shared/db/schema/index.ts`
- `src/shared/db/migrations/*` (generated)
- `src/modules/trips/domain/trip.ts` (rewrite: `Trip`, `Leg`, `CityRef`)
- `src/modules/trips/domain/route.ts` (new: `validateRoute` with
  `NO_LEGS`, `TOO_MANY_LEGS`, `SAME_CITY`)
- `src/modules/trips/domain/route.test.ts` (new)
- `src/modules/trips/service/schemas.ts` (new: Zod contracts)
- `src/modules/trips/service/ports.ts` (rewrite: `TripRepository`,
  `CityNames`)
- `src/modules/trips/service/create-trip.ts` + `.test.ts` (new)
- `src/modules/trips/service/get-home-trips.ts` + `.test.ts` (new;
  replaces `get-home-trips-summary.*`, deleted)
- `src/modules/trips/data/drizzle-trips-repository.ts` (new)
- `src/modules/trips/data/drizzle-trips-repository.integration.test.ts`
  (new: home read ≤ 2 queries)
- `src/modules/trips/data/in-memory-trips-reader.*` (delete)
- `src/modules/trips/data/city-index.ts` (new stub: `localizeName`
  returns stored name; `search` returns `[]`)
- `src/modules/trips/index.ts`
- `src/modules/trips/messages/load.ts` (new)
- `src/modules/trips/messages/{en,es}.json` (delete, moved)
- `src/modules/trips/messages/{en,es}/{home,form,city,cards,edit}.json`
  (new; `city`, `cards`, `edit` start as `{}`)
- `src/modules/trips/ui/index.ts`
- `src/modules/trips/ui/form/trip-form.tsx` (new: name, currency, one
  leg, submit)
- `src/modules/trips/ui/form/leg-fields.tsx` (new)
- `src/modules/trips/ui/form/city-combobox.tsx` (new stub: plain
  labelled text input producing a free-text `CityRef`)
- `src/modules/trips/ui/form/currency-select.tsx` + `.test.tsx` (new)
- `src/modules/trips/ui/form/region-currency.ts` + `.test.ts` (new)
- `src/modules/trips/ui/components/home-screen.tsx` (next trip name +
  date range, other trips list; cards come in T04)
- `src/app/api/v1/trips/route.ts` (new: POST, GET)
- `src/app/[locale]/trips/new/page.tsx` (rewrite)
- `src/app/[locale]/page.tsx` (use `getHomeTrips`, set `today` from
  `tz` cookie)
- `src/shared/ui/components/time-zone-cookie.tsx` (new, D-5)
- `src/app/[locale]/layout.tsx` (mount `TimeZoneCookie`)
- `src/app/_composition/i18n-request.ts`
- `features/003-signup-signin-home/tests.feature` (D-6)
- `tests/steps/trips.steps.ts` (seed real trips, D-6)
- `tests/steps/support/trips.ts` (new: `seedTrip({ ownerEmail, name,
  currency, legs })` with day offsets)
- `tests/steps/trip-create.steps.ts` (new)

Steps:
1. Commit the #3 test edits first as `test(trips): ...` with the D-6
   reason; then red tests for this task.
2. Schema + migration (`pnpm db:generate && pnpm db:migrate`).
3. Domain rules, use cases, repository (one transaction per save).
4. API handler: auth via `getCurrentUser`, Zod parse, map domain
   errors to plan "Contracts" codes.
5. Form posts with fetch; on 201 navigate home and toast "Trip
   created"; focus moves to home `<h1>`.

Done when:
- [x] Scenarios tagged @T01 and all #3 scenarios pass
- [x] Unit tests: `validateRoute` rules, `createTrip` owner membership,
  region→currency default and USD fallback
- [x] Integration: home read issues ≤ 2 queries
- [x] `pnpm lint:deps` passes; no `InMemoryTripsReader` left

Notes:
- Messages loader: copy `src/modules/auth/messages/load.ts`.
- Session helper for API: same pattern as `getCurrentUser`.


## T02. City search with localized names

Status: done
Depends on: T01
Model: sonnet
Scenarios: @T02
Covers: AC-3, EC-1, EC-14

Files:
- `scripts/build-cities.ts` (new, D-1; not part of the app bundle)
- `src/modules/trips/data/cities.json` (new, generated)
- `src/modules/trips/data/city-index.ts` (replace stub) + `.test.ts`
- `src/app/api/v1/cities/route.ts` (new)
- `src/modules/trips/ui/form/city-combobox.tsx` (replace stub) +
  `.test.tsx`
- `src/modules/trips/messages/{en,es}/city.json`
- `README.md` (GeoNames attribution)
- `tests/steps/city-search.steps.ts` (new)

Steps:
1. Script downloads OurAirports + GeoNames, joins, writes JSON.
2. Index: prefix/accent-insensitive search on both locales, rank,
   max 8; `localizeName(cityId, locale)`.
3. Combobox: APG pattern, debounced fetch, abort stale requests,
   `exclude` prop (the leg's From), free text kept on blur.
4. Suggestions on focus (AC-3): the list opens before typing with
   popular cities for the browser region (a `popular` flag in
   `cities.json`), max 8; "No city found" option keeps free text
   (EC-14). Rows: code, city, country, in the metro line type
   (DESIGN.md); the picked city fills the station name.

Done when:
- [x] Scenarios tagged @T02 pass
- [x] Unit: search ranking, accent-insensitive, exclude, locale names
- [x] Unit: combobox keyboard (arrows, Enter, Escape), excluded city
  absent, free text fallback, stale request ignored, list open on
  focus
- [x] `/trips/new` JS ≤ 170 KB gzip (`pnpm build` output)


## T03. Multi-leg route editing and date rules

Status: done
Depends on: T01
Model: sonnet
Scenarios: @T03
Covers: AC-2, AC-4, AC-5, EC-2..EC-10

Files:
- `src/modules/trips/domain/route.ts` (add `DATE_ORDER`, `DATE_PAST`)
- `src/modules/trips/domain/route.test.ts`
- `src/modules/trips/ui/form/trip-form.tsx`
- `src/modules/trips/ui/form/leg-fields.tsx`
- `src/modules/trips/ui/form/use-route-editor.ts` + `.test.ts` (new:
  add, remove + re-chain, add return home, limits)
- `src/modules/trips/messages/{en,es}/form.json`
- `tests/steps/trip-legs.steps.ts` (new)

Steps:
1. Domain date rules (pure, `today` passed in).
2. Route editor hook; form renders legs from it; same rules run
   client-side for inline errors and server-side on save.
3. Live region announcements; focus rules from feature.md.

Done when:
- [x] Scenarios tagged @T03 pass
- [x] Unit: every rule and EC-2..EC-10 in domain or hook tests
- [x] Submit with errors focuses the first invalid field


## T04. Home: the trip line and other trips

Status: done
Depends on: T01
Model: sonnet
Scenarios: @T04
Covers: AC-7, AC-8, AC-9, EC-12, EC-13

Files:
- `src/modules/trips/domain/route-view.ts` + `.test.ts` (new:
  `stopsFromLegs`)
- `src/modules/trips/domain/current-stop.ts` + `.test.ts` (new:
  `currentStopIndex`, `daysBetween`)
- `src/modules/trips/service/get-home-trips.ts` + `.test.ts` (past
  trips into other trips; next trip pick)
- `src/modules/trips/ui/home/trip-line.tsx` + `.test.tsx` (built on
  `shared/ui/components/route-line.tsx`; horizontal variant on `lg`)
- `src/modules/trips/ui/home/stop-station.tsx`
- `src/modules/trips/ui/home/compact-trip.tsx`
- `src/modules/trips/ui/components/home-screen.tsx`
- `src/modules/trips/messages/{en,es}/{home,cards}.json`
- `tests/steps/trip-home.steps.ts` (new)

Steps:
1. Domain view + current stop rules (feature.md "Current stop rules").
2. Trip line: vertical on mobile, horizontal on `lg`, scrolled to the
   current stop; replaces the interim line in `home-screen.tsx`.
3. Compact panels link to `/trips/[tripId]`.

Done when:
- [x] Scenarios tagged @T04 pass, desktop and mobile
- [x] Unit: current stop before/during/after/undated; nights; ICU
  plurals; horizontal line keyboard scroll
- [x] Lighthouse: home CLS ≤ 0.1


## T05. Edit, delete, conflicts and leaving the form

Status: done
Depends on: T03 (and T01)
Model: sonnet
Scenarios: @T05
Covers: AC-10, AC-11, AC-12

Files:
- `src/modules/trips/service/get-trip.ts` + `.test.ts` (new)
- `src/modules/trips/service/update-trip.ts` + `.test.ts` (new)
- `src/modules/trips/service/delete-trip.ts` + `.test.ts` (new)
- `src/modules/trips/data/drizzle-trips-repository.ts` (update, delete,
  version check in transaction)
- `src/modules/trips/index.ts`
- `src/app/api/v1/trips/[tripId]/route.ts` (new: GET, PATCH, DELETE)
- `src/app/[locale]/trips/[tripId]/page.tsx` (new)
- `src/modules/trips/ui/form/trip-form.tsx` (edit mode, delete,
  discard dialog, conflict and offline messages)
- `src/modules/trips/messages/{en,es}/edit.json`
- `tests/steps/trip-edit.steps.ts` (new)

Done when:
- [x] Scenarios tagged @T05 pass
- [x] Unit: owner-only, not-found for non-members, stale version →
  `TRIP_VERSION_CONFLICT`, cascade delete
- [x] Focus returns to trigger after each dialog closes


## Coverage

| Criterion | Task(s) | Scenario(s)                                  |
| --------- | ------- | -------------------------------------------- |
| AC-1      | T01     | Create a trip with one leg                   |
| AC-2      | T03     | Adding legs chains cities; removing re-chains|
| AC-3      | T02     | Search a city in my language                 |
| AC-4      | T03     | Invalid dates block the save                 |
| AC-5      | T03     | Add the return home leg                      |
| AC-6      | T01     | Currency defaults from browser locale        |
| AC-7      | T04     | Home shows takeoff, stops and back home      |
| AC-8      | T04     | Current stop follows today                   |
| AC-9      | T04     | Other trips show as compact panels           |
| AC-10     | T05     | Edit a trip; stale edit conflict             |
| AC-11     | T05     | Delete a trip                                |
| AC-12     | T05     | Leaving with unsaved changes                 |
| EC-1      | T02     | From city is not offered as destination      |
| EC-2      | T03     | Same city in different legs                  |
| EC-3,5    | T03     | Invalid dates block the save                 |
| EC-4      | T03     | Same day legs (unit)                         |
| EC-6      | T03     | Undated legs between dated ones (unit)       |
| EC-7,8    | T03     | Leg limits                                   |
| EC-9      | T03     | Adding legs chains cities; removing re-chains|
| EC-10     | T03     | Add the return home leg                      |
| EC-11     | T01     | Trip name is required                        |
| EC-12     | T04     | Earliest trip takes the home line            |
| EC-13     | T04     | unit: long names truncated, full accessible name |
