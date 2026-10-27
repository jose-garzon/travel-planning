"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import type landingMessages from "@/modules/auth/messages/en/landing.json";
import { isValidEmailFormat } from "@/modules/auth/ui/email-format";
import { useRequestMagicLink } from "@/modules/auth/ui/hooks/use-request-magic-link";
import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
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
    <Panel aria-hidden="true" className="flex flex-col gap-6 p-6 lg:p-10">
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
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-sun px-4 py-2 font-display text-2xl font-bold uppercase leading-none text-on-sun">
          {t("perPerson")}
        </span>
        <span className="text-sm text-text-muted">{t("label")}</span>
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
 * header (root layout) carries the wordmark.
 *
 * T01 behavior: client-side email-format validation (AC-9, inline
 * error, no request sent, focus stays on the field), submit through
 * `use-request-magic-link.ts` (AC-2), and the cooldown message (AC-10)
 * instead of the generic retriable one (AC-12). "Check your email"
 * replaces the form and is announced through the always-rendered
 * `aria-live="polite"` region (EC-3: a reload starts over at idle).
 *
 * Layout: copy, form and how-it-works first; the example trip follows
 * on mobile and takes the right half on `lg`.
 */
export function LandingScreen() {
  const translate = useTranslatable();
  const [email, setEmail] = useState("");
  const [hasFormatError, setHasFormatError] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const { status, errorKind, requestMagicLink, reset } = useRequestMagicLink();
  const [isResending, setIsResending] = useState(false);
  const hasSent = status === "sent" || isResending;

  async function handleResend() {
    setIsResending(true);
    await requestMagicLink(email);
    setIsResending(false);
  }

  function handleChangeEmail() {
    reset();
    setEmail("");
    requestAnimationFrame(() => emailInputRef.current?.focus());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmailFormat(email)) {
      setHasFormatError(true);
      emailInputRef.current?.focus();
      return;
    }

    setHasFormatError(false);
    await requestMagicLink(email);
  }

  const fieldError = hasFormatError
    ? { translateId: "auth.landing.invalidEmailError" as const }
    : errorKind === "cooldown"
      ? { translateId: "auth.landing.cooldownError" as const }
      : errorKind === "generic"
        ? { translateId: "auth.landing.genericError" as const }
        : undefined;

  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-12 px-6 pt-8 pb-16 lg:flex-row lg:items-stretch lg:gap-16 lg:py-12">
      <div className="flex flex-col lg:basis-1/2">
        <h1 className="mb-4 max-w-prose text-5xl leading-none text-text">
          {translate({ translateId: "auth.landing.title" })}
        </h1>
        <p className="mb-10 max-w-prose text-lg text-text-muted">
          {translate({ translateId: "auth.landing.tagline" })}
        </p>
        {hasSent ? null : (
          <form
            onSubmit={handleSubmit}
            className="flex w-full max-w-dialog flex-col gap-4"
            noValidate
          >
            <Input
              ref={emailInputRef}
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              label={{ translateId: "auth.landing.emailLabel" }}
              error={fieldError}
            />
            <Button
              type="submit"
              isLoading={status === "sending"}
              translateId="auth.landing.submit"
            />
            <p className="text-sm text-text-muted">
              {translate({ translateId: "auth.landing.description" })}
            </p>
          </form>
        )}
        <div aria-live="polite" className="w-full max-w-dialog">
          {hasSent && (
            <Panel tone="time" className="animate-fade-in p-6">
              <p className="mb-4 font-semibold">
                {translate({ translateId: "auth.landing.checkEmail", values: { email } })}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  isLoading={isResending}
                  onClick={handleResend}
                  translateId="auth.landing.resend"
                />
                <Button
                  variant="secondary"
                  onClick={handleChangeEmail}
                  translateId="auth.landing.changeEmail"
                />
              </div>
            </Panel>
          )}
        </div>
        <HowItWorks />
      </div>
      <div className="lg:basis-1/2">
        <ExampleTrip />
      </div>
    </main>
  );
}
