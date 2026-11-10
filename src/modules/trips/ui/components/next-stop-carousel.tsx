"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cx } from "@/shared/ui/cx";

/**
 * Phones only: the day boards as a swipeable deck. The edges of the
 * next ones peek out below the one on screen, like a stack. Swipe left for the next day, right to go back, or jump back
 * to the first. From lg only the first ticket shows and nothing
 * scrolls.
 */
export function NextStopCarousel({
  slides,
  label,
  backLabel,
  positionLabels,
}: {
  slides: ReactNode[];
  label: string;
  backLabel: string;
  /** "Day {n} of {total}" per slide, already translated. */
  positionLabels: string[];
}) {
  const trackRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const total = slides.length;
  const ahead = Math.min(total - 1 - index, 2);

  useEffect(() => {
    const track = trackRef.current;
    if (track === null) {
      return;
    }
    const onScroll = () => {
      const width = track.clientWidth || 1;
      setIndex(Math.round(Math.abs(track.scrollLeft) / width));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (target: number) => {
    const track = trackRef.current;
    if (track === null) {
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: target * track.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="relative">
      <section
        ref={trackRef}
        aria-roledescription="carousel"
        aria-label={label}
        className={cx(
          "flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]",
          "lg:overflow-visible",
          // Room under the board for the stacked edges.
          total > 1 && "max-lg:pb-4",
        )}
      >
        {slides.map((slide, i) => (
          // biome-ignore lint/a11y/useSemanticElements: APG carousel slide
          <div
            // Slides are positional: the days are fixed for this render.
            // biome-ignore lint/suspicious/noArrayIndexKey: stable order
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={positionLabels[i]}
            aria-hidden={i === index ? undefined : true}
            inert={i !== index}
            className={cx("w-full shrink-0 snap-center snap-always", i > 0 && "lg:hidden")}
          >
            {slide}
          </div>
        ))}
      </section>

      {/* The stack: edges of the boards still ahead, under the one on screen. */}
      {ahead > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 lg:hidden"
        >
          {ahead > 1 && (
            <div className="absolute inset-x-6 bottom-0 h-4 rounded-b-md border-2 border-t-0 border-accent bg-surface-2" />
          )}
          <div className="absolute inset-x-3 bottom-2 h-4 rounded-b-md border-2 border-t-0 border-accent bg-accent" />
        </div>
      )}

      {total > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3 lg:hidden">
          <div aria-hidden="true" className="flex gap-1.5">
            {slides.map((_, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: stable order
                key={i}
                className={cx(
                  "h-2 rounded-full transition-all duration-fast",
                  i === index ? "w-6 bg-accent" : "w-2 bg-border",
                )}
              />
            ))}
          </div>
          <p aria-live="polite" className="mr-auto text-sm font-semibold tabular-nums">
            {positionLabels[index]}
          </p>
          {index > 0 && (
            <button
              type="button"
              onClick={() => goTo(0)}
              className="text-sm font-semibold text-accent underline underline-offset-4"
            >
              {backLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
