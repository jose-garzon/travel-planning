import { expect } from "@playwright/test";
import { Given, Then, When } from "./fixtures";

const WEBFONT_LOAD_DELAY_MS = 500;

// D-10: Fredoka's configured fallback stack. Checking that headings
// list it in their computed font-family proves the fallback is wired
// up; the browser picks the first available family from that list
// once the real webfont fails to load (EC-2, AC-16).
const DISPLAY_FALLBACK_FONTS = ["ui-rounded", "system-ui", "sans-serif"];

Given("webfonts fail to load", async ({ page }) => {
  await page.route("**/*.woff2", (route) => route.abort());
});

Given("webfonts load slowly", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<
        PerformanceEntry & { hadRecentInput: boolean; value: number }
      >) {
        if (!entry.hadRecentInput) {
          (window as unknown as { __cls: number }).__cls += entry.value;
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  await page.route("**/*.woff2", async (route) => {
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, WEBFONT_LOAD_DELAY_MS));
    await route.fulfill({ response });
  });
});

When("the webfonts finish loading", async ({ page }) => {
  await page.evaluate(() => document.fonts.ready);
});

Then("headings use the display fallback fonts", async ({ page }) => {
  const heading = page.getByRole("heading", { level: 1 });
  const fontFamily = await heading.evaluate((el) => getComputedStyle(el).fontFamily);

  for (const fallback of DISPLAY_FALLBACK_FONTS) {
    expect(fontFamily.toLowerCase()).toContain(fallback.toLowerCase());
  }
});

Then("the layout shift is at most {float}", async ({ page }, maxShift: number) => {
  const cls = await page.evaluate(() => (window as unknown as { __cls?: number }).__cls ?? 0);

  expect(cls).toBeLessThanOrEqual(maxShift);
});
