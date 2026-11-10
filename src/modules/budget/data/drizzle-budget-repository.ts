import "server-only";
import { and, eq } from "drizzle-orm";
import type { BudgetItem } from "@/modules/budget/domain/budget";
import type { BudgetRepository } from "@/modules/budget/service/ports";
import { db } from "@/shared/db/client";
import { budgetItem, tripBudget } from "@/shared/db/schema/budget";

const columns = {
  id: budgetItem.id,
  tripId: budgetItem.tripId,
  category: budgetItem.category,
  label: budgetItem.label,
  amount: budgetItem.amount,
  currency: budgetItem.currency,
  rate: budgetItem.rate,
  userId: budgetItem.userId,
  link: budgetItem.link,
  stop: budgetItem.stop,
};

export class DrizzleBudgetRepository implements BudgetRepository {
  listItems(tripId: string): Promise<BudgetItem[]> {
    return db
      .select(columns)
      .from(budgetItem)
      .where(eq(budgetItem.tripId, tripId))
      .orderBy(budgetItem.createdAt);
  }

  async findItem(tripId: string, itemId: string): Promise<BudgetItem | null> {
    const [row] = await db
      .select(columns)
      .from(budgetItem)
      .where(and(eq(budgetItem.tripId, tripId), eq(budgetItem.id, itemId)))
      .limit(1);
    return row ?? null;
  }

  async createItem(item: BudgetItem): Promise<void> {
    await db.insert(budgetItem).values({ ...item, createdAt: new Date() });
  }

  async updateItem({ id, tripId, ...fields }: BudgetItem): Promise<void> {
    await db
      .update(budgetItem)
      .set(fields)
      .where(and(eq(budgetItem.tripId, tripId), eq(budgetItem.id, id)));
  }

  async removeItem(tripId: string, itemId: string): Promise<void> {
    await db
      .delete(budgetItem)
      .where(and(eq(budgetItem.tripId, tripId), eq(budgetItem.id, itemId)));
  }

  async getCap(tripId: string): Promise<number | null> {
    const [row] = await db
      .select({ cap: tripBudget.cap })
      .from(tripBudget)
      .where(eq(tripBudget.tripId, tripId))
      .limit(1);
    return row?.cap ?? null;
  }

  async setCap(tripId: string, cap: number | null): Promise<void> {
    await db
      .insert(tripBudget)
      .values({ tripId, cap })
      .onConflictDoUpdate({ target: tripBudget.tripId, set: { cap } });
  }
}
