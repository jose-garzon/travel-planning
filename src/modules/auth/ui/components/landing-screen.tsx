import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
import { Wordmark } from "@/shared/ui/components/wordmark";
import { useTranslatable } from "@/shared/ui/translatable";

/**
 * `/[locale]` for a signed-out visitor (plan "States": landing).
 * Header copy is `SiteHeader`'s (root layout); this is a static shell
 * for T00 — hero text, email field and submit button render with no
 * client interactivity yet. T01 adds the request-magic-link flow.
 * Laid out as a centered hero column so wide viewports read as one
 * focused invitation instead of a left-aligned block; the wordmark
 * plays a one-shot pop-in (motion-safe) as the big animated logo.
 */
export function LandingScreen() {
  const translate = useTranslatable();

  return (
    <main className="flex flex-col items-center px-6 py-12 md:py-20 lg:py-28">
      <div className="mb-8 motion-safe:animate-logo-in">
        <Wordmark size="lg" />
      </div>
      <div className="mb-8 max-w-prose text-center">
        <h1 className="mb-3 text-3xl text-accent">
          {translate({ translateId: "auth.landing.title" })}
        </h1>
        <p className="mb-2 font-semibold text-text md:text-lg">
          {translate({ translateId: "auth.landing.tagline" })}
        </p>
        <p className="text-text-muted">{translate({ translateId: "auth.landing.description" })}</p>
      </div>
      <form className="flex w-full max-w-sm flex-col gap-4">
        <Input type="email" name="email" label={{ translateId: "auth.landing.emailLabel" }} />
        <Button type="submit" translateId="auth.landing.submit" />
      </form>
    </main>
  );
}
