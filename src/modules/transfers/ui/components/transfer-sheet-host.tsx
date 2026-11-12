"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
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

function plain(name: string | undefined): string {
  return (name ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/**
 * The gap an edit saves into. The requested one while it exists; else the
 * gap whose cities match the transfer's by name; else a stand-in that keeps
 * the stored index (the API accepts it, and the transfer stays in "Route changed").
 */
function gapFor(request: Request, gaps: Gap[]): Gap {
  const known = gaps[request.gap];
  if (known !== undefined) {
    return known;
  }
  const { from, to } = request.prefill ?? {};
  const match = gaps.find(
    (gap) => plain(gap.from?.name) === plain(from) && plain(gap.to?.name) === plain(to),
  );
  return (
    match ?? {
      index: request.gap,
      kind: "between",
      from: null,
      to: null,
      date: null,
      window: { from: null, to: null },
    }
  );
}

/** Focuses `find()` once it exists (the page refreshes after a save), for about two seconds. */
function focusWhenPresent(find: () => HTMLElement | null, tries = 40) {
  window.setTimeout(() => {
    const target = find();
    if (target !== null) {
      target.focus();
    } else if (tries > 0) {
      focusWhenPresent(find, tries - 1);
    }
  }, 50);
}

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
  // What had focus when the sheet opened: focus goes back there if nothing better exists.
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(
    () =>
      onOpenTransferSheet((detail) => {
        if (!document.activeElement?.closest('[role="dialog"]')) {
          openerRef.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }
        setDeleteError(null);
        setRequest((previous) => ({ ...detail, key: (previous?.key ?? 0) + 1 }));
      }),
    [],
  );

  const gap = request === null ? undefined : gapFor(request, gaps);
  const transferId = request?.prefill?.id;
  const close = () => {
    setRequest(null);
    const opener = openerRef.current;
    focusWhenPresent(() => (opener?.isConnected ? opener : null), 0);
  };
  const base = `/api/v1/trips/${tripId}/transfers`;

  async function send(
    url: string,
    method: string,
    body?: unknown,
    /** Selector of what should take focus once the page shows the result. */
    landing?: (savedId: string | undefined) => string,
  ): Promise<string | null> {
    const response = await fetch(url, {
      method,
      headers: { "content-type": "application/json", "accept-language": locale },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).catch(() => null);
    if (response?.ok) {
      const saved = (await response.json().catch(() => null)) as { id?: string } | null;
      router.refresh();
      close();
      if (landing !== undefined) {
        const selector = landing(saved?.id);
        focusWhenPresent(() => document.querySelector<HTMLElement>(selector));
      }
      return null;
    }
    const payload = (await response?.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    return payload?.error?.message ?? t("failed");
  }

  function save(input: TransferInput) {
    if (transferId === undefined) {
      return send(base, "POST", input, (id) => `#transfer-${id}`);
    }
    return send(
      `${base}/${transferId}`,
      "PATCH",
      { ...input, version: request?.prefill?.version },
      () => `#transfer-${transferId}`,
    );
  }

  async function remove() {
    setIsDeleting(true);
    const index = request?.gap;
    setDeleteError(
      await send(`${base}/${transferId}`, "DELETE", undefined, () =>
        // The gap may be gone (route changed): fall back to the first Add button.
        gaps[index ?? -1] === undefined ? "[data-gap-add]" : `[data-gap-add="${index}"]`,
      ),
    );
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
