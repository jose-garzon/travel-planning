import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { tripMembers } from "@/app/_composition/trip-members";
import { getCurrentUser } from "@/modules/auth";
import { getTrip } from "@/modules/trips";
import { TripForm } from "@/modules/trips/ui/entries/form";
import { TravelersCard } from "@/modules/trips/ui/entries/members";
import { redirect } from "@/shared/i18n/navigation";
import type { Locale } from "@/shared/i18n/routing";
import { Toast } from "@/shared/ui/components/toast";

export default async function TripPage({
  params,
  searchParams,
}: PageProps<"/[locale]/trips/[tripId]">) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);

  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    redirect({ href: "/", locale });
    return null;
  }

  // Happy path reads the trip directly; only on failure do we pay for the
  // access check that tells a removed member (home + toast, feature 009 D-4)
  // from a missing trip (404). Keeps added queries within budget.
  const result = await getTrip({ userId: currentUser.id, tripId, locale: locale as Locale });
  if (!result.ok) {
    const access = await tripMembers.getTripAccess({ userId: currentUser.id, tripId });
    if (access === "not-member") {
      redirect({ href: { pathname: "/", query: { removed: "1" } }, locale });
      return null;
    }
    notFound();
  }

  const members = await tripMembers.listTripMembers({ userId: currentUser.id, tripId });
  if (!members.ok) {
    notFound();
  }

  const { joined, already, invite } = await searchParams;
  const t = await getTranslations({ locale, namespace: "trips.edit" });
  const tj = await getTranslations({ locale, namespace: "trips.join" });

  return (
    <main className="mx-auto w-full max-w-dialog px-6 pt-4 pb-6 lg:pt-10">
      {/* The trip-name field is the visible title; this names the page. */}
      <h1 className="sr-only">{t("title")}</h1>
      {joined === "1" ? (
        <Toast tone="success">{tj("joined", { trip: result.value.name })}</Toast>
      ) : null}
      {already === "1" ? <Toast tone="success">{tj("already")}</Toast> : null}
      {/* Keyed by version so "Reload" (a refresh) restarts the form on the latest trip. */}
      <TripForm key={result.value.version} trip={result.value} />
      <TravelersCard
        tripId={tripId}
        tripName={result.value.name}
        viewerId={currentUser.id}
        members={members.value}
        role={result.value.role}
        openInvite={invite === "1"}
      />
    </main>
  );
}
