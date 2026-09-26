// Client component: Radix Tooltip manages hover/focus state and portals.
"use client";

import { Tooltip as RadixTooltip } from "radix-ui";
import type { ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

/**
 * Documented exception to "zero raw durations" (D-15): Radix needs a
 * number at render time, so this cannot come from a CSS token read via
 * `getComputedStyle` without adding client work for no user benefit.
 */
export const TOOLTIP_DELAY_MS = 300;

const CONTENT_CLASSES =
  "bg-text text-bg text-sm rounded-sm px-2 py-1 shadow-md animate-fade-in max-w-prose";

type TooltipProps = {
  /** Text only, no elements. */
  content: Translatable;
  /** The trigger; merged onto it via Radix `asChild`. */
  children: ReactElement;
  /** Controlled open state (Card uses it). Uncontrolled otherwise. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Tooltip primitive on Radix Tooltip: hoverable content stays open while
 * the pointer moves onto it, Escape closes it, and the trigger keeps its
 * own props and accessible name. Translates its own text (D-7).
 *
 * `globals.css` sets `scroll-behavior: smooth` (T01). Focusing an
 * off-screen trigger scrolls it into view, and Radix's Tooltip closes on
 * that ancestor scroll a few milliseconds after it opens. This component
 * always drives Radix's `open` prop itself (never leaves it `undefined`)
 * so it can veto that particular close while the trigger still has
 * focus — except when the close came from Escape, which must still
 * dismiss the tooltip.
 */
export function Tooltip({ content, children, open: openProp, onOpenChange }: TooltipProps) {
  const translate = useTranslatable();
  const isControlled = openProp !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? openProp : uncontrolledOpen;

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const escapePressedRef = useRef(false);

  // Capture-phase so this runs before Radix's own Escape-keydown handler
  // (also capture-phase, but added later, once the content mounts): by
  // the time Radix asks to close, the flag below already reflects
  // whether this specific close was triggered by Escape.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      escapePressedRef.current = true;
      // Safety net: an Escape press that never leads to a close (the
      // tooltip was already closed) must not leave the flag set for a
      // later, unrelated close.
      setTimeout(() => {
        escapePressedRef.current = false;
      }, 0);
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      const triggerHasFocus =
        triggerRef.current !== null && document.activeElement === triggerRef.current;

      if (!next && !escapePressedRef.current && triggerHasFocus) {
        // Ignore an ancestor-scroll close while the trigger keeps focus;
        // Escape (flagged above) is the only way to close it from here.
        return;
      }

      escapePressedRef.current = false;
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <RadixTooltip.Provider delayDuration={TOOLTIP_DELAY_MS} disableHoverableContent={false}>
      <RadixTooltip.Root open={open} onOpenChange={handleOpenChange}>
        <RadixTooltip.Trigger ref={triggerRef} asChild>
          {children}
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content data-ui="tooltip" className={CONTENT_CLASSES}>
            {translate(content)}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
