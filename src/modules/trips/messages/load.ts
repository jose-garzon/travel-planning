import type { Locale } from "@/shared/i18n/routing";
import type cardsEn from "./en/cards.json";
import type cityEn from "./en/city.json";
import type editEn from "./en/edit.json";
import type errorsEn from "./en/errors.json";
import type formEn from "./en/form.json";
import type homeEn from "./en/home.json";

/** One namespace per file (ADR 0008), shape from the en JSON files. */
export type TripsMessages = {
  home: typeof homeEn;
  form: typeof formEn;
  city: typeof cityEn;
  cards: typeof cardsEn;
  edit: typeof editEn;
  errors: typeof errorsEn;
};

const NAMESPACES = ["home", "form", "city", "cards", "edit", "errors"] as const;

/** Loads every `trips.<namespace>` message file for `locale` (auth load.ts pattern). */
export async function loadTripsMessages(locale: Locale): Promise<TripsMessages> {
  const modules = await Promise.all(
    NAMESPACES.map((namespace) => import(`./${locale}/${namespace}.json`)),
  );

  return Object.fromEntries(
    NAMESPACES.map((namespace, index) => [namespace, modules[index]?.default]),
  ) as TripsMessages;
}
