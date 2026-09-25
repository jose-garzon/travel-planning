import type { MessageKey } from "@/shared/ui/translatable";

/** Section ids and order (plan "Styleguide DOM contract"). */
export type StyleguideSectionId =
  | "brand"
  | "color"
  | "type"
  | "spacing"
  | "radius-shadow"
  | "motion"
  | "icons"
  | "primitives";

type StyleguideSectionDef = {
  id: StyleguideSectionId;
  /** `styleguide/messages/<locale>/<messageKey>.json` namespace. */
  messageKey:
    | "brand"
    | "color"
    | "type"
    | "spacing"
    | "radiusShadow"
    | "motion"
    | "icons"
    | "primitives";
  titleKey: MessageKey;
};

/** Sections shown by `StyleguideScreen`, in the order the plan specifies. */
export const STYLEGUIDE_SECTIONS: readonly StyleguideSectionDef[] = [
  { id: "brand", messageKey: "brand", titleKey: "styleguide.brand.title" },
  { id: "color", messageKey: "color", titleKey: "styleguide.color.title" },
  { id: "type", messageKey: "type", titleKey: "styleguide.type.title" },
  { id: "spacing", messageKey: "spacing", titleKey: "styleguide.spacing.title" },
  {
    id: "radius-shadow",
    messageKey: "radiusShadow",
    titleKey: "styleguide.radiusShadow.title",
  },
  { id: "motion", messageKey: "motion", titleKey: "styleguide.motion.title" },
  { id: "icons", messageKey: "icons", titleKey: "styleguide.icons.title" },
  { id: "primitives", messageKey: "primitives", titleKey: "styleguide.primitives.title" },
];
