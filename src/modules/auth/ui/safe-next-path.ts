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
  // Browsers strip tab/newline and read "\\" as "/", so "/\t/evil" is
  // protocol-relative too. Reject control chars and backslashes outright,
  // then confirm the path resolves to our own origin.
  const hasUnsafeChar = [...next].some((ch) => {
    const code = ch.charCodeAt(0);
    return code < 0x20 || code === 0x7f || ch === "\\";
  });
  if (hasUnsafeChar) {
    return null;
  }
  const base = "http://app.invalid";
  if (new URL(next, base).origin !== base) {
    return null;
  }
  return next;
}
