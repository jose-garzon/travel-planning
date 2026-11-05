import { expect, type Page } from "@playwright/test";
import { Given, Then, When } from "./fixtures";
import { signedInEmail } from "./support/session";
import { findTripId } from "./support/trips";

/** The link the owner saw before a reset, so the reset can be checked against it. */
const linkBeforeReset = new WeakMap<Page, string>();

function inviteLink(page: Page) {
  return page.getByRole("textbox", { name: "Invite link" });
}

async function openInviteCard(page: Page) {
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(inviteLink(page)).toBeVisible();
}

Given("I opened the invite card of {string}", async ({ page }, name: string) => {
  const id = await findTripId(signedInEmail(page), name);
  await page.goto(`/trips/${id}`);
  await openInviteCard(page);
});

When("I open the invite card", async ({ page }) => {
  await openInviteCard(page);
});

Then("I see the invite link", async ({ page }) => {
  await expect(inviteLink(page)).toHaveValue(/\/join\/[A-Za-z0-9_-]{43}$/);
});

Then("I see the link expires in {int} days", async ({ page }, days: number) => {
  await expect(page.getByText(new RegExp(`expires in ${days} days`, "i"))).toBeVisible();
});

When("I copy the invite link", async ({ page }) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy link", exact: true }).click();
});

Then("the clipboard holds the invite link", async ({ page }) => {
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(await inviteLink(page).inputValue());
});

Then("I hear {string}", async ({ page }, text: string) => {
  await expect(page.getByRole("status").filter({ hasText: text })).toBeVisible();
});

When("I reset the invite link and confirm", async ({ page }) => {
  linkBeforeReset.set(page, await inviteLink(page).inputValue());
  await page.getByRole("button", { name: "Reset link", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Reset link?" });
  await dialog.getByRole("button", { name: "Reset", exact: true }).click();
});

Then("I see a new invite link", async ({ page }) => {
  const previous = linkBeforeReset.get(page);
  expect(previous, "no reset happened in this scenario").toBeDefined();
  await expect(inviteLink(page)).not.toHaveValue(previous as string);
  await expect(inviteLink(page)).toHaveValue(/\/join\/[A-Za-z0-9_-]{43}$/);
});
