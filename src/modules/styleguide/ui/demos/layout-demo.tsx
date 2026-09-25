import { useTranslatable } from "@/shared/ui/translatable";

export function LayoutDemo() {
  const translate = useTranslatable();

  return (
    <section aria-labelledby="layout-demo-heading">
      <h3 id="layout-demo-heading">{translate({ translateId: "styleguide.layout.title" })}</h3>
    </section>
  );
}
