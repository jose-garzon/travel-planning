import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { Given, Then } from "./fixtures";
import { signInAs } from "./support/session";

/**
 * A unique email per scenario (testing.md "each scenario sets up its
 * own data") carrying the fixture-triggering suffix (plan D-4), so
 * parallel scenarios never race on the same `user` row.
 */
function emailFor(displayName: string, fixtureSuffix: string): string {
  return `${displayName.toLowerCase()}-${randomUUID().slice(0, 8)}${fixtureSuffix}@example.com`;
}

Given("I am signed in as {string}", async ({ page }, displayName: string) => {
  await signInAs(page, { email: emailFor(displayName, ""), displayName });
});

Given(
  "I am signed in as {string} with trips {string} upcoming and {string} upcoming",
  async ({ page }, displayName: string, _firstTrip: string, _secondTrip: string) => {
    // Trip names cannot be parametrized beyond D-4's fixed fixture
    // ("Colombia trip", "Peru trip"); the `+trips` email pattern is
    // what actually produces them.
    await signInAs(page, { email: emailFor(displayName, "+trips"), displayName });
  },
);

// The Scenario Outline's `<trips>` placeholder is unquoted in the
// Gherkin (`with <trips>`), so each example value needs its own literal
// step, not a `{string}` parameter.
Given("I am signed in as {string} with no trips", async ({ page }, displayName: string) => {
  await signInAs(page, { email: emailFor(displayName, ""), displayName });
});

Given(
  "I am signed in as {string} with only trips in the past",
  async ({ page }, displayName: string) => {
    await signInAs(page, { email: emailFor(displayName, "+pasttrips"), displayName });
  },
);

Then("I see the home page directly, with no landing page", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // The landing page's email field is the only textbox on `/`; its
  // absence is what distinguishes the home page from it.
  await expect(page.getByRole("textbox")).toHaveCount(0);
});

Then("I see {string}", async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible();
});

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
