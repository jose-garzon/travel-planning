import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { Then, When } from "./fixtures";

const MAX_TAB_PRESSES = 60;

/**
 * Locates the field named `name` inside the state figure captioned
 * `state` of the demo named `demoName` (plan "Sample targeting"; see
 * `tests/steps/interaction.steps.ts`).
 */
function locateField(page: Page, demoName: string, name: string, state = "Default"): Locator {
  const demo = page.getByRole("region", { name: demoName });
  const figure = demo.locator("figure").filter({ has: page.getByText(state, { exact: true }) });

  return figure.getByRole("textbox", { name });
}

// Shared between the "invalid and linked" Then and the two follow-up
// error-message Then steps, same module-level handoff pattern as
// `interaction.steps.ts`'s `lastInteractedControl`.
let lastErrorMessage: Locator | null = null;

When(
  "I focus the {string} field in the {string} demo by keyboard",
  async ({ page }, fieldName: string, demoName: string) => {
    const field = locateField(page, demoName, fieldName);

    for (let presses = 0; presses < MAX_TAB_PRESSES; presses += 1) {
      const matches = await field.count();
      const isFocused =
        matches > 0 &&
        (await field
          .evaluate((el) => el === document.activeElement, undefined, { timeout: 500 })
          .catch(() => false));
      if (isFocused) {
        return;
      }
      await page.keyboard.press("Tab");
    }

    throw new Error(
      `could not reach "${fieldName}" in the "${demoName}" demo with the keyboard ` +
        `within ${MAX_TAB_PRESSES} Tab presses`,
    );
  },
);

Then(
  "the {string} field in the error state is invalid and linked to its error",
  async ({ page }, fieldName: string) => {
    const field = locateField(page, "Input", fieldName, "Error");

    await expect(field).toHaveAttribute("aria-invalid", "true");

    const describedBy = await field.getAttribute("aria-describedby");
    expect(describedBy, `"${fieldName}" has no aria-describedby`).toBeTruthy();

    const ids = (describedBy as string).split(" ");
    const errorId = ids.at(-1) as string;
    const errorMessage = page.locator(`#${errorId}`);
    await expect(errorMessage).toBeAttached();

    lastErrorMessage = errorMessage;
  },
);

Then("its error message shows an icon and text", async () => {
  if (!lastErrorMessage) {
    throw new Error("no field was checked for its error state yet");
  }

  const icon = lastErrorMessage.locator('[data-ui="icon"]');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute("aria-hidden", "true");

  const text = (await lastErrorMessage.innerText()).trim();
  expect(text.length).toBeGreaterThan(0);
});

Then("its error message enters with a fade and a shake", async () => {
  if (!lastErrorMessage) {
    throw new Error("no field was checked for its error state yet");
  }

  // The fade and the shake live on two different nodes of the error
  // row (see `src/shared/ui/components/input.tsx`): both utilities set
  // the CSS `animation` shorthand, so the row itself carries the fade
  // and the icon+text it wraps carries the shake.
  const rowAnimationName = await lastErrorMessage.evaluate(
    (el) => getComputedStyle(el).animationName,
  );
  const innerAnimationName = await lastErrorMessage
    .locator(":scope > *")
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);

  expect([rowAnimationName, innerAnimationName]).toEqual(
    expect.arrayContaining(["fade-in", "shake"]),
  );
});
