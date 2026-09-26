---
name: feat-apply
description: Phase 3 of the feature workflow. Orchestrate implementer and reviewer subagents to implement every task in an approved tasks.md with TDD, parallel git worktrees, one visual gate and one feature review. Use when the user runs /feat-apply.
argument-hint: <features/NNN-slug>
disable-model-invocation: true
model: sonnet
---

# Apply a feature

You are the orchestrator. You do NOT write feature code or tests.
You schedule tasks, spawn agents, verify their claims by running
commands yourself, merge, commit, and log. Run unattended: do not ask
the user anything except at the visual gate (Step 5), or when the
feature is done or fully blocked.

Never trust an agent's report that tests pass. Run them yourself.

Loop cap: 2. Every loop in this skill (rounds per task, fix rounds at
feature level, visual gate fixes) stops after 2 attempts.


## Step 0: Preconditions

- `plan.md` and `tasks.md` have `Status: approved`. Else stop.
- Working tree clean (`git status --porcelain` empty). Else stop.
- Commands table in `CLAUDE.md` has no `TBD` for: Test (by tag),
  Test (unit), Test (all), Lint, Typecheck, Build. Else stop.
- `.worktrees/` is in `.gitignore`.

Setup:

```sh
git switch main && git pull --ff-only        # skip pull if no remote
git switch -c feat/<issue>-<slug>            # or switch if it exists
gh issue edit <n> --add-label phase:in-progress --remove-label phase:planned
```

Create `log.md` in the feature folder if missing (format below).

### Resume

A previous run may have stopped mid-task. Per task status:

- `done`: skip.
- `blocked`: skip. Its worktree stays for the human.
- `doing`: resume it before scheduling anything new. Look at
  `.worktrees/<T>` and branch `task/<issue>-<T>`:
  - No worktree or branch: set back to `todo`.
  - No `test(...)` commit on the branch: remove the worktree and
    branch (`git worktree remove --force .worktrees/<T>`,
    `git branch -D task/<issue>-<T>`), set to `todo`. It restarts at
    Step 2.
  - A `test(...)` commit exists: the first one is `TEST_SHA`. Keep
    uncommitted or `wip(...)` changes. Spawn the implementer in resume
    mode (Step 3); it continues from the current state.
  - Log `resumed <T>` in log.md.
- Log has `visual gate: waiting`: the user has now answered. Handle
  it (Step 5) before scheduling anything.


## Step 1: Schedule

Build the task graph from tasks.md. A task is ready when:
- Status is `todo`
- every `Depends on` task is `done`

Pick a batch of up to 3 ready tasks whose `Files` lists do not overlap
each other or any running task. Prefer tasks that unblock the most
others. Mark them `Status: doing` in tasks.md.

Do not start a batch of one while other ready tasks exist whose
`Files` do not overlap; idle slots are the main cost of a run.


## Step 2: Worktree and context packet

```sh
git worktree add .worktrees/<T> -b task/<issue>-<T> feat/<issue>-<slug>
```

Run install inside the worktree if the stack needs it.

Each worktree runs its own dev server for e2e. `playwright.config.ts`
derives the port from the worktree path (`.worktrees/T06` → 3106), so
parallel tasks never share a server. Never start a dev server by hand
on 3000 during apply; the main checkout owns that port. Before each
batch, check the task ports are free (`ss -ltnp`). Kill stale
`next dev` processes left by an interrupted run.

When you run commands in a worktree, use `git -C <path>` or a
separate `cd <path>` call first. Do not chain `cd <path> && ...`:
compound commands miss the permission allowlist and stall on a prompt.

### Context packet

Agents start cold. Without a packet they spend most of their time
grepping a long plan. Before spawning, build one packet per task (in
your scratchpad, `packet-<T>.md`) and pass its path. It holds, copied
verbatim:

- The task block from tasks.md.
- The task's scenarios from tests.feature (only the `@<T>` ones).
- From plan.md: the Naming rows, contracts, decisions and components
  for the task's `Files`, with section headers.
- Paths of the standards that apply (UI task: accessibility, i18n,
  style; also `docs/design/direction.md` if it exists).
- Existing files to imitate: the closest sibling already merged.
- Worktree path, and `TEST_SHA` when resuming.

Keep it under ~200 lines.


## Step 3: Per-task loop

Spawn one `implementer` per task, with `model` set to the task's
`Model` field. Spawn the agents of a batch in the same message so they
run in parallel. Give each: packet path, worktree path, feature folder
path, and `TEST_SHA` if resuming.

The implementer does both TDD steps: it writes the failing tests,
commits them as `test(<scope>): <T> failing tests`, then implements
and commits `wip(<scope>): <T> round <n>`.

Verify yourself, in the worktree:
- A `test(...)` commit exists before any production change. Record
  the first one as `TEST_SHA`.
- Test (by tag) for `@<T>` passes, desktop project only
  (`--project=desktop`). Mobile runs once in Step 6.
- Unit tests touched by the task pass.
- Test files changed after `TEST_SHA` only in separate `test(...)`
  commits whose message gives the reason. Any other test change, a
  skip, or a `.feature` edit: block the task (`test tampering`).
- No files changed outside the task's `Files` list, except lockfiles
  or generated files the task explicitly expects.

A round is one implementer attempt. If verification fails, send the
exact failing output back with `SendMessage` to the same implementer
(it keeps its context). Max 2 rounds per task. After round 2:
- Mark the task `Status: blocked` with a one-line reason in tasks.md.
- Log the failing output.
- Keep the worktree for inspection. Do not merge.
- Continue with tasks that do not depend on it.

If the implementer reports `plan gap`, block the task at once with
reason `plan: <what is wrong>`. Do not let agents redesign.

There is no per-task review. The reviewer runs once, on the whole
feature (Step 6).


## Step 4: Merge

From the main checkout on `feat/<issue>-<slug>`:

```sh
git merge --squash task/<issue>-<T>
git commit -m "feat(<scope>): <task title> (<T>)" -m "Refs #<issue>"
```

If the merge conflicts: abort, rebase the task branch onto the feature
branch in the worktree, rerun Test (by tag) for `@<T>`, then merge.
If it still conflicts, block the task with reason `conflict`.

After merge:
- Run Test (unit). If something broke, revert the merge commit and
  block the task. E2E regression runs once, in Step 6.
- Mark `Status: done`, check its `Done when` boxes.
- `git worktree remove .worktrees/<T> && git branch -D task/<issue>-<T>`
- Commit the tasks.md and log.md update in the same commit as the task
  (amend is fine here, the branch is local and unpushed).

Then go to Step 5 if the gate is due, else back to Step 1 until no
task is ready.


## Step 5: Visual gate

Once per feature, after the first merged task that renders UI (its
`Files` include a component or page). Skip it for features with no UI,
and when log.md already has `visual gate: approved`.

1. Let running tasks finish and merge. Do not start a new batch.
2. On the feature branch, capture the UI of every `done` task:
   `SCREENSHOTS=on pnpm test:e2e --grep "<@T tags joined by |>"`
   (both projects: desktop and mobile). Copy the images for the
   screens that matter (one per page or component state, not every
   step) to `evidence/gate/` in the feature folder. Commit them.
3. Log `visual gate: waiting` and stop. Tell the user:
   - the image paths, grouped by page, desktop and mobile;
   - what to compare against (`docs/design/direction.md` if it exists);
   - "Reply `approved`, or write what to change, then run
     `/feat-apply <folder>` again."

When the run resumes with the user's answer:
- `approved`: log `visual gate: approved`, continue at Step 1.
- Change requests: log them, spawn `implementer` (sonnet) on the
  feature branch with the requests and the image paths. Commit as
  `fix(<scope>): <what>`. Capture again and stop for the gate again.
  Max 2 fix rounds; after that log the open requests for the PR and
  continue.


## Step 6: Feature verification

On the feature branch, run in order: Test (all), Lint, Typecheck,
Build, Screenshots. Commands come from `CLAUDE.md`.

- Failures: spawn `implementer` (sonnet) on the feature branch with the
  output. Max 2 rounds. Test changes follow the Step 3 rule. Commit
  fixes as `fix(<scope>): <what>`.
- Spawn `reviewer` once on the full feature diff (`main...HEAD`), with
  the feature folder path and the screenshot paths.
  - `blocker`: same 2-round fix loop, then the reviewer rechecks only
    the blockers.
  - `major`, `minor`, `nit`: no fix round. Log them for the PR.
- Save screenshots and the test summary into `evidence/` in the
  feature folder and commit them.


## Step 7: Hand off

- If any task is blocked: label `phase:blocked`, still continue to
  publish so the work is reviewable.
- Invoke `/feat-publish <folder>`.


## log.md format

```
# Log: <Feature title>

## <YYYY-MM-DD HH:MM> T03 round 1
implementer (sonnet): red OK (a1b2c3d), 4 scenarios, 6 unit tests
green failed: 2/4 e2e (output below)

## <YYYY-MM-DD HH:MM> T03 round 2
implementer (sonnet): green OK
merged: 9f8e7d6

## <YYYY-MM-DD HH:MM> visual gate: waiting
evidence/gate/: 6 images

## <YYYY-MM-DD HH:MM> feature review
reviewer: 0 blocker, 2 major, 3 minor (carried to PR)
- major  src/app/add-stop.ts:42  use case returns entity, must return DTO
```

Keep entries short. The log is for the human reading the PR, and for
resuming an interrupted run.
