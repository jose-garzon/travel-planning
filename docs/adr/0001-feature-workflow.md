# 0001. Spec-driven feature workflow with agent execution

Date: 2026-09-22
Status: accepted


## Context

Features must be scalable, maintainable and understandable. Work is
done largely by AI agents. Humans need to validate intent and design
without reading every line of code.


## Decision

Adopt the four-phase workflow in `docs/workflow.md`: refine, plan,
apply, publish. Two human gates (after refine, after plan). Apply runs
unattended with tester, implementer and reviewer subagents, strict TDD,
per-task git worktrees, max 3 review rounds per task. Gherkin in each
feature folder is executable via playwright-bdd. GitHub issues track
features; labels track phase.


## Consequences

- Upfront cost in refine and plan. Paid back by cheaper models in apply
  and fewer rewrites.
- Docs in `features/` must stay the source of truth; code that drifts
  from them is a defect.
- Parallelism is limited by how well tasks declare touched files.
- Unattended runs need broad tool permissions in the session.
