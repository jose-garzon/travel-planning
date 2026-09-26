"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/components/button";
import { Stack } from "@/shared/ui/components/stack";

type MotionSampleProps = {
  duration: "fast" | "normal";
};

export function MotionSample({ duration }: MotionSampleProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <Stack gap="4" align="center">
      <div className="relative h-16 w-16 overflow-hidden rounded-md bg-accent">
        {playing && (
          <div
            className={`absolute inset-0 animate-fade-in opacity-100 motion-safe:${duration === "fast" ? "duration-fast" : "duration-normal"}`}
            onAnimationEnd={() => setPlaying(false)}
          />
        )}
      </div>
      <Button onClick={() => setPlaying(true)}>Play</Button>
    </Stack>
  );
}
