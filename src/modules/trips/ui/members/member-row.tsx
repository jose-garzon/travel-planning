"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Role } from "@/modules/trips/domain/trip";
import type { MemberDto } from "@/modules/trips/service/schemas";
import { useRouter } from "@/shared/i18n/navigation";
import { Button } from "@/shared/ui/components/button";
import { Dialog, DialogClose } from "@/shared/ui/components/dialog";

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
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate font-medium">{member.name}</span>
        <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-muted">
          {t(member.role)}
        </span>
      </div>
      {canRemove ? (
        <Dialog
          open={isRemoveOpen}
          onOpenChange={setIsRemoveOpen}
          title={{ translateId: "trips.members.removeTitle", values: { name: member.name } }}
          description={{ translateId: "trips.members.removeDescription" }}
          closeLabel={{ translateId: "trips.edit.close" }}
          trigger={<Button type="button" variant="secondary" translateId="trips.members.remove" />}
          footer={
            <>
              <DialogClose>
                <Button type="button" variant="secondary" translateId="trips.form.cancel" />
              </DialogClose>
              <Button
                type="button"
                isLoading={isBusy}
                onClick={removeTraveler}
                translateId="trips.members.removeConfirm"
              />
            </>
          }
        />
      ) : null}
      {canLeave ? (
        <Dialog
          open={isLeaveOpen}
          onOpenChange={setIsLeaveOpen}
          title={{ translateId: "trips.members.leaveTitle" }}
          description={{ translateId: "trips.members.leaveDescription" }}
          closeLabel={{ translateId: "trips.edit.close" }}
          trigger={<Button type="button" variant="secondary" translateId="trips.members.leave" />}
          footer={
            <>
              <DialogClose>
                <Button type="button" variant="secondary" translateId="trips.form.cancel" />
              </DialogClose>
              <Button
                type="button"
                isLoading={isBusy}
                onClick={leaveTrip}
                translateId="trips.members.leaveConfirm"
              />
            </>
          }
        />
      ) : null}
      {failure !== null ? (
        <p role="alert" className="text-sm text-error">
          {failure === "remove" ? t("removeFailed", { name: member.name }) : t("leaveFailed")}
        </p>
      ) : null}
    </li>
  );
}
