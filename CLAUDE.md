# CLAUDE.md

Guidance for Claude Code working in this repository.

@AGENTS.md


## Project

Travel Planning: a web app + API + PWA where a group of friends plans
and budgets a trip together. Cities with date ranges, scheduled
activities members subscribe to, a budget in total and per person, and
an LLM agent that finds activities, flights and transport and adds
them on approval.

Product details and roadmap: `docs/product.md`.


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

- Next.js 16 (App Router, React Compiler), React 19, TypeScript strict
- pnpm, Node 22
- SQLite: Turso in production, file locally; Drizzle ORM
- next-intl (en, es)
- Tailwind v4 + Radix (customized) — defined in the design feature
- Better Auth (magic link) — added in the auth feature
- Vercel AI SDK + OpenRouter — added in the agent feature
- Biome, dependency-cruiser, lefthook
- Vitest, playwright-bdd, axe-core, Lighthouse CI
- Hosting: Vercel (production only, no previews)


## Layout

```
src/
  app/              routes, pages, /api/v1, _composition (wiring)
  modules/<m>/      domain, service, data, ui, messages, index.ts
  shared/           kernel, ui, db, i18n, config
  proxy.ts          locale routing (Next 16 name for middleware)
tests/
  steps/            playwright-bdd step definitions + fixtures
  features/         cross-feature scenarios (smoke)
features/           one folder per feature (issue + slug)
docs/               workflow, product, standards, adr
.claude/            workflow skills and agents
```

Module and layer rules: `docs/standards/architecture.md`. Enforced by
`pnpm lint:deps`.


## Commands

Skills read commands from this table. Keep it accurate.

| Task               | Command                                    |
| ------------------ | ------------------------------------------ |
| Install deps       | `pnpm install`                             |
| Dev server         | `pnpm dev`                                 |
| Build              | `pnpm build`                               |
| Test (all)         | `pnpm test`                                |
| Test (unit)        | `pnpm test:unit`                           |
| Test (by tag)      | `pnpm test:e2e --grep @T03`                |
| Test (single file) | `pnpm vitest run <path>`                   |
| Screenshots        | `pnpm screenshots --grep @F042`            |
| Lint               | `pnpm lint` (Biome + boundaries)           |
| Format             | `pnpm format`                              |
| Typecheck          | `pnpm typecheck`                           |
| Perf budgets       | `pnpm build && pnpm lhci`                  |
| DB migration       | `pnpm db:generate && pnpm db:migrate`      |


## Conventions

- Code: `docs/standards/code.md`, `docs/standards/architecture.md`
- Tests: `docs/standards/testing.md`
- Git: `docs/standards/git.md` (Conventional Commits, enforced by
  hook; `feat/<issue>-<slug>`; draft PRs; squash merge)
- Docs: `docs/standards/docs.md` (80 columns, Neovim friendly, English)


## Gotchas

- Next 16 differs from older versions (`proxy.ts` replaces
  `middleware.ts`, `PageProps`/`LayoutProps` globals, etc.). Read
  `node_modules/next/dist/docs/` before using an unfamiliar API.
- `pnpm typecheck` runs `next typegen` first; route types come from it.
- `pnpm test:e2e` starts `pnpm dev` (or reuses a running one). With
  `CI=1` it runs `pnpm start`, so build first.
- `/feat-apply` runs unattended except for one visual gate, where it
  stops for you to check screenshots; run it again to resume. It
  needs permission to run git, pnpm and `gh` without prompts (auto
  mode or an allowlist). It runs on Sonnet (skill frontmatter).
- `.worktrees/` holds per-task git worktrees during apply. Blocked
  tasks keep theirs; remove with `git worktree remove .worktrees/<T>`.
- Env vars: see `.env.example`. Copy to `.env.local`.
- Lighthouse CI needs a full Chrome; it runs in CI, not in WSL.
