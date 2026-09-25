import { Link } from "@/shared/i18n/navigation";
import { Wordmark } from "@/shared/ui/components/wordmark";

/** Root header: home link wrapping the wordmark. No props. */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-3">
      <Link href="/">
        <Wordmark />
      </Link>
    </header>
  );
}
