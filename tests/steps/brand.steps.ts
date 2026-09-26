import { expect } from "@playwright/test";
import { Then } from "./fixtures";

// Plan "Styleguide DOM contract": each top-level section is a
// `<section aria-labelledby>`, which has the implicit ARIA role
// "region" named by its `h2` (the section title).

Then(
  "the {string} section shows the name {string}",
  async ({ page }, sectionName: string, name: string) => {
    const section = page.getByRole("region", { name: sectionName });

    await expect(section.getByText(name, { exact: true })).toBeVisible();
  },
);

Then("the {string} section shows the wordmark direction", async ({ page }, sectionName: string) => {
  const section = page.getByRole("region", { name: sectionName });

  // Packet "Brand": wordmark direction is shown with a live
  // `Wordmark` (component contract: `data-ui="wordmark"`).
  await expect(section.locator('[data-ui="wordmark"]')).toBeVisible();
});

Then(
  "the {string} section shows {int} voice rules with do and don't examples",
  async ({ page }, sectionName: string, ruleCount: number) => {
    const section = page.getByRole("region", { name: sectionName });
    const rules = section.getByRole("article");

    await expect(rules).toHaveCount(ruleCount);

    const count = await rules.count();

    for (let index = 0; index < count; index += 1) {
      const rule = rules.nth(index);
      const heading = rule.getByRole("heading", { level: 3 });

      await expect(heading).toBeVisible();

      const title = (await heading.innerText()).trim();
      expect(title.length).toBeGreaterThan(0);

      // Packet "Brand": each rule has a "Do" and a "Don't" example,
      // each labeled with text + Icon (Check / X), not color alone
      // (component contract: `data-ui="icon"`). The icon itself is
      // decorative; the visible text next to it is the label.
      const icons = rule.locator('[data-ui="icon"]');
      await expect(icons).toHaveCount(2);

      const labels = await icons.evaluateAll((elements) =>
        elements.map((el) => el.parentElement?.textContent?.trim() ?? ""),
      );
      for (const label of labels) {
        expect(
          label.length,
          "each Do/Don't example needs a visible text label, not color alone",
        ).toBeGreaterThan(0);
      }
      expect(labels[0]).not.toEqual(labels[1]);

      // The rule shows the do/don't example content itself, beyond
      // just the title and the labels.
      const ruleText = (await rule.innerText()).trim();
      expect(ruleText.length).toBeGreaterThan(title.length);
    }
  },
);
