# Styleguide decisions (pending refine)

Status: draft, not yet synced. Run `/feat-refine 001-design-system`
against this file, then update `plan.md` Tokens/Colors/Contracts, ADR
0007-design-tokens-and-theming.md, `tokens.css`, `tokens.test.ts`.
T01, T06 and T13 are done and built against the old hex values, and
against a single-accent model; they need re-touch once refine lands
the new tokens. This file now covers three kinds of decision: new
color tokens (below), a component usage guide making explicit the
radius/border/shadow logic already implicit in T06/T09/T10, and a
space usage guide doing the same for spacing/layout — none of these
introduce new tokens, so refine's job for the two usage guides is to
fold them into `plan.md` (see "New architecture for refine"), not to
touch `tokens.css`/`tokens.test.ts`.

Trigger: current palette (warm terracotta/cream, one accent) replaced
with a vibrant/playful, travel-journal direction — a sunset
red-orange primary accent, a pine/teal secondary, on a neutral base.
Wordmark stays text-only (no image mark); only its color/treatment
changes. Two earlier rounds (coral+yellow, then plain yellow) were
tried and rejected — see below.

All ratios below are WCAG 2 contrast, computed against the exact
hexes listed (script, not eyeballed). Minimums, extending the current
plan's table to a two-accent model:

- `text` / `text-muted` vs `bg` + `surface-1..3` ≥ 4.5
- `accent` vs `bg` + `surface-1..3` ≥ 4.5 — **new:** same rule for
  `secondary`
- `on-accent` vs `accent` / `accent-hover` ≥ 4.5 — **new:** same rule
  for `on-secondary` vs `secondary` / `secondary-hover`
- `border-strong` vs `bg` + `surface-1` ≥ 3


## Neutral base (unchanged from the first draft, confirmed good)

| Token           | Light     | Dark      |
| --------------- | --------- | --------- |
| `bg`            | `#FAFAFA` | `#16161D` |
| `surface-1`     | `#FFFFFF` | `#1E1E27` |
| `surface-2`     | `#F5F5F7` | `#262631` |
| `surface-3`     | `#F5F4FA` | `#302F3D` |
| `text`          | `#18181B` | `#F4F4F6` |
| `text-muted`    | `#63636D` | `#A8A6B3` |
| `border`        | `#E4E4E7` | `#38384A` |
| `border-strong` | `#8A8894` | `#6E6C7D` |
| `shadow`        | `#18181B14` | `transparent` |
| `overlay`       | `#18181B99` | `#000000B3` |

Semantic colors (`success`/`warning`/`error`) are hue-independent —
kept as-is, still pass ≥ 5.1 against the new neutrals:

| Token     | Light     | Dark      |
| --------- | --------- | --------- |
| `success` | `#1F7A3A` | `#5FD08A` |
| `warning` | `#8A5A00` | `#F2C14E` |
| `error`   | `#B42318` | `#FF8A80` |

Note: `warning` is already a mustard-amber. The new `accent` below is
picked to sit far enough from it in hue that the two don't get
confused as the same color (see rationale).


## Rejected: yellow/gold accent (round 2)

You saw it live and didn't like it. Dropped. See "sunset accent"
below for the replacement, and the contrast note for why pure
saturated yellow was never going to look as vivid as the reference
image implies — same physics bit the orange candidate, see next
section.


## Reference: travel-journal image

Two illustrated hero cards, warm sunset (orange → red-orange, gold
highlights) paired with a cool card (deep pine green → mint), big
full-bleed artwork, near-black pill nav, white/dark text sitting on
the artwork rather than on flat token backgrounds.

Two separate things to pull from it:

1. **Color direction** — a warm sunset accent + a cool green/teal
   secondary, instead of the coral+yellow pairing. Tokens below.
2. **Card treatment** — no illustration budget, so this becomes
   full-bleed *destination photos* (city/activity images the app
   already has or will fetch), not painted art. Photos, not flat
   color, carry the "dynamic" feel; the accent/secondary tokens stay
   scoped to UI chrome (buttons, badges, nav, links). This is still a
   *component* decision, not a token one — flagged under "Open before
   refine" below.


## Accent (primary) — sunset red-orange

| Token          | Light     | Dark      |
| -------------- | --------- | --------- |
| `accent`       | `#C83812` | `#FF9666` |
| `accent-hover` | `#A82E0D` | `#FFB877` |
| `on-accent`    | `#FFFFFF` | `#16161D` |

Contrast reality check, same one that already produced the old
terracotta `#A93D16` and killed the yellow/lime candidates: a
saturated hue used as *text/icon color on a near-white surface* has a
hard luminance floor. Pure vivid orange (`#FF7A00`-ish, closer to the
image's sky) sits around 2.5–3:1 on white — nowhere near 4.5.
`#C83812` is the most saturated, most red-leaning (closer to the
image's sunset-red than a flat orange) point that still clears 4.5:1
with margin. Dark mode has no such ceiling: `#FF9666` is the actual
vivid sunset-glow color from the image, used straight.

If you want the *flat, undiluted* orange from the image somewhere,
it has to live outside the text-safe `accent` token — e.g. as a
decorative fill behind white text with a scrim, or in illustration
assets, not as `bg-accent`/`text-accent`. Not deciding that here;
flagged below.

Verified: `accent`/`bg` 4.99, `accent`/`surface-3` 4.77,
`on-accent`/`accent` 5.21, `on-accent`/`accent-hover` 6.86 (light);
`accent`/`bg` 8.41, `accent`/`surface-3` 6.13 (dark).


## Secondary — pine/teal green

| Token             | Light     | Dark      |
| ------------------ | --------- | --------- |
| `secondary`       | `#0E7A6B` | `#57E0C7` |
| `secondary-hover` | `#084A41` | `#8CEBDA` |
| `on-secondary`    | `#FFFFFF` | `#16161D` |

Pulled from the image's cool card (deep pine → mint). Reads as
travel/nature (jungle, coast, mountains) rather than generic teal,
and sits far enough from `success` (`#1F7A3A`, more yellow-green)
that the two won't be confused.

Verified: `secondary`/`bg` 5.01, `secondary`/`surface-3` 4.78,
`on-secondary`/`secondary` 5.23, `on-secondary`/`secondary-hover`
10.16 (light); `secondary`/`bg` 11.05, `secondary`/`surface-3` 8.06
(dark).

Usage split (for refine to formalize in plan.md "Naming" /
"Contracts"): `accent` stays the primary interactive color — main CTA
fill, links, `focus` ring (`--color-focus: var(--color-accent)`,
D-17, unchanged). `secondary` is for a second-tier emphasis —
secondary buttons, badges/tags, chart or highlight accents, anything
tied to nature/outdoors imagery — anything that needs to stand out
from neutral content without competing with the primary CTA.


## Scrim (photo card legibility)

For the photo-hero-card follow-up: white text over an arbitrary
destination photo needs a guaranteed-dark zone under it, since photo
brightness isn't controllable. A bottom-anchored gradient scrim,
solid at the bottom where text sits, fading to transparent above it.

| Token          | Value      |
| -------------- | ---------- |
| `scrim`        | `#000000A6` (alpha 0.65) |
| `on-scrim`     | `#FFFFFF`  |

Not `light-dark()` — deviates from D-2 on purpose. The scrim sits on
a photo, not an app surface; its job is masking photo contrast, which
has nothing to do with the user's light/dark preference. Same reason
`on-scrim` is a flat white, not theme-aware: text over a photo+scrim
is always white regardless of app theme. Flag this exception
explicitly for refine/ADR 0007 rather than silently breaking the
"every color is light-dark()" rule.

Alpha derivation: worst case is a pure-white photo pixel under the
scrim. Composite gray = `(1 - alpha) × 255`; needs ≥ 4.5:1 against
white text. 0.55 alpha is the exact threshold (4.76:1); picked 0.65
for margin against gradient blending and JPEG/photo noise — 6.98:1
verified against a pure-white worst case, so any real photo (rarely
pure white) clears it with more room.

Shape (component-level, not a `tokens.css` color — this is layout,
add as a `@utility` next to `duration-fast`/`duration-normal`):

```css
@utility scrim-bottom {
  background: linear-gradient(to top, var(--color-scrim) 0%, transparent 55%);
}
```

Text/icons placed in the bottom ~45% of the card (where the gradient
is at or near full `scrim` alpha) use `text-on-scrim`; above that
zone, correctness isn't guaranteed and text shouldn't go there.


## Wordmark

Keep `Wordmark` text-only (`components/wordmark.tsx`, T01): same
markup, `font-display`, `text-accent` now resolves to the sunset
red-orange above. No new component, no image asset, no favicon
change.


## Component usage guide

Not new tokens — this makes explicit the rules already implicit
across T06/T09/T10, so every future component (this feature and
later ones) follows the same logic instead of each task re-deriving
its own radius/border/shadow.

### Card vs Dialog — there is no Drawer

Don't pick "modal vs drawer" — `Dialog` (T10) already **is** both: it
renders as a bottom sheet below `md` and a centered dialog at/above
`md`, same component, same props. Choosing "Drawer" as a separate
primitive would duplicate what Dialog already does responsively.

The real choice is **Card vs Dialog**, and it's about blocking, not
size:

| | `Card` | `Dialog` |
| --- | --- | --- |
| Blocks the page? | No | Yes (focus trap, scroll lock, overlay) |
| Lives | Inline, in a list/grid | On top of everything |
| For | Browsable content, an entry point (`CardLink`/`CardButton`) into more detail | One task that needs full attention: confirm, edit, rename, a form |
| Dismiss | N/A — not modal | Escape, overlay click, explicit close |

Rule: if the user should still see and scroll the page behind it,
it's a `Card`. If the page needs to step aside until one thing is
resolved, it's a `Dialog`. A `CardButton` can open a `Dialog` — that's
the expected chain (browse in cards, act in a dialog), not a reason
to invent a third primitive.

### Radius: scale by size and role, not by taste

Current usage, all deliberate:

| Token | Value | Used by | Role |
| --- | --- | --- | --- |
| `radius-sm` | 0.5rem | Tooltip | small, floating, transient |
| `radius-md` | 1rem | *(unassigned — see below)* | mid-size resting control |
| `radius-lg` | 1.5rem | Card, Dialog | larger resting container |
| `radius-full` | pill | Button (every variant) | the one shape reserved for the primary tappable action |

The pattern: radius grows with the size of the surface, except
`full`, which is reserved — it marks "this is the thing to press,"
so it's never reused for a passive container (a fully-pill card
would compete with Button for that signal).

`radius-md` is currently unused. **Input** (T07, in progress, not yet
styled with a radius) is the natural fit — a mid-size form control,
between Tooltip's small floating chip and Card's larger resting box.
Recommendation for whoever picks T07 back up: `rounded-md`, not
`rounded-lg` or `rounded-full`.

Anything new later (badge, avatar, chip) should map onto this same
scale by asking "how big is the surface, and is it the tappable
action or something resting" — not a fresh choice per component.

### Border: solid only, weight signals role — no dotted

There's no dotted/dashed border anywhere in the system, and there
shouldn't be one added casually — it would be the only place in the
app using a border *style* to mean something, when everywhere else
meaning is carried by border *weight*:

- `border-border` (subtle): passive, resting surfaces — Card,
  Dialog content in dark mode (where shadow disappears, see below).
- `border-border-strong` (more contrast, ≥ 3:1 against `bg`):
  interactive controls that need to read as "operable" — Input,
  Button secondary.

If a future pattern genuinely needs a distinct visual meaning (e.g.
an empty-state "drop a photo here" placeholder), reach for a new
*weight* or a background treatment before reaching for a new border
*style* — introducing dashed/dotted for one case breaks the rule that
border style is meaningless and only weight carries signal.

### Shadow: resting vs floating, and it's light-theme only

`--color-shadow` resolves to `transparent` in dark mode (tokens.css)
— shadows are a light-mode-only cue. That means **border is the only
depth cue dark mode has**, which is why Dialog content adds
`border border-border` specifically in dark mode (T10 step 1) even
though Card always has one.

- `shadow-sm`: resting surfaces — Card. A gentle lift, present at
  rest.
- `shadow-md`: floating/overlay surfaces — Tooltip, Dialog. Reads as
  "above the page," stronger than a resting card.

Rule for anything new: does it sit in the page flow (→ `shadow-sm`,
plus a border since dark mode needs one) or float above it
(→ `shadow-md`, plus a border for dark mode parity)? Never invent a
third shadow strength — the two-tier resting/floating split is the
whole vocabulary.


## Open before refine

- [x] Sunset accent + pine/teal secondary — confirmed, this is final.
- [x] Text-over-photo legibility — solved with `scrim`/`on-scrim`
      above.
- [ ] Confirm `Input` gets `radius-md` (closes the unused-token gap,
      T07 is still in progress so this is unblocked).
- [ ] Decide whether to pursue a photo-hero-card component (full-bleed
      destination photo, pill nav) as a separate follow-up design
      task. Out of scope for this token-only refine.
      - **Where do the photos come from.** Product question, not a
        styleguide one — cities/activities already have some image
        source, or this needs one (upload, stock/API, agent-fetched)
        before the component can be built.


## New architecture for refine

This is a token-shape change, not just new hex values — `secondary`
doesn't exist in the current plan/tokens.css/tests at all:

- `plan.md` Tokens → Colors: add `secondary`, `secondary-hover`,
  `on-secondary` rows to the values table and the contrast-pairs
  table (rules above).
- `tokens.css`: add `--color-secondary`, `--color-secondary-hover`,
  `--color-on-secondary` next to the existing `--color-accent*`
  block.
- `tokens.test.ts`: extend the token-existence and contrast-pair
  assertions to cover the three new tokens.
- ADR 0007: note the move from single-accent to accent+secondary, and
  the `scrim`/`on-scrim` exception to D-2 (not `light-dark()`, see
  "Scrim" above).
- `tokens.css`: add `--color-scrim`, `--color-on-scrim` (flat, no
  `light-dark()`) and the `scrim-bottom` utility.
- T06 (button) and T13 (brand section) were built accent-only; they
  need a secondary variant added, not just a color swap.
- Scrim tokens ship in this refine (they're small and self-contained);
  the photo-hero-card component that *uses* them does not — that's
  the still-open item above.
- `plan.md`: add a new `### Layout guidance` subsection under
  "UI components" (next to the existing "Page layout" paragraph,
  line ~742) holding the "Space usage guide" content below —
  guidance only, no `plan.md` "Tokens" values change, since it picks
  among existing `space.*`/`container-*` values rather than adding
  any. Same placement question applies to the existing "Component
  usage guide" section above (radius/border/shadow) — it should land
  in `plan.md` alongside it, not stay `styleguide.md`-only, since
  both are permanent usage rules for future tasks, not one-off refine
  notes.
- Once both usage guides live in `plan.md`, trim them out of this
  file — `styleguide.md` is scratch for decisions in flight, `plan.md`
  is the source of truth per `features/<issue>-<slug>/` in
  `CLAUDE.md`.


## Space usage guide

Separate topic from the color refine above: how much space a view or
component should use, and why. Written so an agent building a new
screen or primitive can pick spacing without re-deriving it, the same
way the "Component usage guide" above did for radius/border/shadow.
Grounded in the tokens that already exist in `tokens.css` — no new
values proposed here.

### The scale is the only vocabulary

Values already fixed in `plan.md` "Tokens" (`space.0..8,10,12,16` and
the named `spacing-touch`/`spacing-icon-*`/`spacing-sheet`) — this
guide doesn't restate or change any of them, only how to pick among
them. Every margin, padding, gap comes from that scale (`style.md`
"Tokens only", already a rule). Never round to an arbitrary pixel
value to make something "look right" — if the scale's steps feel too
coarse for a spot, that's a signal to reconsider the layout, not to
add a one-off value.

The three named (not numbered) tokens encode a fixed physical/visual
constraint rather than a step on the rhythm scale — don't reuse them
as generic spacing:

- `spacing-touch`: minimum tappable target (Button already uses it as
  `min-h`/`min-w`). Any new tappable element needs this as a floor,
  not a `gap`.
- `spacing-icon-sm|md|lg`: icon box sizes, not spacing between things.
- `spacing-sheet`: the bottom-sheet Dialog height cap.

### Three spacing jobs, three ranges

Don't ask "how much space here" as one question — it's three
different questions, each with its own range on the scale:

| Job | Range | Example |
| --- | --- | --- |
| **Inside** a component (its own padding) | `2`–`6` | Card padding, Button `px-4 py-3` |
| **Between** related things (a Stack's `gap`) | `1`–`4` | Form fields, icon-to-label, list rows |
| **Between** unrelated things (page/section rhythm) | `8`–`16` | Section-to-section, page-top margin |

If a number outside these ranges seems needed, that's usually a sign
the two things being spaced aren't actually in the relationship
assumed (e.g. reaching for `spacing-16` between two form fields means
they're not really "related" — split them into separate sections
instead of stretching the gap).

### Density is a `gap` choice, not a new component

`Stack`'s `gap` prop already exposes the full scale (`stack.tsx`).
Density differences between screens (a compact list vs. a spacious
card grid) should be expressed by choosing a different `gap` on the
same `Stack`, never by building a denser or looser variant of a
component:

- Tight list rows, form fields stacked vertically: `gap="2"`.
- Independent cards in a grid, icon + label pairs: `gap="4"`.
- Grouped sections inside one view (e.g. cards inside a page): `gap="8"`.

Same rule horizontally: a button's internal icon-to-label gap (`gap-2`
in `button.tsx`) is tighter than the gap between two sibling buttons
in a toolbar (`gap="4"` on a horizontal `Stack`) — tighter gap always
means "these read as one unit," looser gap means "these are separate
choices."

### Page layout: pick the container by content type, not by screen

`--container-*` tokens (values in `plan.md` "Tokens": prose 70ch,
nav 14rem, dialog 32rem, page 72rem, card 18rem) exist because
different content has a different ideal measure — pick by what the
content *is*, not by copying whatever container the last screen used:

- `container-prose`: paragraph text — descriptions, help text,
  activity notes.
- `container-card`: a single Card's intrinsic width in a grid.
- `container-nav`: side navigation (already used this way by the
  styleguide screen's `SectionNav`, "UI components" in `plan.md`).
- `container-dialog`: Dialog content.
- `container-page`: the outer page shell (header/content/footer).

A view is normally a `container-page` shell, with narrower containers
nested inside it around specific content (prose inside a wide page,
a grid of `container-card`s, etc.) — never make the whole page as
narrow as `container-prose` just because most of it is text; only the
text block itself gets that width.

### Mobile first, then widen — don't add space, redistribute it

`style.md` already sets mobile-first, 320px minimum. Practically:
build the `gap`/padding values for the smallest breakpoint first, at
the tight end of each job's range (see table above). Widening at
`sm`/`md`/`lg` (`40rem`/`48rem`/`64rem`) means moving up within the
same range or changing layout (stack → row), not stacking extra
margin on top of what mobile already has. A section that used
`gap="4"` on mobile can become `gap="8"` at `md` if the extra breathing
room earns its keep at that width; it should not become `gap="4"`
plus a separate `md:mt-8`.

### Vertical rhythm inside a view

For a view with multiple sections stacked vertically (the common
case: a page is a vertical `Stack` of section `Card`s or `Stack`s):

- Between sections: `gap="8"` to `gap="12"`, consistent across every
  view — this is the constant that makes different pages feel like
  the same app.
- Between a section's heading and its body: `gap="2"` to `gap="4"` —
  tight enough that the heading reads as "of" the content below it,
  not as a separate block.
- Page-top / page-bottom margin: `spacing-8`–`spacing-16` depending on
  whether the page has its own hero/header already providing top
  space.

Don't invent a per-page rhythm — a new view should reuse these same
three numbers rather than picking whatever "looks balanced" for that
one screen, or the app will read as a set of independently-designed
pages instead of one system.

### Checklist for a new component or view

1. Is this spacing *inside* one component, *between* related things,
   or *between* unrelated things? Pick the matching range above.
2. Does it involve a tap target? Floor it at `spacing-touch`, don't
   let padding alone satisfy that — `min-h`/`min-w` explicitly, as
   Button does.
3. Is density different from a nearby, similar element? Change
   `gap`, not the component.
4. Choosing a container width? Match it to the content type, not the
   screen.
5. Adding a breakpoint override? Confirm it moves within the same
   job's range (or changes layout direction) — it never piles a
   second spacing value on top of the mobile one.
