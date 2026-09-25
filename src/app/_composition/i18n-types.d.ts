import type sharedEn from "@/shared/i18n/messages/en.json";

type SharedMessages = typeof sharedEn;

// `Locale` is intentionally not typed here yet: `src/app/[locale]/page.tsx`
// and other route files still pass the router's untyped `string` param to
// next-intl APIs that would then require `Locale`. Narrowing it is a
// separate, larger change across those call sites (see task report).
declare module "next-intl" {
  interface AppConfig {
    Messages: SharedMessages;
  }
}
