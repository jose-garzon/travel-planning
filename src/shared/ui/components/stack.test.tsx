import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stack } from "./stack";

describe("Stack", () => {
  it.each([
    ["div", "DIV"],
    ["ul", "UL"],
    ["ol", "OL"],
    ["section", "SECTION"],
    ["article", "ARTICLE"],
  ] as const)("renders the %s element for as=%s", (as, tagName) => {
    const { container } = render(
      <Stack as={as}>
        <span>item</span>
      </Stack>,
    );

    expect(container.firstElementChild?.tagName).toBe(tagName);
  });

  it.each([
    ["0", "gap-0"],
    ["1", "gap-1"],
    ["2", "gap-2"],
    ["3", "gap-3"],
    ["4", "gap-4"],
    ["5", "gap-5"],
    ["6", "gap-6"],
    ["7", "gap-7"],
    ["8", "gap-8"],
    ["10", "gap-10"],
    ["12", "gap-12"],
    ["16", "gap-16"],
  ] as const)("maps gap=%s to the %s token class", (gap, className) => {
    const { container } = render(
      <Stack gap={gap}>
        <span>item</span>
      </Stack>,
    );

    expect(container.firstElementChild).toHaveClass(className);
  });

  it("renders every child passed to it", () => {
    const { getByText } = render(
      <Stack>
        <span>first</span>
        <span>second</span>
      </Stack>,
    );

    expect(getByText("first")).toBeInTheDocument();
    expect(getByText("second")).toBeInTheDocument();
  });
});
