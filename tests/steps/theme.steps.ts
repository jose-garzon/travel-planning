import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { Given, Then, When } from "./fixtures";
import { readTokens } from "./support/tokens";

// Plan "Test harness" / `theme.ts` contract (naming). Kept local
// instead of importing `src/shared/ui/theme` so this file never
// depends on the production module under test.
const THEME_COOKIE_NAME = "parche-theme";
const THEME_TOGGLE_NAME_PATTERN = /^Switch to (dark|light) theme$/;
const MAX_TAB_PRESSES = 60;

// "I open the styleguide without scripts" opens a brand new
// JS-disabled context/page, which the default `page` fixture cannot
// represent. Scenarios run one at a time per worker (see
// interaction.steps.ts), so this module-level handoff is safe.
let activePage: Page | null = null;
let lastColorScheme: "light" | "dark" | null = null;

function resolvePage(page: Page): Page {
  return activePage ?? page;
}

/** Converts a `#rrggbb` token hex value to the `rgb(r, g, b)` form `getComputedStyle` returns. */
function hexToRgb(hex: string): string {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

Given("I have no stored theme", async ({ context }) => {
  activePage = null;
  await context.clearCookies();
});

Given("my stored theme is {string}", async ({ context, baseURL }, theme: string) => {
  activePage = null;
  await context.clearCookies();
  await context.addCookies([
    { name: THEME_COOKIE_NAME, value: theme, url: baseURL ?? "http://localhost" },
  ]);
});

Given("my system prefers the {string} color scheme", async ({ page }, scheme: string) => {
  lastColorScheme = scheme as "light" | "dark";
  await page.emulateMedia({ colorScheme: lastColorScheme });
});

When("my system switches to the {string} color scheme", async ({ page }, scheme: string) => {
  lastColorScheme = scheme as "light" | "dark";
  await resolvePage(page).emulateMedia({ colorScheme: lastColorScheme });
});

When("I switch to the {string} theme", async ({ page }, theme: string) => {
  const target = resolvePage(page);
  await target.getByRole("button", { name: `Switch to ${theme} theme` }).click();
});

When("I open the styleguide without scripts", async ({ browser, context, baseURL }) => {
  const cookies = await context.cookies();
  const noScriptContext = await browser.newContext({
    javaScriptEnabled: false,
    colorScheme: lastColorScheme ?? undefined,
  });
  if (cookies.length > 0) {
    await noScriptContext.addCookies(cookies);
  }
  activePage = await noScriptContext.newPage();
  await activePage.goto(`${baseURL ?? ""}/en/styleguide`);
});

Then("the page uses the {string} theme", async ({ page }, scheme: string) => {
  const target = resolvePage(page);
  const bgToken = readTokens()["color-bg"];
  if (bgToken === undefined) {
    throw new Error('token "color-bg" is not defined');
  }
  const expectedHex = typeof bgToken === "string" ? bgToken : bgToken[scheme as "light" | "dark"];

  const backgroundColor = await target.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );

  expect(backgroundColor).toBe(hexToRgb(expectedHex));
});

Then("the theme toggle is named {string}", async ({ page }, name: string) => {
  const target = resolvePage(page);
  await expect(target.getByRole("button", { name })).toBeVisible();
});

Then("my theme choice {string} is stored", async ({ context }, theme: string) => {
  const cookies = await context.cookies();
  const cookie = cookies.find((c) => c.name === THEME_COOKIE_NAME);

  expect(cookie, `cookie "${THEME_COOKIE_NAME}" was not set`).toBeDefined();
  expect(cookie?.value).toBe(theme);
});

When("I focus the theme toggle by keyboard", async ({ page }) => {
  const target = resolvePage(page);
  const toggle = target.getByRole("button", { name: THEME_TOGGLE_NAME_PATTERN });

  for (let presses = 0; presses < MAX_TAB_PRESSES; presses += 1) {
    const matches = await toggle.count();
    const isFocused =
      matches > 0 &&
      (await toggle
        .evaluate((el) => el === document.activeElement, undefined, { timeout: 500 })
        .catch(() => false));
    if (isFocused) {
      return;
    }
    await target.keyboard.press("Tab");
  }

  throw new Error(
    `could not reach the theme toggle with the keyboard within ${MAX_TAB_PRESSES} Tab presses`,
  );
});

Then("the theme toggle is at least 44 by 44 pixels", async ({ page }) => {
  const target = resolvePage(page);
  const toggle = target.getByRole("button", { name: THEME_TOGGLE_NAME_PATTERN });

  const box = await toggle.boundingBox();
  expect(box, "the theme toggle has no bounding box").not.toBeNull();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
});
