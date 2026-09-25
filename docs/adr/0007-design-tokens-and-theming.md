# 0007. Design tokens, theming and token lint

Date: 2026-09-24
Status: proposed


## Context

Every UI feature must look like one product in light and dark
themes. Raw colors, sizes and durations in component code drift
apart over time. The stored theme must render without a flash.
Feature #1 (design system) sets the rules every later feature
follows.


## Decision

- All design tokens live in `src/shared/ui/tokens.css`, the only
  file allowed to hold raw values. It resets the whole Tailwind v4
  theme (`--*: initial`) and defines only our tokens, so non-token
  utilities (`p-13`, `bg-red-500`) do not exist.
- Color tokens use `light-dark()`. `color-scheme` on `<html>`
  picks the theme: `light dark` (follow OS) by default,
  `data-theme="light|dark"` when the user chose one.
- The choice is stored in the `parche-theme` cookie (1 year) and
  read by the root layout with `cookies()`. Every page therefore
  renders dynamically.
- Biome GritQL plugins (`biome-plugins/*.grit`) fail `pnpm lint` on
  raw colors, lengths, shadows, durations, Tailwind arbitrary values
  and inline `style` props under `src/`. Biome a11y rules forbid
  click handlers on non-interactive elements. Fixture scenarios
  prove each rule fires.
- UI primitives (`src/shared/ui/components/*.tsx`) accept no
  `className` or `style`, and style hover, focus and active states
  through the `ui-hover`, `ui-focus` and `ui-active` variants.
- Primitives translate their own text with next-intl: literal
  `children`, or a typed `translateId` (+ ICU `values`); string
  props accept the same through the `Translatable` type. All
  messages are sent to the client.
- Radix (`radix-ui`) backs Dialog and Tooltip; Lucide
  (`lucide-react`) is the only icon set.


## Consequences

- No static prerendering of pages. Accepted: most routes need a
  session anyway; Lighthouse CI guards LCP.
- `light-dark()` needs 2024+ browsers.
- New visual needs mean a new token or primitive, discussed in that
  feature's plan, not a one-off style.
- A GritQL plugin that fails at runtime only emits an info in
  Biome 2.5; the fixture scenarios are the safety net and must stay
  in the regression suite.
- See `features/001-design-system/plan.md` for the full token list.
