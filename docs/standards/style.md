# Style Standard

Two parts: code formatting (tools) and UI design (design system).


## Part 1: Code formatting

Tools decide. No debates in review.

- Formatter and linter: Biome (`biome.json`). Pre-commit hook
  (lefthook) formats staged files. `pnpm format` fixes everything.
- Line length: 100 for code, 80 for Markdown.
- Imports: sorted and grouped automatically.
- EditorConfig: `.editorconfig` at the root (UTF-8, LF, final newline,
  2-space indent unless the language says otherwise).


## Part 2: UI design system

Direction: bold and playful, very easy to read, generous spacing,
clear hierarchy, no generic AI look. Stack: Tailwind v4, tokens as CSS
variables, Radix primitives heavily customized.

### Tokens only

No raw values in components. Every color, spacing, radius, font size,
shadow and duration comes from a design token:

```
color.bg              color.text        color.text.muted
color.surface         color.border      color.border.strong
color.accent          color.secondary   color.focus
color.success         color.warning     color.error
color.shadow          color.overlay     color.scrim
font.family.display | body
font.weight.regular | semibold | bold
font.size.xs | sm | md | lg | xl | 2xl | 3xl
font.lineHeight.tight | normal | relaxed
space.0 ... space.8, 10, 12, 16   (4px scale)
radius.sm | md | lg | full
shadow.sm | md
motion.duration.fast | normal
motion.easing.out
```

Tokens live in `src/shared/ui/tokens.css`. Light and dark themes
redefine the same tokens. Full names, values and the contrast rules
they must pass: `docs/adr/0007-design-tokens-and-theming.md` and
`features/001-design-system/plan.md` "Tokens".

### Components

- Build from a small set of primitives: `Icon`, `Wordmark`, `Text`,
  `Stack`, `Button`, `Input`, `Tooltip`, `Card`, `CardButton`,
  `CardLink`, `Dialog`, `DialogClose`, `ThemeToggle`. Features compose
  primitives; they do not restyle them.
- Primitives style hover, focus and active only through the
  `ui-hover`, `ui-focus` and `ui-active` variants, never plain
  `hover:`/`focus-visible:`.
- Every interactive primitive is accessible by default (see
  `accessibility.md`). Features cannot break that.
- Every component handles its states: default, hover, focus, active,
  disabled, loading, error.

### Layout

- Mobile first. Must work at 320px width without horizontal scroll.
- Spacing from the scale only.
- Content max width for reading: ~70 characters.

### Copy

- Sentence case for all UI text.
- Buttons say the action: "Save trip", not "OK".
- Errors say what happened and what to do next.
