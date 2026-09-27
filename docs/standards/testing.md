# Testing Standard

Tests are the executable specification. Written first, locked after.


## Strategy

```
         ▲  few     BDD / e2e    playwright-bdd, from tests.feature
        ▲▲▲         integration  use case + real adapters (DB, HTTP)
      ▲▲▲▲▲▲  many  unit         domain and application, fast, pure
```

- **BDD scenarios** prove user-visible behavior from `feature.md`.
- **Integration** proves adapters work with real infrastructure
  (test DB in a container, not mocks).
- **Unit** proves domain rules and use case logic. Milliseconds each.
- **Component** (Vitest + RTL, `*.test.tsx`) proves component states
  and variants: disabled, loading, error, sizes. Not e2e.

Tests assert behavior, not looks: no pixel sizes, computed CSS
properties, colors or class names. The look is judged by the user
running the app at the visual gate, and from screenshots in the
feature review.


## TDD flow (enforced by /feat-apply)

One implementer agent per task does all three steps.

1. Red: write failing tests. Commit them alone (`test(...)`).
2. Green: write the minimum code to pass.
3. Refactor: clean up while green.
4. Tests are locked after red. A wrong test is fixed only in its own
   `test(...)` commit with the reason in the body. The feature review
   checks every such commit. Skips and weakened assertions are never
   allowed.


## Gherkin rules

- File: `features/<folder>/tests.feature`. Executed by playwright-bdd.
- Tags: `@F<issue>` on Feature, `@T<nn>` and `@AC-n` / `@EC-n` on each
  scenario. Optional: `@a11y`, `@perf`, `@i18n`.
- Declarative, user language. No CSS selectors, ids, or URLs in steps.
- One behavior per scenario. Max ~7 steps.
- Same meaning, same words: reuse step phrasing.
- `Background` for shared setup only.
- `Scenario Outline` for data variations.

Good:

```gherkin
When I add "Museo del Oro" as a stop on day 2
Then day 2 shows 1 stop
```

Bad:

```gherkin
When I click "#add-stop" and type "Museo del Oro" in "input[name=q]"
```


## Step definitions

- Location: `tests/steps/*.steps.ts`, shared across features.
  Fixtures and `Given/When/Then` come from `tests/steps/fixtures.ts`.
- Locate elements by role and accessible name
  (`getByRole('button', { name: 'Add stop' })`). This also tests a11y.
- No `waitForTimeout`. Wait for state.
- Each scenario sets up its own data. No order dependence.


## Accessibility checks

Step `Then the page has no accessibility violations` runs axe-core
(`@axe-core/playwright`) with WCAG 2.2 AA tags. Any violation fails.


## Unit tests

- Name: `<unit> <does what> when <condition>`.
- Arrange / Act / Assert, separated by blank lines.
- Mock only ports (things you do not own or I/O). Never mock domain.
- One logical assertion per test.


## Test file patterns (locked after red)

```
src/**/*.test.ts       unit (node)
src/**/*.test.tsx      component and hook tests (jsdom)
tests/**               step definitions, fixtures, setup
**/*.feature           Gherkin (human-owned)
```

Unit tests sit next to the code they test.


## Commands

```
pnpm test:unit                        all unit tests
pnpm vitest run src/modules/trips     one folder
pnpm test:e2e --grep @T03             scenarios of one task
pnpm test:e2e --grep @F042            scenarios of one feature
pnpm screenshots --grep @F042         same, with screenshots
```

Tests use in-memory SQLite (`file::memory:`) per test file.


## Coverage

Coverage is a signal, not a goal. Domain and service layers: aim
for 90%+ lines. Every AC and EC has at least one scenario.
