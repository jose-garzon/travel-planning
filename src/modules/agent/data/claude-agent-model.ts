import "server-only";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import {
  BUDGET_CATEGORIES,
  type Suggestion,
  TRANSFER_MODES,
} from "@/modules/agent/domain/suggestion";
import type { AgentModel } from "@/modules/agent/service/ports";
import { httpUrl } from "@/shared/kernel/http-url";

// Anthropic needs each tool input to be a plain object (no top-level union),
// so activities and budget items are two tools.
const activitySchema = z.object({
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
  sourceUrl: httpUrl.nullable(),
});

const budgetSchema = z.object({
  category: z.enum(BUDGET_CATEGORIES),
  label: z.string().min(1).max(80),
  amount: z.number().min(0),
  currency: z.string().regex(/^[A-Z]{3}$/),
  perPerson: z.boolean(),
  sourceUrl: httpUrl.nullable(),
  stop: z.number().int().min(0).max(100).nullable(),
});

const transferSchema = z.object({
  gap: z.number().int().min(0).max(100),
  mode: z.enum(TRANSFER_MODES),
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  arriveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  arriveTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  cost: z.number().min(0).nullable(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .nullable(),
  sourceUrl: httpUrl.nullable(),
});

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
          suggest_activity: tool({
            description:
              "Propose one activity for the members to approve. Cost is per person. Call once per activity.",
            inputSchema: activitySchema,
            execute: async (input) => {
              suggestions.push({ kind: "activity", ...input });
              return "Shown to the user for approval.";
            },
          }),
          suggest_budget_item: tool({
            description:
              "Propose one cost (lodging, transport, food, other) for the members to approve. Call once per item. amount is the price for ONE traveler, never a group total: the app multiplies it by the number of travelers. Set stop to the route stop number the cost belongs to (lodging, food, local transport in a city); null only for costs of the whole trip.",
            inputSchema: budgetSchema,
            execute: async (input) => {
              suggestions.push({ kind: "budget", ...input });
              return "Shown to the user for approval.";
            },
          }),
          suggest_transfer: tool({
            description:
              "Propose one way to travel between two cities (flight, train, bus, ferry, car) for the members to approve. gap is the gap number from the prompt. Times are local to the place. cost is the price for ONE traveler. Call once per option.",
            inputSchema: transferSchema,
            execute: async (input) => {
              suggestions.push({ kind: "transfer", ...input });
              return "Shown to the user for approval.";
            },
          }),
        },
      });
      return { text: result.text, suggestions };
    },
  };
}
