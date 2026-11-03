import { expect } from "@playwright/test";
import { Then, When } from "./fixtures";

/** `+10` / `-1` -> local `YYYY-MM-DD`, that many days from today. */
function dayOffset(offset: string): string {
  const date = new Date();
  date.setDate(date.getDate() + Number(offset));
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function leg(page: import("@playwright/test").Page, number: number) {
  return page.getByRole("group", { name: `Leg ${number}` });
}

When(
  "I set leg {int} from {string} to {string} on day {word}",
  async ({ page }, number: number, from: string, to: string, day: string) => {
    await leg(page, number).getByLabel("From", { exact: true }).fill(from);
    await leg(page, number).getByLabel("To", { exact: true }).fill(to);
    await leg(page, number)
      .getByLabel(/Departure date/)
      .fill(dayOffset(day));
  },
);

When("I set leg {int} to {string}", async ({ page }, number: number, to: string) => {
  await leg(page, number).getByLabel("To", { exact: true }).fill(to);
});

When(
  "I set leg {int} to {string} on day {word}",
  async ({ page }, number: number, to: string, day: string) => {
    await leg(page, number).getByLabel("To", { exact: true }).fill(to);
    await leg(page, number)
      .getByLabel(/Departure date/)
      .fill(dayOffset(day));
  },
);

When("I add a leg", async ({ page }) => {
  await page.getByRole("button", { name: "Add stop" }).click();
});

When("I remove leg {int}", async ({ page }, number: number) => {
  await page.getByRole("button", { name: `Remove leg ${number}` }).click();
});

When("I add the return home leg", async ({ page }) => {
  await page.getByRole("button", { name: "Add return home" }).click();
});

When("I add legs until there are {int}", async ({ page }, total: number) => {
  const add = page.getByRole("button", { name: "Add stop" });
  for (let count = await page.getByRole("group", { name: /^Leg \d+$/ }).count(); count < total; ) {
    await add.click();
    count += 1;
    await expect(page.getByRole("group", { name: `Leg ${count}` })).toBeVisible();
  }
});

Then("leg {int} starts from {string}", async ({ page }, number: number, from: string) => {
  await expect(leg(page, number).getByLabel("From", { exact: true })).toHaveValue(from);
});

Then(
  "leg {int} goes from {string} to {string}",
  async ({ page }, number: number, from: string, to: string) => {
    await expect(leg(page, number).getByLabel("From", { exact: true })).toHaveValue(from);
    await expect(leg(page, number).getByLabel("To", { exact: true })).toHaveValue(to);
  },
);

Then("I cannot add the return home leg", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Add return home" })).toBeDisabled();
});

Then("I cannot add a leg", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Add stop" })).toBeDisabled();
});

Then("I cannot remove leg {int}", async ({ page }, number: number) => {
  await expect(page.getByRole("button", { name: `Remove leg ${number}` })).toBeDisabled();
});

Then("the trip is not saved", async ({ page }) => {
  await expect(page).toHaveURL(/\/trips\/new/);
});
