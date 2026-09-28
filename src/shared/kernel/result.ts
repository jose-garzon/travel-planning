// Cross-cutting kernel primitive (architecture.md "Shared kernel":
// `Result` is listed there, but no file existed yet — this is its
// first use case, `setDisplayName` (plan "Contracts"). Kept minimal:
// a discriminated union plus the two constructors every caller needs,
// not a library (code.md #4 "No speculative generality").

/** An expected success (`value`) or an expected failure (`error`), never both. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
