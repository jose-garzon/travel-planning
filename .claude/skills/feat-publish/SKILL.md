---
name: feat-publish
description: Phase 4 of the feature workflow. Push the feature branch and open a draft pull request with summary, linked issue, task checklist, test evidence and UI screenshots. Use when the user runs /feat-publish or feat-apply hands off.
argument-hint: <features/NNN-slug>
disable-model-invocation: true
---

# Publish a feature

## Step 0: Preconditions

- On branch `feat/<issue>-<slug>`, working tree clean.
- Every task in tasks.md is `done` or `blocked`.
- `evidence/` exists with the test summary.
- A GitHub remote exists. If not, stop and tell the user the branch is
  ready locally and how to add the remote.

## Step 1: Push

```sh
git push -u origin feat/<issue>-<slug>
```

## Step 2: PR body

Write the body to a temp file using `templates/pr.md`. Rules:

- Summary: 3-5 lines, user-facing, from feature.md Summary.
- Tasks: one checkbox per task, checked if done. Blocked tasks stay
  unchecked with the reason.
- Test evidence: counts from the last full run (scenarios, unit tests,
  pass/fail), lint/typecheck/build result.
- Screenshots: reference images committed in `evidence/` with
  `https://github.com/<owner>/<repo>/blob/<branch>/<path>?raw=true`.
- Nothing else. No log dump, no minor findings list.
- End with the attribution line required by the session.

## Step 3: Open draft PR

```sh
gh pr create --draft --base main --head feat/<issue>-<slug> \
  --title "<type>(<scope>): <feature title>" --body-file <tmp>
gh issue edit <n> --add-label phase:in-review --remove-label phase:in-progress
```

Keep `phase:blocked` if it was set.

## Step 4: Report

Print the PR URL, tasks done/blocked, and where to look first
(blocked tasks, then the riskiest task by the plan's Risks section).
