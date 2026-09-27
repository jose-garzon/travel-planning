# Tasks: Account creation, sign-in and home page

Plan: ./plan.md
Tests: ./tests.feature

Status values: todo | doing | done | blocked

Parallel batches:

```
T00 → T01, T02, T03
```


## T00. Infra: Better Auth, DB schema, and the page skeleton

Status: todo
Depends on: -
Model: sonnet
Scenarios: @T00
Covers: AC-1

Files:
- `package.json` (add `better-auth`, `resend`)
- `src/shared/config/env.ts` (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
  `RESEND_API_KEY`)
- `.env.example`
- `src/shared/db/schema/auth.ts` (new: `user`, `session`, `verification`,
  `nameConfirmedAt` additional field)
- `src/shared/db/schema/index.ts` (re-export)
- `src/shared/db/migrations/*` (generated)
- `src/modules/auth/data/better-auth.ts` (new)
- `src/modules/auth/data/send-magic-link-email.ts` (new, stub: logs to console)
- `src/modules/auth/service/check-magic-link-cooldown.ts` (new, stub:
  always allows — a service use case, not a data adapter; `better-auth.ts`
  calls it from its `hooks.before`)
- `src/modules/auth/index.ts` (new: `auth.handler`, `getCurrentUser`)
- `src/modules/auth/index.integration.test.ts` (new: asserts
  `getCurrentUser` issues exactly 1 query — perf budget)
- `src/modules/auth/ui/components/landing-screen.tsx` (new, static shell:
  header copy handled by `SiteHeader`, hero text + email field + submit
  button, no interactivity yet)
- `src/modules/auth/ui/components/name-capture-screen.tsx` (new, static shell)
- `src/modules/auth/ui/index.ts` (new)
- `src/modules/auth/messages/en/{landing,nameCapture,linkExpired,signingIn}.json`
  (new, placeholder copy — T01/T02 replace the copy, not the file list)
- `src/modules/auth/messages/es/{landing,nameCapture,linkExpired,signingIn}.json`
  (new)
- `src/modules/auth/messages/load.ts` (new, styleguide pattern)
- `src/modules/trips/domain/trip.ts` (new: `Trip` type)
- `src/modules/trips/service/ports.ts` (new: `TripsReader`)
- `src/modules/trips/service/get-home-trips-summary.ts` (new, calls port)
- `src/modules/trips/data/in-memory-trips-reader.ts` (new, stub: always empty)
- `src/modules/trips/index.ts` (new: `getHomeTripsSummary`)
- `src/modules/trips/ui/components/home-screen.tsx` (new, static shell)
- `src/modules/trips/ui/components/empty-trips-state.tsx` (new, static shell)
- `src/modules/trips/ui/index.ts` (new)
- `src/modules/trips/messages/{en,es}.json` (new, placeholder copy)
- `src/app/api/auth/[...all]/route.ts` (new)
- `src/app/[locale]/page.tsx` (rewrite: branch on `getCurrentUser()` into
  `LandingScreen` / `NameCaptureScreen` / `HomeScreen`, calling
  `getHomeTripsSummary` only in the last branch)
- `src/app/[locale]/trips/new/page.tsx` (new, placeholder route)
- `src/app/_composition/i18n-request.ts` (merge `auth` and `trips` messages)

Steps:
1. Add `better-auth` and `resend` to `package.json`; `pnpm install`.
2. Read `node_modules/better-auth`'s types/README for the Drizzle adapter
   and magic-link plugin options (`expiresIn`, redirect/error handling,
   `additionalFields`) before writing config — do not guess names.
3. Write the `user`/`session`/`verification` Drizzle schema (plus
   `nameConfirmedAt`, nullable timestamp on `user`) matching Better
   Auth's adapter contract; generate and run the migration.
4. Build the Better Auth instance (magic-link plugin, `expiresIn` 900s)
   wired to the two stubs (`send-magic-link-email.ts` logs to console,
   `service/check-magic-link-cooldown.ts` always allows) so later
   tasks replace bodies, not call sites.
5. Mount `/api/auth/[...all]/route.ts` delegating to `auth.handler`.
6. Write `getCurrentUser` (`{ id, displayName, needsDisplayName }` from
   the session + `nameConfirmedAt === null`).
7. Write the three static screen shells (no client interactivity) and
   the trips read model / stub reader (always returns `{ nextTrip:
   null, otherTrips: [] }`).
8. Wire `page.tsx`'s three-way branch and the `trips/new` placeholder
   route.
9. Register both modules' messages in `i18n-request.ts`.

Done when:
- [ ] Scenario tagged @T00 passes: signed-out visitor on `/` sees the
      landing page (header, hero, email field, submit button).
- [ ] `pnpm typecheck` and `pnpm lint` pass (new modules satisfy
      dependency-cruiser boundaries).
- [ ] `pnpm db:generate && pnpm db:migrate` produces a clean migration.
- [ ] Integration test asserts `getCurrentUser` issues exactly 1 query
      (performance budget, plan.md).

Notes:
- This task is infra-heavy by design (plan.md "Context"). Keep every
  screen a static shell — no client state, no real email sending, no
  real cooldown check. T01/T02/T03 fill the stubs in without touching
  `page.tsx`, the route, or each other's files.


## T01. Request a magic link: happy path, invalid email, send failure, cooldown

Status: todo
Depends on: T00
Model: sonnet
Scenarios: @T01
Covers: AC-2, AC-9, AC-10, AC-12, EC-1, EC-3

Files:
- `src/modules/auth/ui/components/landing-screen.tsx` (edit: client
  form state — idle / sending / sent / error)
- `src/modules/auth/ui/hooks/use-request-magic-link.ts` (new)
- `src/modules/auth/domain/magic-link-cooldown-rule.ts` (new:
  `hasReachedMagicLinkCooldown`, pure)
- `src/modules/auth/domain/magic-link-cooldown-rule.test.ts` (new)
- `src/modules/auth/service/ports.ts` (new: `MagicLinkAttemptsReader`,
  `MagicLinkEmailSender`)
- `src/modules/auth/service/check-magic-link-cooldown.ts` (edit: real
  check — calls `MagicLinkAttemptsReader` + the domain rule)
- `src/modules/auth/data/verification-magic-link-attempts-repository.ts` (new)
- `src/modules/auth/data/verification-magic-link-attempts-repository.integration.test.ts`
  (new: asserts the cooldown check issues exactly 1 query — perf budget)
- `src/modules/auth/data/send-magic-link-email.ts` (edit: real
  `ConsoleMagicLinkEmailSender` / `ResendMagicLinkEmailSender`, picked
  by `env.NODE_ENV`, per plan D-2)
- `src/modules/auth/messages/en/landing.json` (edit: real copy)
- `src/modules/auth/messages/es/landing.json` (edit: real copy)

Steps:
1. Write the cooldown domain rule and its unit tests (0, 2, 3, 4 recent
   attempts) before anything else (TDD).
2. Implement `VerificationMagicLinkAttemptsRepository` against the
   `verification` table (count rows for the email created in the last
   15 minutes).
3. Implement `check-magic-link-cooldown.ts` for real: calls the
   repository + domain rule; on cooldown, the `better-auth.ts` hook (T00)
   throws so the response carries `error.code: "MAGIC_LINK_COOLDOWN"`
   (plan.md Contracts).
4. Implement the two email senders; wire the pick by `env.NODE_ENV`.
5. Make `landing-screen.tsx` interactive: client-side email format
   validation (inline error, no request sent), submit via
   `use-request-magic-link.ts` calling Better Auth's client SDK, and
   branch the result on `error.code` — `MAGIC_LINK_COOLDOWN` shows the
   cooldown message, anything else shows the generic retriable error,
   success shows "check your email".
6. Add the `aria-live="polite"` region announcing "check your email".

Done when:
- [ ] Scenarios tagged @T01 pass.
- [ ] Unit tests: cooldown rule at the boundary (2 vs 3 vs 4 recent).
- [ ] Reloading the "check your email" screen returns to the landing
      form (no pending state persisted) — EC-3.
- [ ] Integration test asserts the cooldown check issues exactly 1
      query (performance budget, plan.md).


## T02. Verify a magic link: create/reuse account, expiry, name capture

Status: todo
Depends on: T00
Model: sonnet
Scenarios: @T02
Covers: AC-3, AC-4, AC-5, AC-11, EC-2, EC-5

Files:
- `src/modules/auth/ui/components/name-capture-screen.tsx` (edit: real
  form + validation)
- `src/modules/auth/ui/components/link-expired-screen.tsx` (new: its
  resend button duplicates `use-request-magic-link.ts`'s ~5-line call
  inline — does not import or edit T01's hook, two call sites, no
  shared abstraction yet, per plan "Left to implementation")
- `src/modules/auth/domain/display-name-rule.ts` (new: `isValidDisplayName`)
- `src/modules/auth/domain/display-name-rule.test.ts` (new)
- `src/modules/auth/service/set-display-name.ts` (new)
- `src/modules/auth/service/set-display-name.test.ts` (new)
- `src/modules/auth/index.ts` (edit: add `setDisplayName` export)
- `src/modules/auth/messages/en/nameCapture.json`,
  `en/linkExpired.json`, `en/signingIn.json` (edit: real copy)
- `src/modules/auth/messages/es/nameCapture.json`,
  `es/linkExpired.json`, `es/signingIn.json` (edit: real copy)
- `src/app/[locale]/loading.tsx` (new: owns the "signed in, loading
  your trips" live region — always this file, regardless of what step
  3's vendor-docs read finds about the verify redirect)

Steps:
1. Write `isValidDisplayName` (1–50 chars) and its boundary unit tests
   first (0, 1, 50, 51 chars).
2. Write `setDisplayName` use case: validates, then persists `name` +
   `nameConfirmedAt = now`; export from `auth/index.ts`.
3. Confirm (read vendor types) how the magic-link plugin reports an
   expired/invalid token on verify, and render `LinkExpiredScreen` for
   that case — the page branch already exists in `page.tsx` (T00); add
   the query-param check there only if the plugin surfaces it that way,
   otherwise add the minimal branch needed. Build `loading.tsx` with the
   "signed in, loading your trips" `aria-live="polite"` region
   regardless of whether the verify redirect turns out to be
   server-side or has a client-rendered gap (feature.md Accessibility).
4. Wire the resend button to request a fresh link.
5. Make `name-capture-screen.tsx` real: inline error at 0 or 51+ chars,
   focus stays on the field, submits via `setDisplayName`.
6. After sign-in, move focus to the home page's `<h1>` (feature.md
   Accessibility, AC-13).

Done when:
- [ ] Scenarios tagged @T02 pass.
- [ ] Unit tests: display-name rule at 0, 1, 50, 51 chars; `setDisplayName`
      rejects invalid input without writing.
- [ ] A link opened on a different browser context than the one that
      requested it still verifies (EC-2).
- [ ] After completing sign-in, focus is on the home page's `<h1>`,
      not `body` (AC-13; asserted in the AC-5 scenario).
- [ ] "Signed in, loading your trips" is announced via a live region
      somewhere between verify completing and home rendering.


## T03. Home page: next trip, trip list, empty state

Status: todo
Depends on: T00
Model: sonnet
Scenarios: @T03
Covers: AC-6, AC-7, AC-8, EC-4

Files:
- `src/modules/trips/data/in-memory-trips-reader.ts` (edit: real fixture
  per plan D-4 — email containing `+trips` → two upcoming trips
  ["Colombia trip", "Peru trip"]; `+pasttrips` → one past-only trip;
  everything else → none)
- `src/modules/trips/data/in-memory-trips-reader.test.ts` (new)
- `src/modules/trips/service/get-home-trips-summary.ts` (edit: pick the
  first trip with `startDate >= today` as `nextTrip`, rest as `otherTrips`)
- `src/modules/trips/service/get-home-trips-summary.test.ts` (new)
- `src/modules/trips/ui/components/home-screen.tsx` (edit: real name,
  next-trip card, trip list, locale-formatted date ranges)
- `src/modules/trips/ui/components/empty-trips-state.tsx` (edit: real
  icon/copy/CTA linking to `/[locale]/trips/new`)
- `src/modules/trips/messages/en.json`, `es.json` (edit: real copy)
- `src/app/[locale]/trips/new/page.tsx` (edit: real placeholder copy)

Steps:
1. Write `get-home-trips-summary` unit tests first: zero trips, one
   upcoming, one upcoming + one past (EC-4: past-only → empty state,
   not a "last trip" card), two upcoming (first by date is `nextTrip`).
2. Implement the fixture reader and the summary use case.
3. Build `HomeScreen`: name heading, next-trip card, rest-of-trips list,
   `Intl`-formatted date ranges (both locales).
4. Build `EmptyTripsState`: decorative icon (`alt=""`), title,
   description, CTA button to the placeholder route.
5. Confirm `page.tsx`'s signed-in branch (from T00) already skips the
   landing page and calls `getHomeTripsSummary` — no edit needed unless
   the stub call shape was wrong.

Done when:
- [ ] Scenarios tagged @T03 pass.
- [ ] Unit tests cover: zero trips, all-past trips, one upcoming, two
      upcoming (ordering).
- [ ] Dates render via `Intl`, correct in both `en` and `es`.


## Coverage

| Criterion | Task(s) | Scenario(s)                              |
| ----------- | --------- | -------------------------------------------- |
| AC-1        | T00       | Signed-out visitor sees landing page       |
| AC-2        | T01       | Valid email sends link, shows check-email  |
| AC-3        | T02       | Unexpired link verifies/creates account    |
| AC-4        | T02       | First verification shows name form         |
| AC-5        | T02       | Returning member skips name form           |
| AC-6        | T03       | Signed-in `/` skips landing, loads home    |
| AC-7        | T03       | Home shows name, next trip, rest of trips  |
| AC-8        | T03       | Home empty state, CTA to placeholder       |
| AC-9        | T01       | Invalid email: inline error, no request    |
| AC-10       | T01       | 4th request in 15 min blocked, cooldown    |
| AC-11       | T02       | Expired link: message + resend             |
| AC-12       | T01       | Send failure: retriable error               |
| AC-13       | T00-T03   | a11y check step on every scenario          |
| AC-14       | T00-T03   | `@i18n` outlines, both locales              |
| EC-1        | T01       | Same as AC-10                               |
| EC-2        | T02       | Different browser context still verifies   |
| EC-3        | T01       | Tab closed: back to landing, no pending state |
| EC-4        | T03       | All-past trips: empty state, not last-trip |
| EC-5        | T02       | Name: 1/50 accepted, 0/51 rejected          |
