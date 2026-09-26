import { expect } from "@playwright/test";
import { Then, When } from "./fixtures";

// Plan "components/tooltip.tsx": Radix renders the tooltip content with
// `role="tooltip"`. Scenarios show at most one tooltip at a time, so a
// bare role query is enough (plan step notes: `getByRole("tooltip")`).
const FOCUSABLE_SELECTOR =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

// A tooltip that opens and then closes shortly after (e.g. a transient
// close the component fails to suppress) can still satisfy a single
// polling assertion if it's sampled mid-transition. This is longer than
// any known transient-close window (tooltip.tsx documents one at ~20ms)
// so the re-check below only passes when the tooltip stays open.
const STAY_OPEN_CHECK_MS = 150;

Then("I see the tooltip {string}", async ({ page }, tip: string) => {
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toHaveText(tip);

  await page.waitForTimeout(STAY_OPEN_CHECK_MS);
  await expect(tooltip).toBeVisible();
});

When("I move the pointer onto the tooltip", async ({ page }) => {
  await page.getByRole("tooltip").hover();
});

// Plan step notes: `I press the {string} key` (Escape closes, Tab blurs
// the trigger).
When("I press the {string} key", async ({ page }, key: string) => {
  await page.keyboard.press(key);
});

Then("I do not see a tooltip", async ({ page }) => {
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

// Plan step notes: describes its trigger via `aria-describedby` pointing
// at the tooltip's own id (Radix wires this on the trigger automatically).
Then("the tooltip {string} describes its trigger", async ({ page }, tip: string) => {
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toHaveText(tip);

  const tooltipId = await tooltip.getAttribute("id");
  expect(tooltipId, "the tooltip has no id for a trigger to reference").not.toBeNull();

  const describedByTrigger = page.locator(`[aria-describedby~="${tooltipId}"]`);
  await expect(describedByTrigger).toHaveCount(1);
});

Then("the tooltip has no focusable elements", async ({ page }) => {
  const focusable = page.getByRole("tooltip").locator(FOCUSABLE_SELECTOR);

  await expect(focusable).toHaveCount(0);
});
