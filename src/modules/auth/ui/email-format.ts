// Loose on purpose: catches obviously malformed input (AC-9) without
// re-implementing RFC 5322. The server (Better Auth's own zod schema)
// is the real gate.
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_FORMAT.test(email);
}
