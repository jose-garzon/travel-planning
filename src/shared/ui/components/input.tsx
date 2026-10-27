import { CircleAlert } from "lucide-react";
import type { ComponentPropsWithRef } from "react";
import { useId } from "react";
import { Icon } from "@/shared/ui/components/icon";
import { cx } from "@/shared/ui/cx";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

type NativeInput = Omit<ComponentPropsWithRef<"input">, "className" | "style" | "aria-invalid">;

type InputProps = NativeInput & {
  /** Visible label, rendered above the field (plan Input contract). */
  label: Translatable;
  /** Helper text, linked via `aria-describedby`. */
  hint?: Translatable;
  /** Sets `aria-invalid`, the error border and the announced error row. */
  error?: Translatable;
  /**
   * `field` (default): labelled box. `station` and `title`: the value is
   * set in the display face, as a station name or a page title, on a
   * single rule; the label stays as the accessible name only.
   */
  appearance?: "field" | "station" | "title";
};

const BASE_CLASSES =
  "min-h-touch min-w-touch rounded-md border border-border-strong bg-surface-1 " +
  "px-4 text-md text-text outline-focus transition duration-fast ease-out " +
  "ui-hover:not-disabled:border-accent ui-focus:outline-2 ui-focus:outline-solid " +
  "ui-focus:outline-focus ui-focus:outline-offset-2 disabled:opacity-50 " +
  "disabled:cursor-not-allowed";

const ERROR_CLASSES = "border-error";

const DISPLAY_CLASSES =
  // A filled station reads as a placed stop: the rule shows only while
  // empty, hovered or focused.
  "w-full min-w-0 border-0 border-b-2 border-border-strong not-placeholder-shown:border-transparent " +
  "bg-transparent px-0 pb-1 " +
  "font-display font-bold uppercase leading-none tracking-wide text-text outline-focus " +
  "placeholder:text-text-muted transition duration-fast ease-out " +
  "ui-hover:border-accent ui-focus:border-accent ui-focus:outline-2 ui-focus:outline-solid " +
  "ui-focus:outline-offset-4";

const APPEARANCE_CLASSES = {
  station: `${DISPLAY_CLASSES} text-3xl`,
  title: `${DISPLAY_CLASSES} text-4xl`,
} as const;

/**
 * Input primitive: labelled text field with an optional hint and error
 * row. `error` sets `aria-invalid`, extends `aria-describedby` and
 * shows an icon + text row in `text-error` inside an always-rendered
 * `aria-live="polite"` region, so it is announced whenever it appears
 * (plan Input contract).
 *
 * The fade and the shake live on two different nodes of the error
 * row (the row itself, and the icon+text it wraps): both utilities
 * set the CSS `animation` shorthand, so combining them on one node
 * would make the later rule (`motion-safe:animate-shake`) fully
 * replace the other instead of the two running together. Splitting
 * them across parent/child keeps both prescribed utilities, unmodified,
 * and both animations actually run.
 */
export function Input({
  label,
  hint,
  error,
  id,
  appearance = "field",
  ...nativeProps
}: InputProps) {
  const translate = useTranslatable();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint === undefined ? undefined : `${generatedId}-hint`;
  const errorId = error === undefined ? undefined : `${generatedId}-error`;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div data-ui="input" className="flex min-w-0 flex-col gap-1 wrap-anywhere">
      <label
        htmlFor={inputId}
        className={appearance === "field" ? "text-sm font-semibold text-text" : "sr-only"}
      >
        {translate(label)}
      </label>
      <input
        {...nativeProps}
        id={inputId}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={describedBy}
        className={cx(
          appearance === "field" ? BASE_CLASSES : APPEARANCE_CLASSES[appearance],
          error === undefined ? undefined : ERROR_CLASSES,
        )}
      />
      {hint !== undefined && (
        <p id={hintId} className="text-sm text-text-muted">
          {translate(hint)}
        </p>
      )}
      <div aria-live="polite" className="overflow-x-clip">
        {error !== undefined && (
          <p id={errorId} className="animate-fade-in text-sm text-error">
            <span className="inline-flex items-center gap-1 motion-safe:animate-shake">
              <Icon icon={CircleAlert} size="sm" />
              {translate(error)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
