import "server-only";

export type MagicLinkEmailPayload = {
  email: string;
  url: string;
  token: string;
};

/**
 * T00 stub (plan D-2): logs the magic link instead of sending it, so
 * `pnpm dev` and e2e never need a real email provider. T01 swaps this
 * body for the real pick between `ConsoleMagicLinkEmailSender` and
 * `ResendMagicLinkEmailSender` (by `env.NODE_ENV`) — this call site,
 * from `better-auth.ts`'s magic-link plugin config, does not change.
 */
export async function sendMagicLinkEmail({
  email,
  url,
  token,
}: MagicLinkEmailPayload): Promise<void> {
  // biome-ignore lint/suspicious/noConsole: dev/test stub (plan D-2); T01 replaces this with real senders.
  console.log(`[auth] magic link for ${email}: ${url} (token=${token})`);
}
