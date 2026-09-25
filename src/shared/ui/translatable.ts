import { type TranslationValues, useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * Any full dot-path key of the app messages (e.g.
 * "styleguide.button.sample"), typed through next-intl's `AppConfig`
 * (see `src/app/_composition/i18n-types.d.ts`). Derived from
 * `useTranslations()` called with no namespace, so it always matches
 * what next-intl accepts. `<never>` pins the namespace explicitly;
 * otherwise TypeScript widens the omitted type parameter to its
 * constraint instead of its default when read through `typeof`.
 */
export type MessageKey = Parameters<ReturnType<typeof useTranslations<never>>>[0];

/** Literal text, or a message key with optional ICU values. */
export type Translatable = string | { translateId: MessageKey; values?: TranslationValues };

/** Content of single-text primitives (e.g. `Text`, `Button`): children XOR key. */
export type TextContent =
  | { children: ReactNode; translateId?: never; values?: never }
  | { translateId: MessageKey; values?: TranslationValues; children?: never };

/**
 * Returns a resolver for `Translatable` props: a plain string is
 * returned as is, a `{ translateId }` is translated with
 * `useTranslations()` (no namespace). Works in server and client
 * components, as long as the component itself stays sync (next-intl
 * rule for `useTranslations()`).
 */
export function useTranslatable() {
  const t = useTranslations();

  return (text: Translatable): string => {
    if (typeof text === "string") {
      return text;
    }

    return t(text.translateId, text.values);
  };
}
