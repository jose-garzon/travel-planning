import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";

/** Shown for a trip that is missing or not the user's (feature.md errors). */
export function TripNotFound() {
  const t = useTranslations("trips.edit");

  return (
    <main className="mx-auto flex w-full max-w-dialog flex-col items-start gap-4 px-6 pt-10 pb-6">
      <h1 className="text-xl font-bold">{t("notFound")}</h1>
      <Link
        href="/"
        className="min-h-touch content-center font-semibold underline underline-offset-4 ui-hover:text-accent"
      >
        {t("goHome")}
      </Link>
    </main>
  );
}
