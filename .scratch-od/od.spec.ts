import { test } from "@playwright/test";
import { signInAs } from "../tests/steps/support/session";
import { seedTrip } from "../tests/steps/support/trips";

const OUT = process.env.OUT ?? "out";
test("overdrive", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const email = `od-${Date.now()}@x.test`;
  await signInAs(page, { email, displayName: "Jose" });
  const id = await seedTrip({
    ownerEmail: email,
    name: "Costa",
    currency: "USD",
    legs: [
      { from: "Bogota", to: "Cartagena", dayOffset: 20 },
      { from: "Cartagena", to: "Bogota", dayOffset: 25 },
    ],
  });
  await page.route("**/agent", async (r) => {
    await new Promise((res) => setTimeout(res, 1500));
    await r.fulfill({
      json: {
        reply: "Found a good fare for you.",
        suggestions: [
          {
            id: "s1",
            kind: "budget",
            category: "flights",
            label: "Avianca BOG to CTG",
            amount: 142,
            currency: "USD",
            perPerson: true,
            stop: null,
            sourceUrl: "https://example.com",
          },
        ],
      },
    });
  });
  await page.route("**/budget/items", (r) => r.fulfill({ status: 201, json: {} }));
  await page.goto(`/en/trips/${id}`);
  await page
    .getByRole("textbox", { name: "Ask the assistant" })
    .first()
    .fill("Flights to Cartagena?");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/1-thinking.png` });
  await page.getByRole("button", { name: "Add to trip" }).first().waitFor();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/2-reply.png` });
  await page.getByRole("button", { name: "Add to trip" }).first().click();
  for (const t of [150, 300, 300, 200, 400]) {
    await page.waitForTimeout(t);
    await page.screenshot({ path: `${OUT}/3-fly-${t}-${Date.now()}.png` });
  }
});
