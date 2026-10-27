# Product

<!-- impeccable:product-schema 1 -->

Travel Planning helps a group of friends plan and budget a trip
together. At the end they have a clear itinerary and a clear budget,
in total and per person.

`/feat-refine` reads this file for context. Update it when the product
direction changes.


## Users

A group of people traveling together. One creates the trip; the rest
join by invite link.

| Role    | Can                                                    |
| ------- | ------------------------------------------------------ |
| owner   | everything; invite and remove members; one per trip    |
| editor  | edit cities, activities, budget; use the agent         |
| viewer  | read everything                                        |

- First run is organizer-first: a new user should understand at once
  that they can create a trip, lay out its route, then invite their
  friends. Joining by invite is the secondary path.
- Exactly one owner. Ownership cannot be transferred.
- Invites: shareable link, expires in 7 days, no approval needed.
  The owner picks the role (editor or viewer) for the link.


## Core concepts

- **Trip**: name, date range, trip currency, members.
- **Destination**: a city with a date range. Listed in calendar order.
  A city may appear twice (Bogotá → Cartagena → Bogotá).
- **Activity**: something to do in a destination, on a day, with
  optional start time, duration, cost per person, and link.
  Overlapping activities show a warning.
- **Participants**: the itinerary is a list of suggestions. Each
  member subscribes to the activities they will join. Subscribing adds
  that activity's cost to their personal budget.
- **Budget item**: flights, lodging, transport, activities, food,
  other. Estimates only (no tracking of who paid, no settle-up).


## Budget rules

- Activities: cost counted only for subscribed members.
- Food: daily per-person estimate per destination, times days,
  split equally among all members.
- Transport and lodging: split equally among all members.
- Flights: per person (each member may have their own flight).
- Totals: trip total and per-person total, in the trip currency.
- Items may be entered in any currency. The exchange rate is stored
  with the item at entry time.
- Optional budget cap per trip: shows remaining or over.


## Agent

A key part of the product, not an add-on.

- Searches for activities, flights and transport with the best prices
  for the trip's destinations and dates.
- v1 data source: web search through OpenRouter. Results are labeled
  as estimates with a source link.
- Suggests. Nothing changes until a member approves a suggestion.
  On approval it creates the activity or budget item.
- Chat is private per user; approved results are visible to everyone.
- Answers in the user's locale.
- Rate limited per user per day to control cost.


## Platform

- Web app + public API (`/api/v1`) + installable PWA.
- Offline: read-only itinerary and budget.
- Changes from others appear on window focus (no polling, no sockets).
- Concurrent edits: optimistic version check, warn and reload.
- Locales: English (default) and Spanish.
- Design: bold and playful, very easy to read, generous spacing,
  clear information hierarchy. No generic AI look. Every screen
  tells the user what they can do next. Visual world: DESIGN.md.


## Positioning

Group planning and group budgeting in one place. Each member
subscribes to the activities they will join, and that choice drives
their personal budget. Itinerary tools do not split costs; split
tools do not know the itinerary.


## Product Principles

- The itinerary is a shared list of suggestions; each person opts in.
- Every number answers "how much does this cost me?" first, then the
  trip total.
- Nothing changes without a member's approval (agent included).
- Read first: most visits are checking the plan, not editing it.


## Accessibility

WCAG 2.2 AA. Checked with axe-core in e2e tests.


## Roadmap

Feature order. Each becomes a GitHub issue and goes through
`docs/workflow.md`.

1. Design system: brand, color, type, icons, tokens, primitives,
   motion, voice. Styleguide page.
2. Auth: magic link sign in (Better Auth + Resend).
3. Trips and members: create trip, invite link, roles, remove member.
4. Destinations: add cities with date ranges, calendar order.
5. Itinerary: schedule activities per day, overlap warning,
   subscribe to activities.
6. Budget: items, categories, currency, equal splits, per-person and
   total, cap.
7. Agent: search, suggest, approve, update itinerary and budget.
8. PWA: installable, offline read-only.
9. Observability: open source analytics and error monitoring.

Later: WhatsApp OTP sign in, activity feed, map view, push
notifications, real flight API, custom split amounts.
