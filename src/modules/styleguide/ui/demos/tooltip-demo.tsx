import { StateSample } from "@/modules/styleguide/ui/components/state-sample";
import { Button } from "@/shared/ui/components/button";
import { Stack } from "@/shared/ui/components/stack";
import { Tooltip } from "@/shared/ui/components/tooltip";
import { useTranslatable } from "@/shared/ui/translatable";

/**
 * Tooltip demo: a secondary Button with a tooltip (plan "Demo
 * content"). Kept in the horizontal, wrapping `Stack` even though it
 * renders a single figure today, so a later figure needs no layout
 * change (plan "State-figure layout").
 */
export function TooltipDemo() {
  const translate = useTranslatable();

  return (
    <section aria-labelledby="tooltip-demo-heading" className="mt-16 border-t border-border pt-16">
      <h3 id="tooltip-demo-heading" className="text-accent">
        {translate({ translateId: "styleguide.tooltip.title" })}
      </h3>
      <Stack direction="horizontal" wrap gap="4">
        <StateSample label={{ translateId: "styleguide.tooltip.states.default" }}>
          <Tooltip content={{ translateId: "styleguide.tooltip.content" }}>
            <Button variant="secondary" translateId="styleguide.tooltip.trigger" />
          </Tooltip>
        </StateSample>
      </Stack>
    </section>
  );
}
