---
name: feat-plan
description: Phase 2 of the feature workflow. From an approved feature.md, write plan.md, tasks.md and tests.feature in the feature folder. Use when the user runs /feat-plan or asks to plan an approved feature.
argument-hint: <features/NNN-slug>
disable-model-invocation: true
---

# Plan a feature

You are a staff engineer. Turn an approved `feature.md` into a plan that
cheaper models can execute without guessing. Every ambiguity you leave
becomes a bug or a blocked task later.

## Step 0: Preconditions

- `feature.md` exists and has `Status: approved`. If not, stop and say so.
- If the folder is `draft-<slug>` and a GitHub remote now exists, create
  the issue (see feat-refine Step 1), rename the folder, update `Issue:`.

Read: `feature.md`, `CLAUDE.md`, `docs/workflow.md`, every file in
`docs/standards/`, every ADR in `docs/adr/`, and the existing code the
feature will touch. Know the codebase before designing in it.

## Step 1: Open technical questions

List the technical decisions that are genuinely the user's call
(new dependency, new service, data retention, breaking API change,
cost). Ask them in one round, numbered, with suggested answers.
Decide everything else yourself and record it under Decisions.

## Step 2: plan.md

Template: `templates/plan.md`. Rules:

- Follow `docs/standards/architecture.md` (Clean Architecture). Name the
  layer of every new module.
- Diagrams in Mermaid code blocks. Keep them small, one idea each.
- Naming table: every new public name (entity, use case, endpoint,
  component, route, table, event, i18n key namespace). Cheap models
  copy names; give them the right ones.
- Contracts: exact request/response shapes and error codes.
- Performance budgets with numbers (see `docs/standards/performance.md`).
- Decisions: what you chose, alternatives, why. If a decision affects
  the whole project, also write an ADR in `docs/adr/NNNN-title.md`.

## Step 3: tasks.md

Template: `templates/tasks.md`. Rules for slicing:

- Vertical slices. Each task makes at least one Gherkin scenario pass
  end to end (UI or API through domain to storage). No "do all the
  models" or "do all the UI" tasks.
- Exception: `T00` walking skeleton when the feature needs new
  infrastructure (route, table, module wiring). It still ends with one
  trivial scenario passing.
- Size: about 1-2 hours of human work, under ~300 changed lines.
- Order: happy path first, then alternate flows, errors, edge cases,
  a11y and i18n hardening.
- `Files` lists every file the task creates or edits. The orchestrator
  uses this to decide what can run in parallel. Be exact.
- `Model`: `haiku` only for mechanical work (copy, config, wiring
  following an existing pattern). Otherwise `sonnet`.
- `Done when` is a checklist a reviewer can verify objectively.
- Every AC and EC in feature.md is covered by at least one task.
  Add the coverage table at the bottom of tasks.md.

## Step 4: tests.feature

Template: `templates/tests.feature`. Rules:

- One `Feature:` per file. Tag it `@F<issue>`.
- Each scenario tagged with its task (`@T03`) and what it covers
  (`@AC-2`, `@EC-1`). Add `@a11y` or `@perf` where relevant.
- Declarative steps (what, not how): "When I add a stop to the trip",
  not "When I click the button with id add-stop".
- Reuse step phrasing across scenarios. Same meaning, same words.
- Every UI scenario that renders a page includes an a11y check step:
  `Then the page has no accessibility violations`.
- Use `Scenario Outline` + `Examples` for data variations (locales,
  limits, invalid inputs).

## Step 5: Self check

Before handing over, verify and fix:
- Every AC/EC maps to a scenario and a task.
- Every scenario tag `@Txx` exists in tasks.md and vice versa.
- No two tasks that could run in parallel share a file.
- Dependency graph has no cycles.
- A developer who has never seen the codebase could start T01 with
  only these files and the standards.

## Step 6: Stop

Update the issue label to `phase:planned` only after approval.
Tell the user the three file paths, the task count, the parallel
batches (e.g. "T01 → T02,T03 → T04"), and:
"Review and edit. Say `approved` to run `/feat-apply features/<folder>`
unattended."
