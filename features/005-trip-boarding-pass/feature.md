# Create a trip with a boarding-pass form and see it on home

Issue: #5
Status: approved
Owner: Jose Garzon


## Summary

A signed-in user creates a trip with an interactive form styled as a
boarding pass: a trip name, a currency and a multi-city route of legs
(Bogotá → Madrid → Barcelona → Rome → Bogotá), with optional dates.
The home page then shows the next trip as a carousel of boarding-pass
cards, one per city stop, with the current stop emphasized. The owner
can edit or delete the trip later.


## Problem

Signed-in users land on a home page with an empty state and no way to
create a trip. Every later feature (members, itinerary, budget, agent)
needs a trip with destinations. Airline multi-city search is the mental
model people already know for routes, so the form reuses it.

Success metric: 80% of started trip forms are submitted; median time to
create a 3-stop trip is under 90 seconds.


## Users and roles

| Role    | Can do                                    | Cannot do            |
| ------- | ----------------------------------------- | -------------------- |
| member  | create a trip (becomes its owner)         | -                    |
| owner   | see, edit and delete their trip           | transfer ownership   |
| visitor | nothing (redirected to sign in)           | see any trip         |

Invite links, editor and viewer roles, and removing members are split
into a separate feature (#6). In this feature every trip has exactly
one member: its owner.


## Concepts

- **Leg**: From city → To city, with an optional date (departure day).
- **Stop**: the To city of a leg that is not the return home. A stop
  arrives on its leg's date and leaves on the next leg's date.
- **Origin**: the From city of leg 1. Shown as the Takeoff card.
- **Return home**: a last leg whose To city equals the origin. Shown as
  the Back home card, not as a stop.
- **Trip date range**: first dated leg to last dated leg.


## Use cases

### UC-1: Create a trip

Actor: member
Trigger: "Create trip" on home (empty state CTA or header button)

1. The boarding-pass form opens with one empty leg.
2. User types the trip name.
3. Currency is preselected from the browser locale region (`es-CO` →
   COP, `en-US` → USD; fallback USD). User may change it.
4. User picks From and To for leg 1 with autocomplete ("BOG Bogotá").
   The To list excludes the leg's From city.
5. User optionally picks a date.
6. User clicks "Add leg". The new leg's From is filled with the
   previous leg's To. User picks To and optional date.
7. User clicks "Add return home". A last leg is added from the last To
   back to the origin.
8. User clicks "Create trip".

Result: trip saved, user is the owner, home shows the trip.

Alternate flows:
- 4a. City not in the list: user keeps the typed text; its code is
  the first 3 letters, uppercased.
- 6a. User edits a prefilled From (overland gap): allowed.
- 6b. User removes a middle leg: the next leg's From is re-chained to
  the previous leg's To.
- 8a. Validation fails: submit is blocked, errors show inline, focus
  goes to the first invalid field.
- 8b. User leaves with unsaved changes: confirm dialog "Discard
  changes?"; cancel stays on the form.

### UC-2: See the trip on home

Actor: owner
Trigger: open home

1. The next trip (upcoming or in progress) shows as a carousel:
   Takeoff card, one card per stop, Back home card (if round trip).
2. The current stop card is larger and labeled "Current stop".
3. Other trips show below in "Other trips" as compact cards with only
   the first leg (codes and date).

Result: user sees where they are or go next, and what follows.

### UC-3: Edit a trip

Actor: owner
Trigger: open a trip from home (card or compact card)

1. The same boarding-pass form opens prefilled.
2. User changes name, currency or legs (same rules as UC-1).
3. User clicks "Save changes".

Result: trip updated, home reflects it.

Alternate flows:
- 3a. Someone else changed the trip since it was opened (version
  check): message "This trip changed. Reload to see the latest." with
  a Reload button. The user's edits are not saved.

### UC-4: Delete a trip

Actor: owner
Trigger: "Delete trip" in the edit form

1. Confirm dialog: "Delete Europe with friends? This cannot be undone."
2. User confirms.

Result: trip deleted, user back on home, toast "Trip deleted".


## Current card rules

- Before the trip: the first stop is current.
- During the trip: the stop where today ≥ arrival date and today <
  departure date (next leg's date) is current.
- After the last dated leg: no current stop; the trip moves to "Other
  trips" and the next upcoming trip takes the carousel.
- Stops without dates are never current, except when all legs are
  undated: then the first stop is current.
- The carousel starts scrolled to the current card.


## Card content

Stop card:
- To code large (MAD), city name smaller (Madrid)
- "Stop 2 of 5"
- Arrive date prominent ("Arrive 20 Feb"); departure smaller ("leave
  23 Feb"); "Date TBD" when unknown
- Nights at the stop ("3 nights"), only when both dates are known
- Countdown on the current card ("in 12 days", "today")
- Header strip: trip name and member count ("1 traveler")

Takeoff card (start): smaller, playful. Origin code, departure date,
countdown to trip start ("47 days to go", "Today!", "On the way").

Back home card (end): smaller, playful. Origin code, return date,
countdown to trip end ("Trip ends in 60 days").

Compact card (other trips): trip name, first leg codes (LIM → CUZ),
first leg date.


## States

| State        | When                          | User sees                     |
| ------------ | ----------------------------- | ----------------------------- |
| empty        | no trips                      | existing empty state, CTA     |
|              |                               | "Create your first trip"      |
| loading      | home or form data loading     | skeleton cards / form         |
| undated      | all legs without dates        | "Date TBD" on cards, first    |
|              |                               | stop current                  |
| past only    | all trips ended               | "No upcoming trips" + Create  |
|              |                               | trip, then Other trips        |
| success      | trip created or saved         | home with carousel, toast     |
|              |                               | "Trip created" / "Saved"      |
| save error   | server or network failure     | inline error, data kept       |
| conflict     | version mismatch on save      | reload message (UC-3 3a)      |
| offline      | no connection                 | form disabled, banner "You're |
|              |                               | offline"; home read-only      |


## Edge cases

- EC-1. From = To on a leg: To list excludes From; typed free text
  equal to From shows "Destination must differ from origin".
- EC-2. Same city in different legs (BOG → CTG → BOG → MDE): valid,
  separate cards.
- EC-3. Leg date earlier than a previous dated leg: "Must be on or
  after <date>" on that leg.
- EC-4. Same day for two legs: valid (0 nights, nights label hidden).
- EC-5. Date in the past at creation: "Pick today or a later date".
  On edit, existing past dates are kept and allowed.
- EC-6. Undated legs between dated ones: allowed, not checked.
- EC-7. Maximum 10 legs: "Add leg" disabled with hint "Up to 10 legs".
- EC-8. Minimum 1 leg: remove button hidden on the only leg.
- EC-9. Removing a middle leg: next leg's From re-chains.
- EC-10. Last leg already returns to origin: "Add return home" hidden.
- EC-11. Trip name: required, 1-60 characters, trimmed.
- EC-12. Two trips overlapping in time: allowed; the one starting
  first is the carousel trip.
- EC-13. Long city names (40+ chars): truncate with ellipsis on cards,
  full name in accessible name and tooltip.


## Errors

| Failure              | Message to user                       | Recovery      |
| -------------------- | ------------------------------------- | ------------- |
| required field empty | "<Field> is required"                 | fill field    |
| invalid date order   | "Must be on or after <date>"          | change date   |
| From = To            | "Destination must differ from origin" | change city   |
| save failed          | "Couldn't save the trip. Try again."  | Retry button  |
| version conflict     | "This trip changed. Reload to see     | Reload button |
|                      | the latest."                          |               |
| trip not found / not | "This trip doesn't exist or isn't     | Go home link  |
| owner                | yours."                               |               |
| offline              | "You're offline"                      | wait, retry   |


## UI

Form (create and edit):

```
┌─ BOARDING PASS ─────────────────────────┐
│ Trip name [ Europe with friends      ]  │
│ Currency  [ COP – Colombian peso   ▾ ]  │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│ LEG 1   FROM [BOG Bogotá ] → TO [MAD ▾] │
│         DATE [20 Feb 2027] (optional) ✕ │
│ LEG 2   FROM [MAD Madrid ] → TO [BCN ▾] │
│         DATE [23 Feb 2027]            ✕ │
│ [+ Add leg]        [↺ Add return home]  │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│ ▌▌▌▍▌▌▍▌▌     [ Create trip ]           │
└─────────────────────────────────────────┘
```

Edit mode: button reads "Save changes"; "Delete trip" below.

Home, mobile: horizontal carousel, scroll snap, cards almost full
width so the next card peeks in.

```
Europe with friends · 1 traveler
┌──────────────────────────────┐┌──
│ CURRENT STOP      Stop 2 of 5││ BC
│ MAD  Madrid                  ││
│ Arrive 20 Feb                ││
│ leave 23 Feb · 3 nights      ││
│ in 12 days                   ││
└──────────────────────────────┘└──
Other trips
┌──────────────────────────────┐
│ Peru trip  LIM → CUZ  1 Jul  │
└──────────────────────────────┘
```

Takeoff card: "✈ Takeoff BOG · 47 days to go".
Back home card: "🏠 Back home BOG · trip ends in 60 days".

Home, desktop: grid, current card large, the rest smaller.

```
┌────────────────────┐┌─────────┐┌─────────┐
│ CURRENT STOP       ││BCN 23Feb││FCO 28Feb│
│ MAD Madrid         │├─────────┤├─────────┤
│ Arrive 20 Feb      ││CDG 3 Mar││🏠 BOG   │
│ leave 23 · 3 nights│└─────────┘└─────────┘
└────────────────────┘
```


## Accessibility

- Keyboard: form fields in visual order, leg by leg. City autocomplete
  follows the WAI-ARIA combobox pattern. Carousel is focusable;
  arrow keys move between cards. No traps.
- Screen reader: carousel is a `region` named "Trip stops" containing
  a list. Each card's text includes "Stop 2 of 5"; the current card
  includes "Current stop" as text, not only size. Adding or removing a
  leg is announced ("Leg 3 added", "Leg 2 removed"). Save result and
  errors announced via a live region.
- Focus: after "Add leg", focus goes to the new leg's To field. After
  removing a leg, focus goes to the previous leg's remove button (or
  "Add leg" if none). On submit errors, focus the first invalid field.
  After create or save, focus moves to the home `<h1>`. Dialogs trap
  and return focus.
- Motion and contrast: no smooth scrolling or card animation under
  `prefers-reduced-motion`. Emoji on Takeoff/Back home cards are
  decorative (`aria-hidden`), with text labels. Errors use text and
  icon, not only color. Touch targets 44×44 px.


## Internationalization

- Locales: en, es. All copy through message keys, both locales.
- Dates: leg dates are date-only (`YYYY-MM-DD`), no time zone. Format
  with `Intl` ("20 Feb" / "20 feb"); year shown when not the current
  year.
- Countdown: computed from the user's local today; ICU plurals for
  days and nights ("1 night" / "3 nights", "1 noche" / "3 noches").
- Currency: ISO 4217 list with localized names. Default from the
  browser locale region; fallback USD. No geolocation prompt.
- City names: shown as in the city list; codes are not translated.
- Text length: plan for +40% (Spanish); no fixed-width text on cards.
- Layout uses logical CSS properties; carousel direction follows `dir`.


## Acceptance criteria

- AC-1. Given a signed-in member, when they submit the form with a
  name, a currency and one leg with From and To, then a trip is saved
  with them as owner and home shows it.
- AC-2. Given a leg, when the user adds a leg, then its From is the
  previous leg's To; when they remove a middle leg, then the next
  leg's From re-chains to the previous leg's To.
- AC-3. Given a city picker, when the user types, then autocomplete
  shows "CODE City" options, and the To options exclude the leg's
  From.
- AC-4. Given legs with dates, when a later leg's date is before an
  earlier dated leg, or a new date is in the past, then an inline
  error shows on that leg and submit is blocked.
- AC-5. Given the form, when the user clicks "Add return home", then a
  last leg from the last To to the origin is added; the button is
  hidden once the route returns home.
- AC-6. Given a new form, then currency defaults from the browser
  locale region, falling back to USD.
- AC-7. Given a trip, when home loads, then the next trip shows as
  Takeoff card, one card per stop, and Back home card if round trip;
  each stop card shows arrive date, smaller leave date, nights and
  "Stop N of M".
- AC-8. Given today's date, then the current stop follows the current
  card rules, is larger, labeled "Current stop", and the carousel
  starts on it.
- AC-9. Given other trips, then they show below as compact cards with
  name, first leg codes and first leg date.
- AC-10. Given the owner opens a trip, when they edit and save, then
  the trip updates; when the version is stale, then the conflict
  message shows and nothing is saved.
- AC-11. Given the owner, when they delete a trip and confirm, then it
  is removed and they return home.
- AC-12. Given unsaved form changes, when the user leaves, then a
  confirm dialog asks to discard.


## Out of scope

- Invite links, editor/viewer roles, removing members (#6).
- Activities, itinerary, budget on cards (later features).
- Transit duration, flight numbers, times of day.
- Real flight/airport API; city list is bundled and static.
- Separate trip detail page (edit form serves as trip page for now).
- Geolocation-based defaults.


## Open questions

- Source and size of the bundled city list (cities + IATA codes,
  localized names?). (planner, before plan approval)
- Create issue #6 for invites and roles now or after this ships?
  (Jose, before /feat-plan)
