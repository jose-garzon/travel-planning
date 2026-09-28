import "server-only";
import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { magicLink } from "better-auth/plugins/magic-link";
import { sendMagicLinkEmail } from "@/modules/auth/data/send-magic-link-email";
import { checkMagicLinkCooldown } from "@/modules/auth/service/check-magic-link-cooldown";
import { env } from "@/shared/config/env";
import { db } from "@/shared/db/client";
import * as authSchema from "@/shared/db/schema/auth";

// plan.md "Contracts": magic links are valid for 15 minutes.
const MAGIC_LINK_EXPIRES_IN_SECONDS = 15 * 60;

const MAGIC_LINK_SIGN_IN_PATH = "/sign-in/magic-link";

/**
 * The Better Auth instance (plan "Architecture"): magic-link plugin,
 * wired to the two stubs (`sendMagicLinkEmail`, `checkMagicLinkCooldown`)
 * so T01 only replaces their bodies, never this file (tasks.md T00
 * Steps 4). `hooks.before` calls the cooldown check on every magic-link
 * request and throws `MAGIC_LINK_COOLDOWN` when it's reached (plan.md
 * "Magic-link cooldown"); the client SDK surfaces that as
 * `error.code`, which T01's `use-request-magic-link.ts` branches on.
 */
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
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

      const cooldownReached = await checkMagicLinkCooldown(email);
      if (cooldownReached) {
        throw new APIError("TOO_MANY_REQUESTS", {
          code: "MAGIC_LINK_COOLDOWN",
          message: "Too many requests. Try again in a few minutes.",
        });
      }
    }),
  },
});
