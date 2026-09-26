import { expect } from "@playwright/test";
import { Given, Then, When } from "./fixtures";

// T03 (plan "Test harness"): the fixture is written to a temp
// workspace and linted with the project's real `biome.json` and
// GritQL plugins. `code` is quoted with single quotes in the
// Examples tables (not `{string}`'s double quotes) because several
// fixtures contain embedded double-quoted strings.
Given(
  "the source file {string} contains {string}",
  async ({ lint }, filePath: string, code: string) => {
    lint.write(filePath, code);
  },
);

Given("the source file {string} contains:", async ({ lint }, filePath: string, code: string) => {
  lint.write(filePath, code);
});

When("the source file is linted", async ({ lint }) => {
  lint.run();
});

When("the project source is linted", async ({ lint }) => {
  lint.runOnProjectSource();
});

Then("lint reports {string}", async ({ lint }, message: string) => {
  const output = `${lint.result.stdout}${lint.result.stderr}`;

  expect(output).toContain(message);
});

Then("lint reports no problems", async ({ lint }) => {
  const output = `${lint.result.stdout}${lint.result.stderr}`;

  expect(lint.result.exitCode).toBe(0);
  expect(output).toContain("No fixes applied");
  // D-4 risk: a broken GritQL plugin fails silently, only emitting an
  // "info" diagnostic instead of blocking the run. Guard against that
  // here, since this scenario lints the whole project.
  expect(output).not.toMatch(/errored:/i);
});
