import "server-only";
import { randomUUID } from "node:crypto";
import { createClaudeAgentModel } from "@/modules/agent/data/claude-agent-model";
import { DrizzleUsageRepository } from "@/modules/agent/data/drizzle-usage-repository";
import { type AskAgentCommand, askAgent } from "@/modules/agent/service/ask-agent";
import type { AgentTripReader } from "@/modules/agent/service/ports";
import { env } from "@/shared/config/env";

export type { ChatMessage, Suggestion } from "@/modules/agent/domain/suggestion";
export { AGENT_DAILY_LIMIT } from "@/modules/agent/domain/suggestion";
export type { AgentMessages } from "@/modules/agent/messages/load";
export { loadAgentMessages } from "@/modules/agent/messages/load";
export type { AgentError } from "@/modules/agent/service/ask-agent";

/** The agent API with the trips port injected by the app layer. */
export function createAgentApi({ trips }: { trips: AgentTripReader }) {
  const deps = {
    trips,
    usage: new DrizzleUsageRepository(),
    model: createClaudeAgentModel(env.AGENT_MODEL),
    ids: { next: () => randomUUID() },
  };
  return {
    isEnabled: () => env.ANTHROPIC_API_KEY !== undefined,
    askAgent: (command: AskAgentCommand) => askAgent(command, deps),
  };
}
