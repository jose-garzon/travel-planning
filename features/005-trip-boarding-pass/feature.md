# Create a trip by drawing its route, and see it on home

Issue: #5
Status: approved
Owner: Jose Garzon


## Summary

A signed-in user creates a trip by drawing its route as a metro line
(DESIGN.md): a trip name, a currency and a multi-city route of legs
(Bogotá → Madrid → Barcelona → Rome → Bogotá), with optional dates.
Each city is a station; the next one is an open station with a city
search and a visible list of cities. The home page then shows the next
trip as that line, one station per stop, with the current stop
emphasized. The owner can edit or delete the trip later.

Redesign note (2026-11-02): the boarding-pass form and carousel of
cards were replaced by the metro line world. Behaviour, rules and
acceptance criteria are unchanged except AC-3 (visible city list),
AC-7 to AC-9 (a timeline of trip rows, each with its route as a
short line, instead of the carousel) and the "Add stop" label.


## Problem

Signed-in users land on a home page with an empty state and no way to
create a trip. Every later feature (members, itinerary, budget, agent)
needs a trip with destinations. A transit line diagram is the mental
model people already read for "stops in order", so the form draws the
route as one, and the next step is always the open station.

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
- **Origin**: the From city of leg 1. Shown as the Takeoff station
  (filled ring).
- **Return home**: a last leg whose To city equals the origin. Shown as
  the Back home station (filled ring), not as a stop.
- **Trip date range**: first dated leg to last dated leg.


## Use cases

### UC-1: Create a trip

Actor: member
Trigger: "Create trip" on home (empty state CTA or header button)

1. The route form opens: the trip name, the Takeoff station and one
   open station (dashed ring) for the first stop.
2. User types the trip name.
3. Currency is preselected from the browser locale region (`es-CO` →
   COP, `en-US` → USD; fallback USD). User may change it.
4. User picks From and To for leg 1. Focusing a city field shows a
   list of suggested cities right away (popular cities for the
   browser region, then recent picks); typing filters it ("BOG
   Bogotá"). The To list excludes the leg's From city. The picked
   city is drawn as the station name and the ring closes.
5. User optionally picks a date.
6. User clicks "Add stop". The line extends to a new open station; its
   leg's From is the previous leg's To. User picks To and optional
   date.
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

1. Every trip shows on one timeline, one same-size row per trip: the
   next trip (upcoming or in progress) first with a line-coloured
   rule, then other upcoming trips by start date, then "Past trips",
   quiet, most recent first.
2. Each row: trip name, date range, the route as a short line of
   station codes (BOG ━ CTG ━ SMR ━ BOG, hubs filled), and its next
   step: countdown, "Next: add dates" when undated, "Just you so far"
   while solo; past rows show "Ended <date>".
3. On the next trip's row the current stop's station is larger and
   labeled "Current stop".

Result: user sees where they are or go next, and what follows.

### UC-3: Edit a trip

Actor: owner
Trigger: open a trip from home (next trip or compact panel)

1. The same route form opens prefilled.
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


## Current stop rules

- Before the trip: the first stop is current.
- During the trip: the stop where today ≥ arrival date and today <
  departure date (next leg's date) is current.
- After the last dated leg: no current stop; the trip moves to "Other
  trips" and the next upcoming trip takes the home line.
- Stops without dates are never current, except when all legs are
  undated: then the first stop is current.
- On a horizontal line that overflows, it starts scrolled to the
  current stop.


## Station content

Stop station:
- To code large (MAD), city name smaller (Madrid)
- "Stop 2 of 5"
- Arrive date prominent ("Arrive 20 Feb"); departure smaller ("leave
  23 Feb"); "Date TBD" when unknown
- Nights at the stop ("3 nights"), only when both dates are known
- Countdown on the current stop ("in 12 days", "today")
- Above the line: trip name and member count ("1 traveler")

Takeoff station (start): filled ring. Origin code, departure date,
countdown to trip start ("47 days to go", "Today!", "On the way").

Back home station (end): filled ring. Origin code, return date,
countdown to trip end ("Trip ends in 60 days").

Compact panel (other trips): trip name, first leg codes (LIM → CUZ),
first leg date.


## States

| State        | When                          | User sees                     |
| ------------ | ----------------------------- | ----------------------------- |
| empty        | no trips                      | existing empty state, CTA     |
|              |                               | "Create your first trip"      |
| loading      | home or form data loading     | skeleton line / form          |
| undated      | all legs without dates        | "Date TBD" on stops, first    |
|              |                               | stop current                  |
| past only    | all trips ended               | "No upcoming trips" + Create  |
|              |                               | trip, then Other trips        |
| success      | trip created or saved         | home with the line, toast     |
|              |                               | "Trip created" / "Saved"      |
| save error   | server or network failure     | inline error, data kept       |
| conflict     | version mismatch on save      | reload message (UC-3 3a)      |
| offline      | no connection                 | form disabled, banner "You're |
|              |                               | offline"; home read-only      |


## Edge cases

- EC-1. From = To on a leg: To list excludes From; typed free text
  equal to From shows "Destination must differ from origin".
- EC-2. Same city in different legs (BOG → CTG → BOG → MDE): valid,
  separate stations.
- EC-3. Leg date earlier than a previous dated leg: "Must be on or
  after <date>" on that leg.
- EC-4. Same day for two legs: valid (0 nights, nights label hidden).
- EC-5. Date in the past at creation: "Pick today or a later date".
  On edit, existing past dates are kept and allowed.
- EC-6. Undated legs between dated ones: allowed, not checked.
- EC-7. Maximum 10 legs: "Add stop" disabled with hint "Up to 10
  stops".
- EC-8. Minimum 1 leg: remove button hidden on the only leg.
- EC-9. Removing a middle leg: next leg's From re-chains.
- EC-10. Last leg already returns to origin: "Add return home" hidden.
- EC-11. Trip name: required, 1-60 characters, trimmed.
- EC-12. Two trips overlapping in time: allowed; the one starting
  first is the home line trip.
- EC-13. Long city names (40+ chars): wrap on the vertical line;
  truncate with ellipsis on the horizontal line and compact panels,
  full name in accessible name and tooltip.
- EC-14. City list with no match: the list shows "No city found. Use
  '<text>' as typed" as its only option (alternate flow 4a).


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

Visual world: DESIGN.md (metro line). Form (create and edit), mobile:

```
NEW TRIP
Start with the route: where you leave from
and your first stop.

Trip name [ Europe with friends          ]

 ●  BOGOTÁ                Takeoff
 ┃  From [ Bogotá                     ]
 ┃
 ○  MADRID                Leg 1
 ┃  To   [ mad|                       ]
 ┃  ┌────────────────────────────────┐
 ┃  │ MAD  Madrid        Spain       │
 ┃  │ MDE  Medellín      Colombia    │
 ┃  │ MAN  Manchester    UK          │
 ┃  └────────────────────────────────┘
 ┃  Date [ 20 Feb 2027 ] (optional)   ✕
 ┊
 ◌  [+ Add stop]   [↺ Add return home]

Currency [ COP – Colombian peso ▾ ]
[ Create trip ]  [ Cancel ]
```

The open station (◌, dashed ring) is always the next thing to do.
Picking a city closes its ring and draws the line down to the next
station (motion-safe). Edit mode: button reads "Save changes";
"Delete trip" below.

Home, mobile: the next trip as a vertical line.

```
Europe with friends · 1 traveler · in 12 days
 ●  BOG  Takeoff · 20 Feb
 ┃
 ◉  MAD  Madrid        CURRENT STOP · Stop 1 of 3
 ┃       Arrive 20 Feb · leave 23 Feb · 3 nights
 ○  BCN  Barcelona     Stop 2 of 3
 ┃
 ●  BOG  Back home · 3 Mar
Other trips
┌──────────────────────────────┐
│ PERU TRIP  LIM → CUZ  1 Jul  │
└──────────────────────────────┘
```

Home, desktop: the same line laid horizontally across the page, the
current stop's station larger.

```
 ●━━━━━━━━━━◉━━━━━━━━━━○━━━━━━━━━━○━━━━━━━━━━●
BOG        MAD         BCN        CDG        BOG
Takeoff    CURRENT     23 Feb     3 Mar      Back home
20 Feb     3 nights
```


## Accessibility

- Keyboard: form fields in visual order, leg by leg. City autocomplete
  follows the WAI-ARIA combobox pattern; the suggestion list opens on
  focus and is navigable with arrow keys. A horizontal line that
  overflows scrolls with the keyboard. No traps.
- Screen reader: the home line is a `region` named "Trip stops"
  containing an ordered list. Each station's text includes "Stop 2 of
  5"; the current stop includes "Current stop" as text, not only size
  or a filled ring. Adding or removing a
  leg is announced ("Leg 3 added", "Leg 2 removed"). Save result and
  errors announced via a live region.
- Focus: after "Add stop", focus goes to the new leg's To field. After
  removing a leg, focus goes to the previous leg's remove button (or
  "Add stop" if none). On submit errors, focus the first invalid field.
  After create or save, focus moves to the home `<h1>`. Dialogs trap
  and return focus.
- Motion and contrast: no line draw-in, station pop or smooth
  scrolling under `prefers-reduced-motion`. Rings and the line are
  decorative CSS; every station has text labels. Errors use text and
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
- Text length: plan for +40% (Spanish); no fixed-width text on
  stations.
- Layout uses logical CSS properties; the horizontal line follows
  `dir`.


## Acceptance criteria

- AC-1. Given a signed-in member, when they submit the form with a
  name, a currency and one leg with From and To, then a trip is saved
  with them as owner and home shows it.
- AC-2. Given a leg, when the user adds a leg, then its From is the
  previous leg's To; when they remove a middle leg, then the next
  leg's From re-chains to the previous leg's To.
- AC-3. Given a city picker, when it gets focus, then a list of
  suggested cities shows before any typing; when the user types, then
  the list filters to "CODE City" options; the To options exclude the
  leg's From.
- AC-4. Given legs with dates, when a later leg's date is before an
  earlier dated leg, or a new date is in the past, then an inline
  error shows on that leg and submit is blocked.
- AC-5. Given the form, when the user clicks "Add return home", then a
  last leg from the last To to the origin is added; the button is
  hidden once the route returns home.
- AC-6. Given a new form, then currency defaults from the browser
  locale region, falling back to USD.
- AC-7. Given trips, when home loads, then every trip shows as a
  timeline row with its route as a line of station codes (origin,
  each stop, home if round trip) and its next step.
- AC-8. Given today's date, then on the next trip's row the current
  stop follows the current stop rules, is larger and labeled "Current
  stop".
- AC-9. Given other trips, then upcoming ones follow the next trip by
  start date and ended ones show under "Past trips".
- AC-10. Given the owner opens a trip, when they edit and save, then
  the trip updates; when the version is stale, then the conflict
  message shows and nothing is saved.
- AC-11. Given the owner, when they delete a trip and confirm, then it
  is removed and they return home.
- AC-12. Given unsaved form changes, when the user leaves, then a
  confirm dialog asks to discard.


## Out of scope

- Invite links, editor/viewer roles, removing members (#6).
- Activities, itinerary, budget on the line (later features).
- Transit duration, flight numbers, times of day.
- Real flight/airport API; city list is bundled and static.
- Separate trip detail page (edit form serves as trip page for now).
- Geolocation-based defaults.


## Open questions

- Source and size of the bundled city list (cities + IATA codes,
  localized names?). (planner, before plan approval)
- Create issue #6 for invites and roles now or after this ships?
  (Jose, before /feat-plan)
