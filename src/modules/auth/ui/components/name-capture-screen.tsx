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
    <main className="px-6 py-12">
      <h1 className="mb-8 text-3xl text-accent">
        {translate({ translateId: "auth.nameCapture.title" })}
      </h1>
      <form action={action} className="flex max-w-sm flex-col gap-4">
        <Input
          type="text"
          name="name"
          label={{ translateId: "auth.nameCapture.nameLabel" }}
          error={error ? { translateId: "auth.nameCapture.error" } : undefined}
          autoFocus={error}
        />
        <Button type="submit" translateId="auth.nameCapture.submit" />
      </form>
    </main>
  );
}
