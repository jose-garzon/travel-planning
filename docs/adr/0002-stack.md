# 0002. Stack: Next.js on Vercel, TypeScript, pnpm

Date: 2026-09-22
Status: accepted


## Context

Web app, public API and PWA, built mostly by AI agents, deployed with
minimal ops on a free tier. One developer.


## Decision

- Next.js 16 (App Router, React Compiler) for UI and API in one deploy.
- TypeScript strict (`noUncheckedIndexedAccess`). TypeScript 5.x until
  Next officially supports 7.
- pnpm, Node 22 (see `.nvmrc`).
- Vercel for hosting. Environments: local and production only.
- Biome for format and lint. dependency-cruiser for boundaries.
- Vitest for unit tests. playwright-bdd + axe-core for scenarios.
- Lighthouse CI for performance budgets.
- next-intl for i18n (ICU messages, locale routing).
- Tailwind v4 with CSS variables as design tokens. Radix primitives,
  heavily customized (chosen in the design feature).


## Consequences

- No preview deployments: PRs are verified by CI only.
- Serverless functions: no persistent connections or background
  workers. Long agent runs must stream within function time limits.
- Next 16 ships its own docs in `node_modules/next/dist/docs/`
  (see `AGENTS.md`); agents read them instead of relying on memory.
