import { Link } from "@/shared/i18n/navigation";
import { ThemeToggle } from "@/shared/ui/components/theme-toggle";
import { Wordmark } from "@/shared/ui/components/wordmark";

/** Root header: home link wrapping the wordmark, plus the theme toggle. No props. */
export function SiteHeader() {
  return (
    <header className="px-4 py-3">
      <div className="mx-auto flex max-w-page items-center justify-between">
        <Link href="/">
          <Wordmark />
        </Link>
        <ThemeToggle
          toDarkLabel={{ translateId: "header.themeToggle.toDark" }}
          toLightLabel={{ translateId: "header.themeToggle.toLight" }}
        />
      </div>
    </header>
  );
}
