import { useTranslatable } from "@/shared/ui/translatable";

export function ButtonDemo() {
  const translate = useTranslatable();

  return (
    <section aria-labelledby="button-demo-heading">
      <h3 id="button-demo-heading">{translate({ translateId: "styleguide.button.title" })}</h3>
    </section>
  );
}
