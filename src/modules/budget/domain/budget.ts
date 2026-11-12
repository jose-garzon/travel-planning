// Budget rules (docs/product.md "Budget rules"). Pure. Money is integer
// minor units; every currency is treated as having 2 decimals.

export const CATEGORIES = ["lodging", "transport", "food", "other"] as const;
export type Category = (typeof CATEGORIES)[number];
export type SummaryCategory = Category | "activities" | "transfers";

export type BudgetItem = {
  id: string;
  tripId: string;
  category: Category;
  label: string;
  /** Unit price: per traveler, charged once to each member it counts for. */
  amount: number;
  currency: string;
  /** Trip-currency units per one unit of `currency`. */
  rate: string;
  /** Counts only for this member; null counts for every member. */
  userId: string | null;
  link: string | null;
  /** Leg position (0-based) of the stop it belongs to; null: whole trip. */
  stop: number | null;
};

export type ActivityCost = { title: string; cost: number; participantIds: string[] };

/** A priced transfer: `cost` is per traveler, in trip-currency minor units. */
export type TransferCost = {
  id: string;
  gap: number;
  label: string;
  cost: number;
  charge: "all" | "opt-in";
  participantIds: string[];
};

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
  return { lodging: 0, transport: 0, food: 0, other: 0, activities: 0, transfers: 0 };
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

/** Who owes what: charges count only for people still on the trip. */
function ledgerOf(memberIds: string[]) {
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
    byCategory[category] += amount;
  };
  return { people, byCategory, charge };
}

type Charge = [userId: string, category: SummaryCategory, amount: number];

/** Every (person, category, amount) the trip's costs add up to, before leavers are dropped. */
function chargesOf({
  items,
  activities,
  transfers,
  memberIds,
}: {
  items: BudgetItem[];
  activities: ActivityCost[];
  transfers: TransferCost[];
  memberIds: string[];
}): Charge[] {
  return [
    // A unit price: every member pays it, so the total follows the group size.
    // A per-person item counts for its member only.
    ...items.flatMap((item) =>
      (item.userId === null ? memberIds : [item.userId]).map(
        (userId): Charge => [userId, item.category, inTripCurrency(item)],
      ),
    ),
    ...activities.flatMap((activity) =>
      activity.participantIds.map((userId): Charge => [userId, "activities", activity.cost]),
    ),
    // All-travelers transfers follow the group; opt-in ones, who is still on it.
    ...transfers.flatMap((transfer) =>
      (transfer.charge === "all" ? memberIds : transfer.participantIds).map(
        (userId): Charge => [userId, "transfers", transfer.cost],
      ),
    ),
  ];
}

export function summarize({
  items,
  activities,
  transfers,
  memberIds,
  cap,
}: {
  items: BudgetItem[];
  activities: ActivityCost[];
  transfers: TransferCost[];
  memberIds: string[];
  cap: number | null;
}): BudgetSummary {
  const { people, byCategory, charge } = ledgerOf(memberIds);
  for (const [userId, category, amount] of chargesOf({ items, activities, transfers, memberIds })) {
    charge(userId, category, amount);
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
