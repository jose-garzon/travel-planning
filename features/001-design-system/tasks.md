# Tasks: Design system

Plan: ./plan.md
Tests: ./tests.feature
Status: approved

Status values: todo | doing | done | blocked

Parallel batches (max 3 at once):

```
T01, T03 → T15 → T02 → T04, T11 → T06, T13 → T05, T07, T08
  → T09, T10, T12 → T14
```

Shared rules for every task:

- Read `plan.md` sections Contracts, Naming and Decisions first.
- Only tokens from `src/shared/ui/tokens.css`; no raw values, no
  arbitrary Tailwind values, no `style` prop (T03 lint enforces).
- Tailwind classes are literal strings. Use maps, not
  `` `bg-${x}` ``.
- Primitives live in `src/shared/ui/components/`. No
  `className`/`style` props; text as `children` or `translateId`,
  string props as `Translatable` (plan "Translatable text");
  `data-ui` on the root, states through `ui-hover`/`ui-focus`/
  `ui-active`, movement only under `motion-safe:`.
- en and es message files change together.
- Test mechanics (viewport, `@desktop`, zoom, lint and deps
  harnesses): plan "Test harness".


## T01. Tokens, fonts and root header with the wordmark

Status: done
Depends on: -
Model: sonnet
Scenarios: @T01, @smoke
Covers: AC-3, AC-16, EC-2

Files:
- package.json
- pnpm-lock.yaml
- playwright.config.ts
- src/shared/ui/tokens.css
- src/shared/ui/tokens.test.ts
- src/shared/ui/fonts.ts
- src/shared/ui/cx.ts
- src/shared/ui/cx.test.ts
- src/app/globals.css
- src/app/[locale]/layout.tsx
- src/shared/i18n/messages/en.json
- src/shared/i18n/messages/es.json
- tests/steps/support/tokens.ts
- tests/steps/tokens.steps.ts
- tests/steps/fonts.steps.ts

Steps:
1. `pnpm add radix-ui lucide-react` (both runtime deps, D-9).
2. `playwright.config.ts`: add `grepInvert: /@desktop/` to the
   `mobile` project.
3. Write `tokens.css` exactly as plan "Tokens" describes: `@theme`
   with `--*: initial` then every token, `color-scheme` rules,
   the four `@custom-variant`s, `@utility duration-fast` /
   `duration-normal`, `@keyframes` for fade-in, shake, sheet-up,
   dialog-in, spin. Copy every value from plan Tokens → Values,
   Animations and Colors (including font weights and
   `--container-card`); do not invent values.
4. `globals.css`: `@import "tailwindcss";` then
   `@import "../shared/ui/tokens.css";`, then `@layer base`:
   `body` gets `bg-bg text-text font-body leading-normal`
   (via `@apply`), headings `font-display`,
   `@media (prefers-reduced-motion: no-preference) { html {
   scroll-behavior: smooth } }`.
5. `fonts.ts`: `fredoka` and `plusJakartaSans` per D-10, with
   `variable: "--font-fredoka"` / `"--font-plus-jakarta-sans"`.
6. `layout.tsx`: add both font `.variable` classes to `<html>`
   (via `cx`) and `dir="ltr"`. No header (T15), no cookie (T05).
7. `cx.ts` per plan.
8. Messages: `common.appName` = "Parche" (en, es).
9. `tests/steps/support/tokens.ts`: read `tokens.css`, return a
   map `name → { light, dark } | value` (parses `light-dark()`,
   `#rrggbb`, `#rrggbbaa`, `transparent`; resolves `var(--x)`
   references to the referenced token), plus
   `contrastRatio(hexA, hexB)` (WCAG 2 formula). Used by later
   steps too.

Done when:
- [x] Scenarios tagged @T01 and @smoke pass (both projects)
- [x] `tokens.test.ts` checks: every AC-3 token exists; sizes in
      `rem`; line heights unitless; radius/space/duration values
      match the plan; every pair in the plan contrast table meets
      its minimum in light and dark
- [x] `cx.test.ts` passes
- [x] `support/tokens.ts` resolves `--color-focus` to the
      `--color-accent` values
- [x] `tokens.test.ts` asserts the `@theme` block starts with
      `--*: initial;` (so `p-13`, `m-4`, `bg-red-500` generate no
      CSS; verified in the plan spike)
- [x] `pnpm typecheck` and `pnpm lint` pass

Notes:
- `light-dark()` values must be hex (`#rrggbb` or `#rrggbbaa`).
- next/font `variable` values already contain the fallback stack;
  `--font-display: var(--font-fredoka)`.
- "Webfonts fail" = `page.route` aborting `**/*.woff2`. "Load
  slowly" = fulfill after a delay inside the route handler; CLS via
  a `PerformanceObserver` for `layout-shift` registered with
  `addInitScript`.


## T15. Translatable text, Icon, Wordmark and root header

Status: done
Depends on: T01
Model: sonnet
Scenarios: @T15
Covers: - (root header; enables D-7 for every later task)

Files:
- src/shared/ui/translatable.ts
- src/shared/ui/translatable.test.tsx
- src/app/_composition/i18n-types.d.ts
- tests/setup/intl.tsx
- src/shared/ui/components/icon.tsx
- src/shared/ui/components/icon.test.tsx
- src/shared/ui/components/wordmark.tsx
- src/shared/ui/components/site-header.tsx
- src/app/[locale]/layout.tsx
- tests/steps/header.steps.ts

Steps:
1. `translatable.ts` (`MessageKey`, `Translatable`, `TextContent`,
   `useTranslatable`) per plan "Translatable text".
2. `i18n-types.d.ts` typed with the shared en messages.
3. `tests/setup/intl.tsx` (`renderWithIntl`).
4. `components/icon.tsx`, `components/wordmark.tsx` per plan.
5. `site-header.tsx` (server): `<header>` with next-intl `Link`
   to `/` wrapping `<Wordmark />`. Layout: `flex items-center
   justify-between px-4 py-3`.
6. `layout.tsx`: render `<SiteHeader />` before `children`.

Done when:
- [x] Scenarios tagged @T15 pass
- [x] `icon.test.tsx`: aria-hidden vs role="img"; `label` as string
      and as `{ translateId }`
- [x] `translatable.test.tsx`: plain string returned as is; key
      translated; ICU `values` applied
- [x] `// @ts-expect-error` test proves an unknown `translateId`
      fails typecheck
- [x] `pnpm test:e2e --grep @T01` still passes
- [x] `pnpm typecheck` and `pnpm lint` pass


## T02. Styleguide shell with sections and messages

Status: done
Depends on: T15
Model: sonnet
Scenarios: @T02
Covers: AC-4, AC-11

Files:
- src/app/_composition/i18n-request.ts
- src/app/_composition/i18n-types.d.ts
- src/app/[locale]/styleguide/page.tsx
- src/modules/styleguide/index.ts
- src/modules/styleguide/ui/index.ts
- src/modules/styleguide/ui/styleguide-screen.tsx
- src/modules/styleguide/ui/components/styleguide-section.tsx
- src/modules/styleguide/ui/components/section-nav.tsx
- src/modules/styleguide/ui/components/state-sample.tsx
- src/modules/styleguide/ui/sections/sections.ts
- src/modules/styleguide/ui/sections/brand-section.tsx
- src/modules/styleguide/ui/sections/color-section.tsx
- src/modules/styleguide/ui/sections/type-section.tsx
- src/modules/styleguide/ui/sections/spacing-section.tsx
- src/modules/styleguide/ui/sections/radius-shadow-section.tsx
- src/modules/styleguide/ui/sections/motion-section.tsx
- src/modules/styleguide/ui/sections/icons-section.tsx
- src/modules/styleguide/ui/sections/primitives-section.tsx
- src/modules/styleguide/ui/demos/layout-demo.tsx
- src/modules/styleguide/ui/demos/button-demo.tsx
- src/modules/styleguide/ui/demos/input-demo.tsx
- src/modules/styleguide/ui/demos/tooltip-demo.tsx
- src/modules/styleguide/ui/demos/card-demo.tsx
- src/modules/styleguide/ui/demos/dialog-demo.tsx
- src/modules/styleguide/messages/load.ts
- src/modules/styleguide/messages/load.test.ts
- src/modules/styleguide/messages/en/page.json
- src/modules/styleguide/messages/en/brand.json
- src/modules/styleguide/messages/en/color.json
- src/modules/styleguide/messages/en/type.json
- src/modules/styleguide/messages/en/spacing.json
- src/modules/styleguide/messages/en/radiusShadow.json
- src/modules/styleguide/messages/en/motion.json
- src/modules/styleguide/messages/en/icons.json
- src/modules/styleguide/messages/en/primitives.json
- src/modules/styleguide/messages/en/layout.json
- src/modules/styleguide/messages/en/button.json
- src/modules/styleguide/messages/en/input.json
- src/modules/styleguide/messages/en/card.json
- src/modules/styleguide/messages/en/tooltip.json
- src/modules/styleguide/messages/en/dialog.json
- src/modules/styleguide/messages/es/page.json
- src/modules/styleguide/messages/es/brand.json
- src/modules/styleguide/messages/es/color.json
- src/modules/styleguide/messages/es/type.json
- src/modules/styleguide/messages/es/spacing.json
- src/modules/styleguide/messages/es/radiusShadow.json
- src/modules/styleguide/messages/es/motion.json
- src/modules/styleguide/messages/es/icons.json
- src/modules/styleguide/messages/es/primitives.json
- src/modules/styleguide/messages/es/layout.json
- src/modules/styleguide/messages/es/button.json
- src/modules/styleguide/messages/es/input.json
- src/modules/styleguide/messages/es/card.json
- src/modules/styleguide/messages/es/tooltip.json
- src/modules/styleguide/messages/es/dialog.json
- tests/steps/styleguide.steps.ts

Steps:
1. `sections.ts`: `STYLEGUIDE_SECTIONS` ids in plan order, and the
   message key per id (`radius-shadow` → `radiusShadow`).
2. Message files for every `<name>` in the plan list, each with at
   least `title` (en + es, titles from the plan Messages table;
   demos: "Stack and Text", "Button", "Input", "Tooltip", "Card",
   "Dialog"). `page.json` also has `navLabel` and `metaTitle` (en
   "Design system · Parche", es "Sistema de diseño · Parche").
3. `messages/load.ts`: `loadStyleguideMessages(locale)` imports all
   15 files for the locale. Module `index.ts` (`import
   "server-only"`) re-exports it and `type StyleguideMessages`.
   `i18n-request.ts` imports from `@/modules/styleguide` and merges
   under `styleguide`;
   `i18n-types.d.ts` adds `styleguide` (type of the en files).
   `load.test.ts`: en and es have the same keys.
4. `StyleguideSection`: `<section id aria-labelledby>` + `<h2
   id tabIndex={-1}>`.
5. `StateSample`: `<figure>` with optional `data-preview`, child,
   and `<figcaption>`.
6. Each `*-section.tsx`: renders `StyleguideSection` with its title
   and nothing else, except `primitives-section.tsx` which renders
   the six demos in order: layout, button, input, tooltip, card,
   dialog.
7. Each demo stub: `<section aria-labelledby>` + `<h3>` title.
8. `SectionNav` (server for now, T11 makes it client): `<nav
   aria-label>` + `<ul class="flex flex-wrap gap-x-4 gap-y-2
   md:flex-col">` of `<a href="#id">`.
9. `ui/styleguide-screen.tsx`: `<main>` with `h1`, `SectionNav`,
   sections, layout from plan "UI components". `ui/index.ts`
   exports `StyleguideScreen` only.
10. `src/app/[locale]/styleguide/page.tsx`: route only.
    `generateMetadata` (title from `styleguide.page.metaTitle`),
    `setRequestLocale`, render `<StyleguideScreen />`. No markup.

Done when:
- [x] Scenarios tagged @T02 pass
- [x] `pnpm test:e2e --grep @T01` still passes
- [x] No hardcoded user-facing text in `src/modules/styleguide/**`
- [x] `pnpm lint:deps` passes (page imports only the module's
      public API)
- [x] `pnpm typecheck` and `pnpm lint` pass

Notes:
- Step `I open the styleguide` goes to `/en/styleguide`;
  `I open the styleguide in {string}` to `/<locale>/styleguide`.
- `the page does not scroll horizontally`:
  `document.documentElement.scrollWidth <= clientWidth`.


## T03. Lint rules for tokens and interactive semantics

Status: todo
Depends on: -
Model: sonnet
Scenarios: @T03
Covers: AC-1, AC-2, D-14 (router guard)

Files:
- .dependency-cruiser.cjs
- tests/steps/deps.steps.ts
- biome.json
- biome-plugins/raw-css-values.grit
- biome-plugins/raw-js-values.grit
- biome-plugins/tailwind-arbitrary.grit
- biome-plugins/no-inline-style.grit
- tests/steps/lint.steps.ts

Steps:
1. Write the four plugins per plan "Lint rules" (patterns,
   `$filename` guards, exact messages). Regex groups must be
   non-capturing `(?:...)`.
2. `biome.json`: `"plugins": [...]` (paths relative to the
   config), and the three a11y rules as `"error"`.
3. `lint.steps.ts`: the lint harness from plan "Test harness".
4. Add the `app-is-a-router` rule to `.dependency-cruiser.cjs`
   per plan "Lint rules" (router guard block); `deps.steps.ts` =
   the router guard harness from plan "Test harness".
5. Run `pnpm lint` on the whole repo; fix nothing outside this
   task's files. If existing code fails, block with the file list.

Done when:
- [ ] Scenarios tagged @T03 pass
- [ ] Each plugin loads with no `errored:` info in `biome lint`
      output (assert in the "project source" scenario step)
- [ ] `pnpm lint` passes

Notes:
- The spike results are summarized in plan "Lint rules".
- `JsTemplateChunkElement()` catches template literal text.
- Rust regex: no lookahead. For "not followed by `:`" use
  `(?:[^:]|$)`.


## T04. Text and Stack primitives

Status: done
Depends on: T02
Model: sonnet
Scenarios: @T04
Covers: AC-10

Files:
- src/shared/ui/components/text.tsx
- src/shared/ui/components/text.test.tsx
- src/shared/ui/components/stack.tsx
- src/shared/ui/components/stack.test.tsx
- src/modules/styleguide/ui/demos/layout-demo.tsx
- src/modules/styleguide/messages/en/layout.json
- src/modules/styleguide/messages/es/layout.json
- tests/steps/primitives.steps.ts

Steps:
1. `Text` and `Stack` per plan APIs, with literal class maps.
2. Layout demo per plan "Demo content".
3. `primitives.steps.ts`: `the {string} demo shows the states
   {string}` (region by name, figcaptions in order) and `the
   {string} demo shows every font size`.

Done when:
- [x] Scenarios tagged @T04 pass
- [x] Unit tests: each `size`/`tone`/`gap` maps to its token class;
      `as` renders the element
- [x] `pnpm lint` passes


## T05. Theme: follow the OS, toggle, cookie, server render

Status: todo
Depends on: T06, T15
Model: sonnet
Scenarios: @T05
Covers: AC-6, AC-7, AC-19, AC-21

Files:
- src/shared/ui/theme.ts
- src/shared/ui/theme.test.ts
- src/shared/ui/components/theme-toggle.tsx
- src/shared/ui/components/theme-toggle.test.tsx
- src/app/[locale]/layout.tsx
- src/shared/ui/components/site-header.tsx
- src/shared/i18n/messages/en.json
- src/shared/i18n/messages/es.json
- tests/steps/theme.steps.ts

Steps:
1. `theme.ts` per plan contract.
2. `layout.tsx`: `const theme = parseTheme((await
   cookies()).get(THEME_COOKIE)?.value)`; `<html
   data-theme={theme}>` (omitted when undefined).
3. `ThemeToggle` per plan contract (client, `Translatable` labels,
   CSS-selected name, Moon/Sun icons, styled with `buttonClasses`
   from `components/button.tsx` for secondary + labelHidden).
4. `site-header.tsx`: render `ThemeToggle` with
   `{ translateId: "header.themeToggle.toDark" }` / `toLight`.
5. Messages per plan table.

Done when:
- [ ] Scenarios tagged @T05 pass
- [ ] Unit tests: `parseTheme` (valid, unknown, undefined),
      `oppositeTheme`; toggle click sets `data-theme` and writes a
      cookie with `Max-Age=31536000` and `SameSite=Lax`
- [ ] Toggle click causes no React state update (DOM + cookie only)
- [ ] Toggle is ≥ 44×44 and shows the token focus ring (scenario
      "Theme toggle has the focus ring and touch target")
- [ ] `pnpm test:e2e --grep @T01` still passes

Notes:
- "the page uses the X theme": body computed `background-color`
  equals the X value of `--color-bg` from `support/tokens.ts`.
- System scheme: `page.emulateMedia({ colorScheme })`.
- "without scripts": new context with `javaScriptEnabled: false`.


## T06. Button with every state

Status: todo
Depends on: T04
Model: sonnet
Scenarios: @T06
Covers: AC-9, AC-10, AC-19, AC-21

Files:
- src/shared/ui/components/button.tsx
- src/shared/ui/components/button.test.tsx
- src/modules/styleguide/ui/demos/button-demo.tsx
- src/modules/styleguide/messages/en/button.json
- src/modules/styleguide/messages/es/button.json
- tests/steps/primitives.steps.ts
- tests/steps/interaction.steps.ts
- tests/steps/button.steps.ts

Steps:
1. `Button` per plan API and shared primitive rules. Primary:
   `bg-accent text-on-accent ui-hover:bg-accent-hover`.
   Secondary: `bg-surface-1 border border-border-strong`.
   Active: `motion-safe:ui-active:scale-97`. `rounded-full`.
2. Loading per plan: spinner, `aria-busy`, `aria-disabled`, click
   ignored. `type` defaults to `"button"`. `labelHidden`: label
   `sr-only`, `icon` required (type-level), square
   `min-w-touch min-h-touch`. Export `buttonClasses({ variant,
   labelHidden })` (literal class map) for ThemeToggle.
3. Button demo per plan "Demo content", states via `StateSample`
   (`preview="hover|focus|active"`).
4. Steps: `primitives.steps.ts` adds `every {string} state looks
   different from its default state` (compare computed
   background-color, color, border-color, outline, opacity,
   transform, box-shadow). `interaction.steps.ts`: focus with the
   keyboard (press Tab until the target is focused, max 60),
   token focus ring (outline-style solid, outline-color =
   `--color-focus` for the current theme, offset > 0), touch
   target (every button/link/textbox in the region ≥ 44×44),
   hover, fast-duration transition (`transition-duration` 0.15s).

Done when:
- [ ] Scenarios tagged @T06 pass
- [ ] Unit tests: loading ignores clicks and sets aria-busy;
      disabled; variant classes; icon is aria-hidden; default
      `type="button"`; `labelHidden` keeps the label as the
      accessible name; `labelHidden` without `icon` fails typecheck
      (`// @ts-expect-error`)


## T07. Input with error state

Status: todo
Depends on: T06
Model: sonnet
Scenarios: @T07
Covers: AC-9, AC-10, AC-19, AC-21

Files:
- src/shared/ui/components/input.tsx
- src/shared/ui/components/input.test.tsx
- src/modules/styleguide/ui/demos/input-demo.tsx
- src/modules/styleguide/messages/en/input.json
- src/modules/styleguide/messages/es/input.json
- tests/steps/input.steps.ts

Steps:
1. `Input` per plan API: label above, `min-h-touch`, border
   `border-border-strong`, `ui-hover:border-accent`, focus ring,
   error: `border-error`, error row = `Icon` CircleAlert + text in
   `text-error`, `animate-fade-in motion-safe:animate-shake`.
2. Input demo per plan "Demo content".
3. Steps for "invalid and described by its error", "error message
   shows an icon and text", "enters with a fade and a shake"
   (`animation-name` lists both keyframes).

Done when:
- [ ] Scenarios tagged @T07 pass
- [ ] Unit tests: label association, aria-describedby with hint and
      error, aria-invalid only with error


## T08. Tooltip

Status: todo
Depends on: T06
Model: sonnet
Scenarios: @T08
Covers: AC-13

Files:
- src/shared/ui/components/tooltip.tsx
- src/shared/ui/components/tooltip.test.tsx
- src/modules/styleguide/ui/demos/tooltip-demo.tsx
- src/modules/styleguide/messages/en/tooltip.json
- src/modules/styleguide/messages/es/tooltip.json
- tests/steps/tooltip.steps.ts

Steps:
1. `Tooltip` on Radix Tooltip per plan API. Content: `bg-text
   text-bg text-sm rounded-sm px-2 py-1 shadow-md
   animate-fade-in`, max width `max-w-prose`.
2. Tooltip demo per plan "Demo content".
3. Steps: see/not see tooltip (`getByRole("tooltip")`), describes
   its trigger (`aria-describedby` → element with the text), move
   pointer onto tooltip, no focusable elements inside, `I press the
   {string} key`.

Done when:
- [ ] Scenarios tagged @T08 pass
- [ ] Unit test: content renders only the string; trigger keeps its
      own props


## T09. Card: static, clickable, truncation tooltip

Status: todo
Depends on: T04, T06, T08
Model: sonnet
Scenarios: @T09
Covers: AC-10, AC-12, EC-1

Files:
- src/shared/ui/components/card.tsx
- src/shared/ui/components/card.test.tsx
- src/modules/styleguide/ui/demos/card-demo.tsx
- src/modules/styleguide/messages/en/card.json
- src/modules/styleguide/messages/es/card.json
- tests/steps/card.steps.ts

Steps:
1. `Card`, `CardButton`, `CardLink` per plan API. Surface:
   `bg-surface-1 border border-border rounded-lg p-4 shadow-sm`;
   clickable adds hover `bg-surface-2`, focus ring, active scale.
2. Truncation: heading `truncate` + `data-truncate`;
   `ResizeObserver` sets `isTruncated`; Tooltip `open` gated by it.
3. Card demo per plan "Demo content". Wrap each card sample in
   `<div className="max-w-card">` (primitives take no
   `className`).
4. Steps: truncated with ellipsis (`text-overflow: ellipsis` and
   `scrollWidth > clientWidth`), static card wraps (height > one
   line height, no ellipsis), hover/focus clickable card.

Done when:
- [ ] Scenarios tagged @T09 pass
- [ ] Unit tests: `CardButton` renders `<button type="button">`,
      `CardLink` renders `<a href>`, static renders no interactive
      element


## T10. Dialog with bottom sheet on small screens

Status: todo
Depends on: T05, T06, T07, T08
Model: sonnet
Scenarios: @T10
Covers: AC-14, AC-15, EC-5, EC-6, EC-8

Files:
- src/shared/ui/components/dialog.tsx
- src/shared/ui/components/dialog.test.tsx
- src/modules/styleguide/ui/demos/dialog-demo.tsx
- src/modules/styleguide/messages/en/dialog.json
- src/modules/styleguide/messages/es/dialog.json
- tests/steps/dialog.steps.ts

Steps:
1. `Dialog` + `DialogClose` on Radix Dialog per plan API. Overlay
   `bg-overlay animate-fade-in`. Content `bg-surface-2` (dark:
   plus `border border-border`), responsive classes per plan.
   Header: title (`Text` h2 size xl font display), X button
   `<Button variant="secondary" icon={X} labelHidden>` with
   `closeLabel` as its label.
2. Dialog demo per plan "Demo content" (uses `Input` "Trip name":
   import from `@/shared/ui/components/input`, done in T07).
3. Steps: open dialog, focus inside, press key N times, focus
   returns to button, background does not scroll (wheel; scrollY
   unchanged), scrolls again, bottom sheet (content bottom =
   viewport height, left = 0, width = viewport width), centered
   dialog, still open, focus a field, focus on a field.

Done when:
- [ ] Scenarios tagged @T10 pass
- [ ] Unit tests: title and description wired
      (`aria-labelledby`/`aria-describedby`); X button accessible
      name equals `closeLabel`


## T11. Section navigation with scroll spy

Status: todo
Depends on: T02
Model: sonnet
Scenarios: @T11
Covers: AC-17, AC-18

Files:
- src/modules/styleguide/ui/components/section-nav.tsx
- tests/steps/section-nav.steps.ts

Steps:
1. Make `SectionNav` a client component with the behavior in plan
   "SectionNav behavior". Props stay `label`, `links`.
2. Active link: `aria-current="location"`, `text-accent underline`.
3. Steps: choose section link, section in view (heading top within
   the top 25% of the viewport), focus on heading, link active,
   only one active, scroll to section (`scrollIntoView` on the
   heading from the test), links wrap (link `offsetTop` values
   differ), no horizontal scroll in nav (`scrollWidth <=
   clientWidth`).

Done when:
- [ ] Scenarios tagged @T11 pass
- [ ] `pnpm test:e2e --grep @T02` still passes


## T12. Token sections: color, type, spacing, radius/shadow, motion, icons

Status: todo
Depends on: T04, T06
Model: haiku
Scenarios: @T12
Covers: AC-3, AC-4

Files:
- src/modules/styleguide/ui/sections/color-section.tsx
- src/modules/styleguide/ui/sections/type-section.tsx
- src/modules/styleguide/ui/sections/spacing-section.tsx
- src/modules/styleguide/ui/sections/radius-shadow-section.tsx
- src/modules/styleguide/ui/sections/motion-section.tsx
- src/modules/styleguide/ui/sections/icons-section.tsx
- src/modules/styleguide/ui/components/motion-sample.tsx
- src/modules/styleguide/messages/en/color.json
- src/modules/styleguide/messages/en/type.json
- src/modules/styleguide/messages/en/spacing.json
- src/modules/styleguide/messages/en/radiusShadow.json
- src/modules/styleguide/messages/en/motion.json
- src/modules/styleguide/messages/en/icons.json
- src/modules/styleguide/messages/es/color.json
- src/modules/styleguide/messages/es/type.json
- src/modules/styleguide/messages/es/spacing.json
- src/modules/styleguide/messages/es/radiusShadow.json
- src/modules/styleguide/messages/es/motion.json
- src/modules/styleguide/messages/es/icons.json
- tests/steps/token-sections.steps.ts

Steps:
1. Color: two panels `data-theme="light"` and `data-theme="dark"`
   (each `bg-bg p-4 rounded-lg`, labeled "Light"/"Dark"), a swatch
   per color token with its token name; semantic swatches also
   show their Icon (CircleCheck, TriangleAlert, CircleAlert).
2. Type: display and body family samples; one line per font size
   and per line height, each with its token name.
3. Spacing: one bar per space token (`w-<n> h-4 bg-accent`) plus
   name.
4. Radius/shadow: one box per radius and per shadow, with names.
5. Motion: token names with a sample that fades on a "Play" Button,
   in client component `ui/components/motion-sample.tsx`
   (movement only `motion-safe:`).
6. Icons: Sun, Moon, LoaderCircle, CircleAlert, CircleCheck,
   TriangleAlert, X, Check; each shown once decorative next to
   text and once alone with a label.
7. Token names are literal identifiers (plan DOM contract).

Done when:
- [ ] Scenarios tagged @T12 pass
- [ ] No raw values printed; `pnpm lint` passes


## T13. Brand section with voice rules

Status: todo
Depends on: T04
Model: haiku
Scenarios: @T13
Covers: AC-20

Files:
- src/modules/styleguide/ui/sections/brand-section.tsx
- src/modules/styleguide/messages/en/brand.json
- src/modules/styleguide/messages/es/brand.json
- tests/steps/brand.steps.ts

Steps:
1. Content from feature.md "Brand": name and meaning, wordmark
   direction (with a live `Wordmark`), four voice rules: `friend`
   (speaks like a friend), `direct` (short sentences),
   `sentenceCase`, `actionVerbs`. Each rule: `<article>` with h3,
   a "Do" example and a "Don't" example, each labeled with text +
   Icon (Check / X), not color alone.
2. Keys: `styleguide.brand.name`, `.meaning`, `.wordmark`,
   `.voice.<rule>.{title,do,dont}`, `.doLabel`, `.dontLabel`.

Done when:
- [ ] Scenarios tagged @T13 pass in en and es


## T14. Hardening: motion, reflow, contrast, budgets, docs

Status: todo
Depends on: T01, T02, T03, T04, T05, T06, T07, T08, T09, T10,
T11, T12, T13, T15
Model: sonnet
Scenarios: @T14
Covers: AC-4, AC-5, AC-8, AC-9, AC-11, AC-15, AC-17, AC-19, AC-21,
EC-3, EC-4, EC-7

Files:
- tests/steps/hardening.steps.ts
- lighthouserc.json
- docs/standards/style.md
- src/shared/ui/tokens.css
- src/app/globals.css
- src/shared/ui/components/button.tsx
- src/shared/ui/components/input.tsx
- src/shared/ui/components/card.tsx
- src/shared/ui/components/dialog.tsx
- src/shared/ui/components/tooltip.tsx
- src/shared/ui/components/text.tsx
- src/shared/ui/components/stack.tsx
- src/modules/styleguide/ui/components/section-nav.tsx
- src/modules/styleguide/ui/demos/layout-demo.tsx
- src/modules/styleguide/ui/demos/button-demo.tsx
- src/modules/styleguide/ui/demos/input-demo.tsx
- src/modules/styleguide/ui/demos/tooltip-demo.tsx
- src/modules/styleguide/ui/demos/card-demo.tsx
- src/modules/styleguide/ui/demos/dialog-demo.tsx

Steps:
1. Steps: reduced motion (`emulateMedia({ reducedMotion:
   "reduce" })`), "moves or scales" (after hover/active, computed
   `transform`/`scale`/`translate` is none and `animation-name`
   has no shake/sheet-up/dialog-in), "only fades in", "without
   smooth scrolling" (section in view immediately after click, and
   html `scroll-behavior` is `auto`), zoom 200% (640×400
   viewport), text size 200% (`addInitScript` injecting `html {
   font-size: 200% }`), "no primitive clips or overlaps" (every
   `[data-ui]` except `[data-truncate]` has `scrollWidth <=
   clientWidth`; sibling `figure` boxes do not intersect).
2. Run all @T14 scenarios; fix only what fails, inside the listed
   files.
3. `lighthouserc.json`: add `http://localhost:3000/en/styleguide`.
4. `docs/standards/style.md` Part 2: replace the token list with the
   plan's token table (names only), point to ADR 0007, list the
   primitives and the `ui-*` variants, remove "Status: defined by
   the design system feature".

Done when:
- [ ] Scenarios tagged @T14 pass
- [ ] `pnpm test:e2e --grep @F1` passes (full regression)
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` pass


## Coverage

Not from feature.md: the `app-is-a-router` guard (plan D-14) is
covered by T03, scenario "App folder only imports route files".

Scenarios per criterion: `:grep @AC-n` / `@EC-n` in
`tests.feature`.

| Criterion | Tasks              |
| --------- | ------------------ |
| AC-1      | T03                |
| AC-2      | T03                |
| AC-3      | T01, T12           |
| AC-4      | T02, T12, T14      |
| AC-5      | T01, T14           |
| AC-6      | T05                |
| AC-7      | T05                |
| AC-8      | T14                |
| AC-9      | T06, T14           |
| AC-10     | T04, T06, T07, T09 |
| AC-11     | T02, T14           |
| AC-12     | T09                |
| AC-13     | T08                |
| AC-14     | T10                |
| AC-15     | T10, T14           |
| AC-16     | T01                |
| AC-17     | T11, T14           |
| AC-18     | T11                |
| AC-19     | T05, T06, T07, T14 |
| AC-20     | T13                |
| AC-21     | T05, T06, T07, T09, T14 |
| EC-1      | T09                |
| EC-2      | T01                |
| EC-3      | T14                |
| EC-4      | T14                |
| EC-5      | T10                |
| EC-6      | T10                |
| EC-7      | T14                |
| EC-8      | T10                |
