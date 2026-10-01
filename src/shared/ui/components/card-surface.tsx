import type { ReactNode } from "react";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

export type CardProps = { heading: Translatable; children?: ReactNode };

export const SURFACE_CLASSES = "bg-surface-1 border border-border rounded-lg p-4 shadow-sm";

const HEADING_CLASSES = "font-semibold text-text";

/** Card primitive: a static, non-interactive surface. The heading wraps. */
export function Card({ heading, children }: CardProps) {
  const translate = useTranslatable();

  return (
    <article data-ui="card" className={SURFACE_CLASSES}>
      <p className={HEADING_CLASSES}>{translate(heading)}</p>
      {children}
    </article>
  );
}
