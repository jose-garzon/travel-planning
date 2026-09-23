# Accessibility Standard

Target: WCAG 2.2 level AA. Poor accessibility is a **blocker** in review.


## Automated (every UI scenario)

- axe-core via `@axe-core/playwright`, tags `wcag2a wcag2aa wcag21aa
  wcag22aa`. Zero violations.
- Step definitions locate elements by role and accessible name. If a
  test cannot find an element by role, the UI is probably wrong.


## Manual rules the reviewer checks

### Semantics
- Native elements first: `<button>`, `<a href>`, `<label>`, `<nav>`.
- One `<h1>` per page. Headings do not skip levels.
- Landmarks: `header`, `nav`, `main`, `footer`.
- ARIA only when no native element fits, following the WAI-ARIA
  Authoring Practices pattern named in plan.md.

### Keyboard
- Everything works with keyboard only. Logical tab order.
- Visible focus indicator, 3:1 contrast against its background.
- No keyboard traps. Dialogs trap focus intentionally and release it.
- `Escape` closes dialogs, menus, popovers.

### Focus management
- After opening a dialog: focus goes inside it.
- After closing: focus returns to the trigger.
- After a route change: focus moves to the new `<h1>` or main.
- After deleting an item: focus goes to a sensible neighbor.

### Screen readers
- Every input has a visible label. Placeholder is not a label.
- Icon-only buttons have an accessible name.
- Async results (saved, error, loading done) announced via a live
  region.
- Images: meaningful `alt`, or `alt=""` if decorative.

### Visual
- Text contrast 4.5:1 (3:1 for large text and UI parts).
- Color never the only signal (add icon or text).
- Works at 200% zoom and 320px width.
- Respect `prefers-reduced-motion`.
- Touch targets at least 24×24 CSS px (44×44 preferred).

### Forms
- Errors next to the field, linked with `aria-describedby`.
- On submit with errors: focus the first invalid field.
- Required fields marked in text, not only with `*` color.


## Blockers (always)

- Any axe violation.
- Interactive element not reachable or operable by keyboard.
- Missing accessible name on an interactive element.
- Focus lost (goes to `body`) after an action.
- Contrast below AA.
