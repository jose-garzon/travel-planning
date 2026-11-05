import type { ChatMessage, Suggestion } from "@/modules/agent/domain/suggestion";
import { MAX_HISTORY_MESSAGES, underLimit } from "@/modules/agent/domain/suggestion";
import type {
  AgentModel,
  AgentTripContext,
  AgentTripReader,
  UsageRepository,
} from "@/modules/agent/service/ports";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type AskAgentCommand = {
  userId: string;
  tripId: string;
  locale: "en" | "es";
  today: string;
  messages: ChatMessage[];
};

export type AskAgentDeps = {
  trips: AgentTripReader;
  usage: UsageRepository;
  model: AgentModel;
  ids: { next(): string };
};

export type AgentError =
  | { code: "TRIP_NOT_FOUND" }
  | { code: "AGENT_RATE_LIMITED" }
  | { code: "AGENT_UNAVAILABLE" };

export function systemPrompt(trip: AgentTripContext, locale: "en" | "es", today: string): string {
  const route = trip.stops
    .map((stop) => `${stop.from} → ${stop.city}${stop.date ? ` on ${stop.date}` : ""}`)
    .join("; ");
  return [
    "You help a group of friends plan and budget a trip.",
    `Today is ${today}. Answer in ${locale === "es" ? "Spanish" : "English"}.`,
    `Trip: "${trip.name}". Currency: ${trip.currency}. Travelers: ${trip.memberIds.length}.`,
    `Dates: ${trip.startDate ?? "unknown"} to ${trip.endDate ?? "unknown"}. Route: ${route || "none yet"}.`,
    "Use web search to find activities, flights, transport and lodging with good prices for these destinations and dates.",
    "Every price is an estimate: say so and cite the source link.",
    "When you find something worth adding, call the suggest tool once per item. You never change the trip yourself; members approve suggestions.",
    "Activity dates must be inside the trip dates. Costs for activities are per person. Lodging, transport and food are totals for the group, split equally. Flights are per person.",
    "Keep replies short: a few lines, then the suggestions.",
  ].join("\n");
}

/** One chat turn: rate-limited per user per day; chat history is kept by the client only. */
export async function askAgent(
  { userId, tripId, locale, today, messages }: AskAgentCommand,
  { trips, usage, model, ids }: AskAgentDeps,
): Promise<Result<{ reply: string; suggestions: Suggestion[] }, AgentError>> {
  const trip = await trips.get(tripId, userId, locale);
  if (trip === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  if (!underLimit(await usage.take(userId, today))) {
    return err({ code: "AGENT_RATE_LIMITED" });
  }
  try {
    const result = await model.reply({
      system: systemPrompt(trip, locale, today),
      messages: messages.slice(-MAX_HISTORY_MESSAGES),
    });
    return ok({
      reply: result.text,
      suggestions: result.suggestions.map(
        (suggestion) => ({ ...suggestion, id: ids.next() }) as Suggestion,
      ),
    });
  } catch {
    return err({ code: "AGENT_UNAVAILABLE" });
  }
}
