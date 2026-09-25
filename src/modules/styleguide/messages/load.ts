import type { Locale } from "@/shared/i18n/routing";
import type brandEn from "./en/brand.json";
import type buttonEn from "./en/button.json";
import type cardEn from "./en/card.json";
import type colorEn from "./en/color.json";
import type dialogEn from "./en/dialog.json";
import type iconsEn from "./en/icons.json";
import type inputEn from "./en/input.json";
import type layoutEn from "./en/layout.json";
import type motionEn from "./en/motion.json";
import type pageEn from "./en/page.json";
import type primitivesEn from "./en/primitives.json";
import type radiusShadowEn from "./en/radiusShadow.json";
import type spacingEn from "./en/spacing.json";
import type tooltipEn from "./en/tooltip.json";
import type typeEn from "./en/type.json";

/** One namespace per file listed in plan "Messages"; shape from the en JSON files. */
export type StyleguideMessages = {
  page: typeof pageEn;
  brand: typeof brandEn;
  color: typeof colorEn;
  type: typeof typeEn;
  spacing: typeof spacingEn;
  radiusShadow: typeof radiusShadowEn;
  motion: typeof motionEn;
  icons: typeof iconsEn;
  primitives: typeof primitivesEn;
  layout: typeof layoutEn;
  button: typeof buttonEn;
  input: typeof inputEn;
  card: typeof cardEn;
  tooltip: typeof tooltipEn;
  dialog: typeof dialogEn;
};

const NAMESPACES = [
  "page",
  "brand",
  "color",
  "type",
  "spacing",
  "radiusShadow",
  "motion",
  "icons",
  "primitives",
  "layout",
  "button",
  "input",
  "card",
  "tooltip",
  "dialog",
] as const;

/** Loads every `styleguide.<namespace>` message file for `locale`. */
export async function loadStyleguideMessages(locale: Locale): Promise<StyleguideMessages> {
  const modules = await Promise.all(
    NAMESPACES.map((namespace) => import(`./${locale}/${namespace}.json`)),
  );

  return Object.fromEntries(
    NAMESPACES.map((namespace, index) => [namespace, modules[index]?.default]),
  ) as StyleguideMessages;
}
