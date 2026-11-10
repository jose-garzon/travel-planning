// Client component: a destructive-action confirmation built on Dialog.
"use client";

import { TriangleAlert } from "lucide-react";
import type { ReactElement } from "react";
import { Button } from "@/shared/ui/components/button";
import { Dialog, DialogClose } from "@/shared/ui/components/dialog";
import { Icon } from "@/shared/ui/components/icon";
import { type TextContent, type Translatable, useTranslatable } from "@/shared/ui/translatable";

function toTextContent(text: Translatable): TextContent {
  return typeof text === "string"
    ? { children: text }
    : { translateId: text.translateId, values: text.values };
}

export type ConfirmDialogProps = {
  /** The button that opens the confirmation. */
  trigger: ReactElement;
  /** The question, e.g. “Delete “Museo” for everyone?”. */
  title: Translatable;
  /** What happens if confirmed; shown in the warning box. */
  warning: Translatable;
  confirmLabel: Translatable;
  cancelLabel: Translatable;
  closeLabel: Translatable;
  onConfirm: () => void;
  /**
   * Controlled open state, for async confirms that keep the dialog
   * open (with `isLoading`) until the request settles. Uncontrolled
   * confirms close on click.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
};

/**
 * ConfirmDialog: the warning modal for destructive actions. Cancel
 * precedes the red confirm button so focus and Enter land on the safe
 * choice first.
 */
export function ConfirmDialog({
  trigger,
  title,
  warning,
  confirmLabel,
  cancelLabel,
  closeLabel,
  onConfirm,
  open,
  onOpenChange,
  isLoading,
}: ConfirmDialogProps) {
  const translate = useTranslatable();
  const warningText = translate(warning);
  const confirm = (
    <Button
      type="button"
      variant="danger"
      isLoading={isLoading}
      onClick={onConfirm}
      {...toTextContent(confirmLabel)}
    />
  );
  return (
    <Dialog
      trigger={trigger}
      title={title}
      closeLabel={closeLabel}
      open={open}
      onOpenChange={onOpenChange}
      footer={
        <>
          <DialogClose>
            <Button type="button" variant="secondary" {...toTextContent(cancelLabel)} />
          </DialogClose>
          {open === undefined ? <DialogClose>{confirm}</DialogClose> : confirm}
        </>
      }
    >
      <p className="flex items-start gap-3 rounded-md border-2 border-error p-4 text-sm text-text">
        <span className="shrink-0 text-error">
          <Icon icon={TriangleAlert} />
        </span>
        {warningText}
      </p>
    </Dialog>
  );
}
