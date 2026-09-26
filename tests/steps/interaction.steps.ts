import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { Then, When } from "./fixtures";
import { readTokens } from "./support/tokens";

// Plan "Test harness" / T06 step 4.
const MAX_TAB_PRESSES = 60;
const FAST_DURATION = "0.15s";

/**
 * Locates the button/link named `name` inside the state figure
 * captioned `state` of the demo named `demoName`. Per plan "Sample
 * targeting": a step that names a primitive inside a demo without
 * naming a state targets the "Default" figure.
 */
function locateControl(page: Page, demoName: string, name: string, state = "Default"): Locator {
  const demo = page.getByRole("region", { name: demoName });
  const figure = demo.locator("figure").filter({ has: page.getByText(state, { exact: true }) });

  return figure.getByRole("button", { name }).or(figure.getByRole("link", { name }));
}

/** Converts a `#rrggbb` token hex value to the `rgb(r, g, b)` form `getComputedStyle` returns. */
function hexToRgb(hex: string): string {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

// Shared between "I hover …" / "I focus … by keyboard" and the Then
// step that checks the resulting animation. Scenarios run one at a
// time per worker, so this module-level handoff is safe.
let lastInteractedControl: Locator | null = null;

When(
  "I hover the {string} button in the {string} demo",
  async ({ page }, buttonName: string, demoName: string) => {
    const control = locateControl(page, demoName, buttonName);
    await control.hover({ timeout: 5_000 });
    lastInteractedControl = control;
  },
);

When(
  "I focus the {string} button in the {string} demo by keyboard",
  async ({ page }, buttonName: string, demoName: string) => {
    const control = locateControl(page, demoName, buttonName);

    for (let presses = 0; presses < MAX_TAB_PRESSES; presses += 1) {
      // `count()` never waits, so a control that does not exist yet
      // fails fast instead of hanging on `evaluate`'s actionability
      // wait for every one of the 60 presses.
      const matches = await control.count();
      const isFocused =
        matches > 0 &&
        (await control
          .evaluate((el) => el === document.activeElement, undefined, { timeout: 500 })
          .catch(() => false));
      if (isFocused) {
        lastInteractedControl = control;
        return;
      }
      await page.keyboard.press("Tab");
    }

    throw new Error(
      `could not reach "${buttonName}" in the "${demoName}" demo with the keyboard ` +
        `within ${MAX_TAB_PRESSES} Tab presses`,
    );
  },
);

Then("the focused element shows the token focus ring", async ({ page }) => {
  const theme = await page.evaluate(() => {
    const attr = document.documentElement.dataset.theme;
    if (attr === "light" || attr === "dark") {
      return attr;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const focusToken = readTokens()["color-focus"];
  if (focusToken === undefined) {
    throw new Error('token "color-focus" is not defined');
  }
  const focusHex = typeof focusToken === "string" ? focusToken : focusToken[theme];

  const style = await page.evaluate(() => {
    const el = document.activeElement;
    if (!(el instanceof HTMLElement)) {
      return null;
    }
    const computed = getComputedStyle(el);
    return {
      outlineStyle: computed.outlineStyle,
      outlineColor: computed.outlineColor,
      outlineOffset: computed.outlineOffset,
    };
  });

  expect(style, "no element is focused").not.toBeNull();
  expect(style?.outlineStyle).toBe("solid");
  expect(style?.outlineColor).toBe(hexToRgb(focusHex));
  expect(Number.parseFloat(style?.outlineOffset ?? "0")).toBeGreaterThan(0);
});

Then(
  "every control in the {string} demo is at least 44 by 44 pixels",
  async ({ page }, demoName: string) => {
    const demo = page.getByRole("region", { name: demoName });
    const controls = demo.locator('button, a, input, [role="button"], [role="textbox"]');
    const count = await controls.count();

    expect(count, `the "${demoName}" demo has no controls`).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const box = await controls.nth(index).boundingBox();
      expect(box, `control ${index} in "${demoName}" has no bounding box`).not.toBeNull();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  },
);

Then("its state change animates in the fast duration", async () => {
  if (!lastInteractedControl) {
    throw new Error("no control was hovered or focused before this step");
  }

  const transitionDuration = await lastInteractedControl.evaluate(
    (el) => getComputedStyle(el).transitionDuration,
  );

  expect(transitionDuration).toContain(FAST_DURATION);
});
