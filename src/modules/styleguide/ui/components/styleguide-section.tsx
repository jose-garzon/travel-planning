import type { ReactNode } from "react";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

type StyleguideSectionProps = {
  id: string;
  title: Translatable;
  children?: ReactNode;
};

/** One top-level styleguide section: heading + landmark, scroll target for `SectionNav`. */
export function StyleguideSection({ id, title, children }: StyleguideSectionProps) {
  const translate = useTranslatable();
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="mt-16 border-t border-border pt-16 first:mt-0 first:border-t-0 first:pt-0"
    >
      <h2 id={headingId} tabIndex={-1}>
        {translate(title)}
      </h2>
      {children}
    </section>
  );
}
