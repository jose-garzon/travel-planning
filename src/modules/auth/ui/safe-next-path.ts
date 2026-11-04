/**
 * Returns `next` when it is a relative path inside the app, else `null`
 * (feature 009 D-3). Absolute URLs and protocol-relative ones (`//host`,
 * and `/\host`, which browsers read the same way) would make the name
 * capture a redirect to any site.
 */
export function safeNextPath(next: string | undefined): string | null {
  if (next === undefined || !next.startsWith("/")) {
    return null;
  }
  if (next.startsWith("//") || next.startsWith("/\\")) {
    return null;
  }
  return next;
}
