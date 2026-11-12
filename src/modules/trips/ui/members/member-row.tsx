"use client";

import { UserMinus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Role } from "@/modules/trips/domain/trip";
import type { MemberDto } from "@/modules/trips/service/schemas";
import { useRouter } from "@/shared/i18n/navigation";
import { Button } from "@/shared/ui/components/button";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { useIsOnline } from "@/shared/ui/hooks/use-is-online";

export type MemberRowProps = {
  member: MemberDto;
  tripId: string;
  tripName: string;
  /** The signed-in member, to tell their own row apart. */
  viewerId: string;
  viewerRole: Role;
  /** Called with the removed traveler's name, so the card can announce it. */
  onRemoved: (name: string) => void;
};

type Failure = "remove" | "leave";

/**
 * One traveler: the full name (truncated by CSS, never shortened in the DOM)
 * and the role badge. The owner can remove an editor; an editor can leave
 * (feature 009 plan "Contracts"). Both ask first, in a dialog.
 */
export function MemberRow({
  member,
  tripId,
  tripName,
  viewerId,
  viewerRole,
  onRemoved,
}: MemberRowProps) {
  const t = useTranslations("trips.members");
  const router = useRouter();
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const isOnline = useIsOnline();

  const isSelf = member.userId === viewerId;
  const canRemove = viewerRole === "owner" && !isSelf && member.role === "editor";
  const canLeave = isSelf && member.role === "editor";

  // A 204 answers both; anything else (or no network) is a failure to show.
  async function deleteMembership(userId: string): Promise<boolean> {
    setIsBusy(true);
    setFailure(null);
    const response = await fetch(`/api/v1/trips/${tripId}/members/${userId}`, {
      method: "DELETE",
    }).catch(() => null);
    setIsBusy(false);
    return response?.status === 204;
  }

  async function removeTraveler() {
    const removed = await deleteMembership(member.userId);
    setIsRemoveOpen(false);
    if (removed) {
      onRemoved(member.name);
      router.refresh();
    } else {
      setFailure("remove");
    }
  }

  async function leaveTrip() {
    const left = await deleteMembership(viewerId);
    setIsLeaveOpen(false);
    if (left) {
      router.push({ pathname: "/", query: { left: tripName } });
    } else {
      setFailure("leave");
    }
  }

  return (
    <li className="flex flex-col gap-1 py-2">
      <div className="flex min-h-touch items-center gap-3">
        <span className="min-w-0 flex-1 truncate font-medium">{member.name}</span>
        <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-muted">
          {t(member.role)}
        </span>
        {canRemove ? (
          <ConfirmDialog
            open={isRemoveOpen}
            onOpenChange={setIsRemoveOpen}
            isLoading={isBusy}
            onConfirm={removeTraveler}
            title={{ translateId: "trips.members.removeTitle", values: { name: member.name } }}
            warning={{ translateId: "trips.members.removeDescription" }}
            confirmLabel={{ translateId: "trips.members.removeConfirm" }}
            closeLabel={{ translateId: "trips.edit.close" }}
            cancelLabel={{ translateId: "trips.form.cancel" }}
            trigger={
              <Button
                type="button"
                size="sm"
                variant="outline"
                icon={UserMinus}
                labelHidden
                disabled={!isOnline}
                translateId="trips.members.remove"
              />
            }
          />
        ) : null}
        {/* The owner's view keeps an action column, so badges line up. */}
        {viewerRole === "owner" && !canRemove ? (
          <span aria-hidden="true" className="w-10 shrink-0" />
        ) : null}
        {canLeave ? (
          <ConfirmDialog
            open={isLeaveOpen}
            onOpenChange={setIsLeaveOpen}
            isLoading={isBusy}
            onConfirm={leaveTrip}
            title={{ translateId: "trips.members.leaveTitle" }}
            warning={{ translateId: "trips.members.leaveDescription" }}
            confirmLabel={{ translateId: "trips.members.leaveConfirm" }}
            closeLabel={{ translateId: "trips.edit.close" }}
            cancelLabel={{ translateId: "trips.form.cancel" }}
            trigger={
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!isOnline}
                translateId="trips.members.leave"
              />
            }
          />
        ) : null}
      </div>
      {!isOnline && (canRemove || canLeave) ? (
        <p className="text-sm text-text-muted">{t("offline")}</p>
      ) : null}
      {failure !== null ? (
        <p role="alert" className="text-sm text-error">
          {failure === "remove" ? t("removeFailed", { name: member.name }) : t("leaveFailed")}
        </p>
      ) : null}
    </li>
  );
}
