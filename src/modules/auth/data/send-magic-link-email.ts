import "server-only";
import { Resend } from "resend";
import {
  MAGIC_LINK_EXPIRES_IN_SECONDS,
  renderMagicLinkEmail,
} from "@/modules/auth/data/magic-link-email-template";
import type { MagicLinkEmailPayload, MagicLinkEmailSender } from "@/modules/auth/service/ports";
import { env } from "@/shared/config/env";

export type { MagicLinkEmailPayload };

// Placeholder sender identity (plan "Left to implementation": exact
// copy is T01's call). Swap for a verified domain address once one
// exists.
const MAGIC_LINK_FROM_ADDRESS = "Parche <travel-planning@jose-garzon.com>";

/**
 * Dev/test adapter (D-2): logs the magic link instead of sending it,
 * so `pnpm dev` and e2e never need a real email provider.
 */
class ConsoleMagicLinkEmailSender implements MagicLinkEmailSender {
  async send({ email, url, token, locale }: MagicLinkEmailPayload): Promise<void> {
    // biome-ignore lint/suspicious/noConsole: dev/test adapter (plan D-2).
    console.log(`[auth] magic link for ${email} (${locale}): ${url} (token=${token})`);
  }
}

/**
 * Production adapter (D-2): sends through Resend. `RESEND_API_KEY` is
 * required only in production (`env.ts`); this class is only ever
 * constructed there.
 */
class ResendMagicLinkEmailSender implements MagicLinkEmailSender {
  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send({ email, url, locale }: MagicLinkEmailPayload): Promise<void> {
    const { subject, html, text } = renderMagicLinkEmail({
      url,
      expiresInMinutes: MAGIC_LINK_EXPIRES_IN_SECONDS / 60,
      locale,
    });
    const { error } = await this.client.emails.send({
      from: MAGIC_LINK_FROM_ADDRESS,
      to: email,
      subject,
      html,
      text,
    });

    if (error !== null) {
      throw new Error(`Failed to send magic-link email: ${error.message}`);
    }
  }
}

/**
 * Picks the sender by `env.NODE_ENV` (D-2): `ConsoleMagicLinkEmailSender`
 * everywhere except production, `ResendMagicLinkEmailSender` there.
 * `env.MAGIC_LINK_SENDER` overrides the choice.
 */
function createMagicLinkEmailSender(): MagicLinkEmailSender {
  const sender = env.MAGIC_LINK_SENDER ?? (env.NODE_ENV === "production" ? "resend" : "console");
  if (sender === "resend") {
    if (env.RESEND_API_KEY === undefined) {
      throw new Error("RESEND_API_KEY is required for the Resend sender (see env.ts, plan D-2).");
    }
    return new ResendMagicLinkEmailSender(env.RESEND_API_KEY);
  }

  return new ConsoleMagicLinkEmailSender();
}

/**
 * `better-auth.ts`'s magic-link plugin calls this on every request
 * (T00's call site, unchanged): delegates to the sender picked for
 * the current `env.NODE_ENV`.
 */
export async function sendMagicLinkEmail(payload: MagicLinkEmailPayload): Promise<void> {
  await createMagicLinkEmailSender().send(payload);
}
