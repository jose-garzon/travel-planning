import { StateSample } from "@/modules/styleguide/ui/components/state-sample";
import { Button } from "@/shared/ui/components/button";
import { Tooltip } from "@/shared/ui/components/tooltip";
import { useTranslatable } from "@/shared/ui/translatable";

/** Tooltip demo: a secondary Button with a tooltip (plan "Demo content"). */
export function TooltipDemo() {
  const translate = useTranslatable();

  return (
    <section aria-labelledby="tooltip-demo-heading">
      <h3 id="tooltip-demo-heading">{translate({ translateId: "styleguide.tooltip.title" })}</h3>
      <StateSample label={{ translateId: "styleguide.tooltip.states.default" }}>
        <Tooltip content={{ translateId: "styleguide.tooltip.content" }}>
          <Button variant="secondary" translateId="styleguide.tooltip.trigger" />
        </Tooltip>
      </StateSample>
    </section>
  );
}
