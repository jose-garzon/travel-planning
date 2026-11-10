# 0010. Agent runs on Anthropic, not OpenRouter

Date: 2026-11-04
Status: accepted (supersedes 0006)


## Context

ADR 0006 chose OpenRouter for the agent. The product owner decided on
2026-11-02 to use Anthropic directly. Anthropic offers a server-side
web search tool, which covers the v1 data source without another
search API.


## Decision

- Vercel AI SDK (`ai`) with `@ai-sdk/anthropic`.
- Model from `AGENT_MODEL` (default `claude-sonnet-5-5`); key in
  `ANTHROPIC_API_KEY`. No key: the agent panel is hidden and the API
  answers `AGENT_UNAVAILABLE`.
- Tools: Anthropic web search (max 3 uses per turn) and a local
  `suggest` tool that collects suggestions. The model never writes.
- One request per chat turn (no streaming in v1); the client keeps
  the history, so chats stay private and are not stored.
- Rate limit: 20 turns per user per UTC day (`agent_usage` table).
- Approval goes through the public itinerary and budget APIs, so the
  same validation and authorization apply.


## Consequences

- One provider, one key, provider-native search with source links.
- No model fallback across vendors.
