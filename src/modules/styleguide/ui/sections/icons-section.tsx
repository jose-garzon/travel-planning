"use client";

import type { LucideIcon } from "lucide-react";
import {
  Check,
  AlertCircle as CircleAlert,
  CheckCircle2 as CircleCheck,
  Loader as LoaderCircle,
  Moon,
  Sun,
  AlertTriangle as TriangleAlert,
  X,
} from "lucide-react";
import { StyleguideSection } from "@/modules/styleguide/ui/components/styleguide-section";
import { Icon } from "@/shared/ui/components/icon";
import { Stack } from "@/shared/ui/components/stack";
import { Text } from "@/shared/ui/components/text";

const ICONS: { name: string; Component: LucideIcon }[] = [
  { name: "Sun", Component: Sun },
  { name: "Moon", Component: Moon },
  { name: "LoaderCircle", Component: LoaderCircle },
  { name: "CircleAlert", Component: CircleAlert },
  { name: "CircleCheck", Component: CircleCheck },
  { name: "TriangleAlert", Component: TriangleAlert },
  { name: "X", Component: X },
  { name: "Check", Component: Check },
];

export function IconsSection() {
  return (
    <StyleguideSection id="icons" title={{ translateId: "styleguide.icons.title" }}>
      <Stack gap="8">
        {/* Decorative icons */}
        <Stack gap="3">
          <Text as="h3" size="md" weight="semibold">
            Decorative
          </Text>
          <Stack direction="horizontal" wrap gap="4">
            {ICONS.map(({ name, Component }) => (
              <Stack key={`decorative-${name}`} direction="horizontal" gap="3" align="center">
                <Icon icon={Component} size="md" aria-hidden="true" />
                <Text>{name}</Text>
              </Stack>
            ))}
          </Stack>
        </Stack>

        {/* Meaningful icons */}
        <Stack gap="3">
          <Text as="h3" size="md" weight="semibold">
            Meaningful
          </Text>
          <Stack direction="horizontal" gap="6" wrap>
            {ICONS.map(({ name, Component }) => (
              <Stack key={`meaningful-${name}`} gap="2" align="center">
                <Icon icon={Component} size="md" aria-label={name} />
                <Text size="sm">{name}</Text>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </StyleguideSection>
  );
}
