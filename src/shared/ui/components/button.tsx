// Client component: the loading click guard needs a real handler, and a
// server caller couldn't pass `icon` (a component reference isn't
// serializable) anyway.
"use client";

import type { LucideIcon } from "lucide-react";
import { LoaderCircle } from "lucide-react";
import type { ComponentPropsWithRef, MouseEvent } from "react";
import { Icon } from "@/shared/ui/components/icon";
import { cx } from "@/shared/ui/cx";
import type { TextContent } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

type ButtonVariant = "primary" | "secondary" | "outline";

type NativeButton = Omit<ComponentPropsWithRef<"button">, "className" | "style" | "children">;

// `labelHidden` needs an `icon` (plan Button API): the icon becomes the
// only visible content, the label stays as sr-only accessible name.
type ButtonIcon =
  | { icon?: LucideIcon; labelHidden?: false }
  | { icon: LucideIcon; labelHidden: true };

type ButtonProps = NativeButton &
  TextContent &
  ButtonIcon & {
    variant?: ButtonVariant;
    isLoading?: boolean;
  };

type ButtonClassesOptions = {
  variant?: ButtonVariant;
  labelHidden?: boolean;
};

// Hover/active feedback is gated on `not-disabled:not-aria-disabled:` so a
// disabled or loading (`aria-disabled`) button neither changes on real
// `:hover`/`:active` nor animates in the forced `data-preview` demo state
// (plan "Disabled: … no hover change").
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent ui-hover:not-disabled:not-aria-disabled:bg-accent-hover",
  secondary:
    "bg-surface-1 text-text border border-border-strong " +
    "ui-hover:not-disabled:not-aria-disabled:bg-surface-2",
  outline:
    "bg-transparent text-text border border-border-strong " +
    "ui-hover:not-disabled:not-aria-disabled:bg-surface-2",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-full min-h-touch min-w-touch " +
  "px-4 py-3 text-md font-semibold transition duration-fast ease-out cursor-pointer " +
  "motion-safe:ui-active:not-disabled:not-aria-disabled:scale-97 outline-focus " +
  "ui-focus:outline-2 ui-focus:outline-solid ui-focus:outline-focus " +
  "ui-focus:outline-offset-2 aria-disabled:opacity-50 disabled:opacity-50 " +
  "disabled:cursor-not-allowed";

// `labelHidden` drops all padding so the button stays square (icon plus
// `min-w-touch`/`min-h-touch`, no visible label to pad for).
const LABEL_HIDDEN_CLASSES = "px-0 py-0";

/**
 * Class map for the button look, shared with `ThemeToggle` (D-16), which
 * renders its own `<button>` but reuses these classes.
 */
export function buttonClasses({
  variant = "primary",
  labelHidden,
}: ButtonClassesOptions = {}): string {
  return cx(BASE_CLASSES, VARIANT_CLASSES[variant], labelHidden ? LABEL_HIDDEN_CLASSES : undefined);
}

/**
 * Button primitive: primary/secondary variants, decorative leading icon,
 * loading and disabled states, `labelHidden` for icon-only buttons.
 * Translates its own text (D-7).
 */
export function Button({
  variant = "primary",
  type = "button",
  icon: IconComponent,
  labelHidden,
  isLoading = false,
  translateId,
  values,
  children,
  onClick,
  ...nativeProps
}: ButtonProps) {
  const translate = useTranslatable();
  const label = translateId === undefined ? children : translate({ translateId, values });

  // Loading ignores clicks, but a `submit`/`reset` button still triggers its
  // native form action unless the event itself is prevented (dropping
  // `onClick` alone only stops the app's own handler).
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (isLoading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      {...nativeProps}
      data-ui="button"
      type={type}
      aria-busy={isLoading || undefined}
      aria-disabled={isLoading || undefined}
      onClick={handleClick}
      className={buttonClasses({ variant, labelHidden })}
    >
      {isLoading ? (
        <LoaderCircle
          data-ui="icon"
          aria-hidden="true"
          className="size-icon-md motion-safe:animate-spin motion-reduce:animate-fade-in"
        />
      ) : (
        IconComponent && <Icon icon={IconComponent} size="md" />
      )}
      <span className={labelHidden ? "sr-only" : undefined}>{label}</span>
    </button>
  );
}
