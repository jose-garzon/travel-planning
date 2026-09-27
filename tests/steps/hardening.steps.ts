import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { Given, Then } from "./fixtures";
import { readTokens } from "./support/tokens";

// T14 "Steps" note: every interactive primitive matches this selector.
const CONTROL_SELECTOR = 'button, a, input, [role="button"], [role="textbox"]';

// plan.md "Tokens" / Animations: the three motion-only keyframes that
// must never run under `prefers-reduced-motion: reduce`. `fade-in` and
// `fade-out` are allowed (opacity only, no movement or scale).
const MOTION_ANIMATIONS = ["shake", "sheet-up", "dialog-in"];

// plan.md "Tokens": `--motion-duration-fast: 150ms`, the duration
// every primitive's `transition` utility resolves to.
const FAST_DURATION = "0.15s";

const MAX_TAB_PRESSES = 60;

// A little past `--motion-duration-fast` (150ms), enough for a
// `transition`-covered property (e.g. Card's conditional
// `ui-focus:outline-focus`) to settle at its resting value.
const ANIMATION_SETTLE_MS = 200;

const NAV_NAME = "Styleguide sections";

/** Converts a `#rrggbb` token hex value to the `rgb(r, g, b)` form `getComputedStyle` returns. */
function hexToRgb(hex: string): string {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

async function currentTheme(page: Page): Promise<"light" | "dark"> {
  return page.evaluate(() => {
    const attr = document.documentElement.dataset.theme;
    if (attr === "light" || attr === "dark") {
      return attr;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
}

function focusHexFor(theme: "light" | "dark"): string {
  const focusToken = readTokens()["color-focus"];
  if (focusToken === undefined) {
    throw new Error('token "color-focus" is not defined');
  }
  return typeof focusToken === "string" ? focusToken : focusToken[theme];
}

Given("I prefer reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

Given("the page is zoomed to 200%", async ({ page }) => {
  // Plan/task note: halving the viewport against the demos' 1280px
  // desktop baseline reads the same as a real 200% browser zoom.
  await page.setViewportSize({ width: 640, height: 400 });
});

Given("my browser text size is 200%", async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "html { font-size: 200% }";
      document.head.appendChild(style);
    });
  });
});

Then(
  "no {string} control moves or scales on state change",
  async ({ page }, sectionName: string) => {
    const region = page.getByRole("region", { name: sectionName, exact: true });
    await expect(region).toBeVisible();

    const snapshots = await region.locator("[data-ui]").evaluateAll((elements) =>
      elements.map((el) => {
        const computed = getComputedStyle(el);
        return {
          dataUi: el.getAttribute("data-ui"),
          transform: computed.transform,
          scale: computed.scale,
          translate: computed.translate,
          animationName: computed.animationName,
        };
      }),
    );

    expect(snapshots.length).toBeGreaterThan(0);

    for (const snapshot of snapshots) {
      expect(snapshot.transform, `${snapshot.dataUi} has a transform`).toBe("none");
      expect(snapshot.scale, `${snapshot.dataUi} has a scale`).toBe("none");
      expect(snapshot.translate, `${snapshot.dataUi} has a translate`).toBe("none");
      for (const motionAnimation of MOTION_ANIMATIONS) {
        expect(
          snapshot.animationName,
          `${snapshot.dataUi} runs the "${motionAnimation}" animation`,
        ).not.toContain(motionAnimation);
      }
    }
  },
);

Then("the error message in the {string} demo only fades in", async ({ page }, demoName: string) => {
  const demo = page.getByRole("region", { name: demoName, exact: true });
  const errorFigure = demo
    .locator("figure")
    .filter({ has: page.getByText("Error", { exact: true }) });
  const liveRegion = errorFigure.locator('[aria-live="polite"]');

  const animationNames = await liveRegion.evaluate((el) => {
    const message = el.querySelector("p");
    const iconAndText = el.querySelector("span");
    return {
      message: message ? getComputedStyle(message).animationName : null,
      iconAndText: iconAndText ? getComputedStyle(iconAndText).animationName : null,
    };
  });

  expect(animationNames.message).toBe("fade-in");
  expect(animationNames.iconAndText).toBe("none");
});

Then("the dialog only fades in", async ({ page }) => {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const animationName = await dialog.evaluate((el) => getComputedStyle(el).animationName);
  expect(animationName).toBe("fade-in");
});

Then("the {string} section is in view without smooth scrolling", async ({ page }, name: string) => {
  const scrollBehavior = await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  );
  expect(scrollBehavior).toBe("auto");

  const heading = page.getByRole("heading", { level: 2, name });
  const viewport = page.viewportSize();
  expect(viewport, "the page has no viewport size").not.toBeNull();
  if (viewport === null) {
    return;
  }

  const box = await heading.boundingBox();
  expect(box, `"${name}" heading has no bounding box`).not.toBeNull();
  if (box === null) {
    return;
  }
  expect(box.y).toBeGreaterThan(-1);
  expect(box.y).toBeLessThan(viewport.height * 0.25);
});

Then(
  "every {string} control transitions in the fast duration",
  async ({ page }, sectionName: string) => {
    const region = page.getByRole("region", { name: sectionName, exact: true });
    const controls = region.locator(CONTROL_SELECTOR);
    const count = await controls.count();

    expect(count, `the "${sectionName}" section has no controls`).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const transitionDuration = await controls
        .nth(index)
        .evaluate((el) => getComputedStyle(el).transitionDuration);
      expect(transitionDuration).toContain(FAST_DURATION);
    }
  },
);

Then(
  "every {string} control shows the token focus ring by keyboard",
  async ({ page }, sectionName: string) => {
    const region = page.getByRole("region", { name: sectionName, exact: true });
    await expect(region).toBeVisible();

    // Jump straight to the section (a real user action: the section nav
    // link) so Tab only has to walk this section's own controls instead
    // of the whole page from the top.
    const nav = page.getByRole("navigation", { name: NAV_NAME });
    await nav.getByRole("link", { name: sectionName, exact: true }).click();

    const theme = await currentTheme(page);
    const focusHex = focusHexFor(theme);
    const focusRgb = hexToRgb(focusHex);

    let checkedCount = 0;
    let enteredRegion = false;

    for (let presses = 0; presses < MAX_TAB_PRESSES; presses += 1) {
      await page.keyboard.press("Tab");

      const isInRegion = await region
        .evaluate((el) => el.contains(document.activeElement), undefined, { timeout: 500 })
        .catch(() => false);

      if (!isInRegion) {
        if (enteredRegion) {
          break;
        }
        continue;
      }
      enteredRegion = true;

      // The outline color itself transitions in over the fast duration
      // (plan "Shared primitive rules": `transition` covers every token
      // property, including `outline-color`) on primitives that only set
      // it conditionally (e.g. Card, `ui-focus:outline-focus`). Waiting
      // it out avoids reading a mid-transition, interpolated color.
      await page.waitForTimeout(ANIMATION_SETTLE_MS);

      const style = await page.evaluate(() => {
        const el = document.activeElement;
        if (!(el instanceof HTMLElement)) {
          return null;
        }
        const computed = getComputedStyle(el);
        return {
          outlineStyle: computed.outlineStyle,
          outlineColor: computed.outlineColor,
          outlineOffset: computed.outlineOffset,
        };
      });

      expect(style, "no element is focused").not.toBeNull();
      expect(style?.outlineStyle).toBe("solid");
      expect(style?.outlineColor).toBe(focusRgb);
      expect(Number.parseFloat(style?.outlineOffset ?? "0")).toBeGreaterThan(0);
      checkedCount += 1;
    }

    expect(checkedCount, `no focusable control found in "${sectionName}"`).toBeGreaterThan(0);
  },
);

Then(
  "every {string} control is at least 44 by 44 pixels",
  async ({ page }, sectionName: string) => {
    const region = page.getByRole("region", { name: sectionName, exact: true });
    const controls = region.locator(CONTROL_SELECTOR);
    const count = await controls.count();

    expect(count, `the "${sectionName}" section has no controls`).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const box = await controls.nth(index).boundingBox();
      expect(box, `control ${index} in "${sectionName}" has no bounding box`).not.toBeNull();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  },
);

Then("no primitive clips or overlaps its content", async ({ page }) => {
  const clipped = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll("[data-ui]")).filter(
      (el) => !el.hasAttribute("data-truncate"),
    );
    return elements
      .filter((el) => el.scrollWidth > el.clientWidth)
      .map((el) => el.getAttribute("data-ui"));
  });
  expect(clipped, "these [data-ui] primitives clip their content").toEqual([]);

  const overlaps = await page.evaluate(() => {
    const boxes = Array.from(document.querySelectorAll("figure")).map((figure, index) => {
      const rect = figure.getBoundingClientRect();
      return { index, top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom };
    });

    const pairs: string[] = [];
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        if (!a || !b) {
          continue;
        }
        const intersects =
          a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        if (intersects) {
          pairs.push(`${a.index}:${b.index}`);
        }
      }
    }
    return pairs;
  });
  expect(overlaps, "these figure pairs overlap").toEqual([]);
});

Then("the {string} demo lays out its states in a row", async ({ page }, demoName: string) => {
  const demo = page.getByRole("region", { name: demoName, exact: true });
  const boxes = await demo.locator("figure").evaluateAll((figures) =>
    figures.map((figure) => {
      const rect = figure.getBoundingClientRect();
      return { top: rect.top, left: rect.left };
    }),
  );

  expect(
    boxes.length,
    `the "${demoName}" demo has fewer than two state figures`,
  ).toBeGreaterThanOrEqual(2);

  const sameRow = boxes.some((a, i) =>
    boxes.some((b, j) => j > i && Math.abs(a.top - b.top) < 1 && Math.abs(a.left - b.left) > 1),
  );

  expect(sameRow, `no two figures in the "${demoName}" demo share a row`).toBe(true);
});
