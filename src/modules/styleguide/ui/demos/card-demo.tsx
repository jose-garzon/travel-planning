import { useTranslatable } from "@/shared/ui/translatable";

export function CardDemo() {
  const translate = useTranslatable();

  return (
    <section aria-labelledby="card-demo-heading">
      <h3 id="card-demo-heading">{translate({ translateId: "styleguide.card.title" })}</h3>
    </section>
  );
}
