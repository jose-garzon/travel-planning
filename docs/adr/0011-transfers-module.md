# 0011. Transfers module

Date: 2026-11-12
Status: accepted


## Context

Feature #15 turns flights, trains and buses between destinations into
transfers: items placed in the gaps of the route, with local times in
two time zones, a cost charged to all travelers or opt-in, and members
who join. Today flights are budget items (`category = flights`). The
behavior is close to activities (participants, cost) and to the route
(gaps), but belongs to neither.


## Decision

- New module `transfers` (domain, service, data, ui, messages) owns
  the `transfer` and `transfer_participant` tables.
- A transfer belongs to a gap, identified by its index in the route
  (gap `g` is leg `g`; gap `legs.length` is the return gap). It stores
  a snapshot of its from/to city names to detect route changes.
- `trips` provides the route with city time zones through the
  trip-context port. `budget` reads transfer costs through a new port
  `TransferCostsReader`. `agent` creates transfers through the public
  `/api/v1` transfers endpoints, like activities.
- The `flights` budget category is removed. A one-time migration moves
  flight items into transfers.
- City time zones (IANA) come from GeoNames, added to `cities.json`.


## Consequences

- One more module in `docs/standards/architecture.md`.
- `/api/v1/.../budget/items` rejects `category: "flights"` (breaking;
  no external clients yet).
- Budget summary category `flights` becomes `transfers`.
- Gap index has the same weakness as `budget_item.stop`: a reordered
  route moves the index. The name snapshot flags it to the user.
