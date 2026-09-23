import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("common");

  return (
    <main>
      <h1>{t("appName")}</h1>
      <p>{t("tagline")}</p>
    </main>
  );
}
