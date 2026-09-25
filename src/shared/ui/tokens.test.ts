import { describe, expect, it } from "vitest";
import { contrastRatio, readTokens, readTokensCss } from "../../../tests/steps/support/tokens";

// AC-3: every listed token exists with a light and dark value where
// they differ. Plan "Tokens" is the source for names and values.
const COLOR_TOKENS_WITH_LIGHT_DARK = [
  "color-bg",
  "color-surface-1",
  "color-surface-2",
  "color-surface-3",
  "color-text",
  "color-text-muted",
  "color-border",
  "color-border-strong",
  "color-accent",
  "color-accent-hover",
  "color-on-accent",
  "color-success",
  "color-warning",
  "color-error",
];

const FONT_SIZE_TOKENS: Record<string, string> = {
  "text-xs": "0.75rem",
  "text-sm": "0.875rem",
  "text-md": "1rem",
  "text-lg": "1.125rem",
  "text-xl": "1.375rem",
  "text-2xl": "1.75rem",
  "text-3xl": "2.25rem",
};

const LINE_HEIGHT_TOKENS: Record<string, string> = {
  "leading-tight": "1.15",
  "leading-normal": "1.5",
  "leading-relaxed": "1.7",
};

const RADIUS_TOKENS: Record<string, string> = {
  "radius-sm": "0.5rem",
  "radius-md": "1rem",
  "radius-lg": "1.5rem",
  "radius-full": "9999px",
};

const SPACE_TOKENS: Record<string, string> = {
  "spacing-0": "0",
  "spacing-1": "0.25rem",
  "spacing-2": "0.5rem",
  "spacing-3": "0.75rem",
  "spacing-4": "1rem",
  "spacing-5": "1.25rem",
  "spacing-6": "1.5rem",
  "spacing-7": "1.75rem",
  "spacing-8": "2rem",
  "spacing-10": "2.5rem",
  "spacing-12": "3rem",
  "spacing-16": "4rem",
};

const DURATION_TOKENS: Record<string, string> = {
  "motion-duration-fast": "150ms",
  "motion-duration-normal": "250ms",
};

describe("tokens.css", () => {
  it("starts the @theme block by resetting every default token", () => {
    const css = readTokensCss();

    expect(css).toMatch(/@theme\s*{\s*--\*:\s*initial;/);
  });

  it.each(COLOR_TOKENS_WITH_LIGHT_DARK)("defines --%s with a light and a dark value", (name) => {
    const tokens = readTokens();

    const value = tokens[name];

    expect(value).toBeDefined();
    expect(value).toEqual(
      expect.objectContaining({ light: expect.any(String), dark: expect.any(String) }),
    );
  });

  it("defines --color-focus by resolving to --color-accent", () => {
    const tokens = readTokens();

    expect(tokens["color-focus"]).toEqual(tokens["color-accent"]);
  });

  it("defines the display and body font family tokens", () => {
    const tokens = readTokens();

    expect(tokens["font-display"]).toBe("var(--font-fredoka)");
    expect(tokens["font-body"]).toBe("var(--font-plus-jakarta-sans)");
  });

  it.each(Object.entries(FONT_SIZE_TOKENS))("defines --%s as %s (rem)", (name, expected) => {
    const tokens = readTokens();

    const value = tokens[name];

    expect(value).toBe(expected);
    expect(value).toMatch(/rem$/);
  });

  it.each(Object.entries(LINE_HEIGHT_TOKENS))(
    "defines --%s as the unitless value %s",
    (name, expected) => {
      const tokens = readTokens();

      const value = tokens[name] as string;

      expect(value).toBe(expected);
      expect(value).toMatch(/^\d+(\.\d+)?$/);
    },
  );

  it.each(Object.entries(RADIUS_TOKENS))("defines --%s as %s", (name, expected) => {
    const tokens = readTokens();

    expect(tokens[name]).toBe(expected);
  });

  it.each(Object.entries(SPACE_TOKENS))("defines --%s as %s", (name, expected) => {
    const tokens = readTokens();

    expect(tokens[name]).toBe(expected);
  });

  it.each(Object.entries(DURATION_TOKENS))("defines --%s as %s", (name, expected) => {
    const tokens = readTokens();

    expect(tokens[name]).toBe(expected);
  });

  it("defines the ease-out easing token", () => {
    const tokens = readTokens();

    expect(tokens["ease-out"]).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
  });

  it("defines the touch target, icon and sheet spacing tokens", () => {
    const tokens = readTokens();

    expect(tokens["spacing-touch"]).toBe("2.75rem");
    expect(tokens["spacing-icon-sm"]).toBe("1rem");
    expect(tokens["spacing-icon-md"]).toBe("1.25rem");
    expect(tokens["spacing-icon-lg"]).toBe("1.5rem");
    expect(tokens["spacing-sheet"]).toBe("85dvh");
  });

  it("defines the container width tokens", () => {
    const tokens = readTokens();

    expect(tokens["container-prose"]).toBe("70ch");
    expect(tokens["container-nav"]).toBe("14rem");
    expect(tokens["container-dialog"]).toBe("32rem");
    expect(tokens["container-page"]).toBe("72rem");
    expect(tokens["container-card"]).toBe("18rem");
  });

  it("defines the shadow tokens for the light theme", () => {
    const tokens = readTokens();

    expect(tokens["shadow-sm"]).toBe(
      "0 1px 2px var(--color-shadow), 0 1px 1px var(--color-shadow)",
    );
    expect(tokens["shadow-md"]).toBe(
      "0 4px 12px var(--color-shadow), 0 1px 3px var(--color-shadow)",
    );
  });

  describe("contrast", () => {
    const MIN_TEXT_CONTRAST = 4.5;
    const MIN_UI_CONTRAST = 3;

    const backgrounds = ["color-bg", "color-surface-1", "color-surface-2", "color-surface-3"];

    it.each(["light", "dark"] as const)(
      "text on every bg/surface passes 4.5:1 in the %s theme",
      (theme) => {
        const tokens = readTokens();
        const text = (tokens["color-text"] as { light: string; dark: string })[theme];

        for (const bgName of backgrounds) {
          const bg = (tokens[bgName] as { light: string; dark: string })[theme];
          expect(contrastRatio(text, bg)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
        }
      },
    );

    it.each(["light", "dark"] as const)(
      "text-muted on every bg/surface passes 4.5:1 in the %s theme",
      (theme) => {
        const tokens = readTokens();
        const textMuted = (tokens["color-text-muted"] as { light: string; dark: string })[theme];

        for (const bgName of backgrounds) {
          const bg = (tokens[bgName] as { light: string; dark: string })[theme];
          expect(contrastRatio(textMuted, bg)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
        }
      },
    );

    it.each(["light", "dark"] as const)(
      "accent on every bg/surface passes 4.5:1 in the %s theme",
      (theme) => {
        const tokens = readTokens();
        const accent = (tokens["color-accent"] as { light: string; dark: string })[theme];

        for (const bgName of backgrounds) {
          const bg = (tokens[bgName] as { light: string; dark: string })[theme];
          expect(contrastRatio(accent, bg)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
        }
      },
    );

    it.each(["light", "dark"] as const)(
      "on-accent on accent and accent-hover passes 4.5:1 in the %s theme",
      (theme) => {
        const tokens = readTokens();
        const onAccent = (tokens["color-on-accent"] as { light: string; dark: string })[theme];

        for (const bgName of ["color-accent", "color-accent-hover"]) {
          const bg = (tokens[bgName] as { light: string; dark: string })[theme];
          expect(contrastRatio(onAccent, bg)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
        }
      },
    );

    it.each(["light", "dark"] as const)(
      "success, warning and error pass 4.5:1 on bg and surface-1 in the %s theme",
      (theme) => {
        const tokens = readTokens();

        for (const name of ["color-success", "color-warning", "color-error"]) {
          const fg = (tokens[name] as { light: string; dark: string })[theme];
          for (const bgName of ["color-bg", "color-surface-1"]) {
            const bg = (tokens[bgName] as { light: string; dark: string })[theme];
            expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
          }
        }
      },
    );

    it.each(["light", "dark"] as const)(
      "border-strong passes 3:1 on bg and surface-1 in the %s theme",
      (theme) => {
        const tokens = readTokens();
        const borderStrong = (tokens["color-border-strong"] as { light: string; dark: string })[
          theme
        ];

        for (const bgName of ["color-bg", "color-surface-1"]) {
          const bg = (tokens[bgName] as { light: string; dark: string })[theme];
          expect(contrastRatio(borderStrong, bg)).toBeGreaterThanOrEqual(MIN_UI_CONTRAST);
        }
      },
    );
  });
});
