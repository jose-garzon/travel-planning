import { hasReachedMagicLinkCooldown } from "@/modules/auth/domain/magic-link-cooldown-rule";
import type { MagicLinkAttemptsReader } from "@/modules/auth/service/ports";

// D-3: the cooldown window is the last 15 minutes of `verification`
// rows for the email, independent of the magic link's own 15-minute
// validity window in `better-auth.ts` (same number, different concern).
const COOLDOWN_WINDOW_MS = 15 * 60 * 1000;

/**
 * Real check (plan.md "Magic-link cooldown"): counts recent
 * `verification` rows for `email` through `attemptsReader` (`data/`'s
 * `VerificationMagicLinkAttemptsRepository`, injected — this use case
 * declares the port it needs, architecture.md rule 3) and applies the
 * pure `hasReachedMagicLinkCooldown` domain rule. `better-auth.ts`'s
 * `hooks.before` calls this and throws `MAGIC_LINK_COOLDOWN` when it
 * returns `true`, instead of sending the email.
 */
export async function checkMagicLinkCooldown(
  email: string,
  attemptsReader: MagicLinkAttemptsReader,
): Promise<boolean> {
  const sinceIso = new Date(Date.now() - COOLDOWN_WINDOW_MS).toISOString();
  const recentCount = await attemptsReader.countRecent(email, sinceIso);
  return hasReachedMagicLinkCooldown(recentCount);
}
