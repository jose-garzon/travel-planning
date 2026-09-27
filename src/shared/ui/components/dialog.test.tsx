import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../../../../tests/setup/intl";
import { Dialog, DialogClose } from "./dialog";

describe("Dialog", () => {
  it("wires the title so the dialog is named by it (aria-labelledby)", () => {
    renderWithIntl(
      <Dialog
        trigger={<button type="button">Rename trip</button>}
        title="Rename trip"
        closeLabel="Close"
        open
      />,
    );

    expect(screen.getByRole("dialog", { name: "Rename trip" })).toBeInTheDocument();
  });

  it("wires the description via aria-describedby", () => {
    renderWithIntl(
      <Dialog
        trigger={<button type="button">Rename trip</button>}
        title="Rename trip"
        description="Friends see the new name right away."
        closeLabel="Close"
        open
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Rename trip" });
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(describedBy, "dialog has no aria-describedby").toBeTruthy();
    expect(screen.getByText("Friends see the new name right away.").id).toBe(describedBy);
  });

  it("has no aria-describedby when there is no description", () => {
    renderWithIntl(
      <Dialog
        trigger={<button type="button">Rename trip</button>}
        title="Rename trip"
        closeLabel="Close"
        open
      />,
    );

    expect(screen.getByRole("dialog", { name: "Rename trip" })).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("names the X close button with closeLabel", () => {
    renderWithIntl(
      <Dialog
        trigger={<button type="button">Rename trip</button>}
        title="Rename trip"
        closeLabel="Close"
        open
      />,
    );

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when the X close button is clicked", () => {
    const onOpenChange = vi.fn();
    renderWithIntl(
      <Dialog
        trigger={<button type="button">Rename trip</button>}
        title="Rename trip"
        closeLabel="Close"
        open
        onOpenChange={onOpenChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("translates a translateId title and closeLabel", () => {
    renderWithIntl(
      <Dialog
        trigger={<button type="button">Trigger</button>}
        title={{ translateId: "common.appName" }}
        closeLabel={{ translateId: "common.appName" }}
        open
      />,
    );

    expect(screen.getByRole("dialog", { name: "Parche" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Parche" })).toBeInTheDocument();
  });

  it("wraps a footer button in DialogClose so clicking it closes the dialog", () => {
    const onOpenChange = vi.fn();
    renderWithIntl(
      <Dialog
        trigger={<button type="button">Rename trip</button>}
        title="Rename trip"
        closeLabel="Close"
        open
        onOpenChange={onOpenChange}
        footer={
          <DialogClose>
            <button type="button">Cancel</button>
          </DialogClose>
        }
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders children inside the dialog", () => {
    renderWithIntl(
      <Dialog
        trigger={<button type="button">Rename trip</button>}
        title="Rename trip"
        closeLabel="Close"
        open
      >
        <p>Body content</p>
      </Dialog>,
    );

    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("carries the data-ui=dialog marker on its root element", () => {
    renderWithIntl(
      <Dialog
        trigger={<button type="button">Rename trip</button>}
        title="Rename trip"
        closeLabel="Close"
        open
      />,
    );

    expect(document.querySelector('[data-ui="dialog"]')).toBeInTheDocument();
  });

  it("does not render the dialog when closed", () => {
    renderWithIntl(
      <Dialog
        trigger={<button type="button">Rename trip</button>}
        title="Rename trip"
        closeLabel="Close"
        open={false}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the trigger's own accessible name", () => {
    renderWithIntl(
      <Dialog
        trigger={<button type="button">Rename trip</button>}
        title="Rename trip"
        closeLabel="Close"
        open={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Rename trip" })).toBeInTheDocument();
  });
});
