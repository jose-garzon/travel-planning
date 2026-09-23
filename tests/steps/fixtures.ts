import AxeBuilder from "@axe-core/playwright";
import { test as base, createBdd } from "playwright-bdd";

type Fixtures = {
  /** Returns axe violations for the current page (WCAG 2.2 AA). */
  axe: () => Promise<Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]>;
};

export const test = base.extend<Fixtures>({
  axe: async ({ page }, use) => {
    await use(async () => {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      return results.violations;
    });
  },
});

export const { Given, When, Then } = createBdd(test);
