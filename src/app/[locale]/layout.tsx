import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/shared/i18n/routing";
import { Analytics } from "@/shared/ui/components/analytics";
import { ServiceWorker } from "@/shared/ui/components/service-worker";
import { SiteHeader } from "@/shared/ui/components/site-header";
import { TimeZoneCookie } from "@/shared/ui/components/time-zone-cookie";
import { cx } from "@/shared/ui/cx";
import { barlowCondensed, onest } from "@/shared/ui/fonts";
import { parseTheme, THEME_COOKIE } from "@/shared/ui/theme";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: t("appName"), description: t("tagline") };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html
      lang={locale}
      dir="ltr"
      data-theme={theme}
      className={cx(barlowCondensed.variable, onest.variable)}
    >
      <body>
        <NextIntlClientProvider>
          <TimeZoneCookie />
          <SiteHeader />
          {children}
          <ServiceWorker />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
