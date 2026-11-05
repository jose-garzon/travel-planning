import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import { sql } from "drizzle-orm";
import { Given, When } from "./fixtures";
import { user, verification, withTestDb } from "./support/db";

/** The address a visitor asked a sign-in link for, and where that link lands (feature 009 D-3). */
type SignInRequest = { email: string; callbackURL: string };

const requestByPage = new WeakMap<Page, SignInRequest>();

/** A unique address per call: scenarios run in parallel against one `local.db`. */
function freshEmail(name: string): string {
  return `${name.toLowerCase()}-${randomUUID().slice(0, 8)}@example.com`;
}

/** An account with a name already on file, so its sign-in skips name capture. */
async function seedExistingUser(name: string): Promise<string> {
  const email = freshEmail(name);
  const testDb = await withTestDb();
  const now = new Date();
  await testDb.insert(user).values({
    id: randomUUID(),
    name,
    email,
    emailVerified: true,
    nameConfirmedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  return email;
}

/** The join page's sign-in form: requests the link with the page's accept path as callback. */
async function requestSignInLink(page: Page, email: string): Promise<void> {
  const callbackURL = `${new URL(page.url()).pathname}/accept`;
  requestByPage.set(page, { email, callbackURL });
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByText(email)).toBeVisible();
}

/** Reads the newest magic-link token issued for `email` (feature 009 test setup, as @T02). */
async function latestTokenFor(email: string): Promise<string> {
  const testDb = await withTestDb();
  const rows = await testDb
    .select()
    .from(verification)
    .where(sql`json_extract(${verification.value}, '$.email') = ${email}`);
  if (rows.length === 0) {
    throw new Error(`no sign-in link was issued for ${email}`);
  }
  const latest = rows.reduce((newest, row) => (row.createdAt > newest.createdAt ? row : newest));
  return latest.identifier;
}

/** Opens the emailed sign-in link, carrying the callback the visitor's request set. */
async function openSignInLink(page: Page): Promise<void> {
  const request = requestByPage.get(page);
  if (request === undefined) {
    throw new Error("no sign-in link was requested on this page");
  }
  const token = await latestTokenFor(request.email);
  const query = new URLSearchParams({ token, callbackURL: request.callbackURL });
  await page.goto(`/api/auth/magic-link/verify?${query}`);
}

Given("I am signed out", async ({ page }) => {
  await page.context().clearCookies();
});

Given("I requested a sign-in link as {string}", async ({ page }, name: string) => {
  const email = await seedExistingUser(name);
  await requestSignInLink(page, email);
});

When("I sign in to join as an existing user {string}", async ({ page }, name: string) => {
  const email = await seedExistingUser(name);
  await requestSignInLink(page, email);
  await openSignInLink(page);
});

When("I sign in to join as a new user named {string}", async ({ page }, name: string) => {
  await requestSignInLink(page, freshEmail(name));
  await openSignInLink(page);
  await page.getByRole("textbox", { name: /name/i }).fill(name);
  await page.getByRole("button", { name: /continue/i }).click();
});

When("I open my sign-in link", async ({ page }) => {
  await openSignInLink(page);
});
