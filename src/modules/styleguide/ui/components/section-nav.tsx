import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

type SectionNavLink = {
  id: string;
  label: Translatable;
};

type SectionNavProps = {
  label: Translatable;
  links: SectionNavLink[];
};

/**
 * Jump list to every styleguide section. Server-rendered for now;
 * T11 adds the active-link and scroll-spy behavior on the client.
 */
export function SectionNav({ label, links }: SectionNavProps) {
  const translate = useTranslatable();

  return (
    <nav
      aria-label={translate(label)}
      className="md:sticky md:top-0 md:w-nav md:shrink-0 md:self-start md:pt-6"
    >
      <ul className="flex flex-wrap gap-x-4 gap-y-2 md:flex-col">
        {links.map((link) => (
          <li key={link.id}>
            <a href={`#${link.id}`}>{translate(link.label)}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
