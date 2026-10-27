import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { Given, Then } from "./fixtures";
import { signInAs } from "./support/session";
import { seedTrip } from "./support/trips";

/**
 * A unique email per scenario (testing.md "each scenario sets up its
 * own data"), so parallel scenarios never race on the same `user` row.
 */
function emailFor(displayName: string): string {
  return `${displayName.toLowerCase()}-${randomUUID().slice(0, 8)}@example.com`;
}

Given("I am signed in as {string}", async ({ page }, displayName: string) => {
  await signInAs(page, { email: emailFor(displayName), displayName });
});

Given(
  "I am signed in as {string} with trips {string} upcoming and {string} upcoming",
  async ({ page }, displayName: string, firstTrip: string, secondTrip: string) => {
    const ownerEmail = emailFor(displayName);
    await signInAs(page, { email: ownerEmail, displayName });
    // Fixed dates, not day offsets: the AC-14 i18n scenario asserts the
    // exact formatted range ("Mar 3 – 10, 2027" / "3 – 10 mar 2027").
    await seedTrip({
      ownerEmail,
      name: firstTrip,
      currency: "COP",
      legs: [
        { from: "Bogota", to: "Medellin", date: "2027-03-03" },
        { from: "Medellin", to: "Bogota", date: "2027-03-10" },
      ],
    });
    await seedTrip({
      ownerEmail,
      name: secondTrip,
      currency: "PEN",
      legs: [
        { from: "Lima", to: "Cusco", date: "2027-06-01" },
        { from: "Cusco", to: "Lima", date: "2027-06-10" },
      ],
    });
  },
);

// The Scenario Outline's `<trips>` placeholder is unquoted in the
// Gherkin (`with <trips>`), so each example value needs its own literal
// step, not a `{string}` parameter.
Given("I am signed in as {string} with no trips", async ({ page }, displayName: string) => {
  await signInAs(page, { email: emailFor(displayName), displayName });
});

Then("I see the home page directly, with no landing page", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // The landing page's email field is the only textbox on `/`; its
  // absence is what distinguishes the home page from it.
  await expect(page.getByRole("textbox")).toHaveCount(0);
});

// "I see {string}" (generic visible-text check) is registered once,
// in auth.steps.ts, and reused across @T01/@T02/@T03 (testing.md
// "Same meaning, same words") — do not redefine it here.

Then("I see {string} as my next trip", async ({ page }, name: string) => {
  const nextTrip = page.getByRole("region", { name: "Next trip" });
  await expect(nextTrip.getByText(name, { exact: true })).toBeVisible();
});

Then("I see {string} in my trip list", async ({ page }, name: string) => {
  const otherTrips = page.getByRole("region", { name: "Other trips" });
  await expect(otherTrips.getByText(name, { exact: true })).toBeVisible();
});

Then("I see the empty trips state with a {string} button", async ({ page }, buttonName: string) => {
  await expect(page.getByRole("link", { name: buttonName })).toBeVisible();
});

Then(
  "I see {string} with the date range formatted as {string}",
  async ({ page }, name: string, formatted: string) => {
    // Not scoped to the "Next trip" region: that region's own accessible
    // name is itself translated (this scenario varies locale), so
    // looking it up by its English name would only ever match `en`.
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    await expect(page.getByText(formatted, { exact: true })).toBeVisible();
  },
);
