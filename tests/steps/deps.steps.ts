import { expect } from "@playwright/test";
import { Given, Then, When } from "./fixtures";

// T03 (plan "Test harness", D-14): a temp app tree with
// `src/app/page.tsx` importing the given file, cruised with the
// repo's `.dependency-cruiser.cjs`.
Given("an app page that imports {string}", async ({ deps }, file: string) => {
  deps.givenAppPageImporting(file);
});

When("the dependencies are checked", async ({ deps }) => {
  deps.run();
});

Then("the dependency check reports {string}", async ({ deps }, result: string) => {
  const { stdout, exitCode } = deps.result;

  if (result === "no violations") {
    expect(exitCode).toBe(0);
    expect(stdout).toContain("no dependency violations found");
    return;
  }

  expect(stdout).toContain(`error ${result}:`);
});
