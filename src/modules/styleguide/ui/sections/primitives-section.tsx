import { StyleguideSection } from "@/modules/styleguide/ui/components/styleguide-section";
import { ButtonDemo } from "@/modules/styleguide/ui/demos/button-demo";
import { CardDemo } from "@/modules/styleguide/ui/demos/card-demo";
import { DialogDemo } from "@/modules/styleguide/ui/demos/dialog-demo";
import { InputDemo } from "@/modules/styleguide/ui/demos/input-demo";
import { LayoutDemo } from "@/modules/styleguide/ui/demos/layout-demo";
import { TooltipDemo } from "@/modules/styleguide/ui/demos/tooltip-demo";
import type { Translatable } from "@/shared/ui/translatable";

/**
 * One jump link per Primitives sub-demo heading, in render order.
 * `SectionNav` (T11) nests these, as plain anchors, under its
 * "Primitives" item so every `h3` in this section stays reachable
 * from the nav.
 */
export const PRIMITIVES_SUB_NAV_LINKS: readonly { id: string; label: Translatable }[] = [
  { id: "layout-demo-heading", label: { translateId: "styleguide.layout.title" } },
  { id: "button-demo-heading", label: { translateId: "styleguide.button.title" } },
  { id: "input-demo-heading", label: { translateId: "styleguide.input.title" } },
  { id: "tooltip-demo-heading", label: { translateId: "styleguide.tooltip.title" } },
  { id: "card-demo-heading", label: { translateId: "styleguide.card.title" } },
  { id: "dialog-demo-heading", label: { translateId: "styleguide.dialog.title" } },
];

export function PrimitivesSection() {
  return (
    <StyleguideSection id="primitives" title={{ translateId: "styleguide.primitives.title" }}>
      <LayoutDemo />
      <ButtonDemo />
      <InputDemo />
      <TooltipDemo />
      <CardDemo />
      <DialogDemo />
    </StyleguideSection>
  );
}
