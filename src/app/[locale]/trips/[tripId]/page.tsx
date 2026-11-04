import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { tripMembers } from "@/app/_composition/trip-members";
import { getCurrentUser } from "@/modules/auth";
import { getTrip } from "@/modules/trips";
import { TripForm } from "@/modules/trips/ui/entries/form";
import { TravelersCard } from "@/modules/trips/ui/entries/members";
import { redirect } from "@/shared/i18n/navigation";
import type { Locale } from "@/shared/i18n/routing";

export default async function TripPage({ params }: PageProps<"/[locale]/trips/[tripId]">) {
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

  const members = await tripMembers.listTripMembers({ userId: currentUser.id, tripId });
  if (!members.ok) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "trips.edit" });

  return (
    <main className="mx-auto w-full max-w-dialog px-6 pt-4 pb-6 lg:pt-10">
      {/* The trip-name field is the visible title; this names the page. */}
      <h1 className="sr-only">{t("title")}</h1>
      {/* Keyed by version so "Reload" (a refresh) restarts the form on the latest trip. */}
      <TripForm key={result.value.version} trip={result.value} />
      <TravelersCard members={members.value} role={result.value.role} />
    </main>
  );
}
