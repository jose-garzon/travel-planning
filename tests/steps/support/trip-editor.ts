import { expect, type Page } from "@playwright/test";

/**
 * Goes from a trip page to its edit page. The trip page reads first;
 * the form lives on its own page behind the "Edit trip" link.
 */
export async function openTripEditor(page: Page): Promise<void> {
  if (!/\/edit$/.test(new URL(page.url()).pathname)) {
    // Wait for the link: counting it before the trip page renders would
    // skip the editor entirely.
    const edit = page.getByRole("link", { name: /^(Edit trip|Editar viaje)$/ });
    await edit.click();
    await page.waitForURL(/\/edit$/);
  }
  // The URL changes before the editor renders; wait for its save button.
  await expect(page.getByRole("button", { name: /^(Save changes|Guardar cambios)$/ })).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * Waits until the page stops scrolling. The trip form scrolls smoothly
 * to keep a focused stop clear of its sticky bars; a click sent while
 * that scroll runs lands where the button was, not where it is.
 */
export async function scrollSettled(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      new Promise<boolean>((resolve) => {
        let last = window.scrollY;
        let still = 0;
        const tick = () => {
          still = window.scrollY === last ? still + 1 : 0;
          last = window.scrollY;
          if (still >= 5) {
            resolve(true);
          } else {
            requestAnimationFrame(tick);
          }
        };
        requestAnimationFrame(tick);
      }),
  );
}
