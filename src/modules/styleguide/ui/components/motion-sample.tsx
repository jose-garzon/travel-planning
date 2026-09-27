"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/components/button";
import { Stack } from "@/shared/ui/components/stack";

type MotionSampleProps = {
  duration: "fast" | "normal";
};

// Full, literal class strings: Tailwind's build-time scanner only picks up
// complete class tokens in source, not ones assembled by interpolating a
// runtime value into a template string.
const DURATION_CLASSES: Record<MotionSampleProps["duration"], string> = {
  fast: "motion-safe:duration-fast",
  normal: "motion-safe:duration-normal",
};

export function MotionSample({ duration }: MotionSampleProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <Stack gap="4" align="center">
      <div className="relative h-16 w-16 overflow-hidden rounded-md bg-accent">
        {playing && (
          <div
            className={`absolute inset-0 bg-surface-1 animate-fade-in opacity-100 ${DURATION_CLASSES[duration]}`}
            onAnimationEnd={() => setPlaying(false)}
          />
        )}
      </div>
      <Button onClick={() => setPlaying(true)}>Play</Button>
    </Stack>
  );
}
