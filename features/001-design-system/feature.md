# Design system

Issue: #1
Status: approved
Owner: Jose Garzon


## Summary

Defines Parche's brand (name, wordmark direction, voice), design
tokens (color, font size, line height, spacing, radius, shadow,
motion), Lucide icon usage, and a small set of accessible UI
primitives (Button, Input, Card, Stack, Text, Dialog, Tooltip). Ships
the root layout header (wordmark + theme toggle), the lint rules that
enforce tokens and interactive semantics, and a `/styleguide` page
that shows all of it. After this ships, every later feature builds
screens from shared tokens and primitives instead of inventing its own
colors and spacing.

Also updates `docs/standards/style.md` (Part 2) to match the token
scales defined here.

Refine round 2 (2026-09-26) folds `docs/styleguide.md`'s decisions
in: a second "secondary" accent color, scrim tokens for photo-hero
cards, a component usage guide (radius/border/shadow) and a space
usage guide — plus a fix for the `/styleguide` page's wasted desktop
space in primitive demos. `/feat-plan` reads `docs/styleguide.md`
directly for the exact token values and folds them into `plan.md`,
`tokens.css`, `tokens.test.ts` and ADR 0007; this file only captures
what changes for users.


## Problem

Without a design system, each feature (auth, trips, budget, agent)
would pick its own blues, spacings and card styles. Screens would look
stitched together instead of one product, and later features would
redo styling work already done elsewhere. This blocks all other UI
work (roadmap item #1).

Success metrics:

- Zero raw color, font size, line height, spacing, radius, shadow or
  duration values in component code, enforced by lint (AC-1).
- Zero axe-core violations on `/styleguide` in both themes (AC-4).


## Users and roles

| Role      | Can do                           | Cannot do                   |
| --------- | -------------------------------- | --------------------------- |
| user      | view `/styleguide`, switch theme | edit tokens in UI           |
| developer | use tokens and primitives        | restyle primitives per page |

"User" is anyone using the app, signed in or not (auth arrives in
feature #2). `/styleguide` is public documentation with no sensitive
data.


## Brand

- Name: **Parche**. Colombian Spanish for your group of friends and
  the plan you make together ("¿cuál es el parche?"). In English, a
  patch, like the travel patches sewn on a backpack. Works in both
  locales.
- Wordmark direction: lowercase "parche" in Fredoka, accent color,
  optionally set inside a stitched patch-shaped badge. Final SVG
  artwork is out of scope.
- Color direction: vibrant, playful travel-journal palette — a
  sunset red-orange primary accent (main CTAs, links, focus ring)
  paired with a pine/teal secondary accent (second-tier emphasis:
  future badges/tags, highlights), on a neutral base. Replaces the
  original single warm-terracotta accent. The shipped Button
  `secondary` variant (a neutral, lower-emphasis button shape) is
  unrelated and unchanged — the new secondary accent color has no
  primitive of its own yet (see "Out of scope"). Exact values in
  `docs/styleguide.md`, folded into plan.md tokens by `/feat-plan`.
- Voice: friendly, direct, playful without jokes getting in the way.
  Speaks like a friend in the group, not a travel agency. Sentence
  case, short sentences, action verbs ("Save trip", not "OK"). Each
  voice rule is shown in the styleguide with a do/don't example in en
  and es.


## Use cases

### UC-1: Developer builds a new screen with tokens and primitives

Actor: developer
Trigger: implementing a task in a later feature (e.g. trips, budget)

1. Developer imports primitives (Button, Input, Card, Stack, Text,
   Dialog, Tooltip) from `src/shared/ui`.
2. Developer composes primitives and uses tokens for any layout
   styling; does not restyle primitives.
3. `pnpm lint` fails if a raw value is used instead of a token, or if
   a click handler is attached to a non-interactive element.

Result: new screens match the design system in both themes without
extra design work.

Alternate flows:
- 3a. Existing primitive doesn't cover a new need: developer flags it
  as an open question in that feature's `plan.md`; does not invent a
  one-off style.

### UC-2: User switches between light and dark theme

Actor: user
Trigger: taps the theme toggle in the root layout header

1. User taps the toggle (sun/moon icon, header, always visible).
2. Theme switches immediately; choice is stored in a cookie.
3. All tokens re-resolve. Dark theme uses layered surface colors +
   1px borders (shadows barely read on dark backgrounds); light theme
   uses a subtle shadow + border.

Result: whole app re-themes consistently; no component looks
"unthemed." On the next visit the server reads the cookie and renders
the stored theme directly, so there is no flash of the wrong theme.

Default: with no stored choice, the theme follows the OS
`prefers-color-scheme`, and keeps following it if the OS setting
changes.

### UC-3: User navigates the styleguide

Actor: user or developer
Trigger: opens `/styleguide`

1. Page shows all sections in one scrolling column, with section
   links (side nav on desktop, wrapping link list on mobile).
2. User clicks a section link: page scrolls to that section (instant
   jump under reduced motion) and focus moves to the section's
   heading.
3. As the user scrolls, the link for the section in view becomes
   active (scroll spy).

Result: user always sees which section they are in, from a click or
from scrolling.


## Component states

| State    | When                     | User sees                            |
| -------- | ------------------------ | ------------------------------------ |
| default  | at rest                  | token colors/spacing applied         |
| hover    | pointer over it          | subtle background/scale shift        |
| focus    | keyboard focus           | token focus ring (see Accessibility) |
| active   | pressed                  | scale-down                           |
| disabled | action unavailable       | reduced opacity, not-allowed cursor  |
| loading  | async action in flight   | inline spinner, label keeps width    |
| error    | validation/action failed | error color + icon + text            |

Which primitive supports which state (x = yes):

| Primitive        | default | hover | focus | active | disab. | load. | error |
| ---------------- | ------- | ----- | ----- | ------ | ------ | ----- | ----- |
| Button           | x       | x     | x     | x      | x      | x     |       |
| Input            | x       | x     | x     |        | x      |       | x     |
| Card (static)    | x       |       |       |        |        |       |       |
| Card (clickable) | x       | x     | x     | x      |        |       |       |
| Dialog           | x       |       |       |        |        |       |       |
| Tooltip          | x       |       |       |        |        |       |       |
| Stack, Text      | x       |       |       |        |        |       |       |

Dialog and Tooltip have no interactive states of their own: their
controls (Buttons) and triggers carry them.

Every state change animates with a micro-animation
(`motion.duration.fast`, `motion.easing.out`; fade, slide or scale as
fits the primitive). The error message enters with a fade plus a
slight shake.


## Edge cases

- EC-1. Long city/activity name on a clickable Card: truncates with
  an ellipsis; the Card's `<button>`/`<a>` is the Tooltip trigger and
  the Tooltip shows the full name on hover and focus. Static Cards
  wrap long text instead of truncating (no focusable trigger).
- EC-2. Fonts fail to load (slow/offline network): Fredoka falls back
  to `ui-rounded, system-ui, sans-serif`; Plus Jakarta Sans falls back
  to the system sans stack. No invisible text (`font-display: swap`)
  and no layout shift (fallback metrics matched to the webfont).
- EC-3. Zoom to 200% / viewport at 320px: layout does not break or
  scroll horizontally.
- EC-4. `prefers-reduced-motion: reduce`: all movement/scale
  animations (including the error shake, the Dialog slide-up and
  smooth scrolling) are dropped; opacity fades remain.
- EC-5. OS color scheme changes while a Dialog is open and the user
  has no stored theme: the Dialog and the page re-theme in place; the
  Dialog stays open and focus stays where it was.
- EC-6. Dialog open: background scroll is locked; released on close.
- EC-7. Text size increased via browser/OS settings (not page zoom)
  up to 200%: all sizing is `rem`-based; nothing clips or overlaps.
- EC-8. Viewport below 768px: Dialog renders as a bottom sheet that
  slides up from the bottom edge; same component, same behavior.


## Errors

| Failure                 | Message to user | Recovery                       |
| ----------------------- | --------------- | ------------------------------ |
| Theme cookie not stored | none (silent)   | theme follows OS on each visit |
| Webfont fails to load   | none (silent)   | fallback font renders (EC-2)   |


## UI

### Root layout header (every page)

```
┌────────────────────────────────────────────────────────┐
│ parche [wordmark]                          [🌙 theme]  │
└────────────────────────────────────────────────────────┘
```

### Styleguide page (`/styleguide`), desktop

```
┌────────────────────────────────────────────────────────┐
│ parche [wordmark]                          [🌙 theme]  │
├───────────────┬────────────────────────────────────────┤
│ Brand         │  Brand                                 │
│ Color         │  name, wordmark direction, voice       │
│ Type          │  (do/don't examples)                   │
│ Spacing       ├────────────────────────────────────────┤
│ Radius/Shadow │  Color                                 │
│ Motion        │  [swatch grid: bg/surface/text/border/ │
│ Icons         │   accent/semantic, light + dark]       │
│ Primitives    ├────────────────────────────────────────┤
│               │  Type                                  │
│ (side nav,    │  [Fredoka headings, Plus Jakarta Sans  │
│  sticky,      │   body, every size + line height]      │
│  scroll spy)  │  ...                                   │
└───────────────┴────────────────────────────────────────┘
```

### Styleguide page, mobile (< 768px)

```
┌──────────────────────────┐
│ parche          [🌙]     │
├──────────────────────────┤
│ Brand  Color  Type       │
│ Spacing  Radius/Shadow   │  ← section links wrap onto as
│ Motion  Icons            │    many lines as needed; active
│ Primitives               │    link: accent color +
├──────────────────────────┤    underline
│ All sections, one        │
│ column, full width,      │
│ scrolling                │
└──────────────────────────┘
```

Same section list and order on both layouts. No horizontally
scrolling link strip.

### Button states (shown in styleguide)

```
[ Save trip ]  [ Save trip ]  [ Save trip ]
   default         hover          focus
                                  (ring)

[ Save trip ]  [ ◌ Save trip ] [ Save trip ]
   active          loading        disabled
  (pressed)                       (faded)
```

### Primitive state demos: a wrapping row, not a stack

Every primitive demo (Button, Input, Tooltip, Card, Dialog) lays its
state figures out in a flex row that wraps onto more rows as the
viewport narrows, using the desktop width instead of one cramped
column (see "Button states" above — the row layout was already the
intent; the stacked single column in the current build is a bug this
round fixes). Text/Type is the one exception: font-size and
line-height samples stay a single vertical column, since
demonstrating a real line length is the point. Token-swatch sections
(Color, Spacing, Radius/Shadow, Motion, Icons) are unbuilt (task T12)
and out of scope for this round — their layout is T12's call, not
this fix's.


## Accessibility

Follows `docs/standards/accessibility.md` (WCAG 2.2 AA). Feature
specifics:

- Keyboard: header toggle, section links, all primitive demos operable
  by keyboard; logical tab order top to bottom.
- Screen reader: `header`/`nav`/`main` landmarks; one `h1` (i18n key,
  "Parche design system" in en); each section has an `h2`; section
  nav marks the active link with `aria-current="location"`; the
  icon-only theme toggle's accessible name says the action ("Switch
  to light theme" / "Switch to dark theme").
- Focus: ring on every interactive primitive uses tokens (accent
  color, offset, radius matching the element), not the browser
  default outline; 3:1 against its background in both themes.
  Clicking a section link moves focus to that section's heading.
- Dialog: focus moves inside on open, is trapped while open,
  `Escape` closes, focus returns to the trigger on close
  (WAI-ARIA dialog pattern).
- Tooltip: `role="tooltip"`, linked to its trigger with
  `aria-describedby`; contains no interactive content. Shows on
  trigger hover and focus, stays while the pointer is over it,
  `Escape` dismisses (WCAG 1.4.13).
- Semantics: click handlers only on `<button>`, `<a href>` or an ARIA
  widget with matching role and keyboard handling. A clickable Card
  wraps its content in a `<button>` (or `<a>` when it navigates).
- Icons: Lucide; decorative next to text (`aria-hidden`), meaningful
  icons alone get an accessible name. Semantic colors always come
  with an icon or text.
- Touch targets: 44×44 CSS px minimum on every interactive primitive.


## Internationalization

- Locales: en, es. Fredoka and Plus Jakarta Sans both cover Spanish
  diacritics. Locale detection comes from the existing i18n routing,
  not this feature.
- Dates and times: not applicable.
- Currency and numbers: not applicable.
- Text: all styleguide copy, voice examples, primitive labels and
  accessible names go through next-intl keys. Button/Input demos are
  checked with Spanish strings (+40%) to prove wrap/truncation rules.
- Layout: logical CSS properties (`margin-inline-*`) throughout.


## Acceptance criteria

- AC-1. Given component code under `src/`, when `pnpm lint` runs,
  then it fails on any raw color (hex, `rgb()`, `hsl()`, named),
  length (`px`, `rem`, `em`), shadow, duration or Tailwind arbitrary
  value (`p-[13px]`, `bg-[#fff]`) outside `src/shared/ui/tokens.css`.
  The rule is added by this feature (Biome GritQL plugin or
  equivalent) and has a fixture test proving it catches each case.
- AC-2. Given component code under `src/`, when `pnpm lint` runs,
  then it fails on a click handler attached to a non-interactive
  element (e.g. `<div onClick>`). Biome a11y rules
  `noStaticElementInteractions`,
  `noNoninteractiveElementInteractions` and `useKeyWithClickEvents`
  are enabled as errors.
- AC-3. Given `src/shared/ui/tokens.css`, when inspected, then it
  defines these tokens with a light and a dark value where they
  differ:
  - `color.*`: bg, surface (layered), text, border, accent, focus,
    success, warning, error.
  - `font.family.display` (Fredoka), `font.family.body` (Plus
    Jakarta Sans).
  - `font.size.xs|sm|md|lg|xl|2xl|3xl` in `rem`.
  - `font.lineHeight.tight|normal|relaxed` (unitless).
  - `space.1..8` on a 4px base (4–32px), plus `space.10|12|16`
    (40, 48, 64px) for section spacing, in `rem`.
  - `radius.sm|md|lg|full` = 8px, 16px, 24px, 9999px.
  - `shadow.sm|md` (light theme; dark theme uses borders + surface
    layers instead).
  - `motion.duration.fast|normal` = 150ms, 250ms;
    `motion.easing.out`.
- AC-4. Given `/styleguide`, when scanned with axe-core (wcag2a
  wcag2aa wcag21aa wcag22aa), then there are zero violations in both
  themes.
- AC-5. Given any primitive's text or UI part, when contrast is
  measured in either theme and in every state, then it meets 4.5:1
  (body) or 3:1 (large text/UI parts, focus ring). The disabled state
  is exempt, as WCAG 1.4.3 and 1.4.11 allow; it stays distinct
  through reduced opacity and the not-allowed cursor.
- AC-6. Given a user with no theme cookie, when they open the app,
  then the theme matches the OS `prefers-color-scheme`, and changes
  when the OS setting changes.
- AC-7. Given a user on any page, when they use the header theme
  toggle, then the whole app re-themes, a cookie stores the choice,
  and on reload the server renders that theme with no flash of the
  other one.
- AC-8. Given `prefers-reduced-motion: reduce`, when any primitive
  animates or the styleguide scrolls to a section, then
  movement/scale/smooth scroll is skipped and only opacity fades
  remain.
- AC-9. Given any primitive, when its state changes, then the change
  animates with `motion.duration.fast` instead of an instant swap
  (except under AC-8).
- AC-10. Given each primitive, when rendered in each state marked "x"
  in the state matrix, then that state is visible and distinct in the
  styleguide; unmarked states are not offered.
- AC-11. Given a viewport 320px wide, 200% zoom, or 200% browser text
  size, when the styleguide or any primitive is viewed, then there is
  no horizontal scroll, clipping or overlap.
- AC-12. Given a long name on a clickable Card, when it overflows,
  then it truncates with an ellipsis and a Tooltip on the Card's
  trigger shows the full text on hover and focus; on a static Card
  the text wraps.
- AC-13. Given a Tooltip, when its trigger is hovered or focused,
  then it shows, stays while hovered, hides on `Escape` or blur, and
  is announced via `aria-describedby`; it contains no focusable
  elements.
- AC-14. Given a Dialog, when it opens, then focus moves inside, tab
  stays trapped inside, background does not scroll; when closed via
  button or `Escape`, focus returns to the trigger and scroll is
  restored.
- AC-15. Given a viewport below 768px, when a Dialog opens, then it
  renders as a bottom sheet sliding up from the bottom edge (fade
  only under AC-8).
- AC-16. Given webfonts fail to load, when the page renders, then
  fallback fonts show with no invisible text and no layout shift.
- AC-17. Given the styleguide, when a user clicks a section link,
  then the page scrolls to that section, focus moves to its heading,
  and the link becomes active; when the user scrolls, the active link
  follows the section in view. Active link uses accent color +
  underline and `aria-current="location"`.
- AC-18. Given the mobile styleguide, when the viewport is narrow,
  then section links wrap onto multiple lines instead of scrolling
  horizontally.
- AC-19. Given any interactive primitive, when focused via keyboard,
  then the focus ring uses tokens (accent color, offset, radius)
  rather than the browser default outline.
- AC-20. Given the styleguide Brand section, when viewed in en and
  es, then it shows the name, wordmark direction and each voice rule
  with a do/don't example.
- AC-21. Given any interactive primitive, when measured, then its
  touch target is at least 44×44 CSS px.
- AC-22. Given a desktop viewport, when a Button, Input, Tooltip,
  Card or Dialog demo renders in the styleguide, then its state
  figures lay out in a flex row that wraps onto more rows rather than
  a single vertical column; the Type/font-size demo stays a vertical
  column.


## Out of scope

- Illustrated custom icons (v1 uses Lucide only).
- Marketing/landing pages (only `/styleguide` and the root layout
  header ship).
- Any primitive beyond Button, Input, Card, Stack, Text, Dialog,
  Tooltip. Mobile bottom sheet is the Dialog, not a separate
  primitive. Skeleton loaders. Badge/tag (the new secondary accent's
  badge/tag use case waits for a later feature that needs one).
- Photo-hero-card component (full-bleed destination photo, pill
  nav). The color/scrim tokens it would use ship in this round; the
  component itself needs a photo source decided first (product
  question, not a design-system one).
- Locale detection and default locale (already handled by next-intl
  routing in `src/shared/i18n/routing.ts` and `src/proxy.ts`).
- Trademark or domain availability check for the name "Parche"; it
  is a working product name, not a legal clearance.
- RTL layout support (logical properties are future-proofing only).
- Final wordmark SVG artwork (this feature sets direction only).


## Open questions

None.
