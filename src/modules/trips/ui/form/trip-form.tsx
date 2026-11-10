"use client";

import { ArrowLeft, Check, CircleAlert, House, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { previousDate, validateRoute } from "@/modules/trips/domain/route";
import type { TripDto, TripInput } from "@/modules/trips/service/schemas";
import { CurrencySelect } from "@/modules/trips/ui/form/currency-select";
import { LegFields } from "@/modules/trips/ui/form/leg-fields";
import { currencyForLanguage } from "@/modules/trips/ui/form/region-currency";
import type { EditorLeg } from "@/modules/trips/ui/form/use-route-editor";
import { useRouteEditor } from "@/modules/trips/ui/form/use-route-editor";
import { Link, useRouter } from "@/shared/i18n/navigation";
import { Button, buttonClasses } from "@/shared/ui/components/button";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { Dialog, DialogClose } from "@/shared/ui/components/dialog";
import { Icon } from "@/shared/ui/components/icon";
import { Input } from "@/shared/ui/components/input";
import { Toast } from "@/shared/ui/components/toast";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

const DEFAULT_CURRENCY = "USD";
const MAX_LEGS_HINT = { translateId: "trips.form.legLimit" } as const;

type LegErrors = { from?: Translatable; to?: Translatable; date?: Translatable };
type FormErrors = { name?: Translatable; legs: LegErrors[] };

function toInputLegs(legs: EditorLeg[]): TripInput["legs"] {
  return legs.map((leg) => ({
    from: leg.from,
    to: leg.to,
    date: leg.date === "" ? null : leg.date,
  }));
}

/** Required fields, then the domain route rules (the server runs the same ones on save). */
function findErrors(
  name: string,
  legs: EditorLeg[],
  today: string,
  previousLegs?: TripInput["legs"],
): FormErrors {
  const required = legs.map(
    (leg, index): LegErrors => ({
      from:
        index === 0 && leg.from.name === ""
          ? { translateId: "trips.form.errors.fromRequired" }
          : undefined,
      to: leg.to.name === "" ? { translateId: "trips.form.errors.toRequired" } : undefined,
    }),
  );
  const result: FormErrors = {
    name: name.trim() === "" ? { translateId: "trips.form.errors.nameRequired" } : undefined,
    legs: required,
  };
  if (required.some((e) => e.from || e.to)) {
    return result;
  }

  const inputLegs = toInputLegs(legs);
  for (const { legIndex, rule } of validateRoute({ legs: inputLegs, today, previousLegs })) {
    const target = legIndex === null ? undefined : result.legs[legIndex];
    if (!target) {
      continue;
    }
    if (rule === "SAME_CITY") {
      target.to = { translateId: "trips.form.errors.sameCity" };
    } else if (rule === "DATE_ORDER") {
      const date = previousDate(inputLegs, legIndex as number) ?? "";
      target.date = { translateId: "trips.form.errors.dateOrder", values: { date } };
    } else if (rule === "DATE_PAST") {
      target.date ??= { translateId: "trips.form.errors.datePast" };
    }
  }
  return result;
}

function hasErrors({ name, legs }: FormErrors): boolean {
  return name !== undefined || legs.some((e) => e.from || e.to || e.date);
}

/** Name, currency and every leg's cities and date: what "unsaved changes" compares. */
function snapshot(name: string, currency: string | null, legs: EditorLeg[]): string {
  return JSON.stringify([
    name,
    currency,
    legs.map((leg) => [leg.from.name, leg.to.name, leg.date]),
  ]);
}

/** Creates the trip, or saves the edit against the version the form loaded. */
async function saveTrip(
  input: TripInput,
  trip: TripDto | undefined,
  version = trip?.version,
): Promise<"conflict" | "removed" | "failed" | { tripId: string }> {
  try {
    const response = await fetch(trip ? `/api/v1/trips/${trip.id}` : "/api/v1/trips", {
      method: trip ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trip ? { ...input, version } : input),
    });
    if (response.status === 409) {
      return "conflict";
    }
    // The member was removed while editing (EC-5): the API answers 404.
    if (response.status === 404 && trip) {
      return "removed";
    }
    if (trip) {
      return response.status === 200 ? { tripId: trip.id } : "failed";
    }
    if (response.status !== 201) {
      return "failed";
    }
    const created = (await response.json()) as { id: string };
    return { tripId: created.id };
  } catch {
    return "failed";
  }
}

type TripFormProps = {
  /** The saved trip to edit; the form creates a new trip without it. */
  trip?: TripDto;
};

/** The version the server holds now, so "save mine" can win a conflict. */
async function latestVersion(tripId: string): Promise<number | null> {
  try {
    const response = await fetch(`/api/v1/trips/${tripId}`);
    if (response.status !== 200) {
      return null;
    }
    return ((await response.json()) as { version: number }).version;
  } catch {
    return null;
  }
}

/** Create or edit form: name, currency and the route, leg by leg. */
export function TripForm({ trip }: TripFormProps) {
  const translate = useTranslatable();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const toRefs = useRef(new Map<number, HTMLInputElement | null>());
  const removeRefs = useRef(new Map<number, HTMLButtonElement | null>());
  const addRef = useRef<HTMLButtonElement>(null);
  const route = useRouteEditor(trip?.legs);
  const { legs, change } = route;
  const isEdit = trip !== undefined;
  // Captured on the first render: the state the form started with.
  const [initialSnapshot] = useState(() =>
    snapshot(trip?.name ?? "", isEdit ? trip.currency : null, legs),
  );

  const [name, setName] = useState(trip?.name ?? "");
  const [currency, setCurrency] = useState(trip?.currency ?? DEFAULT_CURRENCY);
  const [hasConflict, setHasConflict] = useState(false);
  const [hasDeleteError, setHasDeleteError] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const isDirty = snapshot(name, isEdit ? currency : null, legs) !== initialSnapshot;
  const [attempts, setAttempts] = useState(0);
  const [hasSaveError, setHasSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  // Once the user has tried to save, errors follow the fields live.
  const errors: FormErrors =
    attempts > 0 ? findErrors(name, legs, today, trip?.legs) : { name: undefined, legs: [] };

  // The server cannot know `navigator.language`, so the default applies after hydration.
  useEffect(() => {
    if (!isEdit) {
      setCurrency(currencyForLanguage(navigator.language));
    }
  }, [isEdit]);

  // Submit blocked: the first invalid field (DOM order is visual order) takes focus.
  useEffect(() => {
    if (attempts > 0) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [attempts]);

  // Focus rules: a new leg's To field; after a removal the previous leg's remove button.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per change only.
  useEffect(() => {
    if (!change) {
      return;
    }
    if (change.kind === "added") {
      const added = legs[change.number - 1];
      if (added) {
        toRefs.current.get(added.key)?.focus();
      }
      return;
    }
    const previous = legs[change.number - 2];
    const remove = previous ? removeRefs.current.get(previous.key) : null;
    (remove ?? addRef.current)?.focus();
  }, [change?.id]);

  useSaveShortcut(formRef);

  async function save(version?: number) {
    const input: TripInput = { name: name.trim(), currency, legs: toInputLegs(legs) };
    setIsSaving(true);
    setHasSaveError(false);
    setHasConflict(false);
    const outcome = await saveTrip(input, trip, version ?? trip?.version);
    setIsSaving(false);
    if (outcome === "conflict") {
      setHasConflict(true);
    } else if (outcome === "removed") {
      router.push({ pathname: "/", query: { removed: "1" } });
    } else if (outcome === "failed") {
      setHasSaveError(true);
    } else if (isEdit) {
      router.push({ pathname: `/trips/${outcome.tripId}`, query: { saved: "1" } });
    } else {
      router.push({ pathname: "/", query: { created: outcome.tripId } });
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (hasErrors(findErrors(name, legs, today, trip?.legs))) {
      setAttempts((count) => count + 1);
      return;
    }
    await save();
  }

  // The user keeps their draft and saves it over the newer version.
  async function overwrite() {
    if (!isEdit) {
      return;
    }
    const version = await latestVersion(trip.id);
    if (version === null) {
      setHasConflict(false);
      setHasSaveError(true);
      return;
    }
    await save(version);
  }

  // Closes the dialog so the error toast on the form is not behind it.
  function failDelete() {
    setIsDeleteOpen(false);
    setHasDeleteError(true);
  }

  async function handleDelete() {
    if (!isEdit) {
      return;
    }
    setIsDeleting(true);
    setHasDeleteError(false);
    try {
      const response = await fetch(`/api/v1/trips/${trip.id}`, { method: "DELETE" });
      if (response.status !== 204) {
        failDelete();
        return;
      }
      router.push({ pathname: "/", query: { deleted: "1" } });
    } catch {
      failDelete();
    } finally {
      setIsDeleting(false);
    }
  }

  function insertButton(at: number, city: string) {
    const label = translate({
      translateId: "trips.form.insertLeg",
      values: { city: city || "…" },
    });
    // Pointer devices show it faint until hover or focus of the leg; touch keeps it full.
    return (
      <div className="mt-4 transition-opacity duration-150 ease-out [@media(hover:hover)]:opacity-40 [@media(hover:hover)]:group-focus-within/leg:opacity-100 [@media(hover:hover)]:group-hover/leg:opacity-100">
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={Plus}
          title={label}
          aria-label={label}
          onClick={() => route.insertLeg(at)}
          translateId="trips.form.insertLegShort"
        />
      </div>
    );
  }

  const exitHref = isEdit ? `/trips/${trip.id}` : "/";
  const exitLabel = translate({
    translateId: isEdit ? "trips.edit.backToTrip" : "trips.form.cancel",
  });

  return (
    <form
      ref={formRef}
      noValidate
      data-sticky-bars
      onSubmit={handleSubmit}
      className="flex flex-col gap-10"
    >
      {/* Back, with the unsaved-changes guard. Saving lives in the bottom bar. */}
      <div className="sticky top-0 z-20 -mx-6 -mb-4 flex items-center gap-3 border-border border-b-2 bg-bg/95 px-6 py-3 backdrop-blur-sm">
        <Dialog
          open={isDiscardOpen}
          onOpenChange={(next) => setIsDiscardOpen(next && isDirty)}
          title={{ translateId: "trips.edit.discardTitle" }}
          description={{ translateId: "trips.edit.discardDescription" }}
          closeLabel={{ translateId: "trips.edit.close" }}
          trigger={
            <Link
              href={exitHref}
              aria-label={exitLabel}
              title={exitLabel}
              className={buttonClasses({ variant: "outline", labelHidden: true })}
              onClick={(event) => {
                // Radix skips its own toggle once the default is prevented, so open here.
                if (isDirty) {
                  event.preventDefault();
                  setIsDiscardOpen(true);
                }
              }}
            >
              <Icon icon={ArrowLeft} />
            </Link>
          }
          footer={
            <>
              <DialogClose>
                <Button type="button" variant="secondary" translateId="trips.edit.keepEditing" />
              </DialogClose>
              <Button
                type="button"
                onClick={() => router.push(exitHref)}
                translateId="trips.edit.discard"
              />
            </>
          }
        />
      </div>
      <div className="flex flex-col gap-3">
        <Input
          appearance="title"
          placeholder={translate({ translateId: "trips.form.namePlaceholder" })}
          label={{ translateId: "trips.form.tripName" }}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
        />
        <p className="max-w-prose text-text-muted">
          {translate({ translateId: isEdit ? "trips.edit.intro" : "trips.form.intro" })}
        </p>
      </div>
      <CurrencySelect
        value={currency}
        onChange={setCurrency}
        hint={isEdit ? { translateId: "trips.edit.currencyHint" } : undefined}
      />

      <div>
        {legs.map((leg, index) => {
          const next = legs[index + 1];
          return (
            <LegFields
              key={leg.key}
              legNumber={index + 1}
              isContinuation={index > 0}
              hasNext={next !== undefined}
              suggestedMonth={legs[index - 1]?.date || today}
              after={
                next !== undefined && route.canAddLeg
                  ? insertButton(index + 1, next.to.name)
                  : undefined
              }
              afterFrom={index === 0 && route.canAddLeg ? insertButton(0, leg.to.name) : undefined}
              fromName={index === 0 ? null : leg.from.name}
              initialFromName={index === 0 ? leg.from.name : undefined}
              isInitiallyPlaced={isEdit}
              fromCityId={leg.from.cityId}
              initialToName={leg.to.name}
              toRef={(element) => {
                toRefs.current.set(leg.key, element);
              }}
              removeRef={(element) => {
                removeRefs.current.set(leg.key, element);
              }}
              fromError={errors.legs[index]?.from}
              toError={errors.legs[index]?.to}
              dateError={errors.legs[index]?.date}
              onFromChange={route.setOrigin}
              onToChange={(city) => route.setTo(index, city)}
              toName={leg.to.name}
              date={leg.date}
              onDateChange={(date) => route.setDate(index, date)}
              onRemove={route.canRemoveLeg ? () => route.removeLeg(index) : undefined}
            />
          );
        })}
      </div>
      <div className="-mt-6 flex flex-wrap items-center gap-3">
        <Button
          ref={addRef}
          type="button"
          variant="secondary"
          icon={Plus}
          disabled={!route.canAddLeg}
          onClick={route.addLeg}
          translateId="trips.form.addLeg"
        />
        {route.canAddReturnHome && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={House}
            onClick={route.addReturnHome}
            translateId="trips.form.addReturnHome"
          />
        )}
        {!route.canAddLeg && <p className="text-sm text-text-muted">{translate(MAX_LEGS_HINT)}</p>}
      </div>
      <p role="status" className="sr-only">
        {/* Removals announce through the undo toast. */}
        {change?.kind === "added" &&
          translate({ translateId: "trips.form.legAdded", values: { number: change.number } })}
      </p>
      {isEdit && trip.role === "owner" && (
        <details className="group/danger border-border border-t-2 pt-6">
          <summary className="inline-flex min-h-touch cursor-pointer items-center gap-2 font-semibold text-error">
            <Icon icon={Trash2} size="sm" />
            {translate({ translateId: "trips.edit.dangerZone" })}
          </summary>
          <div className="mt-4 flex flex-col gap-4 rounded-md border-2 border-error p-4">
            <p className="max-w-prose text-sm text-text">
              {translate({ translateId: "trips.edit.deleteDescription" })}
            </p>
            <ConfirmDialog
              open={isDeleteOpen}
              onOpenChange={setIsDeleteOpen}
              isLoading={isDeleting}
              onConfirm={handleDelete}
              title={{ translateId: "trips.edit.deleteTitle", values: { name: trip.name } }}
              warning={{ translateId: "trips.edit.deleteDescription" }}
              confirmLabel={{ translateId: "trips.edit.deleteConfirm" }}
              closeLabel={{ translateId: "trips.edit.close" }}
              cancelLabel={{ translateId: "trips.edit.keepEditing" }}
              trigger={
                <Button
                  type="button"
                  variant="danger"
                  icon={Trash2}
                  translateId="trips.edit.delete"
                />
              }
            />
          </div>
        </details>
      )}
      <SaveBar
        isEdit={isEdit}
        isSaving={isSaving}
        hasConflict={hasConflict}
        hasSaveError={hasSaveError}
        onOverwrite={overwrite}
        onReload={() => router.refresh()}
      />
      {route.removed !== null && change?.kind === "removed" && (
        <Toast key={change.id} tone="success" placement="above-bar" onDismiss={route.forgetRemoved}>
          <span className="flex flex-wrap items-center gap-3">
            {translate({
              translateId: "trips.form.legRemovedToast",
              values: { number: change.number },
            })}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={route.undoRemove}
              translateId="trips.form.undoRemove"
            />
          </span>
        </Toast>
      )}
      {hasDeleteError && (
        <Toast tone="error" placement="above-bar" onDismiss={() => setHasDeleteError(false)}>
          {translate({ translateId: "trips.edit.deleteFailed" })}
        </Toast>
      )}
    </form>
  );
}

/** Ctrl/Cmd+S submits the form, like any editor. */
function useSaveShortcut(formRef: React.RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s")) {
        return;
      }
      event.preventDefault();
      // An open dialog (discard, delete) owns the keyboard; never save behind it.
      if (document.querySelector('[role="dialog"], [role="alertdialog"]') === null) {
        formRef.current?.requestSubmit();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [formRef]);
}

type SaveBarProps = {
  isEdit: boolean;
  isSaving: boolean;
  hasConflict: boolean;
  hasSaveError: boolean;
  onOverwrite: () => void;
  onReload: () => void;
};

function SaveBar({
  isEdit,
  isSaving,
  hasConflict,
  hasSaveError,
  onOverwrite,
  onReload,
}: SaveBarProps) {
  const translate = useTranslatable();
  return (
    <>
      {/* Saving sits in the thumb zone, the same place when creating and editing.
          A conflict or a failed save reports right above the button. */}
      <div className="sticky bottom-0 z-20 -mx-6 flex flex-col gap-3 border-border border-t-2 bg-bg/95 px-6 py-3 backdrop-blur-sm">
        {hasConflict && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-md border-2 border-border bg-surface-1 p-4"
          >
            <p className="flex items-start gap-2 text-text">
              <span className="shrink-0 text-error">
                <Icon icon={CircleAlert} />
              </span>
              {translate({ translateId: "trips.edit.conflict" })}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                isLoading={isSaving}
                onClick={onOverwrite}
                translateId="trips.edit.overwrite"
              />
              <Button
                type="button"
                variant="outline"
                onClick={onReload}
                translateId="trips.edit.reload"
              />
            </div>
          </div>
        )}
        {hasSaveError && (
          <p role="alert" className="flex items-start gap-2 text-error text-sm">
            <Icon icon={CircleAlert} size="sm" />
            {translate({ translateId: "trips.form.errors.saveFailed" })}
          </p>
        )}
        {hasConflict ? null : (
          <Button
            type="submit"
            icon={Check}
            fullWidth
            isLoading={isSaving}
            title={translate({ translateId: "trips.form.saveShortcut" })}
            translateId={isEdit ? "trips.edit.submit" : "trips.form.submit"}
          />
        )}
      </div>
    </>
  );
}
