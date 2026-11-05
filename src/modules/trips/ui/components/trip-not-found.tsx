import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";
import { buttonClasses } from "@/shared/ui/components/button-classes";
import { LineClosed } from "@/shared/ui/components/line-closed";

/** Shown for a trip that is missing or not the user's (feature.md errors). */
export function TripNotFound() {
  const t = useTranslations("trips.edit");

  return (
    <main className="mx-auto flex w-full max-w-dialog flex-col items-start gap-4 px-6 pt-10 pb-6">
      <LineClosed className="mb-2" />
      <h1 className="font-display text-3xl font-bold">{t("notFound")}</h1>
      <Link href="/" className={buttonClasses()}>
        {t("goHome")}
      </Link>
    </main>
  );
}
