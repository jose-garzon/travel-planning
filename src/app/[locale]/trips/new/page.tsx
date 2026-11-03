import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/modules/auth";
import { TripForm } from "@/modules/trips/ui/entries/form";
import { redirect } from "@/shared/i18n/navigation";

export default async function NewTripPage({ params }: PageProps<"/[locale]/trips/new">) {
  const { locale } = await params;
  setRequestLocale(locale);

  if ((await getCurrentUser()) === null) {
    redirect({ href: "/", locale });
  }

  const t = await getTranslations({ locale, namespace: "trips.form" });

  return (
    <main className="mx-auto w-full max-w-dialog px-6 pt-4 pb-6 lg:pt-10">
      {/* The trip-name field is the visible title; this names the page. */}
      <h1 className="sr-only">{t("title")}</h1>
      <p className="mb-8 text-text-muted">{t("intro")}</p>
      <TripForm />
    </main>
  );
}
