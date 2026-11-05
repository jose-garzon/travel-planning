# Shape: assistant "proposed" lane

Status: brief. Feed into `/feat-refine` before any code.

## Problem

Agent suggestions are approved inside a private chat, away from the
itinerary and budget where the decision belongs. Context (why, source)
is lost once the chat is cleared. Critique 2026-11-06, Q3.

## Idea

Approve and dismiss move out of the chat. Each suggestion lands as a
"proposed" stop: dashed station on the route line, in its city and day,
or a dashed row in the budget category. Chat stays the place to ask.

- Proposed items are private to the asker until added (PRODUCT.md:
  chat private, approved results shared).
- Card shows source link and "suggested by the assistant for <name>";
  added items keep the source.
- Add / Edit / Dismiss on the item itself, editing through the existing
  activity and budget forms.
- Chat reply lists "3 proposed in Lisbon, see them" instead of cards.
- Phone: drawer closes, page scrolls to the first proposed item.

## Open questions

1. Persist proposals server side (needed for cross-device) or session?
2. Do other members ever see proposals ("Ana is considering…")?
3. Overlap warnings: count proposed items or not?
4. Bulk "Add all proposed in Lisbon"?

## Not now

Voting, comments, auto-approval.
