import { type RenderResult, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import defaultMessages from "@/shared/i18n/messages/en.json";

type RenderWithIntlOptions = {
  /** Overrides the default shared `en` messages for this render. */
  messages?: Record<string, unknown>;
  locale?: string;
};

/**
 * Renders `ui` wrapped in a `NextIntlClientProvider` so components
 * using `useTranslations()` / `useTranslatable()` work in tests.
 * Defaults to the shared `en` messages and the `en` locale.
 */
export function renderWithIntl(
  ui: ReactElement,
  { messages = defaultMessages, locale = "en" }: RenderWithIntlOptions = {},
): RenderResult {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}
