import "server-only";
import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { magicLink } from "better-auth/plugins/magic-link";
import { sendMagicLinkEmail } from "@/modules/auth/data/send-magic-link-email";
import { VerificationMagicLinkAttemptsRepository } from "@/modules/auth/data/verification-magic-link-attempts-repository";
import { checkMagicLinkCooldown } from "@/modules/auth/service/check-magic-link-cooldown";
import { env } from "@/shared/config/env";
import { db } from "@/shared/db/client";
import * as authSchema from "@/shared/db/schema/auth";

// plan.md "Contracts": magic links are valid for 15 minutes.
const MAGIC_LINK_EXPIRES_IN_SECONDS = 15 * 60;

const MAGIC_LINK_SIGN_IN_PATH = "/sign-in/magic-link";

// `checkMagicLinkCooldown` (service) declares the port it needs and
// takes it as a parameter (architecture.md rule 3: "Ports belong to
// the service"; service must not import `data/`). This file already
// wires `data/`'s adapters into the magic-link plugin, so it wires
// this one too.
const magicLinkAttemptsReader = new VerificationMagicLinkAttemptsRepository();

/**
 * The Better Auth instance (plan "Architecture"): magic-link plugin,
 * wired to `sendMagicLinkEmail` (T01: real console/Resend senders) and
 * `checkMagicLinkCooldown` (T01: real check, plus the concrete
 * `magicLinkAttemptsReader` above — the one T01 change to this file,
 * needed because service must not import `data/`). `hooks.before`
 * calls the cooldown check on every magic-link request and throws
 * `MAGIC_LINK_COOLDOWN` when it's reached (plan.md "Magic-link
 * cooldown"); the response body carries it as `code`, which
 * T01's `use-request-magic-link.ts` branches on.
 */
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  // Better Auth's own IP rate limit is on in production builds; CI's
  // e2e (a production build, every request from one IP) turns it off.
  ...(env.AUTH_RATE_LIMIT === "off" ? { rateLimit: { enabled: false } } : {}),
  database: drizzleAdapter(db, { provider: "sqlite", schema: authSchema }),
  user: {
    additionalFields: {
      // plan "Data model": null until the first name capture (T02).
      nameConfirmedAt: { type: "date", required: false, input: false },
    },
  },
  plugins: [
    magicLink({
      expiresIn: MAGIC_LINK_EXPIRES_IN_SECONDS,
      sendMagicLink: async ({ email, url, token }) => {
        await sendMagicLinkEmail({ email, url, token });
      },
    }),
  ],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== MAGIC_LINK_SIGN_IN_PATH) {
        return;
      }

      const email = (ctx.body as { email?: string } | undefined)?.email;
      if (email === undefined) {
        return;
      }

      const cooldownReached = await checkMagicLinkCooldown(email, magicLinkAttemptsReader);
      if (cooldownReached) {
        throw new APIError("TOO_MANY_REQUESTS", {
          code: "MAGIC_LINK_COOLDOWN",
          message: "Too many requests. Try again in a few minutes.",
        });
      }
    }),
  },
});
