import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { Then, When } from "./fixtures";
import { readTokens } from "./support/tokens";

/** Converts a `#rrggbb` token hex value to the `rgb(r, g, b)` form `getComputedStyle` returns. */
function hexToRgb(hex: string): string {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

// Plan "components/dialog.tsx": the entrance animation (`--motion-duration-normal`,
// 250ms) must settle before a bounding box is a reliable read of the
// resting layout.
const ANIMATION_SETTLE_MS = 300;

When("I open the {string} dialog", async ({ page }, name: string) => {
  await page.getByRole("button", { name }).click();
});

Then("focus is inside the {string} dialog", async ({ page }, name: string) => {
  const dialog = page.getByRole("dialog", { name });
  await expect(dialog).toBeVisible();

  const isInside = await dialog.evaluate((el) => el.contains(document.activeElement));
  expect(isInside, "focus is not inside the dialog").toBe(true);
});

When("I press the {string} key {int} times", async ({ page }, key: string, times: number) => {
  for (let presses = 0; presses < times; presses += 1) {
    await page.keyboard.press(key);
  }
});

Then("focus returns to the {string} button", async ({ page }, name: string) => {
  await expect(page.getByRole("button", { name })).toBeFocused();
});

// The trigger sits far enough down the "Primitives" section that
// opening the dialog (Playwright scrolls the trigger into view first)
// already leaves the page scrolled down, so scrolling further *up* is
// always the meaningful direction to attempt here, regardless of
// where the page happens to end.
Then("the page behind the dialog does not scroll", async ({ page }) => {
  const before = await page.evaluate(() => window.scrollY);
  expect(before, "the page is already at the top; scroll lock cannot be verified").toBeGreaterThan(
    0,
  );

  await page.mouse.wheel(0, -200);
  await page.waitForTimeout(100);

  const after = await page.evaluate(() => window.scrollY);
  expect(after).toBe(before);
});

When("I close the dialog with the {string} button", async ({ page }, name: string) => {
  await page.getByRole("dialog").getByRole("button", { name }).click();
});

Then("the page scrolls again", async ({ page }) => {
  const before = await page.evaluate(() => window.scrollY);

  await page.mouse.wheel(0, -50);
  await page.waitForTimeout(100);

  const after = await page.evaluate(() => window.scrollY);
  expect(after).toBeLessThan(before);
});

/**
 * `<layout>` in the Scenario Outline is not quoted in the feature
 * file, so `{string}` (which only matches a quoted segment) cannot
 * bind it. The Examples table only ever fills in "bottom sheet" or
 * "centered dialog" (plan step notes), so both are their own literal
 * steps sharing this measurement.
 */
async function assertDialogLayout(page: Page, layout: "bottom sheet" | "centered dialog") {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(ANIMATION_SETTLE_MS);

  const box = await dialog.boundingBox();
  expect(box, "the dialog has no bounding box").not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport, "the page has no viewport size").not.toBeNull();
  if (box === null || viewport === null) {
    return;
  }

  if (layout === "bottom sheet") {
    expect(Math.round(box.x)).toBe(0);
    expect(Math.round(box.width)).toBe(viewport.width);
    expect(Math.round(box.y + box.height)).toBe(viewport.height);
    return;
  }

  const rightMargin = viewport.width - (box.x + box.width);
  expect(box.x, "the dialog touches the left edge").toBeGreaterThan(0);
  expect(box.width, "the dialog spans the full viewport width").toBeLessThan(viewport.width);
  expect(Math.abs(rightMargin - box.x), "the dialog is not horizontally centered").toBeLessThan(2);
}

Then("the dialog is shown as a bottom sheet", async ({ page }) => {
  await assertDialogLayout(page, "bottom sheet");
});

Then("the dialog is shown as a centered dialog", async ({ page }) => {
  await assertDialogLayout(page, "centered dialog");
});

When("I focus the {string} field", async ({ page }, name: string) => {
  await page.getByRole("textbox", { name }).focus();
});

Then(
  "the {string} dialog uses the {string} theme",
  async ({ page }, name: string, scheme: string) => {
    const dialog = page.getByRole("dialog", { name });
    const bgToken = readTokens()["color-surface-2"];
    if (bgToken === undefined) {
      throw new Error('token "color-surface-2" is not defined');
    }
    const expectedHex = typeof bgToken === "string" ? bgToken : bgToken[scheme as "light" | "dark"];

    const backgroundColor = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(backgroundColor).toBe(hexToRgb(expectedHex));
  },
);

Then("the {string} dialog is still open", async ({ page }, name: string) => {
  await expect(page.getByRole("dialog", { name })).toBeVisible();
});

Then("focus is on the {string} field", async ({ page }, name: string) => {
  await expect(page.getByRole("textbox", { name })).toBeFocused();
});
