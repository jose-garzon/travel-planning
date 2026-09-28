import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
import { useTranslatable } from "@/shared/ui/translatable";

/**
 * `/[locale]` for a member whose first verification has no name yet
 * (plan "States": name capture). Static shell for T00 — no validation,
 * no submit handler yet. T02 makes it real (inline error, focus rules).
 */
export function NameCaptureScreen() {
  const translate = useTranslatable();

  return (
    <main className="px-6 py-12">
      <h1 className="mb-8 text-3xl text-accent">
        {translate({ translateId: "auth.nameCapture.title" })}
      </h1>
      <form className="flex max-w-sm flex-col gap-4">
        <Input type="text" name="name" label={{ translateId: "auth.nameCapture.nameLabel" }} />
        <Button type="submit" translateId="auth.nameCapture.submit" />
      </form>
    </main>
  );
}
