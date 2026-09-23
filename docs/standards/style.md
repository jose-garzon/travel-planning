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

Status: defined by the design system feature (roadmap #1). Direction:
bold and playful, very easy to read, generous spacing, clear
hierarchy, no generic AI look. Stack: Tailwind v4, tokens as CSS
variables, Radix primitives heavily customized. Rules that apply now:

### Tokens only

No raw values in components. Every color, spacing, radius, font size,
shadow and duration comes from a design token.

```
color.bg.surface      color.text.primary     color.border.subtle
space.1 ... space.8   (4px scale)
radius.sm | md | lg
font.size.sm | md | lg | xl
motion.duration.fast | normal
```

Tokens live in `src/shared/ui/tokens.css`. Light and dark themes
redefine the same tokens.

### Components

- Build from a small set of primitives (Button, Input, Card, Stack,
  Text, Dialog). Features compose primitives; they do not restyle them.
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
