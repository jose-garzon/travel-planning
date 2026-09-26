// Client component: CardButton/CardLink measure the heading with a
// ResizeObserver to gate the truncation Tooltip.
"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/shared/i18n/navigation";
import { Tooltip } from "@/shared/ui/components/tooltip";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

export type CardProps = { heading: Translatable; children?: ReactNode };
export type CardButtonProps = {
  heading: Translatable;
  onClick: () => void;
  children?: ReactNode;
};
export type CardLinkProps = { heading: Translatable; href: string; children?: ReactNode };

const SURFACE_CLASSES = "bg-surface-1 border border-border rounded-lg p-4 shadow-sm";

// Interactive primitive rules (plan "Shared primitive rules"): own touch
// target, transition, hover/focus/active only through the ui-* variants.
const CLICKABLE_CLASSES =
  `${SURFACE_CLASSES} block w-full text-left min-h-touch min-w-touch transition ` +
  "duration-fast ease-out ui-hover:bg-surface-2 ui-focus:outline-2 ui-focus:outline-solid " +
  "ui-focus:outline-focus ui-focus:outline-offset-2 motion-safe:ui-active:scale-97";

const HEADING_CLASSES = "font-semibold text-text";
const TRUNCATE_HEADING_CLASSES = "block truncate font-semibold text-text";

/**
 * Tracks whether `element` overflows on one line (`scrollWidth >
 * clientWidth`), re-measuring on resize (plan "Truncation"). `undefined`
 * `ResizeObserver` (older test environments) simply never truncates.
 */
function useIsTruncated<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (element === null || typeof ResizeObserver === "undefined") {
      return;
    }

    function measure() {
      if (element) {
        setIsTruncated(element.scrollWidth > element.clientWidth);
      }
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, isTruncated };
}

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

/**
 * CardButton primitive: a clickable surface (`<button type="button">`).
 * The heading truncates to one line; when it actually overflows, hovering
 * or focusing the card shows its full text in a Tooltip (plan
 * "components/card.tsx"). `open={isTruncated ? undefined : false}` forces
 * the Tooltip closed (and its `aria-describedby` absent) when the heading
 * fits, and otherwise leaves Tooltip's own hover/focus handling in charge.
 */
export function CardButton({ heading, onClick, children }: CardButtonProps) {
  const translate = useTranslatable();
  const { ref, isTruncated } = useIsTruncated<HTMLParagraphElement>();

  return (
    <Tooltip content={heading} open={isTruncated ? undefined : false}>
      <button type="button" data-ui="card-button" onClick={onClick} className={CLICKABLE_CLASSES}>
        <p ref={ref} data-truncate className={TRUNCATE_HEADING_CLASSES}>
          {translate(heading)}
        </p>
        {children}
      </button>
    </Tooltip>
  );
}

/** CardLink primitive: a clickable surface rendered as a locale-aware link. */
export function CardLink({ heading, href, children }: CardLinkProps) {
  const translate = useTranslatable();
  const { ref, isTruncated } = useIsTruncated<HTMLParagraphElement>();

  return (
    <Tooltip content={heading} open={isTruncated ? undefined : false}>
      <Link href={href} data-ui="card-link" className={CLICKABLE_CLASSES}>
        <p ref={ref} data-truncate className={TRUNCATE_HEADING_CLASSES}>
          {translate(heading)}
        </p>
        {children}
      </Link>
    </Tooltip>
  );
}
