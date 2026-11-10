# Budget: items, splits, per person, cap

Status: approved (self-approved in a bulk run, 2026-11-04; review in PR)


## Summary

The trip budget answers "how much does this cost me?" first, then the
trip total. Costs come from budget items and subscribed activities.


## Acceptance criteria

- AC-1 Categories: flights, lodging, transport, food, other; plus
  activities from the itinerary.
- AC-2 Lodging, transport, food, other split equally among members;
  remainders in cents go to the first members so shares add up.
- AC-3 Flights are per person: the item names one member.
- AC-4 Activities count only for subscribed members.
- AC-5 Items in any currency; the rate to trip currency is entered
  and stored with the item.
- AC-6 Totals: viewer's share, trip total, per person, by category.
- AC-7 Optional cap: shows remaining or over.
- AC-8 Offline read-only; en and es.


## Assumptions

- Food is a total estimate (daily rate per destination is later).
- Every currency is treated as 2 decimals.
- No live exchange rates; members type today's rate.
