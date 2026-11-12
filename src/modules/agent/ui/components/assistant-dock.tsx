"use client";

import { Sparkles, X } from "lucide-react";
import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Icon } from "@/shared/ui/components/icon";
import { cx } from "@/shared/ui/cx";
import { useIsDesktop } from "@/shared/ui/hooks/use-is-desktop";
import { onAskAssistantForGap } from "@/shared/ui/transfer-events";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Modal drawer: Tab and Shift+Tab cycle inside it. */
function trapTab(event: KeyboardEvent, container: HTMLElement): void {
  const focusable = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (first === undefined || last === undefined) {
    return;
  }
  const active = document.activeElement;
  if (!container.contains(active)) {
    event.preventDefault();
    first.focus();
  } else if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Makes everything outside the open drawer inert (siblings of the drawer
 * and of each ancestor), so screen readers cannot wander behind it.
 * Returns the undo.
 */
function inertOutside(drawer: HTMLElement): () => void {
  const changed: HTMLElement[] = [];
  let node: HTMLElement | null = drawer;
  while (node !== null && node !== document.body) {
    for (const sibling of node.parentElement?.children ?? []) {
      if (sibling !== node && sibling instanceof HTMLElement && !sibling.inert) {
        // The scrim stays live: tapping it closes the drawer.
        if (sibling.getAttribute("aria-hidden") !== "true") {
          sibling.inert = true;
          changed.push(sibling);
        }
      }
    }
    node = node.parentElement;
  }
  return () => {
    for (const element of changed) {
      element.inert = false;
    }
  };
}

/** Focuses a page section (as a skip target) and pulses its heading. */
function arriveAt(id: string): void {
  const section = document.getElementById(id);
  if (section === null) {
    launcherFallback();
    return;
  }
  if (!section.hasAttribute("tabindex")) {
    section.setAttribute("tabindex", "-1");
  }
  section.focus({ preventScroll: true });
  section.scrollIntoView({ block: "start" });
  const heading = document.getElementById(`${id}-heading`);
  if (heading !== null && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heading.classList.remove("agent-arrive");
    void heading.getBoundingClientRect();
    heading.classList.add("agent-arrive");
    heading.addEventListener("animationend", () => heading.classList.remove("agent-arrive"), {
      once: true,
    });
  }
}

function launcherFallback(): void {
  document.getElementById("assistant-launcher")?.focus();
}

/**
 * True while the visitor scrolls down (reading), false on scroll up, near
 * the top or at the foot of the page. Small jitters are ignored.
 */
function useTuckOnScroll(enabled: boolean): boolean {
  const [isTucked, setIsTucked] = useState(false);
  useEffect(() => {
    if (!enabled) {
      return;
    }
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const atFoot = window.innerHeight + y >= document.documentElement.scrollHeight - 8;
      if (y < 80 || atFoot) {
        setIsTucked(false);
      } else if (Math.abs(y - last) > 12) {
        setIsTucked(y > last);
      } else {
        return;
      }
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled]);
  return enabled && isTucked;
}

type AssistantDockProps = {
  /** Launcher label ("Ask the assistant"). */
  label: string;
  closeLabel: string;
  /** The chat panel. Mounted once, so the conversation survives closing. */
  children: ReactNode;
};

/**
 * Where the assistant lives. Desktop: in the page's floating rail.
 * Phones: a drawer that slides up from the bottom, opened by a round
 * station button (ink, line-coloured ring) in the bottom-right corner;
 * icon only, so it never covers the stops under it. The drawer stays mounted
 * while closed (inert), so the chat is still there when it reopens.
 */
export function AssistantDock({ label, closeLabel, children }: AssistantDockProps) {
  const isDesktop = useIsDesktop();
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const isDrawerOpen = isOpen && !isDesktop;
  const isTucked = useTuckOnScroll(!isDesktop);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }
    const drawer = drawerRef.current;
    // A chat in progress continues in the composer. An empty one starts on
    // the drawer itself, so a phone keyboard does not cover the starters.
    const composer = drawer?.querySelector<HTMLTextAreaElement>("#agent-message");
    const hasChat = drawer?.querySelector("[data-turn]") != null;
    // After the drawer stops being inert (same frame as this effect).
    const frame = requestAnimationFrame(() => {
      if (hasChat && composer && !composer.disabled) {
        composer.focus();
      } else {
        drawer?.focus();
      }
    });
    const restoreInert = drawer ? inertOutside(drawer) : () => undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        launcherRef.current?.focus();
        return;
      }
      if (event.key === "Tab" && drawer !== null) {
        trapTab(event, drawer);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      restoreInert();
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [isDrawerOpen]);

  // "Find options" on a gap: on a phone the chat is behind the launcher.
  useEffect(() => onAskAssistantForGap(() => setIsOpen(true)), []);

  if (isDesktop) {
    return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
  }

  function close() {
    setIsOpen(false);
    launcherRef.current?.focus();
  }

  // "See it in the itinerary" points at the page under the drawer: get out
  // of its way, then hand focus to that section and let its heading pulse
  // (the fly-to moment the drawer hid).
  function closeOnPageLink(event: MouseEvent<HTMLDivElement>) {
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (link === null) {
      return;
    }
    const id = link.getAttribute("href")?.slice(1) ?? "";
    setIsOpen(false);
    requestAnimationFrame(() => arriveAt(id));
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        aria-expanded={isOpen}
        id="assistant-launcher"
        aria-controls="assistant-drawer"
        aria-label={label}
        title={label}
        onClick={() => setIsOpen(true)}
        className={cx(
          "fixed right-4 bottom-safe-fab z-30 grid size-16 place-items-center rounded-full",
          "border-4 border-accent bg-text text-bg shadow-md",
          "transition duration-normal ease-out motion-safe:active:scale-97",
          "ui-hover:bg-accent-hover ui-hover:text-on-accent",
          "ui-focus:outline-2 ui-focus:outline-focus ui-focus:outline-offset-2 ui-focus:outline-solid",
          // Out of the way while reading down the page; back on scroll up
          // or at the foot. Reduced motion fades instead of sliding.
          isOpen || isTucked
            ? "pointer-events-none opacity-0 motion-safe:translate-y-24"
            : undefined,
        )}
      >
        <Icon icon={Sparkles} size="lg" />
      </button>

      {/* Scrim: taps outside the drawer close it. */}
      <div
        aria-hidden="true"
        onClick={close}
        className={cx(
          "fixed inset-0 z-40 bg-overlay transition-opacity duration-normal",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div
        ref={drawerRef}
        id="assistant-drawer"
        role="dialog"
        aria-modal={isOpen}
        aria-label={label}
        inert={!isOpen}
        tabIndex={-1}
        onClickCapture={closeOnPageLink}
        className={cx(
          "fixed inset-x-0 bottom-0 z-50 flex h-drawer flex-col rounded-t-lg bg-surface-1 shadow-md outline-none",
          "duration-normal ease-out",
          // Opening: visible at once (so it can take focus), then slide up.
          // Closing: slide down, then hide.
          isOpen
            ? "visible translate-y-0 transition-transform"
            : "invisible translate-y-full transition-all",
        )}
      >
        <button
          type="button"
          onClick={close}
          aria-label={closeLabel}
          className="absolute top-4 right-4 z-10 grid size-touch place-items-center rounded-full bg-surface-2 ui-hover:bg-border ui-focus:outline-2 ui-focus:outline-focus ui-focus:outline-solid"
        >
          <Icon icon={X} />
        </button>
        <div className="flex min-h-0 flex-1 flex-col px-2 pt-2 pb-safe">{children}</div>
      </div>
    </>
  );
}
