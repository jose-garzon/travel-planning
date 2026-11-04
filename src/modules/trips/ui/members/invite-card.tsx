"use client";

import { useTranslations } from "next-intl";
import { type ReactElement, useEffect, useRef, useState } from "react";
import type { InviteDto } from "@/modules/trips/service/schemas";
import { Button } from "@/shared/ui/components/button";
import { Dialog, DialogClose } from "@/shared/ui/components/dialog";
import { Input } from "@/shared/ui/components/input";

export type InviteCardProps = {
  tripId: string;
  /** Sent as the title of the share sheet. */
  tripName: string;
  /** The "Invite" button that opens the card. */
  trigger: ReactElement;
};

/**
 * The owner's invite link: copy it, share it when the browser can, or
 * reset it. The link is created on open when the trip has none (plan
 * "UI components"). Opens as a dialog, a bottom sheet on mobile.
 */
export function InviteCard({ tripId, tripName, trigger }: InviteCardProps) {
  return (
    <Dialog
      trigger={trigger}
      title={{ translateId: "trips.invite.title" }}
      description={{ translateId: "trips.invite.description" }}
      closeLabel={{ translateId: "trips.invite.close" }}
    >
      <InviteBody tripId={tripId} tripName={tripName} />
    </Dialog>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

type Load = { status: "loading" } | { status: "failed" } | { status: "ready"; invite: InviteDto };

type Notice = "copied" | "copyFailed" | "reset" | null;

async function requestInvite(path: string): Promise<InviteDto> {
  const response = await fetch(path, { method: "POST" });
  if (!response.ok) {
    throw new Error(`invite request failed with ${response.status}`);
  }

  return (await response.json()) as InviteDto;
}

/** Whole days left, rounded up: a link made just now shows 7. */
function daysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / DAY_MS));
}

function InviteBody({ tripId, tripName }: { tripId: string; tripName: string }) {
  const t = useTranslations("trips.invite");
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [notice, setNotice] = useState<Notice>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  // Checked on render: this body only mounts in the browser, after the owner opens the card.
  const canShare = typeof navigator.share === "function";

  useEffect(() => {
    let active = true;
    requestInvite(`/api/v1/trips/${tripId}/invite`).then(
      (invite) => {
        if (active) {
          setLoad({ status: "ready", invite });
        }
      },
      () => {
        if (active) {
          setLoad({ status: "failed" });
        }
      },
    );

    return () => {
      active = false;
    };
  }, [tripId]);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("copied");
    } catch {
      // Blocked clipboard: the owner copies by hand, so select the link.
      fieldRef.current?.focus();
      fieldRef.current?.select();
      setNotice("copyFailed");
    }
  }

  async function share(url: string) {
    try {
      await navigator.share({ title: tripName, url });
    } catch {
      // The owner closed the share sheet; nothing to report.
    }
  }

  async function reset() {
    try {
      const invite = await requestInvite(`/api/v1/trips/${tripId}/invite/reset`);
      setLoad({ status: "ready", invite });
      setNotice("reset");
    } catch {
      setLoad({ status: "failed" });
    }
  }

  return (
    <>
      {load.status === "loading" ? <p className="text-text-muted">{t("loading")}</p> : null}
      {load.status === "failed" ? <p role="alert">{t("loadFailed")}</p> : null}
      {load.status === "ready" ? (
        <>
          <Input
            ref={fieldRef}
            label={{ translateId: "trips.invite.link" }}
            readOnly
            value={load.invite.url}
            onFocus={(event) => event.currentTarget.select()}
          />
          <p className="text-sm text-text-muted">
            {t("expires", { count: daysLeft(load.invite.expiresAt) })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              translateId="trips.invite.copy"
              onClick={() => copy(load.invite.url)}
            />
            {canShare ? (
              <Button
                type="button"
                variant="secondary"
                translateId="trips.invite.share"
                onClick={() => share(load.invite.url)}
              />
            ) : null}
          </div>
          <Dialog
            trigger={<Button type="button" variant="outline" translateId="trips.invite.reset" />}
            title={{ translateId: "trips.invite.resetTitle" }}
            description={{ translateId: "trips.invite.resetDescription" }}
            closeLabel={{ translateId: "trips.invite.close" }}
            footer={
              <>
                <DialogClose>
                  <Button type="button" variant="outline" translateId="trips.invite.cancel" />
                </DialogClose>
                <DialogClose>
                  <Button
                    type="button"
                    variant="primary"
                    translateId="trips.invite.resetConfirm"
                    onClick={() => reset()}
                  />
                </DialogClose>
              </>
            }
          />
        </>
      ) : null}
      <p role="status" aria-live="polite" className="text-sm">
        {notice === "copied" ? t("copied") : null}
        {notice === "reset" ? t("resetDone") : null}
      </p>
      {notice === "copyFailed" ? <p role="alert">{t("copyFailed")}</p> : null}
    </>
  );
}
