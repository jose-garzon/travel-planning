import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/modules/auth";
import { getTrip } from "@/modules/trips";
import { TripForm, TripNotFound } from "@/modules/trips/ui";
import { Link, redirect } from "@/shared/i18n/navigation";
import type { Locale } from "@/shared/i18n/routing";

export default async function EditTripPage({ params }: PageProps<"/[locale]/trips/[tripId]">) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);

  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    redirect({ href: "/", locale });
  }

  const result = await getTrip({
    tripId,
    userId: currentUser?.id ?? "",
    locale: locale as Locale,
  });
  if (!result.ok) {
    return <TripNotFound />;
  }

  const t = await getTranslations({ locale, namespace: "trips" });

  return (
    <main className="mx-auto w-full max-w-dialog px-6 pt-4 pb-6 lg:pt-10">
      <div className="mb-6 flex items-center justify-end gap-4">
        <h1 className="sr-only">{t("edit.title")}</h1>
        <Link
          href="/"
          className="min-h-touch content-center font-semibold underline underline-offset-4 ui-hover:text-accent"
        >
          {t("form.cancel")}
        </Link>
      </div>
      <TripForm trip={result.value} />
    </main>
  );
}
