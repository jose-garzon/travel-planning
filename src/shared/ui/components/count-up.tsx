"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/shared/ui/money";

type CountUpMoneyProps = {
  /** Minor units (cents). */
  value: number;
  currency: string;
  locale: string;
  className?: string;
};

const DURATION_MS = 900;

/**
 * A money amount that rolls to its value: from zero on first paint,
 * from the old value when it changes (a cost added, a cap saved).
 * Server-renders the final value; reduced motion shows it at once.
 */
export function CountUpMoney({ value, currency, locale, className }: CountUpMoneyProps) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);

  useEffect(() => {
    const start = from.current;
    from.current = value;
    if (start === value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let frame = 0;
    const began = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - began) / DURATION_MS);
      const eased = 1 - 2 ** (-10 * t);
      setShown(Math.round(start + (value - start) * (t === 1 ? 1 : eased)));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className={className}>
      {/* Screen readers get the settled value, not every frame. */}
      <span aria-hidden="true" className="tabular-nums">
        {formatMoney(shown, currency, locale)}
      </span>
      <span className="sr-only">{formatMoney(value, currency, locale)}</span>
    </span>
  );
}
