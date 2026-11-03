import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../../../../tests/setup/intl";
import { Toast } from "./toast";

afterEach(() => {
  vi.useRealTimers();
});

describe("Toast", () => {
  it("announces a success politely as a status", () => {
    renderWithIntl(<Toast tone="success">Trip deleted</Toast>);

    expect(screen.getByRole("status")).toHaveTextContent("Trip deleted");
  });

  it("announces an error at once as an alert", () => {
    renderWithIntl(<Toast tone="error">Couldn’t delete</Toast>);

    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t delete");
  });

  it("goes away when dismissed with its button", () => {
    const onDismiss = vi.fn();
    renderWithIntl(
      <Toast tone="success" onDismiss={onDismiss}>
        Trip deleted
      </Toast>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByText("Trip deleted")).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("dismisses itself after its duration", () => {
    vi.useFakeTimers();
    renderWithIntl(
      <Toast tone="success" durationMs={1000}>
        Trip deleted
      </Toast>,
    );

    expect(screen.getByText("Trip deleted")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText("Trip deleted")).not.toBeInTheDocument();
  });
});
