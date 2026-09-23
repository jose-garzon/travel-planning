# 0006. Agent: OpenRouter via Vercel AI SDK, suggest then approve

Date: 2026-09-22
Status: accepted


## Context

The agent is a key feature: find activities, flights and transport at
good prices and add them to the trip. LLMs do not know live prices.


## Decision

- Vercel AI SDK with `@openrouter/ai-sdk-provider` for streaming and
  tool calling. Model chosen per task in the agent feature plan.
- v1 data source: web search through OpenRouter. Results are labeled
  estimates with source links.
- The agent never writes directly. It produces suggestions; a member
  approves; approval calls itinerary and budget use cases through
  ports wired in the app layer.
- Everything agent-related lives in `src/modules/agent`.
- Per-user daily rate limit.


## Consequences

- Prices are approximate in v1. A real flights API can be added as a
  new tool later without changing the flow.
- Token cost is bounded by the rate limit.
