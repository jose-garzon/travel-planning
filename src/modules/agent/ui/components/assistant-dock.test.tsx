import { act, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { askAssistantForGap } from "@/shared/ui/transfer-events";
import { renderWithIntl } from "../../../../../tests/setup/intl";
import { AssistantDock } from "./assistant-dock";

const isDesktop = vi.hoisted(() => ({ value: false }));
vi.mock("@/shared/ui/hooks/use-is-desktop", () => ({ useIsDesktop: () => isDesktop.value }));

function renderDock() {
  renderWithIntl(
    <AssistantDock label="Ask the assistant" closeLabel="Close">
      <p>chat</p>
    </AssistantDock>,
  );
}

const ask = { gap: 1, from: "Bogotá", to: "Cartagena", date: "2027-03-15" };

describe("AssistantDock", () => {
  beforeEach(() => {
    isDesktop.value = false;
  });

  it("opens the drawer when a gap asks the assistant on a phone", () => {
    renderDock();
    expect(screen.getByRole("button", { name: "Ask the assistant" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    act(() => askAssistantForGap(ask));
    expect(screen.getByRole("button", { name: "Ask the assistant" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
