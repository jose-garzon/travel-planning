# Account creation, sign-in and home page

Issue: #3
Status: approved
Owner: Jose Garzon


## Summary

A visitor can create an account with just their email (magic link, no
password) and land on a home page that shows their name, their next
trip, and the rest of their trips. Someone with no trips yet sees an
empty state that invites them to create the first one. Today there is
no account system, so nobody can use the app past the landing page.


## Problem

No account system exists. The app cannot persist who is using it, and
every later feature (trips, itinerary, budget, agent) needs a signed-in
user. This is next in the roadmap right after the design system.

Success metric: more than 70% of started sign-ups (email submitted)
complete verification (link clicked) within 10 minutes.


## Users and roles

| Role          | Can do                                | Cannot do                |
| ------------- | -------------------------------------- | ------------------------ |
| visitor       | see landing page, request a magic link | see home page, any trip  |
| member        | see home page, their name, their trips | act on trips (no Trips   |
|               |                                         | feature yet)             |

No account-level role at sign-up. Per-trip roles (owner, editor,
viewer) are assigned later, in the Trips feature, when trips exist.


## Use cases

### UC-1: Create an account / sign in (magic link)

Actor: visitor
Trigger: opens the site with no session

1. Visitor sees the landing page: header, hero copy describing the
   app, and an inline form with an email field and a submit button.
2. Visitor enters their email and submits.
3. App sends a magic link (valid 15 minutes) and shows a
   "check your email" screen.
4. Visitor opens the email, on any device, and clicks the link.
5. App verifies the link and creates the account if the email is new,
   or reuses it if the email already has one.
6. If this is the first verification for this account, app shows a
   one-time form asking for a display name.
7. App shows the home page, signed in.

Result: visitor has a session and, if new, a display name.

Alternate flows:
- 2a. Invalid email format: inline error under the field, focus stays
  on the field, no request sent.
- 3a. Email send fails (provider error): generic retriable error shown
  on the same screen, entered email kept in the field.
- 3b. 4th link request for the same email within 15 minutes: cooldown
  message shown instead of sending another email.
- 4a. Link opened after 15 minutes: "link expired" message with a
  button to send a new one.
- 4b. Link opened on a different device than the one that requested
  it: allowed, verifies normally.
- 6a. Name left empty or over 50 characters on submit: inline error,
  focus stays on the field.

### UC-2: Return to the site already signed in

Actor: member
Trigger: opens the site with a valid session

1. App skips the landing page and shows the home page directly.

Result: member sees their name, next trip (if any), and trip list.

### UC-3: See the home page with trips

Actor: member
Trigger: home page loads, member has one or more trips

1. Home page shows the member's name.
2. Home page shows the next trip: the first trip with a start date on
   or after today, as name and date range.
3. If the member has more than one trip, home page lists the rest as
   name and date range.

Result: member sees their name and an overview of their trips.

Alternate flows:
- 1a. All the member's trips have a start date before today (none
  upcoming): treated as no next trip; see UC-4.

### UC-4: See the home page with no upcoming trips

Actor: member
Trigger: home page loads, member has zero trips, or none upcoming

1. Home page shows an empty state: icon, title, description, and a
   "create your first trip" button.
2. Button links to a placeholder route (Trips feature not built yet).

Result: member is invited to create a trip.


## States

| State          | When                          | User sees                       |
| -------------- | ----------------------------- | -------------------------------- |
| landing        | signed out                    | header, hero, email form        |
| email sent     | after valid email submitted   | "check your email" + live region |
| link expired   | link clicked after 15 min     | expired message, resend button  |
| name capture   | first verification, no name   | one-time name form              |
| home (trips)   | signed in, upcoming trip(s)   | name, next trip, trip list      |
| home (empty)   | signed in, no upcoming trip   | icon, title, text, CTA button   |
| error          | email send fails              | generic retriable error         |


## Edge cases

- EC-1. Same email requested a 4th time within 15 minutes: blocked
  with a cooldown message, no email sent.
- EC-2. Magic link opened on a different device or browser than the
  one that requested it: allowed, verifies and signs in that device.
- EC-3. Tab closed before clicking the link, visitor returns later
  signed out: sees the landing page again, no pending state kept, must
  request a new link.
- EC-4. Member has trips but all are in the past: home page shows the
  empty state, not a "last trip" card.
- EC-5. Name at the boundary (1 or 50 characters): accepted. Empty or
  51+: rejected with inline error.


## Errors

| Failure                    | Message to user               | Recovery              |
| --------------------------- | ------------------------------ | ---------------------- |
| Invalid email format        | "Enter a valid email address" | Fix and resubmit       |
| Email send fails            | "Something went wrong. Try again." | Resubmit same email |
| Rate limit hit (4th in 15m) | "Too many requests. Try again in a few minutes." | Wait, retry later |
| Link expired                | "This link expired."          | Button: send a new link |
| Name invalid                | "Enter a name (1-50 characters)" | Fix and resubmit    |


## UI

Landing page, signed out:

```
┌──────────────────────────────────────┐
│ [logo]                                │
├──────────────────────────────────────┤
│         Plan trips with friends       │
│   Cities, activities, budget, and an  │
│   AI agent that finds the best deals. │
│                                        │
│   [ you@email.com        ] [Continue] │
└──────────────────────────────────────┘
```

After submitting, the form area is replaced in place:

```
┌──────────────────────────────────────┐
│ [logo]                                │
├──────────────────────────────────────┤
│         Plan trips with friends       │
│   Cities, activities, budget, and an  │
│   AI agent that finds the best deals. │
│                                        │
│   Check your email for a sign-in link │
│   Sent to you@email.com               │
└──────────────────────────────────────┘
```

Name capture, first verification only:

```
┌──────────────────────────────────────┐
│ [logo]                                │
├──────────────────────────────────────┤
│         What should we call you?      │
│                                        │
│   [ Your name             ] [Continue]│
└──────────────────────────────────────┘
```

Home page, signed in, with trips:

```
┌──────────────────────────────────────┐
│ [logo]                    Hi, Ana     │
├──────────────────────────────────────┤
│ Next trip                             │
│ Colombia trip · Mar 3-10, 2027        │
├──────────────────────────────────────┤
│ Your trips                            │
│ - Colombia trip · Mar 3-10, 2027      │
│ - Peru trip · Jul 1-8, 2027           │
└──────────────────────────────────────┘
```

Home page, signed in, empty state:

```
┌──────────────────────────────────────┐
│ [logo]                    Hi, Ana     │
├──────────────────────────────────────┤
│               [icon]                  │
│         No trips planned yet          │
│  Create a trip to start planning with │
│           your friends.               │
│         [ Create your first trip ]    │
└──────────────────────────────────────┘
```


## Accessibility

- Keyboard: email form, name form, and CTA buttons are all reachable
  and operable by keyboard alone, in visual order. No traps.
- Screen reader: live region announces state changes:
  - "Check your email for a sign-in link" when that screen appears.
  - "Signed in, loading your trips" once verification completes.
- Focus: on inline error, focus stays on (or moves to) the invalid
  field; error linked with `aria-describedby`. After sign-in, focus
  moves to the home page's `<h1>`.
- Motion and contrast: no motion beyond simple state swaps; respects
  `prefers-reduced-motion`. Empty-state icon is decorative
  (`alt=""`); color is never the only signal for errors.


## Internationalization

- Locales: `en` (default), `es`, per `docs/standards/i18n.md`. No RTL
  locale in scope.
- Dates: next trip and trip list date ranges are locale-formatted via
  `Intl`, using each trip's stored `YYYY-MM-DD` values.
- Text: all copy (hero, form labels, errors, empty state) through
  next-intl keys, both locales updated together. No hardcoded strings.
- Name field: single `displayName`, no first/last split, no format
  restriction beyond length.


## Acceptance criteria

- AC-1. Given a signed-out visitor on `/`, then they see the landing
  page with header, hero copy, and an inline email form.
- AC-2. Given a valid email submitted, when the request succeeds,
  then a magic link valid for 15 minutes is sent and the
  "check your email" screen appears with a live-region announcement.
- AC-3. Given an unexpired magic link, when opened on any device, then
  the email is verified and the account is created (new email) or
  reused (existing email).
- AC-4. Given a first-time verification with no stored name, then a
  required name form (1-50 characters) appears before the home page.
- AC-5. Given a returning member whose account already has a name,
  when they complete the magic-link flow, then they reach the home
  page directly, no name form shown.
- AC-6. Given a signed-in session, when visiting `/`, then the landing
  page is skipped and the home page loads directly.
- AC-7. Given a member with one or more upcoming trips, then the home
  page shows their name, the next upcoming trip (name and date
  range), and, if more than one trip total, the rest as a list (name
  and date range each).
- AC-8. Given a member with zero trips, or with trips but none
  upcoming, then the home page shows the empty state: icon, title,
  description, and a "create your first trip" button linking to a
  placeholder trip-creation route.
- AC-9. Given an invalid email format submitted, then an inline error
  appears under the field, focus stays on the field, and no request
  is sent.
- AC-10. Given 3 magic-link requests already sent for one email within
  15 minutes, when a 4th is requested, then it is blocked with a
  cooldown message and no email is sent.
- AC-11. Given a magic link opened after its 15-minute expiry, then an
  expired message appears with a button to request a new link.
- AC-12. Given the email provider fails to send, then a generic
  retriable error appears on the email-entry screen with the entered
  email preserved.
- AC-13. Given any screen in this feature, then it has zero axe-core
  violations (`wcag2a wcag2aa wcag21aa wcag22aa`), is fully keyboard
  operable, and moves focus as described under Accessibility.
- AC-14. Given any screen in this feature, then all user-facing text
  renders correctly in both `en` and `es`, and dates use locale-aware
  formatting.


## Out of scope

- Real trip creation, editing, cities, members, invites (Trips
  feature). The empty-state button and "next trip" data here use a
  placeholder route and a minimal read-only trip shape.
- Password-based sign-in, social sign-in.
- Editing display name after the first-time capture (needs a
  profile/settings feature).
- Per-trip roles (owner, editor, viewer).
- Account deletion, email change.


## Open questions

- The 14 acceptance criteria span two roadmap slices (auth, and a thin
  read of home/trips). This was a deliberate choice (see decision
  during refine: "thin read now" over deferring the home page or
  bundling trip creation). Flagging here so `/feat-plan` can split
  into more granular tasks if the slice still feels too big once
  planned. (owner: Jose, due: at plan gate)
