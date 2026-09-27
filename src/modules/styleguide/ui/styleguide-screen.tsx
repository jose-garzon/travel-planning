import { SectionNav } from "@/modules/styleguide/ui/components/section-nav";
import { BrandSection } from "@/modules/styleguide/ui/sections/brand-section";
import { ColorSection } from "@/modules/styleguide/ui/sections/color-section";
import { IconsSection } from "@/modules/styleguide/ui/sections/icons-section";
import { MotionSection } from "@/modules/styleguide/ui/sections/motion-section";
import { PrimitivesSection } from "@/modules/styleguide/ui/sections/primitives-section";
import { RadiusShadowSection } from "@/modules/styleguide/ui/sections/radius-shadow-section";
import { STYLEGUIDE_SECTIONS } from "@/modules/styleguide/ui/sections/sections";
import { SpacingSection } from "@/modules/styleguide/ui/sections/spacing-section";
import { TypeSection } from "@/modules/styleguide/ui/sections/type-section";
import { useTranslatable } from "@/shared/ui/translatable";

/** The `/[locale]/styleguide` screen: heading, section nav and every section. */
export function StyleguideScreen() {
  const translate = useTranslatable();

  const navLinks = STYLEGUIDE_SECTIONS.map((section) => ({
    id: section.id,
    label: { translateId: section.titleKey },
  }));

  return (
    <main className="px-6 pb-16">
      <h1 className="mt-8 mb-8 text-3xl text-accent">
        {translate({ translateId: "styleguide.page.title" })}
      </h1>
      <div className="md:flex md:gap-8">
        <SectionNav label={{ translateId: "styleguide.page.navLabel" }} links={navLinks} />
        <div className="min-w-0 flex-1">
          <BrandSection />
          <ColorSection />
          <TypeSection />
          <SpacingSection />
          <RadiusShadowSection />
          <MotionSection />
          <IconsSection />
          <PrimitivesSection />
        </div>
      </div>
    </main>
  );
}
