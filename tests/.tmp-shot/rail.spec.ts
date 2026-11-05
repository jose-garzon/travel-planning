import { test } from "@playwright/test";
import { signInAs } from "../steps/support/session";
import { seedTrip } from "../steps/support/trips";

const OUT = process.env.OUT ?? ".";
test("rail", async ({ page }) => {
  const email = `r-${Date.now()}@example.com`;
  await signInAs(page, { email, displayName: "R" });
  const c = ["Bogota", "Madrid", "Barcelona", "Rome", "Naples", "Paris", "Madrid", "Bogota"];
  const legs = c.slice(1).map((to, i) => ({ from: c[i] as string, to, dayOffset: i * 2 - 3 }));
  const many = await seedTrip({ ownerEmail: email, name: "Europa", currency: "EUR", legs });
  const few = await seedTrip({
    ownerEmail: email,
    name: "Caribe",
    currency: "COP",
    legs: [
      { from: "Bogota", to: "Cartagena", dayOffset: -1 },
      { from: "Cartagena", to: "Bogota", dayOffset: 3 },
    ],
  });
  for (const [w, tag] of [
    [390, "phone"],
    [1280, "desk"],
  ] as const) {
    await page.setViewportSize({ width: w, height: 700 });
    for (const [id, n] of [
      [many, "many"],
      [few, "few"],
    ] as const) {
      await page.goto(`/es/trips/${id}`);
      await page.waitForTimeout(2000);
      await page
        .locator("main header")
        .first()
        .screenshot({ path: `${OUT}/${tag}-${n}.png` });
    }
  }
});
