import type { Locale } from "@/shared/i18n/routing";
import type budgetEn from "./en/budget.json";

export type BudgetMessages = { budget: typeof budgetEn };

export async function loadBudgetMessages(locale: Locale): Promise<BudgetMessages> {
  return { budget: (await import(`./${locale}/budget.json`)).default };
}
