"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { Gap } from "@/modules/transfers/domain/gaps";
import type { TransferInput } from "@/modules/transfers/service/schemas";
import { TransferForm } from "@/modules/transfers/ui/components/transfer-form";
import { useRouter } from "@/shared/i18n/navigation";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { Dialog } from "@/shared/ui/components/dialog";
import { type OpenTransferSheet, onOpenTransferSheet } from "@/shared/ui/transfer-events";

export type TransferSheetHostProps = {
  tripId: string;
  tripCurrency: string;
  gaps: Gap[];
};

type Request = OpenTransferSheet & { key: number };

/**
 * One add/edit sheet and one delete confirmation for the whole page. Cards
 * and gaps open them by event (`openTransferSheet`), so they never import it.
 */
export function TransferSheetHost({ tripId, tripCurrency, gaps }: TransferSheetHostProps) {
  const t = useTranslations("transfers.form");
  const locale = useLocale();
  const router = useRouter();
  const [request, setRequest] = useState<Request | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(
    () =>
      onOpenTransferSheet((detail) => {
        setDeleteError(null);
        setRequest((previous) => ({ ...detail, key: (previous?.key ?? 0) + 1 }));
      }),
    [],
  );

  const gap = request === null ? undefined : gaps[request.gap];
  const transferId = request?.prefill?.id;
  const close = () => setRequest(null);
  const base = `/api/v1/trips/${tripId}/transfers`;

  async function send(url: string, method: string, body?: unknown): Promise<string | null> {
    const response = await fetch(url, {
      method,
      headers: { "content-type": "application/json", "accept-language": locale },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).catch(() => null);
    if (response?.ok) {
      router.refresh();
      close();
      return null;
    }
    const payload = (await response?.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    return payload?.error?.message ?? t("failed");
  }

  function save(input: TransferInput) {
    if (transferId === undefined) {
      return send(base, "POST", input);
    }
    return send(`${base}/${transferId}`, "PATCH", {
      ...input,
      version: request?.prefill?.version,
    });
  }

  async function remove() {
    setIsDeleting(true);
    setDeleteError(await send(`${base}/${transferId}`, "DELETE"));
    setIsDeleting(false);
  }

  // Focus returns to the page; the sheet is opened by events, not by a trigger.
  const hiddenTrigger = <button type="button" hidden />;

  if (request === null || gap === undefined) {
    return null;
  }
  if (request.action === "delete" && transferId !== undefined) {
    return (
      <ConfirmDialog
        open
        onOpenChange={(open) => (open ? undefined : close())}
        trigger={hiddenTrigger}
        title={t("deleteTitle", {
          from: request.prefill?.from ?? gap.from?.name ?? "",
          to: request.prefill?.to ?? gap.to?.name ?? "",
        })}
        warning={deleteError ?? t("deleteWarning")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        closeLabel={t("close")}
        onConfirm={remove}
        isLoading={isDeleting}
      />
    );
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : close())}
      trigger={hiddenTrigger}
      title={transferId === undefined ? t("addTitle") : t("editTitle")}
      closeLabel={t("close")}
    >
      {/* The form is taller than a desktop window: it scrolls, Save included. */}
      <div className="-mx-1 max-h-sheet overflow-y-auto px-1">
        <TransferForm
          key={request.key}
          gap={gap}
          tripCurrency={tripCurrency}
          initial={request.prefill}
          onSubmit={save}
        />
      </div>
    </Dialog>
  );
}
