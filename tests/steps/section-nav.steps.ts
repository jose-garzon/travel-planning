import { expect } from "@playwright/test";
import { Then, When } from "./fixtures";

// Plan "SectionNav behavior" (T11): the nav's accessible name is
// `styleguide.page.navLabel`. Tests always run in "en" (styleguide.steps.ts
// note), so the literal English string identifies the nav landmark.
const NAV_NAME = "Styleguide sections";

// A section is considered "in view" when its heading's top edge sits
// within the top 25% of the viewport (task "Steps" note).
const IN_VIEW_TOP_RATIO = 0.25;

When("I choose the {string} section link", async ({ page }, name: string) => {
  const nav = page.getByRole("navigation", { name: NAV_NAME });
  await nav.getByRole("link", { name, exact: true }).click();
});

When("I scroll to the {string} section", async ({ page }, name: string) => {
  const heading = page.getByRole("heading", { level: 2, name });
  await heading.evaluate((el) => el.scrollIntoView({ block: "start" }));
});

Then("the {string} section is in view", async ({ page }, name: string) => {
  const heading = page.getByRole("heading", { level: 2, name });
  const viewport = page.viewportSize();
  expect(viewport, "the page has no viewport size").not.toBeNull();
  if (viewport === null) {
    return;
  }

  await expect(async () => {
    const box = await heading.boundingBox();
    expect(box, `"${name}" heading has no bounding box`).not.toBeNull();
    if (box === null) {
      return;
    }
    // A smooth `scrollIntoView({ block: "start" })` can settle a
    // sub-pixel fraction past the exact top (e.g. y = -0.4), which is
    // still visually at the top of the viewport. `-1` tolerates that
    // rounding without accepting a heading that is genuinely scrolled
    // out of view.
    expect(box.y).toBeGreaterThan(-1);
    expect(box.y).toBeLessThan(viewport.height * IN_VIEW_TOP_RATIO);
  }).toPass();
});

Then("focus is on the {string} section heading", async ({ page }, name: string) => {
  await expect(page.getByRole("heading", { level: 2, name })).toBeFocused();
});

Then("the {string} section link is active", async ({ page }, name: string) => {
  const nav = page.getByRole("navigation", { name: NAV_NAME });
  await expect(nav.getByRole("link", { name, exact: true })).toHaveAttribute(
    "aria-current",
    "location",
  );
});

Then("only one section link is active", async ({ page }) => {
  await expect(page.locator('[aria-current="location"]')).toHaveCount(1);
});

Then("the section links wrap onto more than one line", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: NAV_NAME });
  // Direct children only: the nested Primitives sub-links sit one
  // level deeper (nav > ul > li > ul > li > a) and must not affect this.
  const topLevelLinks = nav.locator("> ul > li > a");
  const offsets = await topLevelLinks.evaluateAll((links) =>
    links.map((link) => (link as HTMLElement).offsetTop),
  );

  expect(new Set(offsets).size).toBeGreaterThan(1);
});

Then("the section links do not scroll horizontally", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: NAV_NAME });
  const overflows = await nav.evaluate((el) => el.scrollWidth > el.clientWidth);

  expect(overflows).toBe(false);
});
