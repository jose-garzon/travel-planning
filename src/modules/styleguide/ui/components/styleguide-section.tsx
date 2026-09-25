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
    <section id={id} aria-labelledby={headingId}>
      <h2 id={headingId} tabIndex={-1}>
        {translate(title)}
      </h2>
      {children}
    </section>
  );
}
