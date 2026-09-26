// Client component: Radix Dialog manages the focus trap, Escape,
// background scroll lock and focus return.
"use client";

import { X } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import type { ReactElement, ReactNode } from "react";
import { Button } from "@/shared/ui/components/button";
import { Text } from "@/shared/ui/components/text";
import type { TextContent, Translatable } from "@/shared/ui/translatable";

export type DialogProps = {
  /** The trigger; usually a `Button`, merged onto it via Radix `asChild`. */
  trigger: ReactElement;
  title: Translatable;
  description?: Translatable;
  /** Accessible name of the X close `Button` (`labelHidden`). */
  closeLabel: Translatable;
  /** Buttons; wrap each one that should close the dialog in `DialogClose`. */
  footer?: ReactNode;
  children?: ReactNode;
  /** Controlled open state. Uncontrolled (Radix's own state) otherwise. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const OVERLAY_CLASSES = "fixed inset-0 bg-overlay animate-fade-in";

// < md: bottom sheet (`inset-x-0 bottom-0`, rounded top, `max-h-sheet`,
// `motion-safe:animate-sheet-up`, fade always). >= md: centered
// (`inset-0` + `m-auto` centers a `max-w-dialog` box without a static
// `translate(-50%,-50%)`, which `dialog-in`'s own `transform: scale()`
// keyframe would otherwise fight over the `transform` property during
// the animation), `motion-safe:animate-dialog-in` (plan
// "components/dialog.tsx").
const CONTENT_CLASSES =
  "fixed inset-x-0 bottom-0 flex max-h-sheet flex-col gap-4 overflow-y-auto rounded-t-lg " +
  "bg-surface-2 p-6 shadow-md animate-fade-in motion-safe:animate-sheet-up dark:border " +
  "dark:border-border md:inset-0 md:m-auto md:h-fit md:w-full md:max-h-none md:max-w-dialog " +
  "md:rounded-lg md:motion-safe:animate-dialog-in";

/** `Translatable` (content XOR key) to `TextContent` (children XOR key), for spreading into `Text`/`Button`. */
function toTextContent(text: Translatable): TextContent {
  return typeof text === "string"
    ? { children: text }
    : { translateId: text.translateId, values: text.values };
}

/**
 * Dialog primitive: the WAI-ARIA Dialog (Modal) pattern via Radix
 * Dialog. Renders as a bottom sheet below `md`, a centered dialog at
 * `md` and up (plan "components/dialog.tsx"). Radix supplies the
 * focus trap, Escape, background scroll lock and focus return; this
 * component only supplies the look and the X close `Button`.
 * Translates its own text (D-7).
 */
export function Dialog({
  trigger,
  title,
  description,
  closeLabel,
  footer,
  children,
  open,
  onOpenChange,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={OVERLAY_CLASSES} />
        <RadixDialog.Content data-ui="dialog" className={CONTENT_CLASSES}>
          <div className="flex items-start justify-between gap-4">
            <RadixDialog.Title asChild>
              <Text as="h2" size="xl" font="display" {...toTextContent(title)} />
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <Button variant="secondary" icon={X} labelHidden {...toTextContent(closeLabel)} />
            </RadixDialog.Close>
          </div>
          {description !== undefined && (
            <RadixDialog.Description asChild>
              <Text size="sm" tone="muted" {...toTextContent(description)} />
            </RadixDialog.Description>
          )}
          {children}
          {footer !== undefined && <div className="flex justify-end gap-2">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** `DialogClose` primitive: wraps a footer button so clicking it closes the Dialog. */
export function DialogClose({ children }: { children: ReactElement }) {
  return <RadixDialog.Close asChild>{children}</RadixDialog.Close>;
}
