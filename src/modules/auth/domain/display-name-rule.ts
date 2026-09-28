const MIN_LENGTH = 1;
const MAX_LENGTH = 50;

/**
 * A display name is valid at 1-50 characters (plan "Contracts";
 * feature.md EC-5). Pure length check — no trimming, no format
 * restriction (feature.md Internationalization: "no format
 * restriction beyond length").
 */
export function isValidDisplayName(name: string): boolean {
  return name.length >= MIN_LENGTH && name.length <= MAX_LENGTH;
}
