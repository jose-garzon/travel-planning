import AxeBuilder from "@axe-core/playwright";
import { test as base, createBdd } from "playwright-bdd";
import { DepsCase } from "./support/depsCase";
import { LintCase } from "./support/lintCase";

type Fixtures = {
  /** Returns axe violations for the current page (WCAG 2.2 AA). */
  axe: () => Promise<Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]>;
  /** T03: writes fixture source files and runs `biome lint` on them. */
  lint: LintCase;
  /** T03: builds a temp app tree and runs `depcruise` on it. */
  deps: DepsCase;
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
  // biome-ignore lint/correctness/noEmptyPattern: playwright-bdd requires this exact destructuring signature.
  lint: async ({}, use) => {
    const lintCase = new LintCase();
    await use(lintCase);
    lintCase.cleanup();
  },
  // biome-ignore lint/correctness/noEmptyPattern: playwright-bdd requires this exact destructuring signature.
  deps: async ({}, use) => {
    const depsCase = new DepsCase();
    await use(depsCase);
    depsCase.cleanup();
  },
});

export const { Given, When, Then } = createBdd(test);
