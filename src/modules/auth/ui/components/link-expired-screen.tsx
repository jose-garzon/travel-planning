"use client";

import { type FormEvent, useRef, useState } from "react";
import { useRequestMagicLink } from "@/modules/auth/ui/hooks/use-request-magic-link";
import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
import { useTranslatable } from "@/shared/ui/translatable";

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * `/[locale]` when Better Auth's magic-link verify redirect carries
 * `error=INVALID_TOKEN` (feature.md AC-11, States "link expired";
 * confirmed at `node_modules/better-auth/dist/plugins/magic-link` per
 * plan "Risks" — not guessed). That redirect carries no email, so the
 * resend form asks for it again rather than replaying the dead token.
 */
export function LinkExpiredScreen() {
  const translate = useTranslatable();
  const [email, setEmail] = useState("");
  const [hasFormatError, setHasFormatError] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const { status, errorKind, requestMagicLink } = useRequestMagicLink();

  async function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!EMAIL_FORMAT.test(email)) {
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
  const sent = status === "sent";

  return (
    <main className="px-6 py-12">
      <h1 className="mb-2 text-3xl text-accent">
        {translate({ translateId: "auth.linkExpired.title" })}
      </h1>
      <p className="mb-8 text-text-muted">
        {translate({ translateId: "auth.linkExpired.description" })}
      </p>
      <form onSubmit={handleResend} noValidate className="flex max-w-sm flex-col gap-4">
        <Input
          type="email"
          ref={emailInputRef}
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          label={{ translateId: "auth.linkExpired.emailLabel" }}
          error={fieldError}
        />
        <Button
          type="submit"
          isLoading={status === "sending"}
          translateId="auth.linkExpired.resend"
        />
      </form>
      <div aria-live="polite">
        {sent && (
          <p className="mt-4 text-text-muted">
            {translate({ translateId: "auth.linkExpired.sent" })}
          </p>
        )}
      </div>
    </main>
  );
}
