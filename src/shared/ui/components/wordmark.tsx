import { cx } from "@/shared/ui/cx";

type WordmarkSize = "md" | "lg";

type WordmarkProps = {
  /** `md` (default) is the header/inline scale. `lg` is the hero scale. */
  size?: WordmarkSize;
};

const SIZE_CLASSES: Record<WordmarkSize, string> = {
  md: "text-2xl gap-2",
  lg: "text-5xl gap-3",
};

/**
 * The "parche" brand mark: a short stretch of line ending in a station
 * ring, then the name in station-sign capitals.
 */
export function Wordmark({ size = "md" }: WordmarkProps = {}) {
  return (
    <span
      data-ui="wordmark"
      className={cx(
        "inline-flex items-center font-display font-black uppercase leading-none tracking-wide text-text",
        SIZE_CLASSES[size],
      )}
    >
      <span aria-hidden="true" className="flex items-center">
        <span className="h-line w-4 rounded-l-full bg-accent" />
        <span className="size-5 rounded-full border-4 border-text bg-accent" />
      </span>
      parche
    </span>
  );
}
