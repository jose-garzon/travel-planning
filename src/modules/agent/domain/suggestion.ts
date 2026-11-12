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

/** Flights are transfers (feature 015), not budget items. */
export const BUDGET_CATEGORIES = ["lodging", "transport", "food", "other"] as const;
export const TRANSFER_MODES = ["flight", "train", "bus", "ferry", "car", "other"] as const;

export type BudgetSuggestion = {
  kind: "budget";
  category: (typeof BUDGET_CATEGORIES)[number];
  label: string;
  amount: number;
  currency: string;
  /** True for a per-person item. */
  perPerson: boolean;
  sourceUrl: string | null;
  /** Route stop it belongs to (leg position, 0 = first destination); null: whole trip. */
  stop: number | null;
};

export type TransferSuggestion = {
  kind: "transfer";
  /** Gap index of the route (0 = getting to the first destination). */
  gap: number;
  mode: (typeof TRANSFER_MODES)[number];
  departDate: string;
  departTime: string | null;
  arriveDate: string | null;
  arriveTime: string | null;
  cost: number | null;
  currency: string | null;
  sourceUrl: string | null;
};

export type Suggestion = (ActivitySuggestion | BudgetSuggestion | TransferSuggestion) & {
  id: string;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** True when the user can still ask today. */
export function underLimit(usedToday: number): boolean {
  return usedToday < AGENT_DAILY_LIMIT;
}
