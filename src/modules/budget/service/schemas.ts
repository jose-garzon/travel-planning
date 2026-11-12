import { z } from "zod";
import type { BudgetItem, BudgetSummary, TransferCost } from "@/modules/budget/domain/budget";
import { CATEGORIES } from "@/modules/budget/domain/budget";

export const budgetItemInputSchema = z.object({
  category: z.enum(CATEGORIES),
  label: z.string().trim().min(1).max(80),
  /** Major units as entered; stored as minor units. */
  amount: z.number().min(0).max(100_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  rate: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .refine((value) => Number(value) > 0)
    .nullable(),
  userId: z.string().min(1).nullable(),
  link: z.url().max(500).nullable(),
  /** Leg position of the stop it belongs to; null or absent: whole trip. */
  stop: z.number().int().min(0).max(100).nullable().default(null),
});

export type BudgetItemInput = z.infer<typeof budgetItemInputSchema>;

export const capInputSchema = z.object({ cap: z.number().min(0).max(1_000_000_000).nullable() });

export type BudgetItemDto = Omit<BudgetItem, "tripId"> & { amountInTripCurrency: number };

export type BudgetDto = {
  currency: string;
  items: BudgetItemDto[];
  summary: BudgetSummary;
  /** Priced transfers, for the Transfers group. */
  transfers: TransferCost[];
  /** The viewer's own total first: "how much does this cost me?". */
  mine: number;
};
