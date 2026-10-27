"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
import { Panel } from "@/shared/ui/components/panel";
import { RouteLine } from "@/shared/ui/components/route-line";
import { useTranslatable } from "@/shared/ui/translatable";

type NameCaptureScreenProps = {
  /**
   * Server Action bound to the form. Defined and passed down by
   * `app/[locale]/page.tsx` (architecture.md rule 7: UI gets data/
   * behavior through props, never by importing service/index.ts code
   * itself) — a thin caller of `setDisplayName`.
   */
  action: (formData: FormData) => Promise<void>;
  /** `true` after a submission the action flagged invalid (feature.md EC-5). */
  error?: boolean;
};

/**
 * The crew list as a line: the name being typed is the first station,
 * updating live. Decorative (the field already carries the value), so
 * hidden from assistive tech.
 */
function CrewPreview({ name }: { name: string }) {
  const translate = useTranslatable();
  const shown =
    name.trim() === ""
      ? translate({ translateId: "auth.nameCapture.previewFallback" })
      : name.trim();

  return (
    <Panel aria-hidden="true" className="flex flex-col gap-6 p-6 lg:p-10">
      <RouteLine
        size="lg"
        stops={[
          {
            id: "you",
            name: shown,
            meta: translate({ translateId: "auth.nameCapture.previewMeta" }),
            variant: "hub",
          },
        ]}
        open={<span className="block h-station" />}
      />
    </Panel>
  );
}

/**
 * `/[locale]` for a member whose first verification has no name yet
 * (plan "States": name capture). `error` shows the inline message and
 * autofocuses the field: the action's redirect that sets `error` is a
 * full round trip, so the browser's own `autofocus` handling moves
 * focus back to the field on the fresh paint (feature.md
 * Accessibility: "focus stays on/moves to the invalid field").
 *
 * Layout mirrors the landing: copy and form first, the crew list with
 * the live name beside it on `lg`, below it on mobile.
 */
export function NameCaptureScreen({ action, error = false }: NameCaptureScreenProps) {
  const translate = useTranslatable();
  const [name, setName] = useState("");

  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-10 px-6 pt-8 pb-16 lg:min-h-below-header lg:flex-row lg:items-stretch lg:gap-16 lg:py-12">
      <div className="flex flex-col justify-center lg:basis-1/2">
        <h1 className="mb-4 text-5xl leading-none text-text">
          {translate({ translateId: "auth.nameCapture.title" })}
        </h1>
        <p className="mb-8 max-w-prose text-lg text-text-muted">
          {translate({ translateId: "auth.nameCapture.description" })}
        </p>
        <form action={action} className="flex w-full max-w-dialog flex-col gap-4">
          <Input
            type="text"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            label={{ translateId: "auth.nameCapture.nameLabel" }}
            error={error ? { translateId: "auth.nameCapture.error" } : undefined}
            autoFocus={error}
            autoComplete="given-name"
          />
          <Button type="submit" translateId="auth.nameCapture.submit" />
        </form>
      </div>
      <div className="lg:basis-1/2 lg:self-center">
        <CrewPreview name={name} />
      </div>
    </main>
  );
}
