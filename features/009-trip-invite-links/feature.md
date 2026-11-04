# Invite friends to a trip by link

Issue: #9
Status: approved
Owner: Jose Garzon


## Summary

The trip owner shares one invite link. Anyone who opens it signs in
with their email and joins the trip as an editor who can change the
plan. Everyone sees who is traveling in a floating Travelers card; the
owner can remove members and any member can leave.


## Problem

Today a trip has one member, its owner. Friends cannot see or change
the plan, so planning moves back to chat. Every later feature
(itinerary subscriptions, per-person budget split) needs more than one
member.

Success metric: 60% of trips have 2 or more members within 7 days of
creation.


## Users and roles

| Role     | Can do                                  | Cannot do            |
| -------- | --------------------------------------- | -------------------- |
| owner    | invite, reset link, remove members,     | leave the trip       |
|          | edit and delete the trip                |                      |
| editor   | see members, edit trip (name, route,    | invite, reset link,  |
|          | currency), leave the trip               | remove, delete trip  |
| visitor  | open an invite link, see the preview,   | see the trip without |
| (anyone) | sign in to join                         | joining              |

Every invite makes an editor. There is no viewer role and no role
picker in this feature. This differs from `docs/product.md` ("the
owner picks the role for the link"); product.md is updated with the
plan.

Exactly one owner. Ownership cannot be transferred.


## Concepts

- **Invite link**: one active link per trip. Opaque, unguessable URL
  `/join/<token>`. Expires 7 days after it was created.
- **Reset link**: replaces the active link with a new one; the old one
  stops working at once. A new link gets a new 7-day expiry.
- **Member**: a user in the trip, `owner` or `editor`. Max 20 per trip,
  owner included.


## Use cases

### UC-1: Owner shares the invite link

Actor: owner
Trigger: "Invite" button in the Travelers card on the trip page

1. Owner opens the trip page (`/trips/[tripId]`).
2. Owner presses "Invite". The Invite card opens (floating, top left on
   desktop; bottom sheet on mobile).
3. If the trip has no active link, one is created now.
4. The card shows the link, "Anyone with the link joins as an editor",
   "Copy link", "Share" (when the Web Share API exists) and
   "Expires {date} · Reset link".
5. Owner presses "Copy link". The button shows "Copied" and a live
   region announces it.

Result: the owner has a link to send through any app.

Alternate flows:
- 5a. "Share": the native share sheet opens with the trip name and
  link.
- 5b. "Reset link": confirm dialog ("Reset link? The current link stops
  working."); on confirm a new link and expiry show.
- 2a. Right after creating a trip, the toast "Trip created" has an
  "Invite friends" action that opens the trip page with the Invite
  card open.

### UC-2: Signed-in visitor joins

Actor: signed-in user, not a member
Trigger: opens `/join/<token>`

1. The join page shows "{owner} invited you to", trip name, date range
   and member count.
2. User presses "Join trip".
3. User becomes an editor and lands on the trip page with the toast
   "You joined {trip}".

Result: the trip shows on the user's home timeline like their own.

Alternate flows:
- 1a. Already a member: go straight to the trip page, toast "You're
  already in this trip".
- 1b. Link expired, reset or unknown: expired page (see States).
- 2a. Trip full: full page (see States).

### UC-3: Signed-out visitor joins

Actor: anonymous visitor
Trigger: opens `/join/<token>`

1. The join page shows the same preview with "Sign in to join".
2. Visitor enters their email (existing magic link sign-in from #3).
3. Visitor opens the magic link. New users go through name capture
   (#3) first.
4. Visitor lands on the trip page, already joined, with the toast
   "You joined {trip}".

Result: as UC-2.

Alternate flows:
- 3a. The invite expired or the trip filled up between the email and
  the click: the user is signed in and sees the expired or full page.

### UC-4: See who is traveling

Actor: owner, editor
Trigger: opens the trip page

1. The Travelers card is always visible (floating, top left on
   desktop; collapsible bar "{n} travelers" above the form on mobile).
2. It lists members by name, owner first with an "Owner" badge, then
   by join date. Email shows on hover and focus.

### UC-5: Owner removes a member

Actor: owner
Trigger: "Remove" next to a member

1. Confirm dialog: "Remove {name} from {trip}?" with "Remove" and
   "Cancel".
2. On confirm the member disappears from the list; live region
   announces "{name} removed".

Result: the removed user loses access. Their next action or page load
on the trip shows "You're no longer in this trip" and sends them home.

### UC-6: Member leaves

Actor: editor
Trigger: "Leave trip" in the Travelers card (own row)

1. Confirm dialog: "Leave {trip}? You'll need a new invite to come
   back."
2. On confirm the user goes home with the toast "You left {trip}".

The owner has no "Leave trip"; they can only delete the trip.

### UC-7: Editor edits the trip

Actor: editor
Trigger: opens the trip page

1. The trip form works as for the owner (name, route, currency, Save).
2. No "Delete trip" button and no "Invite" or "Remove" controls.
3. A stale save shows the existing version conflict message (005).


## States

| State   | When                          | User sees                         |
| ------- | ----------------------------- | --------------------------------- |
| alone   | owner is the only member      | owner row and "Invite friends to  |
|         |                               | plan together" (opens Invite)     |
| loading | creating link, joining        | button busy state, no layout jump |
| success | joined, copied, removed, left | toast or inline "Copied"          |
| expired | link expired, reset, unknown  | "This invite link has expired.    |
|         |                               | Ask {owner} for a new one." +     |
|         |                               | "Go home" (unknown: no owner)     |
| full    | trip has 20 members           | "This trip is full (20            |
|         |                               | travelers)" + "Go home"           |
| removed | user no longer a member       | "You're no longer in this trip"   |
|         |                               | toast on home                     |
| offline | no network                    | Copy works; Join, Remove, Leave,  |
|         |                               | Reset disabled with offline note  |


## Edge cases

- EC-1. Owner opens their own invite link: as "already a member".
- EC-2. Removed member opens a still-valid link: they can rejoin. The
  owner resets the link to stop it.
- EC-3. Two people join at once when 19 members exist: only one joins;
  the other sees the full page.
- EC-4. Link reset while a visitor is on the join page: "Join trip"
  shows the expired page.
- EC-5. Member removed while editing: Save fails, they see "You're no
  longer in this trip" and go home; unsaved changes are lost.
- EC-6. Two editors save at once: version conflict as in 005.
- EC-7. Trip deleted after the link was shared: the link shows the
  expired page.
- EC-8. Long names (40+ chars) in the Travelers card: truncate with
  ellipsis; full name in the accessible name and on hover.
- EC-9. Visitor locale differs from owner's: join page uses the
  visitor's locale and date format.
- EC-10. Join link opened in a browser where the user is signed in
  with another account: joins that account (no account switch).


## Errors

| Failure                   | Message to user                | Recovery        |
| ------------------------- | ------------------------------ | --------------- |
| expired/reset/unknown     | This invite link has expired.  | Go home         |
| link                      | Ask {owner} for a new one.     |                 |
| trip full                 | This trip is full (20          | Go home         |
|                           | travelers).                    |                 |
| not a member any more     | You're no longer in this trip. | sent home       |
| copy fails (no clipboard) | Couldn't copy. Select the link | link text is    |
|                           | and copy it.                   | selected        |
| network error on action   | Something went wrong. Try      | button stays,   |
|                           | again.                         | retry           |
| non-owner calls owner API | (API 403 `TRIP_FORBIDDEN`)     | UI never offers |


## UI

Trip page, desktop, owner viewing. Cards float top left over the page:

```
┌────────────────────────────────────────────────────────────┐
│ ┌──────────────────────┐                                   │
│ │ Travelers · 3        │      Trip form (route line,       │
│ │ ● Jose      Owner    │      name, currency, Save)        │
│ │ ● Laura     Remove   │                                   │
│ │ ● Ana       Remove   │                                   │
│ │ [ Invite ]           │                                   │
│ └──────────────────────┘                                   │
└────────────────────────────────────────────────────────────┘
```

Editor viewing: no "Remove", no "Invite"; own row has "Leave trip".

Invite card (desktop: floating over the top left, like a share
popover; mobile: bottom sheet):

```
┌──────────────────────────────┐
│ Invite friends            ✕  │
│ Anyone with the link joins   │
│ as an editor.                │
│ ┌──────────────────────────┐ │
│ │ trips.app/join/k3x9…     │ │
│ └──────────────────────────┘ │
│ [ Copy link ]  [ Share ]     │
│ Expires Nov 10 · Reset link  │
└──────────────────────────────┘
```

Mobile trip page:

```
┌────────────────────────┐
│ 3 travelers ▾          │
├────────────────────────┤
│ Trip form              │
│                        │
└────────────────────────┘
```

Join page (`/join/<token>`):

```
┌──────────────────────────────┐
│ Jose invited you to          │
│ Europe                       │
│ Nov 20 – Dec 3 · 3 travelers │
│ [ Join trip ]                │
│ (signed out: Sign in to join)│
└──────────────────────────────┘
```

Cards follow the metro line world (DESIGN.md).


## Accessibility

- Travelers card: `region` named "Travelers", list of members as `ul`.
- Invite card: non-modal popover on desktop (Escape and ✕ close it,
  focus returns to "Invite"); modal dialog as bottom sheet on mobile
  with focus trapped.
- Link field read-only, labeled "Invite link"; focusing it selects
  the text.
- "Copied", "{name} removed" and link reset are announced in a polite
  live region.
- Remove, Leave and Reset use the confirm `Dialog`; focus returns to
  the trigger, or to the Travelers heading if the trigger is gone.
- Touch targets ≥ 44px; mobile bar is a disclosure button with
  `aria-expanded`.
- Respects reduced motion for the card and sheet.


## Internationalization

- Locales en, es. All copy in message files.
- Plurals with ICU: "{n, plural, one {# traveler} other {# travelers}}".
- Expiry date and trip dates with `Intl.DateTimeFormat` in the
  viewer's locale.
- Owner and trip names are user data, never translated.
- Spanish text runs ~30% longer: cards grow in height, never clip.


## Acceptance criteria

- AC-1. Given the owner, when they press "Invite", then the Invite card
  shows the active link (created if missing), its expiry date, "Copy
  link", "Share" (when supported) and "Reset link".
- AC-2. Given the Invite card, when the owner copies the link, then
  the clipboard holds it and "Copied" is shown and announced.
- AC-3. Given the owner, when they reset the link and confirm, then
  the old link shows the expired page and a new link with a new 7-day
  expiry shows.
- AC-4. Given a signed-in non-member with a valid link, when they press
  "Join trip", then they are an editor and land on the trip page with
  "You joined {trip}".
- AC-5. Given a signed-out visitor with a valid link, when they sign
  in through the join page, then after the magic link (and name
  capture if new) they land on the trip page joined.
- AC-6. Given a link older than 7 days, reset, or unknown, then the
  visitor sees the expired page and cannot join.
- AC-7. Given a trip with 20 members, when someone tries to join, then
  they see the full page and are not added.
- AC-8. Given a member, then the Travelers card lists all members,
  owner first with an "Owner" badge, and is always visible.
- AC-9. Given the owner, when they remove a member and confirm, then
  that user loses access and sees "You're no longer in this trip" on
  their next request.
- AC-10. Given an editor, when they leave and confirm, then they are no
  longer a member and go home with "You left {trip}".
- AC-11. Given an editor, then they can edit and save the trip but see
  no Delete, Invite, Reset or Remove controls, and the API rejects
  those actions with 403.


## Out of scope

- Viewer role and changing a member's role (everyone is an editor).
- Transferring ownership.
- Sending invites by email from the app.
- Live updates of the members list (refresh on navigation only).
- Owner approval of joins.
- Per-person invite links or link usage stats.


## Open questions

- None.
