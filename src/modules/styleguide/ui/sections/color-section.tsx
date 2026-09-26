"use client";

import { StyleguideSection } from "@/modules/styleguide/ui/components/styleguide-section";
import { Stack } from "@/shared/ui/components/stack";

const COLOR_TOKENS = [
  { name: "color-bg", swatchClassName: "swatch-color-bg" },
  { name: "color-surface-1", swatchClassName: "swatch-color-surface-1" },
  { name: "color-surface-2", swatchClassName: "swatch-color-surface-2" },
  { name: "color-surface-3", swatchClassName: "swatch-color-surface-3" },
  { name: "color-text", swatchClassName: "swatch-color-text" },
  { name: "color-text-muted", swatchClassName: "swatch-color-text-muted" },
  { name: "color-border", swatchClassName: "swatch-color-border" },
  { name: "color-border-strong", swatchClassName: "swatch-color-border-strong" },
  { name: "color-accent", swatchClassName: "swatch-color-accent" },
  { name: "color-accent-hover", swatchClassName: "swatch-color-accent-hover" },
  { name: "color-on-accent", swatchClassName: "swatch-color-on-accent" },
  { name: "color-success", swatchClassName: "swatch-color-success" },
  { name: "color-warning", swatchClassName: "swatch-color-warning" },
  { name: "color-error", swatchClassName: "swatch-color-error" },
  { name: "color-focus", swatchClassName: "swatch-color-focus" },
  { name: "color-secondary", swatchClassName: "swatch-color-secondary" },
  { name: "color-secondary-hover", swatchClassName: "swatch-color-secondary-hover" },
  { name: "color-on-secondary", swatchClassName: "swatch-color-on-secondary" },
  { name: "color-scrim", swatchClassName: "swatch-color-scrim" },
  { name: "color-on-scrim", swatchClassName: "swatch-color-on-scrim" },
] as const;

function ColorSwatch({
  tokenName,
  swatchClassName,
}: {
  tokenName: string;
  swatchClassName: string;
}) {
  return (
    <Stack direction="horizontal" gap="3" align="center">
      <div className={`h-12 w-12 rounded-md border border-border ${swatchClassName}`} />
      <Stack gap="1">
        <span className="font-mono text-sm">{tokenName}</span>
      </Stack>
    </Stack>
  );
}

export function ColorSection() {
  return (
    <StyleguideSection id="color" title={{ translateId: "styleguide.color.title" }}>
      <Stack direction="horizontal" gap="6" wrap>
        <div data-theme="light" className="flex-1 min-w-80 bg-bg p-4 rounded-lg">
          <h3 className="mb-4 text-md font-semibold">Light</h3>
          <Stack gap="3">
            {COLOR_TOKENS.map((token) => (
              <ColorSwatch
                key={token.name}
                tokenName={token.name}
                swatchClassName={token.swatchClassName}
              />
            ))}
          </Stack>
        </div>
        <div data-theme="dark" className="flex-1 min-w-80 bg-bg p-4 rounded-lg">
          <h3 className="mb-4 text-md font-semibold">Dark</h3>
          <Stack gap="3">
            {COLOR_TOKENS.map((token) => (
              <ColorSwatch
                key={token.name}
                tokenName={token.name}
                swatchClassName={token.swatchClassName}
              />
            ))}
          </Stack>
        </div>
      </Stack>
    </StyleguideSection>
  );
}
