import type { Page } from "@playwright/test";

/**
 * Goes from a trip page to its edit page. The trip page reads first;
 * the form lives on its own page behind the "Edit trip" link.
 */
export async function openTripEditor(page: Page): Promise<void> {
  const edit = page.getByRole("link", { name: /^(Edit trip|Editar viaje)$/ });
  if ((await edit.count()) === 0) {
    return;
  }
  await edit.click();
  await page.waitForURL(/\/edit$/);
}
