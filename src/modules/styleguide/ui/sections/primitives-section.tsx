import { StyleguideSection } from "@/modules/styleguide/ui/components/styleguide-section";
import { ButtonDemo } from "@/modules/styleguide/ui/demos/button-demo";
import { CardDemo } from "@/modules/styleguide/ui/demos/card-demo";
import { DialogDemo } from "@/modules/styleguide/ui/demos/dialog-demo";
import { InputDemo } from "@/modules/styleguide/ui/demos/input-demo";
import { LayoutDemo } from "@/modules/styleguide/ui/demos/layout-demo";
import { TooltipDemo } from "@/modules/styleguide/ui/demos/tooltip-demo";

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
