import { expect } from "@playwright/test";
import { Then } from "./fixtures";

// Mapping of token group names to their token identifiers
// Token names are the CSS variable names without the "--" prefix
const TOKEN_GROUPS: Record<string, string[]> = {
  color: [
    "color-bg",
    "color-surface-1",
    "color-surface-2",
    "color-surface-3",
    "color-text",
    "color-text-muted",
    "color-border",
    "color-border-strong",
    "color-accent",
    "color-accent-hover",
    "color-on-accent",
    "color-success",
    "color-warning",
    "color-error",
    "color-focus",
  ],
  font: [
    "font-display",
    "font-body",
    "text-xs",
    "text-sm",
    "text-md",
    "text-lg",
    "text-xl",
    "text-2xl",
    "text-3xl",
    "leading-tight",
    "leading-normal",
    "leading-relaxed",
  ],
  space: [
    "spacing-1",
    "spacing-2",
    "spacing-3",
    "spacing-4",
    "spacing-5",
    "spacing-6",
    "spacing-7",
    "spacing-8",
    "spacing-10",
    "spacing-12",
    "spacing-16",
  ],
  radius: ["radius-sm", "radius-md", "radius-lg", "radius-full"],
  shadow: ["shadow-sm", "shadow-md"],
  motion: ["motion-duration-fast", "motion-duration-normal", "ease-out"],
};

Then(
  "the {string} section names every {string} token",
  async ({ page }, sectionName: string, groups: string) => {
    const section = page.getByRole("region", { name: sectionName });

    // Parse the groups (e.g., "color" or "radius, shadow")
    const groupNames = groups.split(",").map((g) => g.trim());
    const expectedTokens = groupNames.flatMap((g) => TOKEN_GROUPS[g] || []);

    for (const token of expectedTokens) {
      // Use first() to handle cases where the same token appears multiple times
      // (e.g., in both light and dark panels)
      await expect(section.getByText(token, { exact: true }).first()).toBeVisible();
    }
  },
);

Then(
  "the {string} section shows a light panel and a dark panel",
  async ({ page }, sectionName: string) => {
    const section = page.getByRole("region", { name: sectionName });

    // Check for light and dark panels with data-theme attributes
    const lightPanel = section.locator('[data-theme="light"]');
    const darkPanel = section.locator('[data-theme="dark"]');

    await expect(lightPanel).toBeVisible();
    await expect(darkPanel).toBeVisible();
  },
);

Then(
  "each icon in the {string} section is hidden or has a name",
  async ({ page }, sectionName: string) => {
    const section = page.getByRole("region", { name: sectionName });
    const icons = section.locator("svg");

    const iconCount = await icons.count();
    for (let i = 0; i < iconCount; i++) {
      const icon = icons.nth(i);

      // Check if icon is hidden (aria-hidden="true") or has a name (aria-label or accessible name)
      const ariaHidden = await icon.getAttribute("aria-hidden");
      const ariaLabel = await icon.getAttribute("aria-label");

      // For SVGs inside interactive elements or with text, check the parent's role
      const parent = icon.locator("..");
      const parentRole = await parent.getAttribute("role");

      // Icon should either be aria-hidden or have a label or be inside a labeled element
      if (ariaHidden !== "true" && !ariaLabel) {
        // Check if parent has accessible text content or role
        const parentText = await parent.innerText();
        const hasTextContent = parentText && parentText.trim().length > 0;

        expect(
          hasTextContent || parentRole,
          `Icon must be aria-hidden="true" or have aria-label or parent must have text content`,
        ).toBeTruthy();
      }
    }
  },
);
