import "server-only";
import { Resend } from "resend";
import type { MagicLinkEmailPayload, MagicLinkEmailSender } from "@/modules/auth/service/ports";
import { env } from "@/shared/config/env";

export type { MagicLinkEmailPayload };

// Placeholder sender identity (plan "Left to implementation": exact
// copy is T01's call). Swap for a verified domain address once one
// exists.
const MAGIC_LINK_FROM_ADDRESS = "Travel Planning <onboarding@resend.dev>";

/**
 * Dev/test adapter (D-2): logs the magic link instead of sending it,
 * so `pnpm dev` and e2e never need a real email provider.
 */
class ConsoleMagicLinkEmailSender implements MagicLinkEmailSender {
  async send({ email, url, token }: MagicLinkEmailPayload): Promise<void> {
    // biome-ignore lint/suspicious/noConsole: dev/test adapter (plan D-2).
    console.log(`[auth] magic link for ${email}: ${url} (token=${token})`);
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

  async send({ email, url }: MagicLinkEmailPayload): Promise<void> {
    const { error } = await this.client.emails.send({
      from: MAGIC_LINK_FROM_ADDRESS,
      to: email,
      subject: "Your sign-in link",
      html: `<p>Tap the link below to sign in.</p><p><a href="${url}">${url}</a></p>`,
    });

    if (error !== null) {
      throw new Error(`Failed to send magic-link email: ${error.message}`);
    }
  }
}

/**
 * Picks the sender by `env.NODE_ENV` (D-2): `ConsoleMagicLinkEmailSender`
 * everywhere except production, `ResendMagicLinkEmailSender` there.
 */
function createMagicLinkEmailSender(): MagicLinkEmailSender {
  if (env.NODE_ENV === "production") {
    if (env.RESEND_API_KEY === undefined) {
      throw new Error("RESEND_API_KEY is required in production (see env.ts, plan D-2).");
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
