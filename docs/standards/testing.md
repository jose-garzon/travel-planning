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


## TDD flow (enforced by /feat-apply)

1. Red: tester writes failing tests. Commit.
2. Green: implementer writes the minimum code to pass.
3. Refactor: implementer cleans up while green.
4. Tests are locked after red. Changing them requires the reviewer to
   agree the test is wrong.


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

- Location: TBD per stack (e.g. `tests/steps/`), shared across features.
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


## Test file patterns (locked for implementer)

TBD per stack. Starting point:

```
**/*.test.*
**/*.spec.*
tests/**
features/**/*.feature
```


## Coverage

Coverage is a signal, not a goal. Domain and application layers: aim
for 90%+ lines. Every AC and EC has at least one scenario.
