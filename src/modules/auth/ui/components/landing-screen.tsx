import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
import { useTranslatable } from "@/shared/ui/translatable";

/**
 * `/[locale]` for a signed-out visitor (plan "States": landing).
 * Header copy is `SiteHeader`'s (root layout); this is a static shell
 * for T00 — hero text, email field and submit button render with no
 * client interactivity yet. T01 adds the request-magic-link flow.
 */
export function LandingScreen() {
  const translate = useTranslatable();

  return (
    <main className="px-6 py-12">
      <h1 className="mb-2 text-3xl text-accent">
        {translate({ translateId: "auth.landing.title" })}
      </h1>
      <p className="mb-8 max-w-prose text-text-muted">
        {translate({ translateId: "auth.landing.description" })}
      </p>
      <form className="flex max-w-sm flex-col gap-4">
        <Input type="email" name="email" label={{ translateId: "auth.landing.emailLabel" }} />
        <Button type="submit" translateId="auth.landing.submit" />
      </form>
    </main>
  );
}
