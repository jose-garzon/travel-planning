import { useTranslatable } from "@/shared/ui/translatable";

export function InputDemo() {
  const translate = useTranslatable();

  return (
    <section aria-labelledby="input-demo-heading">
      <h3 id="input-demo-heading">{translate({ translateId: "styleguide.input.title" })}</h3>
    </section>
  );
}
