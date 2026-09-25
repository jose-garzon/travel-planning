type ClassPart = string | false | null | undefined;

/** Joins truthy class name parts with a single space. */
export function cx(...parts: ClassPart[]): string {
  return parts.filter((part): part is string => Boolean(part)).join(" ");
}
