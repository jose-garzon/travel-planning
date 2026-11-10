import type { ReactNode } from "react";
import { cx } from "@/shared/ui/cx";

type SectionHeaderProps = {
  /** Id of the `<h2>`, for the section's `aria-labelledby`. */
  id: string;
  title: ReactNode;
  /** The section's main action, aligned to the heading's baseline. */
  action?: ReactNode;
  /** "line" fills the station marker with the line colour (the assistant). */
  tone?: "ink" | "line";
  /** Heavy rule above the heading; off inside an already-framed panel. */
  rule?: boolean;
};

/**
 * One header for every section of a page: a station marker, a display
 * heading and an optional action. The heavy rule above it is the stop
 * between sections, so they read as separate stations of the trip.
 */
export function SectionHeader({
  id,
  title,
  action,
  tone = "ink",
  rule = true,
}: SectionHeaderProps) {
  return (
    <div
      className={cx(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-3",
        rule ? "border-text border-t-4 pt-5" : undefined,
      )}
    >
      <h2 id={id} className="flex min-w-0 items-center gap-3 text-3xl leading-none sm:text-4xl">
        <span
          aria-hidden="true"
          className={cx(
            "size-5 shrink-0 rounded-full border-4",
            tone === "line" ? "border-accent bg-accent" : "border-text bg-bg",
          )}
        />
        <span className="min-w-0 text-balance">{title}</span>
      </h2>
      {action}
    </div>
  );
}
