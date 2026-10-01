import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FocusHeading } from "./focus-heading";

describe("FocusHeading", () => {
  it("moves focus to the page's heading on mount", () => {
    render(
      <>
        <h1>Hi, Ana</h1>
        <FocusHeading />
      </>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  });

  it("renders nothing itself", () => {
    const { container } = render(
      <>
        <h1>Hi, Ana</h1>
        <FocusHeading />
      </>,
    );

    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });
});
