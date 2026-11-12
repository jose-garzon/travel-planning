import "server-only";
import { randomUUID } from "node:crypto";
import { DrizzleBudgetRepository } from "@/modules/budget/data/drizzle-budget-repository";
import type {
  ActivityCostsReader,
  TransferCostsReader,
  TripContextReader,
} from "@/modules/budget/service/ports";
import {
  createBudgetItem,
  deleteBudgetItem,
  getBudget,
  setBudgetCap,
  updateBudgetItem,
} from "@/modules/budget/service/use-cases";

export type { Category } from "@/modules/budget/domain/budget";
export { CATEGORIES } from "@/modules/budget/domain/budget";
export type { BudgetMessages } from "@/modules/budget/messages/load";
export { loadBudgetMessages } from "@/modules/budget/messages/load";
export type {
  BudgetDto,
  BudgetItemDto,
  BudgetItemInput,
} from "@/modules/budget/service/schemas";
export { budgetItemInputSchema, capInputSchema } from "@/modules/budget/service/schemas";
export type { BudgetError } from "@/modules/budget/service/use-cases";

type Args<F> = F extends (first: infer A, ...rest: never[]) => unknown ? A : never;

/** The budget API with the trips and itinerary ports injected by the app layer. */
export function createBudgetApi({
  trips,
  activityCosts,
  transferCosts,
}: {
  trips: TripContextReader;
  activityCosts: ActivityCostsReader;
  transferCosts: TransferCostsReader;
}) {
  const deps = {
    budget: new DrizzleBudgetRepository(),
    trips,
    activityCosts,
    transferCosts,
    ids: { next: () => randomUUID() },
  };
  return {
    getBudget: (query: Args<typeof getBudget>) => getBudget(query, deps),
    createBudgetItem: (command: Args<typeof createBudgetItem>) => createBudgetItem(command, deps),
    updateBudgetItem: (command: Args<typeof updateBudgetItem>) => updateBudgetItem(command, deps),
    deleteBudgetItem: (command: Args<typeof deleteBudgetItem>) => deleteBudgetItem(command, deps),
    setBudgetCap: (command: Args<typeof setBudgetCap>) => setBudgetCap(command, deps),
  };
}
