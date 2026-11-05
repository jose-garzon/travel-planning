import "server-only";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import type { Suggestion } from "@/modules/agent/domain/suggestion";
import type { AgentModel } from "@/modules/agent/service/ports";

const suggestionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("activity"),
    title: z.string().min(1).max(80),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable(),
    durationMinutes: z.number().int().positive().nullable(),
    costPerPerson: z.number().min(0).nullable(),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .nullable(),
    sourceUrl: z.url().nullable(),
  }),
  z.object({
    kind: z.literal("budget"),
    category: z.enum(["flights", "lodging", "transport", "food", "other"]),
    label: z.string().min(1).max(80),
    amount: z.number().min(0),
    currency: z.string().regex(/^[A-Z]{3}$/),
    perPerson: z.boolean(),
    sourceUrl: z.url().nullable(),
  }),
]);

/** Claude through the Vercel AI SDK, with Anthropic web search (ADR 0011). */
export function createClaudeAgentModel(modelId: string): AgentModel {
  return {
    async reply({ system, messages }) {
      const suggestions: Omit<Suggestion, "id">[] = [];
      const result = await generateText({
        model: anthropic(modelId),
        system,
        messages,
        maxOutputTokens: 2000,
        stopWhen: stepCountIs(6),
        tools: {
          web_search: anthropic.tools.webSearch_20250305({ maxUses: 3 }),
          suggest: tool({
            description:
              "Propose one activity or budget item for the members to approve. Call once per item.",
            inputSchema: suggestionSchema,
            execute: async (input) => {
              suggestions.push(input);
              return "Shown to the user for approval.";
            },
          }),
        },
      });
      return { text: result.text, suggestions };
    },
  };
}
