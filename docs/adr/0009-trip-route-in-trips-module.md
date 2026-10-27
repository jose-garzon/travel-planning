# 0009. Trip route lives in the trips module

Date: 2026-10-26
Status: accepted


## Context

The architecture table planned a `destinations` module owning cities
with date ranges (roadmap item 4). Feature #5 creates a trip and its
multi-city route (legs) in one form and one save. Splitting legs into
another module would need cross-module ports for a single atomic
write, and stops are derived from legs, not entered separately.


## Decision

- Legs (`trip_leg`) are part of the `trips` aggregate.
- Stops, origin and return home are derived from legs in
  `trips/domain`, never stored.
- The `destinations` module is removed from the module table in
  `docs/standards/architecture.md`.


## Consequences

- One transaction per trip save; no ports between trips and a
  destinations module.
- Itinerary (activities per stop) will reference `trip_leg.id` through
  a port provided by `trips`.
- `trips` grows; if it passes ~3k lines, revisit splitting.
