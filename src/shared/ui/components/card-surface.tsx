import type { ReactNode } from "react";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

export type CardProps = { heading: Translatable; children?: ReactNode };

export const SURFACE_CLASSES = "rounded-md border-2 border-text bg-surface-1 p-5";

const HEADING_CLASSES = "font-display text-2xl font-bold uppercase leading-tight text-text";

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
