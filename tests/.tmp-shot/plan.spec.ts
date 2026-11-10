import { test } from "@playwright/test";
import { signInAs } from "../steps/support/session";
import { seedTrip } from "../steps/support/trips";

const OUT = process.env.OUT ?? ".";
test("plan", async ({ page }) => {
  test.setTimeout(120000);
  const email = `plan-${Date.now()}@example.com`;
  await signInAs(page, { email, displayName: "Rev" });
  const id = await seedTrip({
    ownerEmail: email,
    name: "Caribe con el parche",
    currency: "COP",
    legs: [
      { from: "Bogota", to: "Cartagena", dayOffset: 1 },
      { from: "Cartagena", to: "Santa Marta", dayOffset: 4 },
      { from: "Santa Marta", to: "Bogota", dayOffset: 7 },
    ],
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/en/trips/${id}`);
  await page.waitForTimeout(3000);
  // add activity + cost in first stop
  await page.getByRole("button", { name: "Add activity" }).first().click();
  await page.getByLabel("What").fill("Walled city tour");
  await page.getByRole("button", { name: "Save activity" }).click();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Add cost" }).first().click();
  await page.getByLabel("What").fill("Hotel Getsemaní");
  await page.getByLabel("Amount").fill("800000");
  await page.getByRole("button", { name: "Save cost" }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/plan-phone.png`, fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/plan-desk.png`, fullPage: true });
});
