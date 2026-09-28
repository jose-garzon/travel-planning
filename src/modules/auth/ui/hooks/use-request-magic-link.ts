"use client";

import { createAuthClient } from "better-auth/client";
import { magicLinkClient } from "better-auth/client/plugins";
import { useState } from "react";

// Browser-only client, no `baseURL` (Better Auth infers it from
// `window.location.origin`; this file is `ui/`, which must not touch
// `shared/config` or any server-only module, architecture.md).
const authClient = createAuthClient({ plugins: [magicLinkClient()] });

export type RequestMagicLinkStatus = "idle" | "sending" | "sent";

/** Distinguishes AC-10's cooldown copy from AC-12's generic one. */
export type RequestMagicLinkErrorKind = "cooldown" | "generic";

export type UseRequestMagicLinkResult = {
  status: RequestMagicLinkStatus;
  errorKind: RequestMagicLinkErrorKind | null;
  requestMagicLink: (email: string) => Promise<void>;
};

/**
 * Calls Better Auth's magic-link sign-in through its client SDK
 * (plan.md "Magic-link cooldown": same mounted `/api/auth/[...all]`
 * route, no new HTTP path) and tracks the landing form's state.
 * Client-side email-format validation is `LandingScreen`'s job (AC-9
 * rejects before any request is sent, so it never reaches here).
 */
export function useRequestMagicLink(): UseRequestMagicLinkResult {
  const [status, setStatus] = useState<RequestMagicLinkStatus>("idle");
  const [errorKind, setErrorKind] = useState<RequestMagicLinkErrorKind | null>(null);

  async function requestMagicLink(email: string): Promise<void> {
    setStatus("sending");
    setErrorKind(null);

    const { error } = await authClient.signIn.magicLink({ email });

    if (error !== null) {
      setStatus("idle");
      setErrorKind(error.code === "MAGIC_LINK_COOLDOWN" ? "cooldown" : "generic");
      return;
    }

    setStatus("sent");
  }

  return { status, errorKind, requestMagicLink };
}
