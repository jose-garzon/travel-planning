import { flushSync } from "react-dom";

/**
 * Runs a state update inside a same-document View Transition, so cards
 * morph between states instead of jumping. Falls back to a plain update
 * when the browser lacks the API or the user prefers reduced motion.
 */
export function withViewTransition(update: () => void): void {
  const canTransition =
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!canTransition) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}
