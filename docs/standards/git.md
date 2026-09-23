# Git Standard


## Branches

| Branch                     | Purpose                              |
| -------------------------- | ------------------------------------ |
| `main`                     | always releasable, protected         |
| `feat/<issue>-<slug>`      | one feature, one PR                  |
| `fix/<issue>-<slug>`       | bug fix                              |
| `chore/<slug>`             | tooling, deps, docs                  |
| `task/<issue>-<Tnn>`       | temporary, local only, per task      |

`task/*` branches live in `.worktrees/` during /feat-apply and are
deleted after squash-merge into the feature branch. Never pushed.


## Commits

Conventional Commits:

```
<type>(<scope>): <summary in imperative, ≤ 72 chars>

<body: why, not what. Wrap at 72.>

Refs #<issue>
```

Types: `feat fix test refactor perf docs style chore ci build revert`.
`wip` is allowed only on local `task/*` branches (squashed away).
The `commit-msg` hook checks the subject format.
Scope: the capability (`trips`, `bookings`) or `workflow`.

One commit per task on the feature branch:
`feat(trips): add stop to a trip day (T03)`.


## Pull requests

- Always draft first. Author marks ready after reading it.
- Title: same format as a commit subject.
- Body: summary, `Closes #<issue>`, tasks, test evidence, screenshots.
- CI green before ready for review.
- Merge: squash. Delete branch after merge.


## Never

- Force-push to `main`.
- Commit secrets, `.env`, or build output.
- Merge with failing CI.
