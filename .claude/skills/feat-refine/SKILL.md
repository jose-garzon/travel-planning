---
name: feat-refine
description: Phase 1 of the feature workflow. Interview the user in depth about a new feature from the user's perspective and write features/<issue>-<slug>/feature.md. Use when the user runs /feat-refine or asks to refine, spec, or define a new feature.
argument-hint: <short feature idea>
disable-model-invocation: true
---

# Refine a feature

You are a senior product engineer interviewing the product owner.
Goal: a `feature.md` so complete that a planner never has to guess
user-facing behavior. Technical design is NOT part of this phase.

Read first: `docs/workflow.md`, `docs/standards/docs.md`,
`docs/standards/accessibility.md`, `docs/standards/i18n.md`.

## Step 1: Issue and folder

1. Derive a kebab-case slug (2-4 words) from the idea.
2. If `gh repo view` succeeds, create the issue:
   `gh issue create --title "<Title>" --label phase:refining --body "<idea>"`
   and use its number, zero-padded to 3 digits (e.g. `042`).
   If there is no GitHub remote, use `draft` as the number and tell the
   user. `/feat-plan` will create the issue and rename the folder later.
3. Create `features/<number>-<slug>/`.

## Step 2: Interview

Ask in rounds. Each round: max 5 questions, one topic, numbered.
For each question, offer a suggested answer in `[brackets]`.
The user may skip a question; the suggestion then applies.
Keep asking until every section in the template has real content.

Topic order (skip what does not apply, add what is missing):

1. Problem and value: who hurts today, how, why now, success metric.
2. Users and roles: who uses it, permissions, anonymous vs signed in.
3. Use cases: the main flow step by step, then alternate flows.
4. States: empty, loading, partial, success, error, offline, stale.
5. Edge cases: limits, duplicates, concurrency, time zones, huge data,
   zero data, invalid input, slow network, interrupted flows.
6. Errors: what the user sees and can do for each failure.
7. Accessibility: keyboard flow, screen reader announcements, focus
   management, motion, contrast, touch targets.
8. i18n: locales, text expansion, dates, times, time zones, currency,
   number formats, pluralization, RTL.
9. UI: screens, layout, what goes where. Draw ASCII wireframes and
   confirm them with the user.
10. Out of scope and open questions.

Rules:
- Dig. When an answer is vague ("it should be fast", "handle errors"),
  ask for a concrete example or number.
- Challenge contradictions and scope creep. Suggest splitting the
  feature when it has more than ~10 acceptance criteria.
- Summarize what you understood at the end of each round, in 3-5 lines,
  so the user can correct you early.

## Step 3: Write feature.md

Use `templates/feature.md` in this skill folder. Follow
`docs/standards/docs.md` (80 columns, plain Markdown, Neovim friendly).
Acceptance criteria are numbered `AC-1`, `AC-2`, ... so the plan and
tests can reference them.

If the issue exists, update its body with the Summary section and a link
to the file: `gh issue edit <n> --body-file <tmp>`.

## Step 4: Stop

Tell the user:
- the path of `feature.md`
- open questions that remain, if any
- "Review and edit the file. Say `approved` to continue with
  `/feat-plan features/<folder>`."

Do not start planning in this phase.
