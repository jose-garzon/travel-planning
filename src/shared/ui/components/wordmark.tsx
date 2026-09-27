/** The "parche" brand mark: dashed "stitched" border, display font, accent color. */
export function Wordmark() {
  return (
    <span
      data-ui="wordmark"
      className="inline-flex items-center rounded-full border border-dashed border-border-strong px-3 py-1 font-display text-accent"
    >
      parche
    </span>
  );
}
