"use client";

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
import { Dialog, DialogClose } from "@/shared/ui/components/dialog";
import { Input } from "@/shared/ui/components/input";
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
): Promise<"saved" | "conflict" | "failed"> {
  try {
    const response = await fetch(trip ? `/api/v1/trips/${trip.id}` : "/api/v1/trips", {
      method: trip ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trip ? { ...input, version: trip.version } : input),
    });
    if (response.status === 409) {
      return "conflict";
    }
    return response.status === (trip ? 200 : 201) ? "saved" : "failed";
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per failed attempt only.
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
    } else if (outcome === "failed") {
      setHasSaveError(true);
    } else {
      router.push(isEdit ? "/" : { pathname: "/", query: { created: "1" } });
    }
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
        setHasDeleteError(true);
        return;
      }
      router.push({ pathname: "/", query: { deleted: "1" } });
    } catch {
      setHasDeleteError(true);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-10">
      <Input
        appearance="title"
        placeholder={translate({ translateId: "trips.form.namePlaceholder" })}
        label={{ translateId: "trips.form.tripName" }}
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name}
      />
      {legs.map((leg, index) => (
        <LegFields
          key={leg.key}
          legNumber={index + 1}
          fromName={index === 0 ? null : leg.from.name}
          initialFromName={isEdit && index === 0 ? leg.from.name : undefined}
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
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          ref={addRef}
          type="button"
          variant="secondary"
          disabled={!route.canAddLeg}
          onClick={route.addLeg}
          translateId="trips.form.addLeg"
        />
        {route.canAddReturnHome && (
          <Button
            type="button"
            variant="secondary"
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
      <CurrencySelect value={currency} onChange={setCurrency} />
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
      {/* Pinned on mobile so the one action is always in reach. */}
      <div className="sticky bottom-0 -mx-6 bg-bg px-6 pt-3 pb-6 sm:static sm:mx-0 sm:p-0">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            isLoading={isSaving}
            translateId={isEdit ? "trips.edit.submit" : "trips.form.submit"}
          />
          <Dialog
            open={isDiscardOpen}
            onOpenChange={(next) => setIsDiscardOpen(next && isDirty)}
            title={{ translateId: "trips.edit.discardTitle" }}
            description={{ translateId: "trips.edit.discardDescription" }}
            closeLabel={{ translateId: "trips.edit.close" }}
            trigger={
              <Link
                href="/"
                className={buttonClasses({ variant: "secondary" })}
                onClick={(event) => {
                  // Radix skips its own toggle once the default is prevented, so open here.
                  if (isDirty) {
                    event.preventDefault();
                    setIsDiscardOpen(true);
                  }
                }}
              >
                {translate({ translateId: "trips.form.cancel" })}
              </Link>
            }
            footer={
              <>
                <DialogClose>
                  <Button type="button" variant="secondary" translateId="trips.edit.keepEditing" />
                </DialogClose>
                <Button
                  type="button"
                  onClick={() => router.push("/")}
                  translateId="trips.edit.discard"
                />
              </>
            }
          />
          {isEdit && (
            <Dialog
              title={{ translateId: "trips.edit.deleteTitle" }}
              description={{ translateId: "trips.edit.deleteDescription" }}
              closeLabel={{ translateId: "trips.edit.close" }}
              trigger={<Button type="button" variant="secondary" translateId="trips.edit.delete" />}
              footer={
                <>
                  <DialogClose>
                    <Button type="button" variant="secondary" translateId="trips.form.cancel" />
                  </DialogClose>
                  <Button
                    type="button"
                    isLoading={isDeleting}
                    onClick={handleDelete}
                    translateId="trips.edit.deleteConfirm"
                  />
                </>
              }
            >
              {hasDeleteError && (
                <p role="alert" className="text-error">
                  {translate({ translateId: "trips.edit.deleteFailed" })}
                </p>
              )}
            </Dialog>
          )}
        </div>
      </div>
    </form>
  );
}
