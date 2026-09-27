"use client";

import { StyleguideSection } from "@/modules/styleguide/ui/components/styleguide-section";
import { Stack } from "@/shared/ui/components/stack";
import { Text } from "@/shared/ui/components/text";

const FONT_SIZES = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"] as const;
const LINE_HEIGHTS = ["tight", "normal", "relaxed"] as const;

export function TypeSection() {
  return (
    <StyleguideSection id="type" title={{ translateId: "styleguide.type.title" }}>
      <Stack gap="8">
        {/* Display font */}
        <Stack gap="3">
          <Text as="h3" size="md" weight="semibold">
            Display
          </Text>
          <Stack gap="2">
            <Text font="display">font-display</Text>
          </Stack>
        </Stack>

        {/* Body font */}
        <Stack gap="3">
          <Text as="h3" size="md" weight="semibold">
            Body
          </Text>
          <Stack gap="2">
            <Text font="body">font-body</Text>
          </Stack>
        </Stack>

        {/* Font sizes */}
        <Stack gap="3">
          <Text as="h3" size="md" weight="semibold">
            Sizes
          </Text>
          <Stack gap="3">
            {FONT_SIZES.map((size) => (
              <Stack key={size} direction="horizontal" gap="4" align="center">
                <div className="w-24">
                  <span className="font-mono text-sm">text-{size}</span>
                </div>
                <Text as="p" size={size}>
                  The quick brown fox
                </Text>
              </Stack>
            ))}
          </Stack>
        </Stack>

        {/* Line heights */}
        <Stack gap="3">
          <Text as="h3" size="md" weight="semibold">
            Line heights
          </Text>
          <Stack gap="3">
            {LINE_HEIGHTS.map((height) => (
              <Stack key={height} gap="2">
                <span className="font-mono text-sm">leading-{height}</span>
                <Text as="p" leading={height}>
                  The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor
                  jugs.
                </Text>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </StyleguideSection>
  );
}
