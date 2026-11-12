# Transfers between destinations

Issue: #15
Status: approved
Owner: Jose Garzon


## Summary

Flights, trains, buses and other trips between cities become
transfers: items that sit between two destinations on the route, with
mode, departure and arrival times, duration, cost and a link. The trip
home shows the next transfer with a countdown, so nobody misses one.
The agent can find transfer options for a gap and add one on approval.


## Problem

Today a flight is a budget line in the "flights" category. Its date,
time and duration have no place in the app, so travelers dig through
the budget or their email to know when they leave. Trains, buses and
ferries between cities have no proper home either; they get lumped
into "transport" with taxis and the metro. The route shows cities, but
not how the group moves between them.

Success metric: 80% of trips with 2 or more destinations have at least
one transfer in every gap within 7 days of their second destination
being added.


## Concepts

- **Transfer**: a leg from one place to another. Fields: mode, from,
  to, depart date, depart time, arrive date, arrive time, cost per
  traveler, currency, charge mode, booking reference, link, notes.
- **Mode**: flight, train, bus, ferry, car, other.
- **Gap**: the slot between two consecutive destinations. There are
  also two edge gaps: outbound (before the first destination) and
  return (after the last).
- **Charge mode**:
  - *All travelers*: the cost is charged to every member, like
    lodging. No opt-in.
  - *Opt-in*: members join it, like an activity. The cost counts
    only for members who joined.
- A gap may hold several transfers: layover legs, or part of the
  group taking a different mode. They are listed by departure time.
- Transfers replace the "flights" budget category. "Transport" stays
  for local rides (taxi, metro, car rental inside a city).


## Users and roles

| Role   | Can do                                        | Cannot do |
| ------ | --------------------------------------------- | --------- |
| owner  | add, edit, delete transfers; join; use agent  | -         |
| editor | add, edit, delete transfers; join; use agent  | -         |

Non-members see nothing, as for the rest of the trip.


## Use cases

### UC-1: Add a transfer by hand

Actor: owner or editor
Trigger: taps "+ Add" in a gap

1. A sheet opens: bottom sheet on mobile, dialog on desktop.
2. From and to are prefilled from the neighbor destinations (outbound:
   only "to"; return: only "from").
3. User picks a mode and enters the depart date. Optionally: depart
   and arrive times, arrive date, cost and currency, charge mode
   (default "All travelers"), booking reference, link, notes.
4. User saves.

Result: the transfer shows in the gap. Its cost shows in the budget
under "Transfers". Duration is computed from the times.

Alternate flows:
- 3a. Arrival is before departure: field error, cannot save.
- 3b. Depart date is outside the gap dates: warning "Doesn't match
  route dates". Save is allowed.
- 4a. Save fails: inline "Couldn't save. Try again". The form keeps
  its values.

### UC-2: Find a transfer with the agent

Actor: owner or editor
Trigger: taps "Find options" in a gap

1. The agent panel opens with the gap prefilled (from, to, dates).
2. The agent returns 2 to 3 options. Each one shows mode, times,
   duration, price estimate and a source link.
3. User can switch the charge mode (default "All travelers") and
   approves one option.

Result: a transfer is created with the option's data. The source
link is saved as the transfer link.

Alternate flows:
- 2a. No options found: "No options found. Add it yourself" with a
  "+ Add" button that opens UC-1 prefilled.
- 2b. The user's daily agent limit is reached: the existing agent
  limit message shows.

### UC-3: Join an opt-in transfer

Actor: any member
Trigger: taps "Join" on an opt-in transfer

1. The button becomes "Joined". The count updates ("4 of 5").

Result: the cost is added to that member's budget. Tapping "Joined"
leaves the transfer and removes the cost.

### UC-4: Check the next transfer

Actor: any member
Trigger: opens the trip home

1. A "Next up" card shows the next upcoming transfer: mode, from, to,
   date, depart time and a countdown ("Leaves in 2 days").
2. Tapping the card scrolls to the transfer in the route.

Result: the member knows when and how they leave next.

### UC-5: Edit or delete a transfer

Actor: owner or editor
Trigger: taps a transfer, then "Edit" or "Delete"

1. Edit opens the same sheet with current values.
2. Delete asks for confirmation, then removes the transfer and its
   budget cost.

Alternate flows:
- 1a. Someone else changed it meanwhile: the existing version-conflict
  warning shows and asks to reload.

### UC-6: Existing flight items move to transfers

Actor: system, once
Trigger: the feature ships

1. Every budget item in the "flights" category becomes a transfer
   with mode "flight". Label goes to notes, amount, currency, rate and
   link are kept. Per-person items become opt-in transfers joined by
   that member; others become "All travelers".
2. Transfers whose date or gap is unknown are placed by the item's
   stop if set, else in the outbound gap, flagged "Check details".

Result: no flight cost is lost; budget totals do not change.


## States

| State        | When                          | User sees                     |
| ------------ | ----------------------------- | ----------------------------- |
| empty gap    | gap has no transfer           | dashed slot "How do you get   |
|              |                               | to <city>?", "+ Add", "Find   |
|              |                               | options"                      |
| loading      | route is loading              | existing route skeleton       |
| success      | gap has transfers             | transfer cards by departure   |
| no price     | cost missing                  | "No price yet"                |
| no next up   | no upcoming transfer          | "Next up" card hidden         |
| route change | gap cities no longer match    | flag "Route changed. Check    |
|              | the transfer from/to          | from/to"                      |
| error        | save or load fails            | inline error, retry           |
| offline      | no network                    | read only; add/edit disabled  |
| stale        | others changed it             | updates on window focus       |


## Edge cases

- EC-1. Destination deleted or reordered: transfers are kept and
  flagged "Route changed. Check from/to". Nothing is deleted.
- EC-2. Different time zones: depart time is in the "from" city's
  zone, arrive time in the "to" city's zone. Duration is computed
  across zones. If a city has no time zone, the form asks for it.
- EC-3. Overnight arrival: arrive time shows "+1" (or "+2").
- EC-4. Missing times: no duration shown. Countdown uses the date
  only ("Leaves tomorrow").
- EC-5. Several transfers in one gap: sorted by depart date and time;
  same time keeps creation order.
- EC-6. Opt-in transfer nobody joined: shows "0 of 5"; costs nothing.
- EC-7. Member leaves the trip: removed from opt-in transfers;
  "All travelers" totals shrink like other per-traveler items.
- EC-8. Trip with one destination: only outbound and return gaps.
- EC-9. Departure in the past: transfer stays, shown muted; not used
  for "Next up".
- EC-10. Cost in another currency: the rate is stored at entry, as
  for budget items.
- EC-11. Very long names or references: wrap, never truncate the
  from/to cities.


## Errors

| Failure                 | Message to user                   | Recovery      |
| ----------------------- | --------------------------------- | ------------- |
| save fails              | Couldn't save. Try again.         | retry, values |
|                         |                                   | kept          |
| arrival before depart   | Arrival must be after departure.  | fix field     |
| missing required field  | <Field> is required.              | fill field    |
| invalid link            | Enter a valid link.               | fix field     |
| version conflict        | existing conflict warning         | reload        |
| agent finds nothing     | No options found. Add it          | "+ Add"       |
|                         | yourself.                         |               |
| agent fails             | existing agent error              | retry         |
| delete fails            | Couldn't delete. Try again.       | retry         |


## UI

Route view, mobile:

```
┌────────────────────────────────────┐
│ ● Bogotá            12–15 Mar      │
│                                    │
│ ┆ ✈ Flight  Sat 15 Mar             │
│ ┆ BOG 09:40 → CTG 11:05  1h 25m    │
│ ┆ $180 each · All travelers        │
│ ┆ Ref AV9512 · Open booking ↗      │
│                                    │
│ ● Cartagena         15–19 Mar      │
│                                    │
│ ┆ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐    │
│ ┆   How do you get to Santa       │
│ ┆   Marta?                        │
│ ┆   [+ Add]  [✦ Find options]     │
│ ┆ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘    │
│ ● Santa Marta       19–22 Mar      │
└────────────────────────────────────┘
```

Opt-in transfer card:

```
┌────────────────────────────────────┐
│ 🚌 Bus  Wed 19 Mar                 │
│ Cartagena 08:00 → Santa Marta      │
│ 12:30  4h 30m                      │
│ $25 each · 3 of 5      [ Join ]    │
│ View source ↗                      │
└────────────────────────────────────┘
```

Trip home, top:

```
┌────────────────────────────────────┐
│ NEXT UP · leaves in 2 days         │
│ ✈ BOG → CTG  Sat 15 Mar 09:40      │
└────────────────────────────────────┘
```

Add/edit sheet:

```
┌────────────────────────────────────┐
│ Add transfer                    ✕  │
│ Mode  [✈][🚆][🚌][⛴][🚗][…]        │
│ From  [Bogotá        ]             │
│ To    [Cartagena     ]             │
│ Depart [15 Mar] [09:40]            │
│ Arrive [15 Mar] [11:05]            │
│ Cost  [180] [USD ▾] per traveler   │
│ Charge (•) All travelers ( ) Opt-in│
│ Booking ref [        ]             │
│ Link [                ]            │
│ Notes [               ]            │
│               [Cancel] [Save]      │
└────────────────────────────────────┘
```

Budget: a "Transfers" group lists each leg with its cost. Tapping a
leg opens it in the route.


## Accessibility

- Keyboard: every gap action and transfer card reachable by Tab in
  route order; sheet traps focus while open; Escape closes it.
- Screen reader: each transfer is read as one sentence, e.g. "Flight
  from Bogotá to Cartagena, Saturday 15 March, departs 09:40, arrives
  11:05, 1 hour 25 minutes". Mode icons are decorative; the mode is
  always shown as text. Join toggle uses `aria-pressed`.
- Countdown is not a live region; it is read on page load only.
- Focus: after save, focus goes to the new or edited card; after
  delete, to the gap's "+ Add" or the next card; after closing the
  sheet, back to the trigger.
- Motion and contrast: no motion required; respect reduced motion.
  Route-change and date warnings use text and icon, not color alone.
  Touch targets at least 44 by 44 px.


## Internationalization

- Locales: en, es. All copy and mode names translated.
- Dates and times: locale format (en "9:40 AM", es "09:40"). Times
  are local to each city's time zone; "+1" for next-day arrival.
- Duration: localized ("1h 25m", "1 h 25 min").
- Currency and numbers: next-intl, trip currency for totals.
- Pluralization: "Leaves in {n} days", "{n} of {total}" via ICU.
- Text length: Spanish runs longer; cards wrap, never truncate cities.


## Acceptance criteria

- AC-1. Given a trip with destinations, when a member opens the
  route, then each gap (outbound, between, return) shows its
  transfers by departure, or an empty slot with "+ Add" and "Find
  options".
- AC-2. Given an empty gap, when an editor adds a transfer with mode,
  from, to and depart date, then it shows in that gap with from/to
  prefilled from the neighbor destinations.
- AC-3. Given depart and arrive times in cities with different time
  zones, when the transfer is saved, then duration is computed across
  zones and next-day arrival shows "+1".
- AC-4. Given arrival before departure, when saving, then a field
  error shows and nothing is saved; given a date outside the gap, a
  warning shows and saving is allowed.
- AC-5. Given an "All travelers" transfer with a cost, then every
  member's budget includes it and the trip total grows with members.
- AC-6. Given an opt-in transfer, when a member taps "Join", then the
  cost is added to their budget and the count updates; "Joined"
  removes it.
- AC-7. Given a gap, when a member taps "Find options", then the
  agent returns options with times, price and a source link, and
  approving one creates a transfer with that link saved.
- AC-8. Given an upcoming transfer, when a member opens the trip
  home, then a "Next up" card shows it with a countdown and links to
  it in the route.
- AC-9. Given a destination is deleted or reordered, then affected
  transfers are kept and flagged "Route changed. Check from/to".
- AC-10. Given existing "flights" budget items, when the feature
  ships, then they become transfers, the "flights" category is gone,
  and budget totals are unchanged.
- AC-11. Given the budget screen, then a "Transfers" group lists each
  leg and its cost, linking to it in the route.
- AC-12. Transfer screens pass axe-core and read each transfer as one
  sentence to screen readers, in en and es.


## Out of scope

- Real flight or train API (agent uses web search).
- Booking or payment.
- Reminders, email or push notifications.
- Ticket or boarding pass file uploads, seat numbers.
- Live flight status tracking.
- Map view of the route.


## Open questions

- None. 12 acceptance criteria, slightly above the ~10 guideline; the
  owner chose to keep the agent part in this feature.
