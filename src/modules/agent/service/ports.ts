import type { ChatMessage, Suggestion } from "@/modules/agent/domain/suggestion";

export type AgentTripContext = {
  name: string;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  stops: { city: string; from: string; date: string | null }[];
  memberIds: string[];
};

export type AgentTripReader = {
  get(tripId: string, userId: string, locale: "en" | "es"): Promise<AgentTripContext | null>;
};

export type UsageRepository = {
  /** Increments today's count and returns the count before the increment. */
  take(userId: string, day: string): Promise<number>;
};

export type AgentModel = {
  reply(input: {
    system: string;
    messages: ChatMessage[];
  }): Promise<{ text: string; suggestions: Omit<Suggestion, "id">[] }>;
};
