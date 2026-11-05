import { test } from "@playwright/test";
import { signInAs } from "../steps/support/session";
import { seedTrip } from "../steps/support/trips";

const OUT = process.env.OUT ?? ".";
test("ticket train", async ({ page }) => {
  const email = `shot-${Date.now()}@example.com`;
  await signInAs(page, { email, displayName: "Shot" });
  const id = await seedTrip({
    ownerEmail: email,
    name: "Caribe con el parche",
    currency: "COP",
    legs: [
      { from: "Bogota", to: "Cartagena", dayOffset: -2 },
      { from: "Cartagena", to: "Santa Marta", dayOffset: 2 },
      { from: "Santa Marta", to: "Bogota", dayOffset: 6 },
    ],
  });
  for (const [w, h, tag] of [
    [390, 844, "phone"],
    [1280, 900, "desk"],
  ] as const) {
    await page.setViewportSize({ width: w, height: h });
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(`/en/trips/${id}`);
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/${tag}-${scheme}-mid.png` });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${OUT}/${tag}-${scheme}-top.png` });
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${OUT}/${tag}-${scheme}-scrolled.png` });
    }
  }
});
