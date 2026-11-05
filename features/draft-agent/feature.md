# Agent: search, suggest, approve

Status: approved (self-approved in a bulk run, 2026-11-04; review in PR)


## Summary

A private chat on the trip page. The assistant searches the web for
activities, flights, transport and lodging for the trip's route and
dates, and proposes suggestions. Nothing changes until a member
approves; approval creates the activity or cost.


## Acceptance criteria

- AC-1 Chat is private per user and not stored.
- AC-2 Replies in the user's locale; prices labeled as estimates with
  a source link.
- AC-3 Suggestions: activity (day, time, cost per person) or budget
  item (category, amount, per person or shared).
- AC-4 Approve creates it through the public API; Dismiss hides it.
- AC-5 20 turns per user per day; over the limit shows a clear error.
- AC-6 No API key: the panel is hidden.
- AC-7 Offline: disabled with a notice.

Decisions: ADR 0010.
