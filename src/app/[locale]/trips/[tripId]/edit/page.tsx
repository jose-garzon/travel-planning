import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/modules/auth";
import { getTrip } from "@/modules/trips";
import { TripForm } from "@/modules/trips/ui/entries/form";
import { redirect } from "@/shared/i18n/navigation";
import type { Locale } from "@/shared/i18n/routing";

/** Edit a trip's name, currency and route, on a page of its own. */
export default async function EditTripPage({ params }: PageProps<"/[locale]/trips/[tripId]/edit">) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);

  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    redirect({ href: "/", locale });
    return null;
  }
  const result = await getTrip({ userId: currentUser.id, tripId, locale: locale as Locale });
  if (!result.ok) {
    notFound();
  }
  const t = await getTranslations({ locale, namespace: "trips.edit" });

  return (
    <main className="mx-auto w-full max-w-dialog px-6 pb-6">
      {/* The trip-name field is the visible title; this names the page. */}
      <h1 className="sr-only">{t("title")}</h1>
      {/* Keyed by version so "Reload" (a refresh) restarts the form on the latest trip. */}
      <TripForm key={result.value.version} trip={result.value} />
    </main>
  );
}
