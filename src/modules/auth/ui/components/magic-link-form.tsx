"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { isValidEmailFormat } from "@/modules/auth/ui/email-format";
import { useRequestMagicLink } from "@/modules/auth/ui/hooks/use-request-magic-link";
import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
import { Panel } from "@/shared/ui/components/panel";
import { useTranslatable } from "@/shared/ui/translatable";

export type MagicLinkFormProps = {
  /** Where the sign-in link lands after verify (a relative path). */
  callbackURL?: string;
};

/**
 * The email form that sends a sign-in link (plan "States": landing).
 * Client-side email-format validation (AC-9, inline error, no request
 * sent, focus stays on the field), the cooldown message (AC-10) and the
 * generic retriable one (AC-12). "Check your email" replaces the form
 * and is announced through the always-rendered `aria-live="polite"`
 * region (EC-3: a reload starts over at idle).
 *
 * Shared by the landing page and the join page's sign-in slot (feature
 * 009 D-3); `callbackURL` is where the link lands after verify.
 */
export function MagicLinkForm({ callbackURL }: MagicLinkFormProps) {
  const translate = useTranslatable();
  const [email, setEmail] = useState("");
  const [hasFormatError, setHasFormatError] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const { status, errorKind, requestMagicLink, reset } = useRequestMagicLink({ callbackURL });
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
    <>
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
    </>
  );
}
