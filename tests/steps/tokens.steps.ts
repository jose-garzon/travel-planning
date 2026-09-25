import { expect } from "@playwright/test";
import { Then, When } from "./fixtures";
import { readTokens } from "./support/tokens";

// AC-3: color tokens with a light and a dark value where they differ.
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

// AC-3: every other token the tokens.css file must define.
const OTHER_REQUIRED_TOKENS = [
  "color-focus",
  "font-display",
  "font-body",
  "text-xs",
  "text-sm",
  "text-md",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-3xl",
  "leading-tight",
  "leading-normal",
  "leading-relaxed",
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
  "radius-sm",
  "radius-md",
  "radius-lg",
  "radius-full",
  "shadow-sm",
  "shadow-md",
  "motion-duration-fast",
  "motion-duration-normal",
  "ease-out",
];

// The "When" step and the "Then" steps below each re-read the tokens
// file: readTokens() is a pure, synchronous parse with no side
// effects, so there is no state to carry between steps.
When("I inspect the design tokens", async () => {
  readTokens();
});

Then("every required design token is defined", async () => {
  const tokens = readTokens();

  for (const name of [...COLOR_TOKENS_WITH_LIGHT_DARK, ...OTHER_REQUIRED_TOKENS]) {
    expect(tokens[name], `--${name} is not defined`).toBeDefined();
  }
});

Then("every color token has a light and a dark value", async () => {
  const tokens = readTokens();

  for (const name of COLOR_TOKENS_WITH_LIGHT_DARK) {
    const value = tokens[name];
    expect(value, `--${name} is not defined`).toEqual(
      expect.objectContaining({ light: expect.any(String), dark: expect.any(String) }),
    );
  }
});
