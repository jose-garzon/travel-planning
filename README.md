# Travel Planning

Plan and budget a trip with your friends. Pick the cities, schedule the
activities, let an AI agent find the best prices, and end with a clear
budget: in total and per person.

Status: in development.


## How this project is built

Every feature goes through a spec-driven workflow run with Claude Code
agents: refine the feature with the product owner, plan it into small
end-to-end slices with executable Gherkin scenarios, implement each
slice with strict TDD and automated review, then open a pull request.

- Workflow: [docs/workflow.md](docs/workflow.md)
- Product: [docs/product.md](docs/product.md)
- Architecture: [docs/standards/architecture.md](docs/standards/architecture.md)
- Decisions: [docs/adr/](docs/adr/)
- Features: [features/](features/)


## Stack

Next.js 16, React 19, TypeScript, SQLite (Turso) + Drizzle, next-intl,
Tailwind v4 + Radix, Vercel AI SDK + OpenRouter. Tested with Vitest,
playwright-bdd and axe-core. Deployed on Vercel.


## Development

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Checks: `pnpm lint`, `pnpm typecheck`, `pnpm test`.


## License

All rights reserved. See [LICENSE](LICENSE).
