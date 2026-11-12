import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import cardMessages from "@/modules/transfers/messages/en/card.json";
import { JoinTransferToggle } from "@/modules/transfers/ui/components/join-transfer-toggle";
import sharedMessages from "@/shared/i18n/messages/en.json";
import { renderWithIntl } from "../../../../../tests/setup/intl";

const refresh = vi.fn();
vi.mock("@/shared/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

const messages = { ...sharedMessages, transfers: { card: cardMessages } };

function renderToggle(participantIds: string[] = []) {
  return renderWithIntl(
    <JoinTransferToggle
      tripId="trip-1"
      transferId="t1"
      from="Cartagena"
      to="Santa Marta"
      participantIds={participantIds}
      viewerId="me"
      memberCount={2}
    />,
    { messages },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

describe("JoinTransferToggle", () => {
  it("shows how many of the travelers joined", () => {
    renderToggle(["other"]);

    expect(screen.getByText("1 of 2")).toBeInTheDocument();
  });

  it("is not pressed until the viewer joined", () => {
    renderToggle(["other"]);

    expect(screen.getByRole("button", { name: /^Join/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("is pressed when the viewer joined", () => {
    renderToggle(["me"]);

    expect(screen.getByRole("button", { name: /^Join/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("joins with PUT, updates the count and refreshes the page", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    renderToggle();

    await userEvent.click(screen.getByRole("button", { name: /^Join/ }));

    expect(screen.getByText("1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Join/ })).toHaveAttribute("aria-pressed", "true");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/trips/trip-1/transfers/t1/participation",
      expect.objectContaining({ method: "PUT" }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("leaves with DELETE", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    renderToggle(["me"]);

    await userEvent.click(screen.getByRole("button", { name: /^Join/ }));

    expect(screen.getByText("0 of 2")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/trips/trip-1/transfers/t1/participation",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("goes back and says so when the server refuses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ error: { message: "Nope" } }, { status: 400 })),
    );
    renderToggle();

    await userEvent.click(screen.getByRole("button", { name: /^Join/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Nope");
    expect(screen.getByText("0 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Join/ })).toHaveAttribute("aria-pressed", "false");
  });
});
