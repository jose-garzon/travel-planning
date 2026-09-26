import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { Then, When } from "./fixtures";

const MAX_TAB_PRESSES = 60;

/**
 * Locates the clickable card (`CardButton`/`CardLink`) named `name` in
 * the "Card" demo. The demo repeats the same long heading across the
 * Default/Hover/Focus/Active figures (plan "Demo content"), so `.first()`
 * resolves to the first one in DOM order (the "Default" figure), the
 * same "unnamed state targets Default" convention as
 * `tests/steps/interaction.steps.ts`. The short "Café" card is unique,
 * so `.first()` is a no-op for it.
 */
function locateClickableCard(page: Page, name: string): Locator {
  const demo = page.getByRole("region", { name: "Card" });

  return demo
    .locator('[data-ui="card-button"], [data-ui="card-link"]')
    .filter({ hasText: name })
    .first();
}

Then(
  "the clickable card {string} is truncated with an ellipsis",
  async ({ page }, name: string) => {
    const heading = locateClickableCard(page, name).locator("[data-truncate]");

    await expect(heading).toHaveCSS("text-overflow", "ellipsis");

    const isOverflowing = await heading.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(isOverflowing, `"${name}" heading does not overflow`).toBe(true);
  },
);

When("I hover the clickable card {string}", async ({ page }, name: string) => {
  await locateClickableCard(page, name).hover();
});

When("I focus the clickable card {string} by keyboard", async ({ page }, name: string) => {
  const control = locateClickableCard(page, name);

  for (let presses = 0; presses < MAX_TAB_PRESSES; presses += 1) {
    const matches = await control.count();
    const isFocused =
      matches > 0 &&
      (await control
        .evaluate((el) => el === document.activeElement, undefined, { timeout: 500 })
        .catch(() => false));
    if (isFocused) {
      return;
    }
    await page.keyboard.press("Tab");
  }

  throw new Error(
    `could not reach the clickable card "${name}" with the keyboard within ${MAX_TAB_PRESSES} Tab presses`,
  );
});

Then("the static card {string} wraps its text", async ({ page }, name: string) => {
  const demo = page.getByRole("region", { name: "Card" });
  const heading = demo.locator('[data-ui="card"]').filter({ hasText: name }).locator("p").first();

  await expect(heading).not.toHaveCSS("text-overflow", "ellipsis");

  const { height, lineHeight } = await heading.evaluate((el) => {
    const computed = getComputedStyle(el);
    return {
      height: el.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(computed.lineHeight),
    };
  });

  expect(
    height,
    `"${name}" is one line tall (${height}px) instead of wrapping (line height ${lineHeight}px)`,
  ).toBeGreaterThan(lineHeight * 1.5);
});
