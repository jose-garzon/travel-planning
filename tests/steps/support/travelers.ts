import type { Page } from "@playwright/test";

/**
 * Opens the Travelers disclosure when it is collapsed. On mobile the list
 * sits behind a disclosure button (feature 009 plan "Accessibility notes");
 * on desktop that button is not rendered, so this does nothing.
 *
 * The click is dispatched, not pointed: a modal sheet can be open and Radix
 * then hides the page behind it from pointer events and the a11y tree.
 */
export async function openTravelers(page: Page): Promise<void> {
  const toggle = page
    .getByRole("region", { name: "Travelers", includeHidden: true })
    .getByRole("button", { name: "Travelers", expanded: false, includeHidden: true });
  if ((await toggle.count()) === 0) {
    return;
  }
  if (await toggle.evaluate((el) => getComputedStyle(el).display === "none")) {
    return;
  }
  await toggle.dispatchEvent("click");
}
