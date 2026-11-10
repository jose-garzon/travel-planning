"use client";

import type landingMessages from "@/modules/auth/messages/en/landing.json";
import { MagicLinkForm } from "@/modules/auth/ui/components/magic-link-form";
import { Panel } from "@/shared/ui/components/panel";
import { RouteLine } from "@/shared/ui/components/route-line";
import { useTranslatable } from "@/shared/ui/translatable";

type ExampleKey = keyof (typeof landingMessages)["example"];
type StepKey = keyof (typeof landingMessages)["steps"];

/**
 * Example trip: a real-looking route on the line (takeoff, two stops,
 * home again) and what it costs each person. It shows the product's
 * mechanism before sign-in. Decorative and labeled as an example, so
 * it is hidden from assistive tech.
 */
function ExampleTrip() {
  const translate = useTranslatable();
  const t = (key: ExampleKey) => translate({ translateId: `auth.landing.example.${key}` });

  return (
    <Panel aria-hidden="true" className="flex flex-col gap-6 p-6 lg:flex-1 lg:p-10">
      <span className="font-display text-3xl font-bold uppercase leading-none tracking-wide">
        {t("name")}
      </span>
      <RouteLine
        size="lg"
        stops={[
          { id: "takeoff", name: t("takeoff"), meta: t("takeoffMeta"), variant: "hub" },
          { id: "stop1", name: t("stop1"), meta: t("stop1Meta") },
          { id: "stop2", name: t("stop2"), meta: t("stop2Meta") },
          { id: "home", name: t("home"), meta: t("homeMeta"), variant: "hub" },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3 lg:mt-auto">
        <span className="rounded-full bg-sun px-4 py-2 font-display text-2xl font-bold uppercase leading-none text-on-sun">
          {t("perPerson")}
        </span>
        <span className="text-sm font-semibold text-text-muted">{t("label")}</span>
      </div>
    </Panel>
  );
}

/** Three steps on the line: what a member can do here. */
function HowItWorks() {
  const translate = useTranslatable();
  const t = (key: StepKey) => translate({ translateId: `auth.landing.steps.${key}` });

  return (
    <section aria-labelledby="how-it-works" className="mt-12">
      <h2 id="how-it-works" className="mb-4 text-xl text-text-muted">
        {t("label")}
      </h2>
      <RouteLine
        stops={[
          { id: "route", name: t("route"), meta: t("routeMeta") },
          { id: "crew", name: t("crew"), meta: t("crewMeta") },
          { id: "share", name: t("share"), meta: t("shareMeta") },
        ]}
      />
    </section>
  );
}

/**
 * `/[locale]` for a signed-out visitor (plan "States": landing). The
 * header (root layout) carries the wordmark. The email form is
 * `MagicLinkForm` (T04 extracted it for the join page's sign-in slot).
 *
 * Layout: copy, form and how-it-works first; the example trip follows
 * on mobile and takes the right half on `lg`.
 */
export function LandingScreen() {
  const translate = useTranslatable();

  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-12 px-6 pt-8 pb-16 lg:flex-row lg:items-stretch lg:gap-16 lg:py-12">
      <div className="flex flex-col lg:basis-1/2">
        <h1 className="mb-4 max-w-prose text-5xl leading-none text-text">
          {translate({ translateId: "auth.landing.title" })}
        </h1>
        <p className="mb-10 max-w-prose text-lg text-text-muted">
          {translate({ translateId: "auth.landing.tagline" })}
        </p>
        <MagicLinkForm />
        <HowItWorks />
      </div>
      <div className="lg:flex lg:basis-1/2">
        <ExampleTrip />
      </div>
    </main>
  );
}
