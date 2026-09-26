import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import type { DataTable } from "playwright-bdd";
import { Then } from "./fixtures";

// Plan "Demo content": the "Stack and Text" demo shows one Text per
// font size, xs..3xl, each labeled with its token name.
const FONT_SIZE_TOKENS = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"].map(
  (size) => `font.size.${size}`,
);

Then(
  "the {string} demo shows these states:",
  async ({ page }, demoName: string, table: DataTable) => {
    const expectedStates = table.raw().flat();
    const demo = page.getByRole("region", { name: demoName });
    const captions = await demo.locator("figure > figcaption").allTextContents();

    expect(captions).toEqual(expectedStates);
  },
);

Then("the {string} demo shows every font size", async ({ page }, demoName: string) => {
  const demo = page.getByRole("region", { name: demoName });

  for (const token of FONT_SIZE_TOKENS) {
    await expect(demo.getByText(token)).toBeVisible();
  }
});

// T06: each state figure (Hover, Focus, Active, Loading, Disabled, …)
// must look different from the "Default" figure, so the styleguide
// actually shows the state, not just its label (AC-10).
// Tailwind v4 compiles `scale-*`/`translate-*`/`rotate-*` utilities (e.g.
// the Active state's `scale-97`) to the standalone `scale`/`translate`/
// `rotate` CSS properties, not the `transform` shorthand, so each must be
// read on its own to detect the state.
type ControlSnapshot = {
  backgroundColor: string;
  color: string;
  borderColor: string;
  outline: string;
  opacity: string;
  transform: string;
  scale: string;
  translate: string;
  rotate: string;
  boxShadow: string;
};

const CONTROL_SELECTOR = 'button, a, input, [role="button"], [role="textbox"]';

function firstControl(figure: Locator): Locator {
  return figure.locator(CONTROL_SELECTOR).first();
}

async function computedSnapshot(control: Locator): Promise<ControlSnapshot> {
  return control.evaluate((el) => {
    const computed = getComputedStyle(el);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      borderColor: computed.borderColor,
      outline: computed.outline,
      opacity: computed.opacity,
      transform: computed.transform,
      scale: computed.scale,
      translate: computed.translate,
      rotate: computed.rotate,
      boxShadow: computed.boxShadow,
    };
  });
}

Then(
  "every {string} state looks different from its default state",
  async ({ page }, demoName: string) => {
    const demo = page.getByRole("region", { name: demoName });
    const figures = demo.locator("figure");
    const figureCount = await figures.count();

    const defaultFigure = figures.filter({ has: page.getByText("Default", { exact: true }) });
    const defaultSnapshot = await computedSnapshot(firstControl(defaultFigure));

    for (let index = 0; index < figureCount; index += 1) {
      const figure = figures.nth(index);
      const caption = (await figure.locator("figcaption").innerText()).trim();
      if (caption === "Default") {
        continue;
      }

      const snapshot = await computedSnapshot(firstControl(figure));
      expect(snapshot, `the "${caption}" state looks the same as Default`).not.toEqual(
        defaultSnapshot,
      );
    }
  },
);
