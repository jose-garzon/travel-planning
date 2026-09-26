import { Link } from "@/shared/i18n/navigation";
import { ThemeToggle } from "@/shared/ui/components/theme-toggle";
import { Wordmark } from "@/shared/ui/components/wordmark";

/** Root header: home link wrapping the wordmark, plus the theme toggle. No props. */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-3">
      <Link href="/">
        <Wordmark />
      </Link>
      <ThemeToggle
        toDarkLabel={{ translateId: "header.themeToggle.toDark" }}
        toLightLabel={{ translateId: "header.themeToggle.toLight" }}
      />
    </header>
  );
}
