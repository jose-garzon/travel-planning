"use client";

import { ArrowLeft, Check, House, Plus, Trash2 } from "lucide-react";
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
): Promise<"conflict" | "removed" | "failed" | { tripId: string }> {
  try {
    const response = await fetch(trip ? `/api/v1/trips/${trip.id}` : "/api/v1/trips", {
      method: trip ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trip ? { ...input, version: trip.version } : input),
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (hasErrors(findErrors(name, legs, today, trip?.legs))) {
      setAttempts((count) => count + 1);
      return;
    }

    const input: TripInput = { name: name.trim(), currency, legs: toInputLegs(legs) };
    setIsSaving(true);
    setHasSaveError(false);
    setHasConflict(false);
    const outcome = await saveTrip(input, trip);
    setIsSaving(false);
    if (outcome === "conflict") {
      setHasConflict(true);
    } else if (outcome === "removed") {
      router.push({ pathname: "/", query: { removed: "1" } });
    } else if (outcome === "failed") {
      setHasSaveError(true);
    } else {
      router.push(isEdit ? "/" : { pathname: "/", query: { created: outcome.tripId } });
    }
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
    return (
      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={Plus}
          title={translate({
            translateId: "trips.form.insertLeg",
            values: { city: city || "…" },
          })}
          aria-label={translate({
            translateId: "trips.form.insertLeg",
            values: { city: city || "…" },
          })}
          onClick={() => route.insertLeg(at)}
          translateId="trips.form.insertLegShort"
        />
      </div>
    );
  }

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-10">
      {/* One bar for the form's two exits: back (with the unsaved-changes
          guard) and save. Sticky, so saving is always in reach. */}
      <div className="sticky top-0 z-20 -mx-6 -mb-4 flex items-center justify-between gap-3 border-border border-b-2 bg-bg/95 px-6 py-3 backdrop-blur-sm">
        <Dialog
          open={isDiscardOpen}
          onOpenChange={(next) => setIsDiscardOpen(next && isDirty)}
          title={{ translateId: "trips.edit.discardTitle" }}
          description={{ translateId: "trips.edit.discardDescription" }}
          closeLabel={{ translateId: "trips.edit.close" }}
          trigger={
            <Link
              href={isEdit ? `/trips/${trip.id}` : "/"}
              aria-label={translate({ translateId: "trips.form.cancel" })}
              title={translate({ translateId: "trips.form.cancel" })}
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
                onClick={() => router.push(isEdit ? `/trips/${trip.id}` : "/")}
                translateId="trips.edit.discard"
              />
            </>
          }
        />
        {/* Editing saves from the bar; a new trip saves at the foot, once
            the fields above it are filled in. */}
        {isEdit ? (
          <Button type="submit" icon={Check} isLoading={isSaving} translateId="trips.edit.submit" />
        ) : null}
      </div>
      <Input
        appearance="title"
        placeholder={translate({ translateId: "trips.form.namePlaceholder" })}
        label={{ translateId: "trips.form.tripName" }}
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name}
      />
      <CurrencySelect value={currency} onChange={setCurrency} />
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
        {change &&
          translate({
            translateId: change.kind === "added" ? "trips.form.legAdded" : "trips.form.legRemoved",
            values: { number: change.number },
          })}
      </p>
      {hasConflict && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-error">
          <p>{translate({ translateId: "trips.edit.conflict" })}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.refresh()}
            translateId="trips.edit.reload"
          />
        </div>
      )}
      {hasSaveError && (
        <p role="alert" className="text-error">
          {translate({ translateId: "trips.form.errors.saveFailed" })}
        </p>
      )}
      {isEdit ? null : (
        <div>
          <Button type="submit" icon={Check} isLoading={isSaving} translateId="trips.form.submit" />
        </div>
      )}
      {isEdit && trip.role === "owner" && (
        <div className="mt-6 flex flex-col gap-4 rounded-md border-2 border-error border-dashed p-4">
          <p className="max-w-prose text-sm text-text-muted">
            {translate({ translateId: "trips.edit.deleteDescription" })}
          </p>
          <ConfirmDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            isLoading={isDeleting}
            onConfirm={handleDelete}
            title={{ translateId: "trips.edit.deleteTitle" }}
            warning={{ translateId: "trips.edit.deleteDescription" }}
            confirmLabel={{ translateId: "trips.edit.deleteConfirm" }}
            closeLabel={{ translateId: "trips.edit.close" }}
            cancelLabel={{ translateId: "trips.form.cancel" }}
            trigger={
              <Button
                type="button"
                variant="outline"
                icon={Trash2}
                fullWidth
                translateId="trips.edit.delete"
              />
            }
          />
        </div>
      )}
      {hasDeleteError && (
        <Toast tone="error" onDismiss={() => setHasDeleteError(false)}>
          {translate({ translateId: "trips.edit.deleteFailed" })}
        </Toast>
      )}
    </form>
  );
}
