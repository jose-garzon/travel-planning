---
name: feat-apply
description: Phase 3 of the feature workflow. Orchestrate tester, implementer and reviewer subagents to implement every task in an approved tasks.md with strict TDD, parallel git worktrees and review loops, unattended. Use when the user runs /feat-apply.
argument-hint: <features/NNN-slug>
disable-model-invocation: true
---

# Apply a feature

You are the orchestrator. You do NOT write feature code or tests.
You schedule tasks, spawn agents, verify their claims by running
commands yourself, merge, commit, and log. Run unattended: do not ask
the user anything until the feature is done or fully blocked.

Never trust an agent's report that tests pass. Run them yourself.


## Step 0: Preconditions

- `plan.md` and `tasks.md` have `Status: approved`. Else stop.
- Working tree clean (`git status --porcelain` empty). Else stop.
- Commands table in `CLAUDE.md` has no `TBD` for: Test (by tag),
  Test (all), Lint, Typecheck, Build. Else stop.
- `.worktrees/` is in `.gitignore`.

Setup:

```sh
git switch main && git pull --ff-only        # skip pull if no remote
git switch -c feat/<issue>-<slug>            # or switch if it exists
gh issue edit <n> --add-label phase:in-progress --remove-label phase:planned
```

Create `log.md` in the feature folder if missing (format below).
If tasks are already `done` from a previous run, resume: skip them.


## Step 1: Schedule

Build the task graph from tasks.md. A task is ready when:
- Status is `todo`
- every `Depends on` task is `done`

Pick a batch of up to 3 ready tasks whose `Files` lists do not overlap
each other or any running task. Prefer tasks that unblock the most
others. Mark them `Status: doing` in tasks.md.


## Step 2: Worktree per task

```sh
git worktree add .worktrees/<T> -b task/<issue>-<T> feat/<issue>-<slug>
```

Run install inside the worktree if the stack needs it.


## Step 3: Per-task loop

Run the tasks of a batch in parallel: spawn the agents for different
tasks in the same message. Inside one task, steps are sequential.

### 3a. Red (tester)

Spawn agent `tester` with: worktree path, task block, feature folder
path. It writes step definitions and unit tests and commits
`test(<scope>): <T> failing tests`.

Verify yourself, in the worktree:
- Test (by tag) for `@<T>` fails.
- The failure is an assertion or missing behavior, not a syntax error,
  import typo, or missing step definition.
- Only test files changed (patterns in `docs/standards/testing.md`).

If not, send it back once with the exact output. Second failure:
block the task.

Record the tester commit SHA as `TEST_SHA`.

### 3b. Green (implementer)

Spawn agent `implementer` with `model` set to the task's `Model`
field. Give it: worktree path, task block, `TEST_SHA`, and on later
rounds the reviewer findings or failing output.

Verify yourself:
- Test (by tag) for `@<T>` passes.
- Unit tests touched by the task pass.
- `git diff TEST_SHA -- <test files> '*.feature'` is empty.
  Tests are locked. Any change is an automatic blocker finding.
- No files changed outside the task's `Files` list, except lockfiles
  or generated files the task explicitly expects.

If the implementer claims a test is wrong, do not let it edit the test.
Ask `reviewer` to judge that claim only. If the reviewer agrees, send
`tester` back to fix the test (counts as a round), then retry green.

### 3c. Review (reviewer)

Spawn agent `reviewer` with: worktree path, base
`feat/<issue>-<slug>`, task block, feature folder path.
It returns findings with severity `blocker | major | minor | nit`.

- Any `blocker` or `major`: back to 3b with the findings. New round.
- Only `minor`/`nit`: approved. Log them for the PR.

### 3d. Rounds

A round is one implementer attempt (3b + 3c). Max 3 rounds per task.
After round 3 without approval:
- Mark the task `Status: blocked` with a one-line reason in tasks.md.
- Log the last findings and failing output.
- Keep the worktree for inspection. Do not merge.
- Continue with tasks that do not depend on it.

If the task cannot be done because the plan is wrong (missing contract,
wrong name, impossible order), block it immediately with reason
`plan: <what is wrong>`. Do not let agents redesign.


## Step 4: Merge approved task

From the main checkout on `feat/<issue>-<slug>`:

```sh
git merge --squash task/<issue>-<T>
git commit -m "feat(<scope>): <task title> (<T>)" -m "Refs #<issue>"
```

If the merge conflicts: abort, rebase the task branch onto the feature
branch in the worktree, rerun Test (by tag) for `@<T>`, then merge.
If it still conflicts, block the task with reason `conflict`.

After merge:
- Run Test (by tag) for every `done` task tag (regression check).
  If something broke, revert the merge commit and block the task.
- Mark `Status: done`, check its `Done when` boxes.
- `git worktree remove .worktrees/<T> && git branch -D task/<issue>-<T>`
- Commit the tasks.md and log.md update in the same commit as the task
  (amend is fine here, the branch is local and unpushed).

Go back to Step 1 until no task is ready.


## Step 5: Feature verification

On the feature branch, run in order: Test (all), Lint, Typecheck,
Build, Screenshots. Commands come from `CLAUDE.md`.

- Failures: spawn `implementer` (sonnet) on the feature branch with the
  output. Max 2 rounds. Tests stay locked. Commit fixes as
  `fix(<scope>): <what>`.
- Reviewer pass on the full feature diff (`main...HEAD`) focused on
  cross-task consistency, a11y and performance. Blockers get the same
  2-round fix loop.
- Save screenshots and the test summary into `evidence/` in the
  feature folder and commit them.


## Step 6: Hand off

- If any task is blocked: label `phase:blocked`, still continue to
  publish so the work is reviewable.
- Invoke `/feat-publish <folder>`.


## log.md format

```
# Log: <Feature title>

## <YYYY-MM-DD HH:MM> T03 round 1
tester: 4 scenarios, 6 unit tests, red OK (a1b2c3d)
implementer (sonnet): green OK
reviewer: 1 major, 2 minor
- major  src/app/add-stop.ts:42  use case returns entity, must return DTO
- minor  ...

## <YYYY-MM-DD HH:MM> T03 round 2
implementer (sonnet): green OK
reviewer: approved, 2 minor carried
merged: 9f8e7d6
```

Keep entries short. The log is for the human reading the PR, and for
resuming an interrupted run.
