import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
import { Wordmark } from "@/shared/ui/components/wordmark";
import { useTranslatable } from "@/shared/ui/translatable";

/**
 * `/[locale]` for a signed-out visitor (plan "States": landing).
 * Header copy is `SiteHeader`'s (root layout); this is a static shell
 * for T00 — hero text, email field and submit button render with no
 * client interactivity yet. T01 adds the request-magic-link flow.
 *
 * `<main>` centers its content horizontally and vertically. `SiteHeader`
 * (root layout) renders above it in normal flow, so `<main>` never
 * forces a full-viewport min-height (that would push the page taller
 * than the viewport and scroll it, on any breakpoint); instead every
 * vertical gap is trimmed and `py-16` — the largest step on the
 * spacing scale — frames the hero, which comfortably fits one small
 * mobile viewport and a typical desktop one with no scroll.
 *
 * On `lg` and up the row splits into two columns: a left placeholder
 * reserved for an image that is added later (empty on purpose — no
 * artwork is designed here, `basis-1/3` of the row), and a right
 * column (`basis-2/3`) that centers the hero content. `<main>` itself
 * cannot also be capped to ~1/3 of the viewport width: it is the row
 * that holds *both* columns, and capping it would collapse the
 * two-column layout back to one. The ~1/3-width cap belongs to the
 * hero content wrapper instead (`lg:max-w-md`, centered inside the
 * right column), which is what actually needs to read as a narrower,
 * centered block rather than stretching the full 2/3 column. The
 * wordmark plays a one-shot pop-in (motion-safe).
 */
export function LandingScreen() {
  const translate = useTranslatable();

  return (
    <main className="flex flex-col items-center justify-center gap-4 px-6 py-16 lg:flex-row lg:items-stretch lg:justify-center lg:gap-12 lg:px-16 lg:py-16">
      <div
        aria-hidden="true"
        className="hidden shrink-0 basis-1/3 rounded-lg border border-border bg-surface-2 lg:block"
      />
      <div className="flex w-full flex-col items-center justify-center lg:min-w-0 lg:basis-2/3">
        <div className="flex w-full flex-col items-center lg:max-w-md">
          <div className="mb-4 motion-safe:animate-logo-in md:mb-6 lg:mb-8">
            <Wordmark size="lg" />
          </div>
          <div className="mb-4 max-w-prose text-center md:mb-6 lg:mb-8">
            <h1 className="mb-2 text-3xl leading-tight text-accent md:mb-3">
              {translate({ translateId: "auth.landing.title" })}
            </h1>
            <p className="mb-1 font-semibold text-text md:mb-2 md:text-lg">
              {translate({ translateId: "auth.landing.tagline" })}
            </p>
            <p className="text-text-muted">
              {translate({ translateId: "auth.landing.description" })}
            </p>
          </div>
          <form className="flex w-full max-w-sm flex-col gap-3 md:gap-4">
            <Input type="email" name="email" label={{ translateId: "auth.landing.emailLabel" }} />
            <Button type="submit" translateId="auth.landing.submit" />
          </form>
        </div>
      </div>
    </main>
  );
}
