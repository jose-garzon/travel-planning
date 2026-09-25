# Feature Workflow

How every feature goes from idea to pull request.

Four phases. Two human gates. Everything after the second gate runs
unattended until a draft PR exists.

```
  /feat-refine ──► GATE 1 ──► /feat-plan ──► GATE 2 ──► /feat-apply ──► /feat-publish
   (you + AI)     you approve   (AI)       you approve   (agents)        (AI)
                  feature.md             plan + tasks                  draft PR
                                          + tests
```


## Artifacts

Every feature lives in one folder named after its GitHub issue:

```
features/
  042-trip-itinerary/
    feature.md       what and why, from the user's point of view
    plan.md          how: architecture, data, contracts, naming
    tasks.md         small end-to-end slices, with dependencies
    tests.feature    Gherkin scenarios, executable via playwright-bdd
    log.md           apply progress, review rounds, blockers
    evidence/        screenshots and test reports for the PR
```

You read and edit these files. Agents treat them as the source of truth.
If a file is wrong, fix the file, not the code.


## Phase 1: Refine  (`/feat-refine <idea>`)

Goal: understand the feature completely before any technical thinking.

1. Create GitHub issue (label `phase:refining`) and the feature folder.
2. Interview you in rounds of ~5 questions, grouped by topic:
   users, use cases, states, edge cases, errors, permissions,
   accessibility, i18n, out of scope.
3. Write `feature.md` (template: `.claude/skills/feat-refine/templates/`).
4. Stop. You review and edit `feature.md`.

**Gate 1**: you say "approved". Issue label moves to `phase:planned`
after planning.


## Phase 2: Plan  (`/feat-plan <folder>`)

Goal: decide the how, and cut the work into slices small enough that a
mid-tier model can implement each one without guessing.

1. Read `feature.md`, standards in `docs/standards/`, ADRs in `docs/adr/`.
2. Write `plan.md`: architecture, data model, contracts, components,
   naming table, decisions, risks, performance budgets.
3. Write `tasks.md`: vertical slices. Each task has ID, depends-on,
   files touched, linked scenarios, model tier, done criteria.
4. Write `tests.feature`: Gherkin scenarios tagged with task IDs.
5. Ask you any open technical questions.
6. Stop. You review and edit.

**Gate 2**: you say "approved". From here the run is unattended.


## Phase 3: Apply  (`/feat-apply <folder>`)

Goal: implement every task, verified, without human help.

The main session is the orchestrator. It never writes feature code.
It schedules tasks and spawns three agent types:

| Agent        | Model    | Job                                    |
| ------------ | -------- | -------------------------------------- |
| tester       | sonnet   | red: write failing tests for the task  |
| implementer  | per task | green: make the tests pass             |
| reviewer     | opus     | check diff against plan and standards  |

Per task loop (strict TDD):

```
  tester ──► tests fail? ──► implementer ──► tests pass? ──► reviewer
                                  ▲                              │
                                  └──── fix (max 3 rounds) ◄─────┘
                                                                 │
                                                        approved ▼
                                                   merge + commit task
```

Rules:

- Tasks run in parallel (max 3) only when dependencies are done and
  their "files touched" lists do not overlap.
- Each running task gets its own git worktree in `.worktrees/<task-id>`.
- The implementer must not edit test files. The orchestrator checks this.
- After 3 failed rounds the task is marked `blocked`, logged, and
  skipped. Independent tasks continue.
- If the plan is wrong, agents do not improvise. The task is blocked with
  a note. Small naming fixes are allowed and logged.
- One commit per task.
- End of feature: full test suite, lint, typecheck, build, screenshots.


## Phase 4: Publish  (`/feat-publish <folder>`)

1. Push branch `feat/<issue>-<slug>`.
2. Open a **draft** PR: summary, `Closes #<issue>`, task checklist,
   test evidence, UI screenshots, blockers if any.
3. Move issue label to `phase:in-review`.


## Audit  (`/feat-audit <folder>/<file>`)

Optional, before any gate. Audits one spec file (`feature.md`,
`plan.md`, `tasks.md` or `tests.feature`) against the other spec
files, `docs/product.md`, standards, ADRs and the code.

1. Report numbered findings: contradictions, redundancies, vague or
   untestable items, missing items, format.
2. You answer by number.
3. It applies the answers and lists the decisions it made plus any
   files now out of sync. It never changes `Status:`.


## GitHub labels

| Label                | Meaning                               |
| -------------------- | ------------------------------------- |
| `phase:refining`     | refine in progress                    |
| `phase:planned`      | plan approved, ready for apply        |
| `phase:in-progress`  | apply running                         |
| `phase:blocked`      | apply finished with blocked tasks     |
| `phase:in-review`    | draft PR open                         |

Create them once per repo:

```sh
gh label create phase:refining    --color C5DEF5
gh label create phase:planned     --color BFD4F2
gh label create phase:in-progress --color FBCA04
gh label create phase:blocked     --color D93F0B
gh label create phase:in-review   --color 0E8A16
```


## Standards

Tools enforce first. Docs explain why. Reviewers flag only what tools
cannot catch, and extreme deviations.

- `docs/standards/architecture.md`  Clean Architecture layers and rules
- `docs/standards/code.md`          naming, functions, errors, comments
- `docs/standards/testing.md`       TDD, pyramid, Gherkin, playwright-bdd
- `docs/standards/style.md`         formatting and UI design system
- `docs/standards/accessibility.md` WCAG 2.2 AA, blocker rules
- `docs/standards/performance.md`   budgets, blocker rules
- `docs/standards/i18n.md`          strings, dates, currency, time zones
- `docs/standards/git.md`           branches, commits, PRs
- `docs/standards/docs.md`          how to write files readable in Neovim


## Reuse in another repo

The workflow is project-agnostic. To reuse it, copy:

- `.claude/skills/feat-*`
- `.claude/agents/`
- `docs/workflow.md`
- `docs/standards/` (then adjust)

Project specifics (commands, stack) come from the `Commands` table in
`CLAUDE.md`. The skills read commands from there, never hardcode them.
