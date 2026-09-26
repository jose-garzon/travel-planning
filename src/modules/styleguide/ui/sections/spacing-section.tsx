"use client";

import { StyleguideSection } from "@/modules/styleguide/ui/components/styleguide-section";
import { Stack } from "@/shared/ui/components/stack";

const SPACE_TOKENS = [
  "spacing-1",
  "spacing-2",
  "spacing-3",
  "spacing-4",
  "spacing-5",
  "spacing-6",
  "spacing-7",
  "spacing-8",
  "spacing-10",
  "spacing-12",
  "spacing-16",
] as const;

// Mapping token names to Tailwind width classes
const SPACE_CLASS_MAP: Record<(typeof SPACE_TOKENS)[number], string> = {
  "spacing-1": "w-1",
  "spacing-2": "w-2",
  "spacing-3": "w-3",
  "spacing-4": "w-4",
  "spacing-5": "w-5",
  "spacing-6": "w-6",
  "spacing-7": "w-7",
  "spacing-8": "w-8",
  "spacing-10": "w-10",
  "spacing-12": "w-12",
  "spacing-16": "w-16",
};

export function SpacingSection() {
  return (
    <StyleguideSection id="spacing" title={{ translateId: "styleguide.spacing.title" }}>
      <Stack gap="4">
        {SPACE_TOKENS.map((token) => (
          <Stack key={token} direction="horizontal" gap="3" align="center">
            <div className={`${SPACE_CLASS_MAP[token]} h-4 bg-accent`} />
            <span className="font-mono text-sm">{token}</span>
          </Stack>
        ))}
      </Stack>
    </StyleguideSection>
  );
}
