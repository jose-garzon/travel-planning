import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
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
 * `/[locale]` for a member whose first verification has no name yet
 * (plan "States": name capture). `error` shows the inline message and
 * autofocuses the field — no client JS needed: the action's redirect
 * that sets `error` is itself a full round trip, so the browser's own
 * `autofocus` handling moves focus back to the field on the fresh
 * paint (feature.md Accessibility: "focus stays on/moves to the
 * invalid field").
 */
export function NameCaptureScreen({ action, error = false }: NameCaptureScreenProps) {
  const translate = useTranslatable();

  return (
    <main className="flex min-h-below-header flex-col items-center justify-center gap-4 px-6 py-16 lg:flex-row lg:items-stretch lg:justify-center lg:gap-12 lg:px-16 lg:py-16">
      <div
        aria-hidden="true"
        className="hidden shrink-0 basis-1/3 rounded-lg border border-border bg-surface-2 lg:block"
      />
      <div className="flex w-full flex-col items-center justify-center lg:min-w-0 lg:basis-2/3">
        <div className="flex w-full flex-col items-center lg:max-w-md">
          <h1 className="mb-4 text-center text-3xl leading-tight text-accent md:mb-6 lg:mb-8">
            {translate({ translateId: "auth.nameCapture.title" })}
          </h1>
          <form action={action} className="flex w-full max-w-sm flex-col gap-3 md:gap-4">
            <Input
              type="text"
              name="name"
              label={{ translateId: "auth.nameCapture.nameLabel" }}
              error={error ? { translateId: "auth.nameCapture.error" } : undefined}
              autoFocus={error}
            />
            <Button type="submit" translateId="auth.nameCapture.submit" />
          </form>
        </div>
      </div>
    </main>
  );
}
