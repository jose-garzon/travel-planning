import { useTranslatable } from "@/shared/ui/translatable";

export function TooltipDemo() {
  const translate = useTranslatable();

  return (
    <section aria-labelledby="tooltip-demo-heading">
      <h3 id="tooltip-demo-heading">{translate({ translateId: "styleguide.tooltip.title" })}</h3>
    </section>
  );
}
