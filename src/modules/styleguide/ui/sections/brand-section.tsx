import type { LucideIcon } from "lucide-react";
import { Check, X } from "lucide-react";
import { StyleguideSection } from "@/modules/styleguide/ui/components/styleguide-section";
import { Icon } from "@/shared/ui/components/icon";
import { Stack } from "@/shared/ui/components/stack";
import { Text } from "@/shared/ui/components/text";
import { Wordmark } from "@/shared/ui/components/wordmark";

const VOICE_RULES = ["friend", "direct", "sentenceCase", "actionVerbs"] as const;

function VoiceExample({
  icon: IconComponent,
  labelId,
  exampleId,
}: {
  icon: LucideIcon;
  labelId: "styleguide.brand.doLabel" | "styleguide.brand.dontLabel";
  exampleId: `styleguide.brand.voice.${(typeof VOICE_RULES)[number]}.${"do" | "dont"}`;
}) {
  return (
    <Stack direction="horizontal" gap="2" align="start">
      <Stack direction="horizontal" gap="2" align="center">
        <Icon icon={IconComponent} size="md" />
        <Text translateId={labelId} />
      </Stack>
      <Text translateId={exampleId} />
    </Stack>
  );
}

export function BrandSection() {
  return (
    <StyleguideSection id="brand" title={{ translateId: "styleguide.brand.title" }}>
      <Stack gap="8">
        <Stack gap="3">
          <Text as="h3" size="lg" weight="semibold" translateId="styleguide.brand.name" />
          <Text translateId="styleguide.brand.meaning" />
        </Stack>

        <Stack gap="3">
          <Text as="h3" size="lg" weight="semibold" translateId="styleguide.brand.wordmark" />
          <Stack direction="horizontal" gap="4" align="center" wrap>
            <Wordmark />
            <Text translateId="styleguide.brand.wordmarkDirection" />
          </Stack>
        </Stack>

        <Stack gap="6">
          {VOICE_RULES.map((rule) => (
            <Stack as="article" key={rule} gap="3">
              <Text
                as="h3"
                size="md"
                weight="semibold"
                translateId={`styleguide.brand.voice.${rule}.title`}
              />
              <Stack direction="vertical" gap="4">
                <VoiceExample
                  icon={Check}
                  labelId="styleguide.brand.doLabel"
                  exampleId={`styleguide.brand.voice.${rule}.do`}
                />
                <VoiceExample
                  icon={X}
                  labelId="styleguide.brand.dontLabel"
                  exampleId={`styleguide.brand.voice.${rule}.dont`}
                />
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </StyleguideSection>
  );
}
