import type { BudgetItem } from "@/modules/budget/domain/budget";
import { inTripCurrency, summarize } from "@/modules/budget/domain/budget";
import type {
  ActivityCostsReader,
  BudgetRepository,
  TransferCostsReader,
  TripContext,
  TripContextReader,
} from "@/modules/budget/service/ports";
import type { BudgetDto, BudgetItemInput } from "@/modules/budget/service/schemas";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type BudgetDeps = {
  budget: BudgetRepository;
  trips: TripContextReader;
  activityCosts: ActivityCostsReader;
  transferCosts: TransferCostsReader;
  ids: { next(): string };
};

export type BudgetError =
  | { code: "TRIP_NOT_FOUND" }
  | { code: "BUDGET_ITEM_NOT_FOUND" }
  | { code: "MEMBER_NOT_FOUND" };

function toRecord(
  id: string,
  tripId: string,
  input: BudgetItemInput,
  context: TripContext,
): BudgetItem {
  return {
    id,
    tripId,
    category: input.category,
    label: input.label,
    amount: Math.round(input.amount * 100),
    currency: input.currency,
    rate: input.currency === context.currency ? "1" : (input.rate ?? "1"),
    userId: input.userId,
    link: input.link,
    stop: input.stop,
  };
}

export async function getBudget(
  { userId, tripId }: { userId: string; tripId: string },
  { budget, trips, activityCosts, transferCosts }: Omit<BudgetDeps, "ids">,
): Promise<Result<BudgetDto, BudgetError>> {
  const context = await trips.get(tripId, userId);
  if (context === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  const [items, activities, transfers, cap] = await Promise.all([
    budget.listItems(tripId),
    activityCosts.forTrip(tripId),
    transferCosts.forTrip(tripId),
    budget.getCap(tripId),
  ]);
  const summary = summarize({
    items,
    activities,
    transfers,
    memberIds: context.memberIds,
    cap,
  });
  return ok({
    currency: context.currency,
    items: items.map(({ tripId: _tripId, ...item }) => ({
      ...item,
      amountInTripCurrency: inTripCurrency(item),
    })),
    summary,
    transfers,
    mine: summary.perPerson.find((person) => person.userId === userId)?.total ?? 0,
  });
}

export async function createBudgetItem(
  { userId, tripId, input }: { userId: string; tripId: string; input: BudgetItemInput },
  { budget, trips, ids }: BudgetDeps,
): Promise<Result<{ id: string }, BudgetError>> {
  const context = await trips.get(tripId, userId);
  if (context === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  if (input.userId !== null && !context.memberIds.includes(input.userId)) {
    return err({ code: "MEMBER_NOT_FOUND" });
  }
  const id = ids.next();
  await budget.createItem(toRecord(id, tripId, input, context));
  return ok({ id });
}

export async function updateBudgetItem(
  {
    userId,
    tripId,
    itemId,
    input,
  }: { userId: string; tripId: string; itemId: string; input: BudgetItemInput },
  { budget, trips }: Pick<BudgetDeps, "budget" | "trips">,
): Promise<Result<{ id: string }, BudgetError>> {
  const context = await trips.get(tripId, userId);
  if (context === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  if ((await budget.findItem(tripId, itemId)) === null) {
    return err({ code: "BUDGET_ITEM_NOT_FOUND" });
  }
  if (input.userId !== null && !context.memberIds.includes(input.userId)) {
    return err({ code: "MEMBER_NOT_FOUND" });
  }
  await budget.updateItem(toRecord(itemId, tripId, input, context));
  return ok({ id: itemId });
}

export async function deleteBudgetItem(
  { userId, tripId, itemId }: { userId: string; tripId: string; itemId: string },
  { budget, trips }: Pick<BudgetDeps, "budget" | "trips">,
): Promise<Result<null, BudgetError>> {
  if ((await trips.get(tripId, userId)) === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  if ((await budget.findItem(tripId, itemId)) === null) {
    return err({ code: "BUDGET_ITEM_NOT_FOUND" });
  }
  await budget.removeItem(tripId, itemId);
  return ok(null);
}

/** Any member sets or clears the cap (major units in, minor units stored). */
export async function setBudgetCap(
  { userId, tripId, cap }: { userId: string; tripId: string; cap: number | null },
  { budget, trips }: Pick<BudgetDeps, "budget" | "trips">,
): Promise<Result<null, BudgetError>> {
  if ((await trips.get(tripId, userId)) === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  await budget.setCap(tripId, cap === null ? null : Math.round(cap * 100));
  return ok(null);
}
