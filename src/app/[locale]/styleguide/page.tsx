import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { StyleguideScreen } from "@/modules/styleguide/ui";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/styleguide">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "styleguide.page" });
  return { title: t("metaTitle") };
}

export default async function StyleguidePage({ params }: PageProps<"/[locale]/styleguide">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <StyleguideScreen />;
}
