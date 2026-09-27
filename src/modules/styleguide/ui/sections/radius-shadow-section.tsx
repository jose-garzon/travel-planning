"use client";

import { StyleguideSection } from "@/modules/styleguide/ui/components/styleguide-section";
import { Stack } from "@/shared/ui/components/stack";
import { Text } from "@/shared/ui/components/text";

const RADIUS_TOKENS = ["radius-sm", "radius-md", "radius-lg", "radius-full"] as const;
const SHADOW_TOKENS = ["shadow-sm", "shadow-md"] as const;

// Mapping token names to Tailwind classes
const RADIUS_CLASS_MAP: Record<(typeof RADIUS_TOKENS)[number], string> = {
  "radius-sm": "rounded-sm",
  "radius-md": "rounded-md",
  "radius-lg": "rounded-lg",
  "radius-full": "rounded-full",
};

const SHADOW_CLASS_MAP: Record<(typeof SHADOW_TOKENS)[number], string> = {
  "shadow-sm": "shadow-sm",
  "shadow-md": "shadow-md",
};

export function RadiusShadowSection() {
  return (
    <StyleguideSection id="radius-shadow" title={{ translateId: "styleguide.radiusShadow.title" }}>
      <Stack gap="8">
        {/* Radius section */}
        <Stack gap="3">
          <Text as="h3" size="md" weight="semibold">
            Radius
          </Text>
          <Stack direction="horizontal" gap="6" wrap>
            {RADIUS_TOKENS.map((token) => (
              <Stack key={token} gap="2" align="center">
                <div
                  className={`${RADIUS_CLASS_MAP[token]} h-16 w-16 border border-border bg-surface-1`}
                />
                <span className="font-mono text-sm">{token}</span>
              </Stack>
            ))}
          </Stack>
        </Stack>

        {/* Shadow section */}
        <Stack gap="3">
          <Text as="h3" size="md" weight="semibold">
            Shadow
          </Text>
          <Stack direction="horizontal" gap="6" wrap>
            {SHADOW_TOKENS.map((token) => (
              <Stack key={token} gap="2" align="center">
                <div
                  className={`${SHADOW_CLASS_MAP[token]} h-16 w-16 rounded-md border border-border bg-surface-1`}
                />
                <span className="font-mono text-sm">{token}</span>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </StyleguideSection>
  );
}
