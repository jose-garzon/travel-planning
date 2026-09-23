# Style Standard

Two parts: code formatting (tools) and UI design (design system).


## Part 1: Code formatting

Tools decide. No debates in review.

- Formatter: TBD per stack. Runs on save and in a pre-commit hook.
- Linter: TBD per stack, based on Google's config for the language.
- Line length: 100 for code, 80 for Markdown.
- Imports: sorted and grouped automatically.
- EditorConfig: `.editorconfig` at the root (UTF-8, LF, final newline,
  2-space indent unless the language says otherwise).


## Part 2: UI design system

Status: TBD. Defined with the first UI feature. Rules that apply now:

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

Tokens live in one file (path TBD). Light and dark themes redefine the
same tokens.

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
