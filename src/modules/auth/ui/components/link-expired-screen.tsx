"use client";

import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { type FormEvent, useState } from "react";
import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
import { useTranslatable } from "@/shared/ui/translatable";

// Duplicated from what will become `use-request-magic-link.ts` (T01):
// the same few-line Better Auth client-SDK call, not imported from it
// (plan "Left to implementation" — two call sites, no shared
// abstraction yet until a third one needs it, code.md #4).
const authClient = createAuthClient({ plugins: [magicLinkClient()] });

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
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    const { error } = await authClient.signIn.magicLink({ email });
    setIsSending(false);
    setSent(error === null || error === undefined);
  }

  return (
    <main className="px-6 py-12">
      <h1 className="mb-2 text-3xl text-accent">
        {translate({ translateId: "auth.linkExpired.title" })}
      </h1>
      <p className="mb-8 text-text-muted">
        {translate({ translateId: "auth.linkExpired.description" })}
      </p>
      <form onSubmit={handleResend} className="flex max-w-sm flex-col gap-4">
        <Input
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          label={{ translateId: "auth.linkExpired.emailLabel" }}
        />
        <Button type="submit" isLoading={isSending} translateId="auth.linkExpired.resend" />
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
