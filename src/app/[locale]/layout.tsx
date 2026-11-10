import type { Metadata, Viewport } from "next";
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
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  // A theme picked in the app wins; otherwise the favicon follows the OS.
  const favicon = theme === undefined ? "/favicon.svg" : `/favicon-${theme}.svg`;
  const appleIcon = theme === "dark" ? "/icon-dark-192.png" : "/icon-192.png";
  return {
    title: t("appName"),
    description: t("tagline"),
    icons: { icon: { url: favicon, type: "image/svg+xml" }, apple: appleIcon },
  };
}

// Browser chrome colors cannot read CSS tokens; these mirror the `bg` token.
// biome-ignore lint/plugin: no token access in the meta theme-color.
const CHROME_LIGHT = "#ffffff";
// biome-ignore lint/plugin: no token access in the meta theme-color.
const CHROME_DARK = "#0e1220";

export async function generateViewport(): Promise<Viewport> {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  if (theme !== undefined) {
    return { themeColor: theme === "dark" ? CHROME_DARK : CHROME_LIGHT };
  }
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: CHROME_LIGHT },
      { media: "(prefers-color-scheme: dark)", color: CHROME_DARK },
    ],
  };
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
      data-scroll-behavior="smooth"
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
