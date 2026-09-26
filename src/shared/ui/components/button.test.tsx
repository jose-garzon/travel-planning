import { fireEvent, screen } from "@testing-library/react";
import { CircleAlert } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../../../../tests/setup/intl";
import { Button, buttonClasses } from "./button";

describe("Button", () => {
  it("defaults to the native button type", () => {
    renderWithIntl(<Button>Save trip</Button>);

    expect(screen.getByRole("button", { name: "Save trip" })).toHaveAttribute("type", "button");
  });

  it("renders the requested native type", () => {
    renderWithIntl(<Button type="submit">Save trip</Button>);

    expect(screen.getByRole("button", { name: "Save trip" })).toHaveAttribute("type", "submit");
  });

  it.each([
    ["primary", "bg-accent"],
    ["secondary", "bg-surface-1"],
  ] as const)("maps variant=%s to its token background class", (variant, className) => {
    renderWithIntl(<Button variant={variant}>Save trip</Button>);

    expect(screen.getByRole("button", { name: "Save trip" })).toHaveClass(className);
  });

  it("translates a translateId label", () => {
    renderWithIntl(<Button translateId="common.appName" />);

    expect(screen.getByRole("button", { name: "Parche" })).toBeInTheDocument();
  });

  it("hides a decorative icon from assistive tech", () => {
    renderWithIntl(<Button icon={CircleAlert}>Save trip</Button>);

    const icon = document.querySelector('[data-ui="icon"]');
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the label as the accessible name when labelHidden", () => {
    renderWithIntl(
      <Button icon={CircleAlert} labelHidden>
        Save trip
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Save trip" })).toBeInTheDocument();
  });

  it("visually hides the label when labelHidden", () => {
    renderWithIntl(
      <Button icon={CircleAlert} labelHidden>
        Save trip
      </Button>,
    );

    expect(screen.getByText("Save trip")).toHaveClass("sr-only");
  });

  it("sets aria-busy and aria-disabled while loading", () => {
    renderWithIntl(<Button isLoading>Save trip</Button>);

    const button = screen.getByRole("button", { name: "Save trip" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("ignores clicks while loading", () => {
    const onClick = vi.fn();
    renderWithIntl(
      <Button isLoading onClick={onClick}>
        Save trip
      </Button>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save trip" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("stays focusable while loading", () => {
    renderWithIntl(<Button isLoading>Save trip</Button>);

    const button = screen.getByRole("button", { name: "Save trip" });
    button.focus();

    expect(button).toHaveFocus();
  });

  it("disables the native button when disabled", () => {
    renderWithIntl(<Button disabled>Save trip</Button>);

    expect(screen.getByRole("button", { name: "Save trip" })).toBeDisabled();
  });

  it("calls onClick when not loading", () => {
    const onClick = vi.fn();
    renderWithIntl(<Button onClick={onClick}>Save trip</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Save trip" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("requires an icon when labelHidden is true (type-level)", () => {
    // @ts-expect-error labelHidden requires icon
    const element = <Button labelHidden>Save trip</Button>;

    expect(element).toBeDefined();
  });

  describe("buttonClasses", () => {
    it.each([
      ["primary", "bg-accent"],
      ["secondary", "bg-surface-1"],
    ] as const)("maps variant=%s to its token background class", (variant, className) => {
      expect(buttonClasses({ variant })).toContain(className);
    });

    it("adds the square labelHidden classes", () => {
      expect(buttonClasses({ variant: "secondary", labelHidden: true })).toContain("min-w-touch");
    });
  });
});
