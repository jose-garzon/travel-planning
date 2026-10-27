import { Link } from "@/shared/i18n/navigation";
import { ThemeToggle } from "@/shared/ui/components/theme-toggle";
import { Wordmark } from "@/shared/ui/components/wordmark";

/** Root header: home link wrapping the wordmark, plus the theme toggle. No props. */
export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-page items-center justify-between px-6 pt-6 pb-2">
      <Link
        href="/"
        className="rounded-full ui-focus:outline-2 ui-focus:outline-solid ui-focus:outline-focus ui-focus:outline-offset-4"
      >
        <Wordmark />
      </Link>
      <ThemeToggle
        toDarkLabel={{ translateId: "header.themeToggle.toDark" }}
        toLightLabel={{ translateId: "header.themeToggle.toLight" }}
      />
    </header>
  );
}
