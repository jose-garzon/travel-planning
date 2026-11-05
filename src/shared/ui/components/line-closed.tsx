import { cx } from "@/shared/ui/cx";

/**
 * A dead end drawn as the line: a station, the magenta track, then a
 * gap where the track breaks off and a hollow station beyond it. Heads
 * the pages that cannot take the visitor where they meant to go.
 * Decorative only; the heading beside it says what went wrong.
 */
export function LineClosed({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx("flex items-center", className)}>
      <span className="size-5 shrink-0 rounded-full border-4 border-accent bg-accent" />
      <span className="h-2 w-20 shrink-0 bg-accent" />
      <span className="w-4 shrink-0" />
      <span className="h-2 w-10 shrink-0 bg-border" />
      <span className="size-5 shrink-0 rounded-full border-4 border-border bg-surface-1" />
    </div>
  );
}
