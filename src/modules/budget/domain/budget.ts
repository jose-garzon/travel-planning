// Budget rules (docs/product.md "Budget rules"). Pure. Money is integer
// minor units; every currency is treated as having 2 decimals.

export const CATEGORIES = ["flights", "lodging", "transport", "food", "other"] as const;
export type Category = (typeof CATEGORIES)[number];
export type SummaryCategory = Category | "activities";

export type BudgetItem = {
  id: string;
  tripId: string;
  category: Category;
  label: string;
  amount: number;
  currency: string;
  /** Trip-currency units per one unit of `currency`. */
  rate: string;
  /** A per-person item counts only for this member; null splits equally. */
  userId: string | null;
  link: string | null;
};

export type ActivityCost = { title: string; cost: number; participantIds: string[] };

export type PersonTotal = {
  userId: string;
  total: number;
  byCategory: Record<SummaryCategory, number>;
};

export type BudgetSummary = {
  total: number;
  byCategory: Record<SummaryCategory, number>;
  perPerson: PersonTotal[];
  cap: number | null;
  /** `cap - total`; negative when over. Null with no cap. */
  remaining: number | null;
};

export function inTripCurrency(item: Pick<BudgetItem, "amount" | "rate">): number {
  return Math.round(item.amount * Number(item.rate));
}

function emptyCategories(): Record<SummaryCategory, number> {
  return { flights: 0, lodging: 0, transport: 0, food: 0, other: 0, activities: 0 };
}

/**
 * Splits `amount` equally among `count` people. The remainder (in minor
 * units) goes to the first people so shares always add up to the amount.
 */
export function splitEqually(amount: number, count: number): number[] {
  if (count === 0) {
    return [];
  }
  const base = Math.floor(amount / count);
  const remainder = amount - base * count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function summarize({
  items,
  activities,
  memberIds,
  cap,
}: {
  items: BudgetItem[];
  activities: ActivityCost[];
  memberIds: string[];
  cap: number | null;
}): BudgetSummary {
  const people = new Map<string, PersonTotal>(
    memberIds.map((userId) => [userId, { userId, total: 0, byCategory: emptyCategories() }]),
  );
  const byCategory = emptyCategories();

  const charge = (userId: string, category: SummaryCategory, amount: number) => {
    const person = people.get(userId);
    if (person === undefined) {
      return;
    }
    person.total += amount;
    person.byCategory[category] += amount;
  };

  for (const item of items) {
    const amount = inTripCurrency(item);
    if (item.userId !== null) {
      // A per-person item of a member who left is no longer counted.
      if (!people.has(item.userId)) {
        continue;
      }
      byCategory[item.category] += amount;
      charge(item.userId, item.category, amount);
      continue;
    }
    byCategory[item.category] += amount;
    splitEqually(amount, memberIds.length).forEach((share, index) => {
      const userId = memberIds[index];
      if (userId !== undefined) {
        charge(userId, item.category, share);
      }
    });
  }

  for (const activity of activities) {
    for (const userId of activity.participantIds) {
      if (people.has(userId)) {
        byCategory.activities += activity.cost;
        charge(userId, "activities", activity.cost);
      }
    }
  }

  const total = Object.values(byCategory).reduce((sum, value) => sum + value, 0);
  return {
    total,
    byCategory,
    perPerson: [...people.values()],
    cap,
    remaining: cap === null ? null : cap - total,
  };
}
