import { StateSample } from "@/modules/styleguide/ui/components/state-sample";
import { Stack } from "@/shared/ui/components/stack";
import { Text } from "@/shared/ui/components/text";
import { useTranslatable } from "@/shared/ui/translatable";

const FONT_SIZE_LABELS = {
  xs: "font.size.xs",
  sm: "font.size.sm",
  md: "font.size.md",
  lg: "font.size.lg",
  xl: "font.size.xl",
  "2xl": "font.size.2xl",
  "3xl": "font.size.3xl",
} as const;

const FONT_SIZES = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"] as const;

export function LayoutDemo() {
  const translate = useTranslatable();

  return (
    <section aria-labelledby="layout-demo-heading" className="mt-16 border-t border-border pt-16">
      <h3 id="layout-demo-heading" className="text-accent">
        {translate({ translateId: "styleguide.layout.title" })}
      </h3>
      <StateSample label={{ translateId: "styleguide.layout.states.default" }}>
        <Stack>
          {FONT_SIZES.map((size) => (
            <Text key={size} size={size}>
              {FONT_SIZE_LABELS[size]}
            </Text>
          ))}
        </Stack>
      </StateSample>
    </section>
  );
}
