// Client component: the loading click guard needs a real handler, and a
// server caller couldn't pass `icon` (a component reference isn't
// serializable) anyway.
"use client";

import {
  type ButtonSize,
  type ButtonVariant,
  buttonClasses,
} from "@/shared/ui/components/button-classes";

export { type ButtonVariant, buttonClasses };

import type { LucideIcon } from "lucide-react";
import { LoaderCircle } from "lucide-react";
import type { ComponentPropsWithRef, MouseEvent } from "react";
import { Icon } from "@/shared/ui/components/icon";
import type { TextContent } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

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
    size?: ButtonSize;
    isLoading?: boolean;
    fullWidth?: boolean;
  };

/**
 * Button primitive: primary/secondary variants, decorative leading icon,
 * loading and disabled states, `labelHidden` for icon-only buttons.
 * Translates its own text (D-7).
 */
export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  icon: IconComponent,
  labelHidden,
  isLoading = false,
  fullWidth,
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
      className={buttonClasses({ variant, size, labelHidden, fullWidth })}
    >
      {isLoading ? (
        <LoaderCircle
          data-ui="icon"
          aria-hidden="true"
          className="size-icon-md motion-safe:animate-spin motion-reduce:animate-fade-in"
        />
      ) : (
        IconComponent && <Icon icon={IconComponent} size={size === "sm" ? "sm" : "md"} />
      )}
      <span className={labelHidden ? "sr-only" : undefined}>{label}</span>
    </button>
  );
}
