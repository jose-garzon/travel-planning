// plan.md "Magic-link cooldown": three requests within the cooldown
// window (D-3's 15-minute `verification` window, counted by
// `service/check-magic-link-cooldown.ts`) block a fourth. Pure rule
// (code.md #1): the caller counts and passes in a plain number.
const MAGIC_LINK_COOLDOWN_THRESHOLD = 3;

/**
 * `true` once `recentCount` (magic-link requests for one email in the
 * cooldown window) reaches the threshold — the request that would be
 * the 3rd (and every one after) is blocked (plan.md "Magic-link
 * cooldown", AC-10/EC-1).
 */
export function hasReachedMagicLinkCooldown(recentCount: number): boolean {
  return recentCount >= MAGIC_LINK_COOLDOWN_THRESHOLD;
}
