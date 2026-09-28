/**
 * T00 stub (plan D-3 / Risks): always allows. `better-auth.ts`'s
 * `hooks.before` already calls this on every magic-link request, so
 * T01 only replaces this body with the real check (a
 * `MagicLinkAttemptsReader` port + the `hasReachedMagicLinkCooldown`
 * domain rule) — no call-site changes.
 */
export async function checkMagicLinkCooldown(_email: string): Promise<boolean> {
  return false;
}
