---
name: Parche
description: A trip is a metro line; cities are its stations.
colors:
  line: "light-dark(#c4006b, #ff6fb5)"
  line-hover: "light-dark(#9a0054, #ff9acb)"
  on-line: "light-dark(#ffffff, #0e1220)"
  people: "light-dark(#00756b, #3fd1c2)"
  people-hover: "light-dark(#005a52, #7fe2d8)"
  on-people: "light-dark(#ffffff, #0e1220)"
  time: "light-dark(#ffb000, #ffc23d)"
  on-time: "#141414"
  ink: "light-dark(#141414, #f3f4f7)"
  ink-muted: "light-dark(#575757, #a9afc2)"
  ground: "light-dark(#ffffff, #0e1220)"
  surface-1: "light-dark(#ffffff, #161b2e)"
  surface-2: "light-dark(#f4f4f1, #1d2338)"
  border: "light-dark(#dcdcd7, #2f3652)"
  border-strong: "light-dark(#6b6b6b, #7a819c)"
  error: "light-dark(#b42318, #ff8a80)"
  success: "light-dark(#1f7a3a, #5fd08a)"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "4rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  title-field:
    fontFamily: "Barlow Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  station:
    fontFamily: "Barlow Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  station-sm:
    fontFamily: "Barlow Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  wordmark:
    fontFamily: "Barlow Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.02em"
  body:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  lead:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  full: "9999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  "10": "2.5rem"
  "12": "3rem"
  "16": "4rem"
  touch: "2.75rem"
  station: "1.75rem"
  line: "0.5rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.full}"
    padding: "0.75rem 1.5rem"
    height: "{spacing.touch}"
  button-primary-hover:
    backgroundColor: "{colors.line-hover}"
    textColor: "{colors.on-line}"
  button-secondary:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0.75rem 1.5rem"
    height: "{spacing.touch}"
  button-secondary-hover:
    backgroundColor: "{colors.surface-2}"
  button-sun:
    backgroundColor: "{colors.time}"
    textColor: "{colors.on-time}"
    rounded: "{rounded.full}"
    padding: "0.75rem 1.5rem"
    height: "{spacing.touch}"
  panel-plain:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  panel-time:
    backgroundColor: "{colors.time}"
    textColor: "{colors.on-time}"
    rounded: "{rounded.md}"
  input-field:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "{spacing.touch}"
  input-station:
    textColor: "{colors.ink}"
    typography: "{typography.station}"
    padding: "0 0 0.25rem"
  input-title:
    textColor: "{colors.ink}"
    typography: "{typography.title-field}"
    padding: "0 0 0.25rem"
  chip-time:
    backgroundColor: "{colors.time}"
    textColor: "{colors.on-time}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0.25rem 0.75rem"
  chip-people:
    backgroundColor: "{colors.people}"
    textColor: "{colors.on-people}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0.25rem 0.75rem"
---

# Design System: Parche

Visual system for Parche. Product truth lives in `docs/product.md`.
Token values live only in `src/shared/ui/tokens.css`; the keys above
are the roles, the CSS names are in parens below.


## Overview

**Creative North Star: "The Metro Line"**

A trip is a metro line. Cities are stations; the route is one thick
magenta line that grows a station each time a city is added. The
ground is plain white (deep night-blue in dark), the ink near-black,
and every heading reads like a station sign: condensed, bold, upper
case. It replaces the card-list-over-a-map habit of travel apps with
the diagram itself.

The signature is the line drawing down to a new station: when a city
is committed, the segment above it grows from the top and the
station's ring pops (overshoots, then settles). It plays only under
`motion-safe`; reduced motion shows the placed station at once.

**Key Characteristics:**

- One route colour, one line, ringed stations, a dashed open station
  for "next".
- Colours have jobs: line, people, time. Nothing else is coloured.
- Flat signboards with a 2px ink rule; no shadows on the page.
- Condensed upper-case display over a plain, legible body face.


## Colors

### Primary

- **Line** (`accent`, also `line`): the route line, open-station
  rings, the wordmark, caret, focus rings, hover on links and inputs,
  the route text of a trip in a list.

### Secondary

- **People** (`secondary`): the crew. Member counts and anything about
  who is going.

### Tertiary

- **Time** (`sun`): dates and countdowns, as amber chips; also text
  selection and the "check your email" confirmation panel. Text on it
  is always `on-sun` ink, in both themes.

### Neutral

- **Ink** (`text`): all headings and body, station rings, panel rules,
  and the primary button fill.
- **Ink muted** (`text-muted`): leads, hints, meta lines under stations.
- **Ground / surfaces** (`bg`, `surface-1..3`): white and two warm
  greys in light; night-blue steps in dark.

**The Colours Have Jobs Rule.** Magenta is the route and the brand,
teal is people, amber is time. Do not use one for another's job, and
never colour a heading.

**The Ink Button Rule.** The primary button is ink, not magenta, so
the line colour stays with the route. It turns line-coloured on hover.

Contrast: WCAG 2.2 AA in both themes, enforced by `tokens.test.ts`.


## Typography

- **Display:** Barlow Condensed (600, 700, 800). Headings, station
  names, trip names, the wordmark. Always upper case with 0.02em
  tracking and line height 1. All `h1`-`h4` get this by default.
- **Body:** Onest. Everything else, including labels and chips.

Barlow Condensed loads with `display: optional`, not `swap`: its caps
are far narrower than any metric-adjusted fallback, so a late swap
would rewrap every heading and break the layout-shift budget. A first
slow visit keeps the fallback; the cached face is used after.

### Hierarchy

The scale tops at `text-5xl` (4rem): page titles and the next trip's
name, `leading-none`. The trip-name field is `text-4xl`; station
fields and large route stations `text-3xl` (`lg:text-4xl` on a trip's
own route); list stations and card headings `text-2xl`. Leads are
`text-lg` muted; labels, hints and meta are `text-sm`.

**The Station Sign Rule.** Anything that names a place or a trip is
set in the display face; anything that explains is set in Onest.


## Layout

Mobile first, single column. Pages sit in `max-w-page` (72rem) with
24px gutters; forms in `max-w-dialog` (32rem). On `lg`, landing,
name capture and the next-trip panel split into two halves: words
left, the line right. The route always runs down the left edge of its
column. The create-trip action is pinned to the bottom on mobile and
flows inline from `sm` up. More space above a section than below its
heading.


## Elevation & Depth

The page is flat. Panels are signboards: a fill and a 2px ink rule,
no shadow. Shadows (`shadow-md`) belong only to things that float
over the page: dialogs and tooltips. In dark mode the shadow colour is
transparent, so depth there is the surface step alone.


## Shapes

Station rings and chips are full circles and pills; buttons are pills.
Panels, inputs and selects have gently rounded corners (1rem). The
line itself is a square-ended 0.5rem bar.


## Components

### Route line (signature)

`RouteLine` (`shared/ui/components/route-line.tsx`) renders an ordered
list; the `route` / `route-stop` utilities in `tokens.css` draw each
segment and ring in CSS. Stops:

- **default:** ink ring on the ground colour.
- **hub:** filled magenta ring. Takeoff and home again.
- **open:** dashed magenta ring and a dashed segment. Where the next
  city goes.
- **new:** the last segment draws in, then the ring pops.
- **extend:** on the stop before a new one; its segment draws down.

Meta under a station is one `text-sm` muted line or a row of chips.

**The Stations Are the Controls Rule.** On a form, the city fields are
the stations: each is an `Input` with the `station` appearance inside
a `route-stop`, and the date sits in that station's meta as a time
chip. Do not build a form beside the line and a picture of the line
next to it.

### Trip rows (home timeline)

Home lists every trip as one same-size `Panel` row, in time order:
the next trip first with a magenta rule, then upcoming trips, then
"Past trips" with a muted rule and grey line. A row carries the trip
name, its dates, the route as a short line of station codes
(`MiniRoute` in `home-screen.tsx`: 4px line, small rings, hubs
filled) and its next step as chips (countdown, "Next: add dates",
"Just you so far"). The full station-by-station line belongs to the
trip page, not home.

### Panels

`Panel` (`shared/ui/components/panel.tsx`), tones `plain` (surface,
ink rule), `line`, `people`, `time` (fill and rule in the job colour,
text in its `on-` colour). Shipped surfaces use `plain` for trips,
examples and the empty state, and `time` for sent confirmations. A
trip panel that is a link turns its rule magenta on hover and focus.

### Inputs

`Input` appearances:

- **field:** labelled box, 1px strong border, magenta on hover.
- **station:** the value in the display face (`text-3xl`) on a single
  2px rule that hides once filled; label is screen-reader only.
- **title:** the same at `text-4xl`; the trip name is the page title.

Selects use `select-themed` (drawn ink chevron, 2px ink border). The
native date field inside a time chip uses `date-chip`.

### Buttons

Pill, bold, at least 44px. Variants: `primary` (ink), `secondary`
(surface with 2px ink rule), `outline`, `sun` (for actions on line or
people panels). Pressed buttons scale to 97% under `motion-safe`.
Links that act as a primary action reuse `buttonClasses()`.

### Chips

Amber time chips (dates, countdown, takeoff) and teal people chips
(member count), pill, `text-sm` semibold. Facts, not controls, unless
a chip wraps a real field like the date.

### Wordmark

`Wordmark`: a short stretch of magenta line ending in a filled
station ring, then "parche" in display 800 upper case. `md` in the
header, `lg` (`text-5xl`) at hero scale.

### Focus

Interactive elements: 2px solid magenta outline, 2px offset (4px on
display inputs and panel links). The date chip uses an ink outline,
since magenta on amber is too faint. Headings focused from code
(`tabindex=-1`) draw no ring.


## Do's and Don'ts

### Do:

- Do show a trip as its line, cities as stations, in order.
- Do keep magenta for the route and brand, teal for people, amber for
  time.
- Do gate every line and ring animation on `motion-safe`.
- Do take every value from a `tokens.css` utility.

### Don't:

- Don't put a kicker or eyebrow above a heading; the heading speaks.
- Don't put shadows on panels, or tilt anything.
- Don't use the line colour for primary buttons or headings.
- Don't hold raw colours, lengths or durations outside `tokens.css`.

The city list for the open station (search plus 3-5 visible rows) is
pending feature 005 T02; until then `CityCombobox` is free text.
