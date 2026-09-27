import { expect } from "@playwright/test";
import { Then } from "./fixtures";

Then(
  "the loading {string} button keeps its label and is busy",
  async ({ page }, buttonName: string) => {
    const figure = page
      .locator("figure")
      .filter({ has: page.getByText("Loading", { exact: true }) });
    const button = figure.getByRole("button", { name: buttonName });

    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("aria-busy", "true");
  },
);
