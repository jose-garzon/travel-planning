"use client";

import { useEffect, useRef, useState } from "react";
import type { Leg } from "@/modules/trips/domain/trip";
import type { TripDto, TripInput } from "@/modules/trips/service/schemas";
import { CurrencySelect } from "@/modules/trips/ui/form/currency-select";
import { LegFields } from "@/modules/trips/ui/form/leg-fields";
import { currencyForLanguage } from "@/modules/trips/ui/form/region-currency";
import type { EditorLeg, LegErrors } from "@/modules/trips/ui/form/use-route-editor";
import { legErrors, MAX_LEGS, useRouteEditor } from "@/modules/trips/ui/form/use-route-editor";
import { Link, useRouter } from "@/shared/i18n/navigation";
import { Button } from "@/shared/ui/components/button";
import { Dialog, DialogClose } from "@/shared/ui/components/dialog";
import { Input } from "@/shared/ui/components/input";
import { useTranslatable } from "@/shared/ui/translatable";

const DEFAULT_CURRENCY = "USD";

/** The user's local date, `YYYY-MM-DD` (plan D-5). */
function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

type SaveMessage = "saveFailed" | "conflict" | "deleteFailed";

const SAVE_MESSAGE_KEYS = {
  saveFailed: "trips.form.errors.saveFailed",
  conflict: "trips.edit.conflict",
  deleteFailed: "trips.edit.deleteFailed",
} as const;

/** The legs as sent to the API; also the snapshot that tells whether the form changed. */
function toLegInputs(legs: EditorLeg[]): TripInput["legs"] {
  return legs.map(({ from, to, date }) => ({ from, to, date: date === "" ? null : date }));
}

/** Internal link a click on which would leave the page (new tab, download and modifiers excluded). */
function leavingLink(event: MouseEvent): HTMLAnchorElement | null {
  const link = (event.target as Element | null)?.closest("a[href]");
  if (!(link instanceof HTMLAnchorElement)) {
    return null;
  }
  const isPlainClick = event.button === 0 && !(event.metaKey || event.ctrlKey || event.shiftKey);
  const isInternal = link.origin === window.location.origin && link.target !== "_blank";

  return isPlainClick && isInternal ? link : null;
}

/**
 * Unsaved changes (AC-12): a click on a link that leaves the page asks first;
 * closing the tab uses the browser's own prompt. Set `hasLeft` to skip the ask.
 */
function useLeaveGuard(isDirty: boolean) {
  const hasLeft = useRef(false);
  const pendingLink = useRef<HTMLAnchorElement | null>(null);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      return;
    }
    function onClick(event: MouseEvent) {
      const link = hasLeft.current ? null : leavingLink(event);
      if (link === null) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      pendingLink.current = link;
      setIsDiscardOpen(true);
    }
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasLeft.current) {
        event.preventDefault();
      }
    }
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [isDirty]);

  return { hasLeft, pendingLink, isDiscardOpen, setIsDiscardOpen };
}

/** Creates the trip, or saves `input` over `trip` with the version the form read. */
async function saveTrip(
  trip: TripDto | undefined,
  input: TripInput,
): Promise<"saved" | "conflict" | "saveFailed"> {
  const response =
    trip === undefined
      ? await sendJson("/api/v1/trips", "POST", input)
      : await sendJson(`/api/v1/trips/${trip.id}`, "PATCH", { ...input, version: trip.version });
  if (response.status === (trip === undefined ? 201 : 200)) {
    return "saved";
  }

  return response.status === 409 ? "conflict" : "saveFailed";
}

function sendJson(url: string, method: "POST" | "PATCH", body: unknown): Promise<Response> {
  return fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Create or edit form: name, currency and the route as a chain of legs. Edits `trip` when given. */
export function TripForm({ trip }: { trip?: TripDto }) {
  const translate = useTranslatable();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const editor = useRouteEditor(trip?.legs);
  const { legs, change } = editor;
  const savedLegs: Leg[] | undefined = trip?.legs;
  const savedSnapshot = useRef(JSON.stringify(toLegInputs(legs)));

  const [name, setName] = useState(trip?.name ?? "");
  const [currency, setCurrency] = useState(trip?.currency ?? DEFAULT_CURRENCY);
  const [isCurrencyChosen, setIsCurrencyChosen] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [errors, setErrors] = useState<LegErrors[]>([]);
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const [message, setMessage] = useState<SaveMessage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const isDirty =
    name !== (trip?.name ?? "") ||
    isCurrencyChosen ||
    JSON.stringify(toLegInputs(legs)) !== savedSnapshot.current;
  const { hasLeft, pendingLink, isDiscardOpen, setIsDiscardOpen } = useLeaveGuard(isDirty);

  // The server cannot know `navigator.language`, so the default applies after hydration.
  useEffect(() => {
    if (trip === undefined) {
      setCurrency(currencyForLanguage(navigator.language));
    }
  }, [trip]);

  // After a failed submit, focus the first invalid field in page order.
  useEffect(() => {
    if (submitAttempt > 0) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [submitAttempt]);

  // Focus rules (feature.md "Accessibility"): new leg's To field; after a
  // removal the previous leg's remove button, or "Add stop" when none.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per change
  useEffect(() => {
    if (change === null) {
      return;
    }
    const leg = change.focusLegId === null ? null : `[data-leg-id="${change.focusLegId}"]`;
    const target =
      change.kind === "added"
        ? formRef.current?.querySelector<HTMLElement>(
            `${leg} [data-field="to"] input:not([readonly])`,
          )
        : formRef.current?.querySelector<HTMLElement>(`${leg} button[data-remove]:not(:disabled)`);
    (target ?? addRef.current)?.focus();
  }, [change?.seq]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = legErrors({ legs, today: localToday(), previousLegs: savedLegs });
    const isNameMissing = name.trim() === "";
    setNameError(isNameMissing);
    setErrors(found);
    if (isNameMissing || found.some((leg) => leg.from || leg.to || leg.date)) {
      setSubmitAttempt((count) => count + 1);
      return;
    }

    const input: TripInput = {
      name: name.trim(),
      currency,
      legs: toLegInputs(legs),
    };
    setIsSaving(true);
    setMessage(null);
    try {
      const outcome = await saveTrip(trip, input);
      if (outcome !== "saved") {
        setMessage(outcome);
        return;
      }
      hasLeft.current = true;
      router.push(trip === undefined ? { pathname: "/", query: { created: "1" } } : "/");
    } catch {
      setMessage("saveFailed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (trip === undefined) {
      return;
    }
    setIsDeleting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/v1/trips/${trip.id}`, { method: "DELETE" });
      if (response.status === 204) {
        hasLeft.current = true;
        setIsDeleted(true);
      } else {
        setMessage("deleteFailed");
      }
    } catch {
      setMessage("deleteFailed");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  }

  function discard() {
    hasLeft.current = true;
    window.location.assign(pendingLink.current?.href ?? "/");
  }

  const announcement =
    change === null
      ? ""
      : translate({
          translateId: change.kind === "added" ? "trips.form.legAdded" : "trips.form.legRemoved",
          values: { number: change.legNumber },
        });

  if (isDeleted) {
    return (
      <div role="status" className="flex flex-col items-start gap-4">
        <p className="font-semibold text-success">
          {translate({ translateId: "trips.edit.deleted" })}
        </p>
        <Link
          href="/"
          autoFocus
          className="min-h-touch content-center font-semibold underline underline-offset-4"
        >
          {translate({ translateId: "trips.edit.backHome" })}
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-10">
      <Input
        appearance="title"
        placeholder={translate({ translateId: "trips.form.namePlaceholder" })}
        label={{ translateId: "trips.form.tripName" }}
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={nameError ? { translateId: "trips.form.errors.nameRequired" } : undefined}
      />
      {legs.map((leg, index) => (
        <LegFields
          key={leg.id}
          legNumber={index + 1}
          leg={leg}
          errors={errors[index] ?? {}}
          onFromChange={(city) => editor.setFrom(index, city)}
          onToChange={(city) => editor.setTo(index, city)}
          onDateChange={(date) => editor.setDate(index, date)}
          onRemove={() => editor.removeLeg(index)}
          canRemove={editor.canRemoveLeg}
        />
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          ref={addRef}
          type="button"
          variant="secondary"
          disabled={!editor.canAddLeg}
          translateId="trips.form.addLeg"
          onClick={editor.addLeg}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={!editor.canAddReturnHome}
          translateId="trips.form.addReturnHome"
          onClick={editor.addReturnHome}
        />
        {!editor.canAddLeg && (
          <p className="text-sm text-text-muted">
            {translate({ translateId: "trips.form.legLimit", values: { max: MAX_LEGS } })}
          </p>
        )}
      </div>
      <CurrencySelect
        value={currency}
        onChange={(code) => {
          setCurrency(code);
          setIsCurrencyChosen(true);
        }}
      />
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
      {message !== null && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-error">
          <p>{translate({ translateId: SAVE_MESSAGE_KEYS[message] })}</p>
          {message === "conflict" && (
            <Button
              type="button"
              variant="secondary"
              translateId="trips.edit.reload"
              onClick={() => window.location.reload()}
            />
          )}
        </div>
      )}
      {/* Pinned on mobile so the one action is always in reach. */}
      <div className="sticky bottom-0 -mx-6 bg-bg px-6 pt-3 pb-6 sm:static sm:mx-0 sm:p-0">
        <div className="flex flex-wrap gap-3 sm:items-start">
          <Button
            type="submit"
            isLoading={isSaving}
            translateId={trip === undefined ? "trips.form.submit" : "trips.edit.submit"}
          />
          {trip !== undefined && (
            <Dialog
              open={isDeleteOpen}
              onOpenChange={setIsDeleteOpen}
              trigger={<Button type="button" variant="outline" translateId="trips.edit.delete" />}
              title={{ translateId: "trips.edit.deleteTitle" }}
              description={{ translateId: "trips.edit.deleteDescription" }}
              closeLabel={{ translateId: "trips.edit.close" }}
              footer={
                <>
                  <DialogClose>
                    <Button type="button" variant="secondary" translateId="trips.edit.deleteKeep" />
                  </DialogClose>
                  <Button
                    type="button"
                    isLoading={isDeleting}
                    translateId="trips.edit.deleteConfirm"
                    onClick={handleDelete}
                  />
                </>
              }
            />
          )}
        </div>
      </div>
      {/* Opened by a link click while dirty; the hidden trigger hands focus back to that link. */}
      <Dialog
        open={isDiscardOpen}
        onOpenChange={setIsDiscardOpen}
        trigger={
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            onFocus={() => pendingLink.current?.focus()}
          />
        }
        title={{ translateId: "trips.edit.discardTitle" }}
        description={{ translateId: "trips.edit.discardDescription" }}
        closeLabel={{ translateId: "trips.edit.close" }}
        footer={
          <>
            <DialogClose>
              <Button type="button" variant="secondary" translateId="trips.edit.discardKeep" />
            </DialogClose>
            <Button type="button" translateId="trips.edit.discardConfirm" onClick={discard} />
          </>
        }
      />
    </form>
  );
}
