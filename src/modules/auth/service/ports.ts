// Ports the auth service layer declares and `data/` implements
// (architecture.md rule 3: "Ports belong to the service").

/**
 * Reads how many magic-link requests a `data/` adapter has recorded
 * for an email, used by `check-magic-link-cooldown.ts` (plan.md
 * "Magic-link cooldown"). Implemented by
 * `VerificationMagicLinkAttemptsRepository` (D-3: reuses the
 * `verification` table, no new one).
 */
export type MagicLinkAttemptsReader = {
  /** Rows for `email` created at or after `sinceIso` (ISO 8601). */
  countRecent(email: string, sinceIso: string): Promise<number>;
};

/** Payload Better Auth's magic-link plugin hands to `sendMagicLink`. */
export type MagicLinkEmailPayload = {
  email: string;
  url: string;
  token: string;
};

/**
 * Sends the magic-link email. Implemented by `ConsoleMagicLinkEmailSender`
 * (dev/test) and `ResendMagicLinkEmailSender` (production), picked by
 * `env.NODE_ENV` in `data/send-magic-link-email.ts` (D-2).
 */
export type MagicLinkEmailSender = {
  send(payload: MagicLinkEmailPayload): Promise<void>;
};
