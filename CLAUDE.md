# CLAUDE.md

Guidance for Claude Code working in this repository.


## Project

Travel planning application. (Purpose, users, scope: TBD.)


## How we build features

Every feature follows `docs/workflow.md`:

```
/feat-refine → GATE → /feat-plan → GATE → /feat-apply → /feat-publish
```

- Feature docs: `features/<issue>-<slug>/`. They are the source of truth.
- Standards: `docs/standards/`. Read the relevant ones before writing
  code, tests or docs.
- Decisions: `docs/adr/`.
- Do not write feature code outside this workflow unless asked.


## Stack

- Language / runtime: TBD
- Framework: TBD
- Database / storage: TBD
- Package manager: TBD
- BDD tests: playwright-bdd (+ @axe-core/playwright)


## Layout

```
.claude/skills/   feat-refine, feat-plan, feat-apply, feat-publish
.claude/agents/   tester, implementer, reviewer
docs/workflow.md  the feature workflow
docs/standards/   architecture, code, testing, style, a11y, perf, i18n,
                  git, docs
docs/adr/         architecture decision records
features/         one folder per feature (issue number + slug)
src/              TBD
```


## Commands

Skills read commands from this table. Keep it accurate.

| Task               | Command                                    |
| ------------------ | ------------------------------------------ |
| Install deps       | TBD                                        |
| Dev server         | TBD                                        |
| Build              | TBD                                        |
| Test (all)         | TBD                                        |
| Test (by tag)      | TBD  (e.g. `bddgen && playwright test --grep @T03`) |
| Test (single file) | TBD                                        |
| Screenshots        | TBD                                        |
| Lint               | TBD                                        |
| Format             | TBD                                        |
| Typecheck          | TBD                                        |


## Conventions

- Code: `docs/standards/code.md`, `docs/standards/architecture.md`
- Tests: `docs/standards/testing.md`
- Git: `docs/standards/git.md` (Conventional Commits,
  `feat/<issue>-<slug>`, draft PRs)
- Docs: `docs/standards/docs.md` (80 columns, Neovim friendly, English)


## Gotchas

- `/feat-apply` runs unattended. It needs permission to run git, the
  test commands and `gh` without prompts (auto mode or an allowlist in
  `.claude/settings.json`).
- `.worktrees/` holds per-task git worktrees during apply. Gitignored.
  Blocked tasks leave their worktree for inspection; remove with
  `git worktree remove .worktrees/<T>`.
- GitHub repo not created yet. Until then refine uses `draft-<slug>`
  folders and publish stops before pushing.
