"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { useRequestMagicLink } from "@/modules/auth/ui/hooks/use-request-magic-link";
import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
import { Wordmark } from "@/shared/ui/components/wordmark";
import { useTranslatable } from "@/shared/ui/translatable";

// Loose on purpose: catches obviously malformed input (AC-9) without
// re-implementing RFC 5322. The server (Better Auth's own zod schema)
// is the real gate.
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmailFormat(email: string): boolean {
  return EMAIL_FORMAT.test(email);
}

/**
 * `/[locale]` for a signed-out visitor (plan "States": landing). Header
 * copy is `SiteHeader`'s (root layout).
 *
 * T01 makes the shell interactive: client-side email-format validation
 * (AC-9, inline error, no request sent, focus stays on the field),
 * submit through `use-request-magic-link.ts` (AC-2), and branching the
 * result on `error.code` — the cooldown message (AC-10) instead of the
 * generic retriable one (AC-12). "Check your email" replaces the form
 * and is announced through the always-rendered `aria-live="polite"`
 * region below it (accessibility.md "Async results … announced via a
 * live region"); a full reload always starts over at `status: "idle"`
 * (EC-3 — nothing here persists across reloads).
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
  const [email, setEmail] = useState("");
  const [hasFormatError, setHasFormatError] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const { status, errorKind, requestMagicLink } = useRequestMagicLink();

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
    <main className="flex min-h-below-header flex-col items-center justify-center gap-4 px-6 py-16 lg:flex-row lg:items-stretch lg:justify-center lg:gap-12 lg:px-16 lg:py-16">
      <div
        aria-hidden="true"
        className="hidden shrink-0 basis-1/3 rounded-lg border border-border bg-surface-2 lg:block"
      />
      <div className="flex w-full flex-col items-center justify-center lg:min-w-0 lg:basis-2/3">
        <div className="flex w-full flex-col items-center lg:max-w-md">
          <div className="mb-4 motion-safe:animate-logo-in md:mb-6 lg:mb-8">
            <Wordmark size="lg" />
          </div>
          <div className="mb-4 lg:w-1/2 max-w-prose text-center md:mb-6 lg:mb-8">
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
          {status === "sent" ? null : (
            <form
              onSubmit={handleSubmit}
              className="flex w-full max-w-sm flex-col gap-3 md:gap-4"
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
            </form>
          )}
          <div aria-live="polite" className="w-full max-w-sm text-center">
            {status === "sent" && (
              <p className="animate-fade-in text-text">
                {translate({ translateId: "auth.landing.checkEmail", values: { email } })}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
