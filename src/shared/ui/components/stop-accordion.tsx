import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "@/shared/ui/components/icon";
import { cx } from "@/shared/ui/cx";

type StopAccordionProps = {
  /** Station name, set like the route board. */
  title: string;
  /** Formatted days at this stop, shown as the amber time chip. */
  dates: string | null;
  /** One quiet line: what is planned and what it costs. */
  meta: string;
  defaultOpen?: boolean;
  /** "whole" draws a hollow station on a dashed, quieter card: the trip, not a city. */
  tone?: "stop" | "whole";
  children: ReactNode;
};

/**
 * One stop of the trip as a disclosure: station dot, city, its days and
 * a summary line; open, it shows what happens there. Native `<details>`,
 * so it works without script and keeps keyboard and find-in-page.
 */
export function StopAccordion({
  title,
  dates,
  meta,
  defaultOpen = false,
  tone = "stop",
  children,
}: StopAccordionProps) {
  return (
    <details
      open={defaultOpen}
      className={cx(
        "group rounded-md border-2 border-border transition-colors open:border-text",
        tone === "stop" ? "bg-surface-1" : "border-dashed bg-transparent",
      )}
    >
      <summary className="flex min-h-touch cursor-pointer list-none items-center gap-4 rounded-md p-4 ui-focus:outline-2 ui-focus:outline-focus ui-focus:outline-solid sm:p-5 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className={cx(
            "size-5 shrink-0 rounded-full border-4 border-accent",
            tone === "stop" ? "bg-accent" : "bg-surface-1",
          )}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className={cx(
                "font-bold font-display uppercase leading-none tracking-wide",
                tone === "stop" ? "text-2xl" : "text-xl",
              )}
            >
              {title}
            </span>
            {/* The whole trip's days are the ticket's: no chip to repeat them. */}
            {dates === null || tone === "whole" ? null : (
              <span className="rounded-full bg-sun px-3 py-0.5 font-semibold text-on-sun text-sm tabular-nums">
                {dates}
              </span>
            )}
          </span>
          <span className="text-sm text-text-muted">{meta}</span>
        </span>
        <span className="shrink-0 transition-transform duration-fast group-open:rotate-180">
          <Icon icon={ChevronDown} />
        </span>
      </summary>
      <div className="flex flex-col gap-8 border-border border-t-2 border-dashed p-4 sm:p-5">
        {children}
      </div>
    </details>
  );
}
