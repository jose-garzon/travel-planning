import { test } from "@playwright/test";
import { signInAs } from "../steps/support/session";
import { seedTrip } from "../steps/support/trips";

const OUT = process.env.OUT ?? ".";
test("review", async ({ page }) => {
  test.setTimeout(120000);
  const email = `rev-${Date.now()}@example.com`;
  await signInAs(page, { email, displayName: "Rev" });
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
    await page.goto(`/en`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${tag}-home.png` });
    await page.goto(`/en/trips/${id}`);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/${tag}-trip.png`, fullPage: true });
    for (const name of ["Add activity", "Add cost"]) {
      const b = page.getByRole("button", { name }).first();
      if (await b.count()) {
        await b.click();
        await page.waitForTimeout(600);
        await page.screenshot({
          path: `${OUT}/${tag}-form-${name.split(" ")[1]}.png`,
          fullPage: true,
        });
        await page.keyboard.press("Escape");
        await page.goto(`/en/trips/${id}`);
        await page.waitForTimeout(1500);
      }
    }
    if (tag === "phone") {
      const a = page.getByRole("button", { name: /ask|assistant/i }).first();
      if (await a.count()) {
        await a.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: `${OUT}/${tag}-assistant.png` });
      }
    }
    await page.goto(`/en/trips/${id}/edit`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${tag}-edit.png`, fullPage: true });
  }
});
