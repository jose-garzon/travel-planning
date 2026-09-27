import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "../../../../tests/setup/intl";
import { Input } from "./input";

describe("Input", () => {
  it("associates the visible label with the field", () => {
    renderWithIntl(<Input label="City" />);

    expect(screen.getByRole("textbox", { name: "City" })).toBeInTheDocument();
  });

  it("translates a translateId label", () => {
    renderWithIntl(<Input label={{ translateId: "common.appName" }} />);

    expect(screen.getByRole("textbox", { name: "Parche" })).toBeInTheDocument();
  });

  it("does not set aria-invalid without an error", () => {
    renderWithIntl(<Input label="City" />);

    expect(screen.getByRole("textbox", { name: "City" })).not.toHaveAttribute("aria-invalid");
  });

  it("sets aria-invalid when there is an error", () => {
    renderWithIntl(<Input label="City" error="Enter a city name" />);

    expect(screen.getByRole("textbox", { name: "City" })).toHaveAttribute("aria-invalid", "true");
  });

  it("has no aria-describedby without a hint or an error", () => {
    renderWithIntl(<Input label="City" />);

    expect(screen.getByRole("textbox", { name: "City" })).not.toHaveAttribute("aria-describedby");
  });

  it("describes the field by its hint", () => {
    renderWithIntl(<Input label="City" hint="Where the trip starts" />);

    const field = screen.getByRole("textbox", { name: "City" });
    const describedBy = field.getAttribute("aria-describedby");

    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      "Where the trip starts",
    );
  });

  it("describes the field by both its hint and its error", () => {
    renderWithIntl(<Input label="City" hint="Where the trip starts" error="Enter a city name" />);

    const field = screen.getByRole("textbox", { name: "City" });
    const ids = (field.getAttribute("aria-describedby") ?? "").split(" ");

    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[0] as string)).toHaveTextContent("Where the trip starts");
    expect(document.getElementById(ids[1] as string)).toHaveTextContent("Enter a city name");
  });

  it("shows the error icon and text", () => {
    renderWithIntl(<Input label="City" error="Enter a city name" />);

    expect(screen.getByText("Enter a city name")).toBeInTheDocument();
    const icon = document.querySelector('[data-ui="icon"]');
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("always renders the error region live, even without an error", () => {
    renderWithIntl(<Input label="City" />);

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toBeEmptyDOMElement();
  });

  it("carries the data-ui marker on its root element", () => {
    renderWithIntl(<Input label="City" />);

    expect(document.querySelector('[data-ui="input"]')).toBeInTheDocument();
  });
});
