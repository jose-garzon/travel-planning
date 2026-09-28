import { getTranslations, setRequestLocale } from "next-intl/server";

// Placeholder route (plan "Left to implementation" / D-4): the real
// Trips feature replaces this. `EmptyTripsState`'s CTA links here.
export default async function NewTripPage({ params }: PageProps<"/[locale]/trips/new">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "trips.placeholder" });

  return (
    <main className="px-6 py-12">
      <h1 className="text-3xl text-accent">{t("title")}</h1>
    </main>
  );
}
