import type { ReactNode } from "react";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

type StateSampleProps = {
  label: Translatable;
  /** Forces a hover/focus/active preview (plan "Custom variants"). */
  preview?: "hover" | "focus" | "active";
  children: ReactNode;
};

/** A single labelled state figure inside a primitive demo. */
export function StateSample({ label, preview, children }: StateSampleProps) {
  const translate = useTranslatable();

  return (
    <figure data-preview={preview}>
      {children}
      <figcaption>{translate(label)}</figcaption>
    </figure>
  );
}
