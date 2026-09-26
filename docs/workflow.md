# Feature Workflow

How every feature goes from idea to pull request.

Four phases. Two human gates, plus one visual gate inside apply.
Apart from the visual gate, everything after the second gate runs
unattended until a draft PR exists.

```
  /feat-refine ──► GATE 1 ──► /feat-plan ──► GATE 2 ──► /feat-apply ──► /feat-publish
   (you + AI)     you approve   (AI)       you approve   (agents)        (AI)
                  feature.md             plan + tasks   visual gate:   draft PR
                                          + tests       you check
                                                        screenshots
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

Goal: decide the how, and cut the work into slices a mid-tier model
can implement without guessing. The plan holds decisions and
contracts, not code: values, styling, props and copy are left to the
task that writes them. Aim under ~200 lines and 4-8 tasks; bigger
means the feature is split into several issues.

1. Read `feature.md`, standards in `docs/standards/`, ADRs in `docs/adr/`.
2. Write `plan.md`: architecture, data model, contracts, components,
   naming table, decisions, risks, performance budgets, and what is
   left to implementation.
3. Write `tasks.md`: vertical slices. Each task has ID, depends-on,
   files touched, linked scenarios, model tier, done criteria.
4. Write `tests.feature`: Gherkin scenarios for user flows, tagged
   with task IDs. Component states go in unit tests. No assertions on
   looks (pixels, CSS).
5. Ask you any open technical questions.
6. Stop. You review and edit.

**Gate 2**: you say "approved". From here the run is unattended
until the visual gate.


## Phase 3: Apply  (`/feat-apply <folder>`)

Goal: implement every task, verified, with one human look at the UI.

The main session is the orchestrator (Sonnet, set in the skill). It
never writes feature code. It schedules tasks and spawns two agent
types:

| Agent        | Model    | Job                                         |
| ------------ | -------- | ------------------------------------------- |
| implementer  | per task | TDD: failing tests, commit, then make pass  |
| reviewer     | opus     | once per feature: diff, standards, visuals  |

Per task loop:

```
  implementer: red commit ──► green ──► orchestrator verifies
                                  ▲              │
                                  └─ fix (max 2) ◄┘ fail
                                                 │ pass
                                                 ▼
                                   merge + unit tests + commit task
```

Then, once per feature:

```
  first UI task merged ──► screenshots ──► VISUAL GATE (you) ──► rest of tasks
  all tasks done ──► full tests, lint, typecheck, build ──► reviewer (opus)
                                                     blockers: fix, max 2
```

Rules:

- Loop cap 2 everywhere: an agent runs the tests at most twice before
  reporting, a task gets at most 2 rounds, fix loops stop at 2.
- Tasks run in parallel (max 3) only when dependencies are done and
  their "files touched" lists do not overlap.
- Each running task gets its own git worktree in `.worktrees/<task-id>`
  and its own e2e dev server port (`.worktrees/T06` → 3106, set in
  `playwright.config.ts`). Per-task e2e runs desktop only; mobile runs
  at the end.
- The orchestrator hands each agent a context packet: task block,
  its scenarios, and the plan excerpts it needs. Agents do not
  re-read the whole plan.
- An interrupted run resumes: `doing` tasks continue from their last
  commit instead of restarting.
- Tests are locked after the red commit. A wrong test is fixed only in
  its own `test(...)` commit with a reason; the reviewer checks these.
- After 2 failed rounds the task is marked `blocked`, logged, and
  skipped. Independent tasks continue.
- If the plan is wrong, agents do not improvise. The task is blocked
  with a note.
- One commit per task. After each merge only unit tests run; full e2e
  runs once at the end.
- Visual gate: after the first UI task merges, the run captures
  screenshots (desktop and mobile) into `evidence/gate/` and stops.
  You compare them with `docs/design/direction.md`, reply `approved`
  or what to change, and run `/feat-apply` again.
- Review: one reviewer pass on the whole feature. Only blockers get a
  fix round; everything else goes to the PR.


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
