/**
 * The approve moment: an approved suggestion card folds into a ringed
 * station and rides an arc to the section it joined (itinerary or budget),
 * which answers with a pulse. Pure Web Animations on a ghost element, so the
 * real card keeps its own layout and state.
 *
 * Skipped when motion is reduced, when the target is off screen, or when it
 * sits under something (the phone drawer covers the page): the in-place
 * "approved" state still says what happened.
 */

const FOLD_MS = 260;
const FLY_MS = 620;
const STATION = 22;

const EDGE = 48;

/** Where the ring lands: on the heading, or at the screen edge toward it. */
function landing(box: DOMRect): { x: number; y: number; isOffscreen: boolean } {
  const y = box.top + box.height / 2 - STATION / 2;
  const max = window.innerHeight - EDGE;
  return {
    x: box.left - STATION - 6,
    y: Math.min(Math.max(y, EDGE), max),
    isOffscreen: y < EDGE || y > max,
  };
}

/** False when something (the phone drawer) sits over the target's column. */
function isUncovered(x: number, y: number): boolean {
  const hit = document.elementFromPoint(x + STATION + 12, y + STATION / 2);
  return hit === null || !hit.closest("[role=dialog]");
}

export function flyToStation(card: HTMLElement, targetId: string): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  const target = document.getElementById(targetId);
  if (target === null || typeof card.animate !== "function") {
    return;
  }
  const to = target.getBoundingClientRect();
  const land = landing(to);
  if (to.width === 0 || !isUncovered(land.x, land.y)) {
    return;
  }
  const from = card.getBoundingClientRect();
  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  ghost.className = "agent-ghost";
  Object.assign(ghost.style, {
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
  });
  document.body.append(ghost);

  // Fold: card rectangle shrinks to a ring at its own centre.
  const cx = from.left + from.width / 2 - STATION / 2;
  const cy = from.top + from.height / 2 - STATION / 2;
  const fold = ghost.animate(
    [
      { borderRadius: "var(--radius-md)", opacity: 0.9 },
      {
        left: `${cx}px`,
        top: `${cy}px`,
        width: `${STATION}px`,
        height: `${STATION}px`,
        borderRadius: "var(--radius-full)",
        opacity: 1,
      },
    ],
    { duration: FOLD_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
  );

  // Fly: an arc that lifts first, then drops onto the heading's start.
  const dx = land.x - cx;
  const dy = land.y - cy;
  const lift = -Math.min(160, Math.abs(dx) * 0.35 + 60);
  const steps = 12;
  const frames: Keyframe[] = [];
  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    const arc = 4 * p * (1 - p) * lift;
    // Off screen: the ring keeps going down the line and fades out.
    const fade = land.isOffscreen ? Math.max(0, (p - 0.7) / 0.3) : 0;
    frames.push({
      transform: `translate(${dx * p}px, ${dy * p + arc + Math.sign(dy) * fade * EDGE}px) scale(${1 - 0.15 * Math.sin(Math.PI * p)})`,
      opacity: 1 - fade,
    });
  }

  fold.finished
    .then(() => {
      Object.assign(ghost.style, {
        left: `${cx}px`,
        top: `${cy}px`,
        width: `${STATION}px`,
        height: `${STATION}px`,
        borderRadius: "var(--radius-full)",
      });
      fold.cancel();
      return ghost.animate(frames, {
        duration: FLY_MS,
        easing: "cubic-bezier(0.45, 0, 0.2, 1)",
        fill: "forwards",
      }).finished;
    })
    .then(() => {
      ghost.remove();
      target.classList.remove("agent-arrive");
      // Restart the pulse even when two approvals land back to back.
      void target.getBoundingClientRect();
      target.classList.add("agent-arrive");
      target.addEventListener("animationend", () => target.classList.remove("agent-arrive"), {
        once: true,
      });
    })
    .catch(() => ghost.remove());
}
