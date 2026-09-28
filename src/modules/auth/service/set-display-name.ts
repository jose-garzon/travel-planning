import { isValidDisplayName } from "@/modules/auth/domain/display-name-rule";
import { err, ok, type Result } from "@/shared/kernel/result";

export type SetDisplayNameError = "INVALID_NAME";

/** Port: persists the confirmed display name (plan "Contracts"). */
export type DisplayNameWriter = {
  setDisplayName(name: string, confirmedAt: Date): Promise<void>;
};

/**
 * Validates 1-50 characters (domain rule `isValidDisplayName`), then
 * persists `name` and `nameConfirmedAt = now` through `writer` (plan
 * "Contracts"). An invalid name is an expected failure, returned as a
 * `Result` with no write attempt (code.md "Errors"); `writer`'s own
 * failures are unexpected and propagate by throwing.
 */
export async function setDisplayName(
  name: string,
  writer: DisplayNameWriter,
): Promise<Result<void, SetDisplayNameError>> {
  if (!isValidDisplayName(name)) {
    return err("INVALID_NAME");
  }

  await writer.setDisplayName(name, new Date());
  return ok(undefined);
}
