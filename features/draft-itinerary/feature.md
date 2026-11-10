# Itinerary: activities per day, subscribe

Status: approved (self-approved in a bulk run, 2026-11-04; review in PR)


## Summary

Members add activities to days of the trip. The list is a shared set
of suggestions; each member says "I'm in" to what they will join, and
that choice drives their personal budget.


## Acceptance criteria

- AC-1 Any member adds an activity: title and day required; start
  time, duration, cost per person, currency (+ rate), link optional.
- AC-2 The day must be inside the trip dates when the trip has them.
- AC-3 Activities list by day, untimed first, then by start time.
- AC-4 Overlapping timed activities on a day show a warning; saving
  is never blocked.
- AC-5 The creator is subscribed; any member joins or leaves for
  themselves only. Participants are listed by name.
- AC-6 Any member edits or deletes an activity (delete asks first).
- AC-7 Offline: read-only, actions disabled with a notice.
- AC-8 en and es; costs shown in trip currency per person.


## Assumptions (made without interview)

- Last write wins on activity edits (no version check in v1).
- Max 300 activities per trip.
- Members who leave stop counting as participants.
