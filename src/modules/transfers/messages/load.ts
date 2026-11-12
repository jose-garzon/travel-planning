import type { Locale } from "@/shared/i18n/routing";
import type cardEn from "./en/card.json";
import type formEn from "./en/form.json";
import type gapEn from "./en/gap.json";
import type nextEn from "./en/next.json";

/** One namespace per file (ADR 0008), shape from the en JSON files. */
export type TransfersMessages = {
  gap: typeof gapEn;
  card: typeof cardEn;
  form: typeof formEn;
  next: typeof nextEn;
};

const NAMESPACES = ["gap", "card", "form", "next"] as const;

/** Loads every `transfers.<namespace>` message file for `locale`. */
export async function loadTransfersMessages(locale: Locale): Promise<TransfersMessages> {
  const modules = await Promise.all(
    NAMESPACES.map((namespace) => import(`./${locale}/${namespace}.json`)),
  );

  return Object.fromEntries(
    NAMESPACES.map((namespace, index) => [namespace, modules[index]?.default]),
  ) as TransfersMessages;
}
