import { cx } from "@/shared/ui/cx";

// Server-safe: no "use client", so server components can call it.
export type ButtonVariant = "primary" | "secondary" | "outline" | "sun" | "people" | "danger";

export type ButtonSize = "md" | "sm";

type ButtonClassesOptions = {
  variant?: ButtonVariant;
  /** "sm" is the compact in-list size: 40px tall, small label. */
  size?: ButtonSize;
  labelHidden?: boolean;
  /** Fills its container's width (stacked, standalone actions). */
  fullWidth?: boolean;
};

// Hover/active feedback is gated on `not-disabled:not-aria-disabled:` so a
// disabled or loading (`aria-disabled`) button neither changes on real
// `:hover`/`:active` nor animates in the forced `data-preview` demo state
// (plan "Disabled: … no hover change").
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Primary is ink; hover turns it the line colour (DESIGN.md).
  primary:
    "bg-text text-bg " +
    "ui-hover:not-disabled:not-aria-disabled:bg-accent-hover " +
    "ui-hover:not-disabled:not-aria-disabled:text-on-accent",
  // For actions on line- or people-coloured panels.
  // Joining in: the crew colour (DESIGN.md "people").
  people:
    "bg-secondary text-on-secondary border-2 border-secondary " +
    "ui-hover:not-disabled:not-aria-disabled:bg-secondary-hover",
  // Destructive confirmations only (ConfirmDialog).
  danger:
    "bg-error text-on-accent border-2 border-error " +
    "ui-hover:not-disabled:not-aria-disabled:opacity-90",
  sun: "bg-sun text-on-sun ui-hover:not-disabled:not-aria-disabled:bg-surface-1",
  secondary:
    "bg-surface-1 text-text border-2 border-text " +
    "ui-hover:not-disabled:not-aria-disabled:bg-surface-2",
  outline:
    "bg-transparent text-text border-2 border-text " +
    "ui-hover:not-disabled:not-aria-disabled:bg-surface-2",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-full text-center " +
  "font-bold transition duration-fast ease-out cursor-pointer " +
  "motion-safe:ui-active:not-disabled:not-aria-disabled:scale-97 outline-focus " +
  "ui-focus:outline-2 ui-focus:outline-solid ui-focus:outline-focus " +
  "ui-focus:outline-offset-2 aria-disabled:opacity-50 disabled:opacity-50 " +
  "disabled:cursor-not-allowed";

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "min-h-touch min-w-touch px-6 py-3 text-md",
  sm: "min-h-10 min-w-10 px-4 py-2 text-sm",
};

// `labelHidden` drops all padding so the button stays square (icon plus
// `min-w-touch`/`min-h-touch`, no visible label to pad for).
// `!` because utility order in the stylesheet, not class order, decides
// between `px-6` and `px-0`; without it icon buttons render as pills.
const LABEL_HIDDEN_CLASSES = "aspect-square px-0! py-0!";

/**
 * Class map for the button look, shared with `ThemeToggle` (D-16), which
 * renders its own `<button>` but reuses these classes.
 */
export function buttonClasses({
  variant = "primary",
  size = "md",
  labelHidden,
  fullWidth,
}: ButtonClassesOptions = {}): string {
  return cx(
    BASE_CLASSES,
    SIZE_CLASSES[size],
    VARIANT_CLASSES[variant],
    labelHidden ? LABEL_HIDDEN_CLASSES : undefined,
    fullWidth ? "w-full" : undefined,
  );
}
