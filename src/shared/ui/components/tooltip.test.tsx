import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../../../../tests/setup/intl";
import { TOOLTIP_DELAY_MS, Tooltip } from "./tooltip";

describe("Tooltip", () => {
  it("renders only the content string, no elements, inside the tooltip", () => {
    renderWithIntl(
      <Tooltip content="Adds this activity to the trip budget" open>
        <button type="button">Add to budget</button>
      </Tooltip>,
    );

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Adds this activity to the trip budget");
    expect(tooltip.children).toHaveLength(0);
  });

  it("translates a translateId content", () => {
    renderWithIntl(
      <Tooltip content={{ translateId: "common.appName" }} open>
        <button type="button">Add to budget</button>
      </Tooltip>,
    );

    expect(screen.getByRole("tooltip")).toHaveTextContent("Parche");
  });

  it("keeps the trigger's own onClick handler", () => {
    const onClick = vi.fn();
    renderWithIntl(
      <Tooltip content="Adds this activity to the trip budget" open>
        <button type="button" onClick={onClick}>
          Add to budget
        </button>
      </Tooltip>,
    );

    screen.getByRole("button", { name: "Add to budget" }).click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps the trigger's own accessible name", () => {
    renderWithIntl(
      <Tooltip content="Adds this activity to the trip budget" open>
        <button type="button" aria-label="Custom label">
          Add to budget
        </button>
      </Tooltip>,
    );

    expect(screen.getByRole("button", { name: "Custom label" })).toBeInTheDocument();
  });

  it("does not render the tooltip content when closed", () => {
    renderWithIntl(
      <Tooltip content="Adds this activity to the trip budget" open={false}>
        <button type="button">Add to budget</button>
      </Tooltip>,
    );

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("exposes the delay duration as the documented constant (D-15)", () => {
    expect(TOOLTIP_DELAY_MS).toBe(300);
  });
});
