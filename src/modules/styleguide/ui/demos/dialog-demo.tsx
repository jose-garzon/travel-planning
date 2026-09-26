import { useTranslatable } from "@/shared/ui/translatable";

export function DialogDemo() {
  const translate = useTranslatable();

  return (
    <section aria-labelledby="dialog-demo-heading" className="mt-16 border-t border-border pt-16">
      <h3 id="dialog-demo-heading">{translate({ translateId: "styleguide.dialog.title" })}</h3>
    </section>
  );
}
