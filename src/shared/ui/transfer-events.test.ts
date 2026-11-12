// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import {
  askAssistantForGap,
  onAskAssistantForGap,
  onOpenTransferSheet,
  openTransferSheet,
} from "@/shared/ui/transfer-events";

describe("transfer events", () => {
  it("delivers openTransferSheet to subscribers with its payload", () => {
    const listener = vi.fn();
    const unsubscribe = onOpenTransferSheet(listener);

    openTransferSheet({ gap: 2, prefill: { to: "Lima" } });

    expect(listener).toHaveBeenCalledWith({ gap: 2, prefill: { to: "Lima" } });
    unsubscribe();
  });

  it("delivers askAssistantForGap to subscribers with its payload", () => {
    const listener = vi.fn();
    const unsubscribe = onAskAssistantForGap(listener);

    askAssistantForGap({ gap: 1, from: "Cartagena", to: "Santa Marta", date: "2027-03-19" });

    expect(listener).toHaveBeenCalledWith({
      gap: 1,
      from: "Cartagena",
      to: "Santa Marta",
      date: "2027-03-19",
    });
    unsubscribe();
  });

  it("stops delivering after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = onOpenTransferSheet(listener);
    unsubscribe();

    openTransferSheet({ gap: 0 });

    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps the two events apart", () => {
    const sheet = vi.fn();
    const assistant = vi.fn();
    const offSheet = onOpenTransferSheet(sheet);
    const offAssistant = onAskAssistantForGap(assistant);

    openTransferSheet({ gap: 0 });

    expect(sheet).toHaveBeenCalledTimes(1);
    expect(assistant).not.toHaveBeenCalled();
    offSheet();
    offAssistant();
  });
});
