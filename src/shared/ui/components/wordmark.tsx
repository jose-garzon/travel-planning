import { cx } from "@/shared/ui/cx";

type WordmarkSize = "md" | "lg";

type WordmarkProps = {
  /** `md` (default) is the header/inline scale. `lg` is the hero scale. */
  size?: WordmarkSize;
};

const SIZE_CLASSES: Record<WordmarkSize, string> = {
  md: "px-3 py-1",
  lg: "px-6 py-3 text-3xl",
};

/** The "parche" brand mark: dashed "stitched" border, display font, accent color. */
export function Wordmark({ size = "md" }: WordmarkProps = {}) {
  return (
    <span
      data-ui="wordmark"
      className={cx(
        "inline-flex items-center rounded-full border border-dashed border-border-strong font-display text-accent",
        SIZE_CLASSES[size],
      )}
    >
      parche
    </span>
  );
}
