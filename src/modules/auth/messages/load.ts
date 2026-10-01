import type { Locale } from "@/shared/i18n/routing";
import type landingEn from "./en/landing.json";
import type linkExpiredEn from "./en/linkExpired.json";
import type nameCaptureEn from "./en/nameCapture.json";
import type signingInEn from "./en/signingIn.json";

/** One namespace per file listed in plan "Naming" (i18n namespaces), shape from the en JSON files. */
export type AuthMessages = {
  landing: typeof landingEn;
  nameCapture: typeof nameCaptureEn;
  linkExpired: typeof linkExpiredEn;
  signingIn: typeof signingInEn;
};

const NAMESPACES = ["landing", "nameCapture", "linkExpired", "signingIn"] as const;

/** Loads every `auth.<namespace>` message file for `locale` (styleguide load.ts pattern). */
export async function loadAuthMessages(locale: Locale): Promise<AuthMessages> {
  const modules = await Promise.all(
    NAMESPACES.map((namespace) => import(`./${locale}/${namespace}.json`)),
  );

  return Object.fromEntries(
    NAMESPACES.map((namespace, index) => [namespace, modules[index]?.default]),
  ) as AuthMessages;
}
