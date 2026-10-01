"use client";

import { useState } from "react";

// Better Auth's magic-link route, called with plain `fetch` instead of
// its client SDK: the SDK alone pushed `/en` past the Lighthouse
// script budget. Relative URL, so it always targets the current origin.
const MAGIC_LINK_ENDPOINT = "/api/auth/sign-in/magic-link";

export type RequestMagicLinkStatus = "idle" | "sending" | "sent";

/** Distinguishes AC-10's cooldown copy from AC-12's generic one. */
export type RequestMagicLinkErrorKind = "cooldown" | "generic";

export type UseRequestMagicLinkResult = {
  status: RequestMagicLinkStatus;
  errorKind: RequestMagicLinkErrorKind | null;
  requestMagicLink: (email: string) => Promise<void>;
};

/**
 * Calls Better Auth's magic-link sign-in route
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

    const errorCode = await postMagicLinkRequest(email);

    if (errorCode !== null) {
      setStatus("idle");
      setErrorKind(errorCode === "MAGIC_LINK_COOLDOWN" ? "cooldown" : "generic");
      return;
    }

    setStatus("sent");
  }

  return { status, errorKind, requestMagicLink };
}

/** Returns `null` on success, else Better Auth's error `code` (or `""`). */
async function postMagicLinkRequest(email: string): Promise<string | null> {
  try {
    const response = await fetch(MAGIC_LINK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (response.ok) {
      return null;
    }
    const body: unknown = await response.json().catch(() => null);
    return typeof body === "object" && body !== null && "code" in body ? String(body.code) : "";
  } catch {
    return "";
  }
}
