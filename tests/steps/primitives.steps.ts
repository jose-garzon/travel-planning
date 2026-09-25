import { expect } from "@playwright/test";
import type { DataTable } from "playwright-bdd";
import { Then } from "./fixtures";

// Plan "Demo content": the "Stack and Text" demo shows one Text per
// font size, xs..3xl, each labeled with its token name.
const FONT_SIZE_TOKENS = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"].map(
  (size) => `font.size.${size}`,
);

Then(
  "the {string} demo shows these states:",
  async ({ page }, demoName: string, table: DataTable) => {
    const expectedStates = table.raw().map(([state]) => state);
    const demo = page.getByRole("region", { name: demoName });
    const captions = await demo.locator("figure > figcaption").allTextContents();

    expect(captions).toEqual(expectedStates);
  },
);

Then("the {string} demo shows every font size", async ({ page }, demoName: string) => {
  const demo = page.getByRole("region", { name: demoName });

  for (const token of FONT_SIZE_TOKENS) {
    await expect(demo.getByText(token)).toBeVisible();
  }
});
