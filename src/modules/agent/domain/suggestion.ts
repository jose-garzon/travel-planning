// Agent suggestions (docs/product.md "Agent"). Nothing is saved until a
// member approves one; approval goes through the itinerary or budget API.

export const AGENT_DAILY_LIMIT = 20;
export const MAX_HISTORY_MESSAGES = 20;

export type ActivitySuggestion = {
  kind: "activity";
  title: string;
  date: string;
  startTime: string | null;
  durationMinutes: number | null;
  costPerPerson: number | null;
  currency: string | null;
  sourceUrl: string | null;
};

export type BudgetSuggestion = {
  kind: "budget";
  category: "flights" | "lodging" | "transport" | "food" | "other";
  label: string;
  amount: number;
  currency: string;
  /** True for a per-person item (a flight for the asking member). */
  perPerson: boolean;
  sourceUrl: string | null;
};

export type Suggestion = (ActivitySuggestion | BudgetSuggestion) & { id: string };

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** True when the user can still ask today. */
export function underLimit(usedToday: number): boolean {
  return usedToday < AGENT_DAILY_LIMIT;
}
