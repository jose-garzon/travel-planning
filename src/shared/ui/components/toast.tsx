"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/shared/ui/components/button";
import { Icon } from "@/shared/ui/components/icon";
import { cx } from "@/shared/ui/cx";

type ToastTone = "success" | "error";

type ToastProps = {
  tone: ToastTone;
  children: ReactNode;
  /** Milliseconds before it dismisses itself. */
  durationMs?: number;
  onDismiss?: () => void;
};

const DEFAULT_DURATION_MS = 6000;

// Tone shows in the rule, the icon and the words, never colour alone.
const TONE_CLASSES: Record<ToastTone, string> = {
  success: "border-l-success",
  error: "border-l-error",
};

/**
 * A short message that confirms or reports an action. Success is a polite
 * status; an error is an alert. Dismisses itself, or with its button.
 */
export function Toast({ tone, children, durationMs = DEFAULT_DURATION_MS, onDismiss }: ToastProps) {
  const [isOpen, setIsOpen] = useState(true);

  function dismiss() {
    setIsOpen(false);
    onDismiss?.();
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: the timer starts once per toast
  useEffect(() => {
    const timer = setTimeout(dismiss, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={cx(
        "fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-dialog items-center gap-3 rounded-md",
        "border-2 border-l-8 border-text bg-surface-1 py-2 pr-2 pl-4 text-text",
        "motion-safe:animate-fade-in",
        TONE_CLASSES[tone],
      )}
    >
      <span className={tone === "error" ? "text-error" : "text-success"}>
        <Icon icon={tone === "error" ? CircleAlert : CircleCheck} />
      </span>
      <p className="flex-1 font-semibold">{children}</p>
      <Button
        type="button"
        variant="outline"
        icon={X}
        labelHidden
        translateId="common.toast.dismiss"
        onClick={dismiss}
      />
    </div>
  );
}
