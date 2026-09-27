"use client";

import { MotionSample } from "@/modules/styleguide/ui/components/motion-sample";
import { StyleguideSection } from "@/modules/styleguide/ui/components/styleguide-section";
import { Stack } from "@/shared/ui/components/stack";

const MOTION_TOKENS = [
  { name: "motion-duration-fast", duration: "fast" as const },
  { name: "motion-duration-normal", duration: "normal" as const },
  { name: "ease-out", duration: "normal" as const },
] as const;

export function MotionSection() {
  return (
    <StyleguideSection id="motion" title={{ translateId: "styleguide.motion.title" }}>
      <Stack gap="6">
        {MOTION_TOKENS.map((token) => (
          <Stack key={token.name} gap="3">
            <h3 className="font-mono font-semibold text-md">{token.name}</h3>
            <MotionSample duration={token.duration} />
          </Stack>
        ))}
      </Stack>
    </StyleguideSection>
  );
}
