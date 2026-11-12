import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Gap } from "@/modules/transfers/domain/gaps";
import cardMessages from "@/modules/transfers/messages/en/card.json";
import formMessages from "@/modules/transfers/messages/en/form.json";
import { TransferSheetHost } from "@/modules/transfers/ui/components/transfer-sheet-host";
import sharedMessages from "@/shared/i18n/messages/en.json";
import { openTransferSheet } from "@/shared/ui/transfer-events";
import { renderWithIntl } from "../../../../../tests/setup/intl";

const refresh = vi.fn();
vi.mock("@/shared/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

const messages = { ...sharedMessages, transfers: { form: formMessages, card: cardMessages } };

const gaps: Gap[] = [
  {
    index: 0,
    kind: "outbound",
    from: { name: "Bogotá", code: "BOG", tz: "America/Bogota" },
    to: { name: "Cartagena", code: "CTG", tz: "America/Bogota" },
    date: "2027-03-15",
    window: { from: null, to: "2027-03-15" },
  },
  {
    index: 1,
    kind: "between",
    from: { name: "Cartagena", code: "CTG", tz: "America/Bogota" },
    to: { name: "Santa Marta", code: "SMR", tz: "America/Bogota" },
    date: "2027-03-19",
    window: { from: "2027-03-15", to: "2027-03-19" },
  },
];

const fetchMock = vi.fn();

function answer(status: number, body?: unknown) {
  fetchMock.mockResolvedValueOnce(
    new Response(body === undefined ? null : JSON.stringify(body), { status }),
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  renderWithIntl(<TransferSheetHost tripId="trip-1" tripCurrency="COP" gaps={gaps} />, {
    messages,
  });
});

afterEach(() => {
  fetchMock.mockReset();
  refresh.mockReset();
  vi.unstubAllGlobals();
});

function open(detail: Parameters<typeof openTransferSheet>[0]) {
  act(() => openTransferSheet(detail));
}

const editing = {
  id: "t1",
  version: 4,
  mode: "bus",
  from: "Cartagena",
  to: "Santa Marta",
  departDate: "2027-03-19",
  departTime: null,
  cost: null,
  currency: null,
  charge: "all",
};

describe("TransferSheetHost", () => {
  it("renders nothing until the sheet is asked for", () => {
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the add sheet prefilled from the gap", async () => {
    open({ gap: 1 });

    const dialog = await screen.findByRole("dialog", { name: "Add transfer" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "From" })).toHaveValue("Cartagena");
    expect(screen.getByRole("textbox", { name: "To" })).toHaveValue("Santa Marta");
  });

  it("posts a new transfer for the gap, refreshes and closes", async () => {
    open({ gap: 1 });
    await screen.findByRole("dialog");
    answer(201, { id: "new" });

    await userEvent.click(screen.getByRole("button", { name: "Save transfer" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/v1/trips/trip-1/transfers");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({
      gap: 1,
      from: "Cartagena",
      to: "Santa Marta",
      departDate: "2027-03-19",
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("patches the transfer with its version when editing", async () => {
    open({ gap: 1, action: "edit", prefill: editing });
    await screen.findByRole("dialog", { name: "Edit transfer" });
    answer(200, { id: "t1" });

    await userEvent.click(screen.getByRole("button", { name: "Save transfer" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/v1/trips/trip-1/transfers/t1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toMatchObject({ mode: "bus", version: 4 });
    expect(refresh).toHaveBeenCalled();
  });

  it("keeps the sheet open and shows the conflict when the version is stale", async () => {
    open({ gap: 1, action: "edit", prefill: editing });
    await screen.findByRole("dialog");
    answer(409, {
      error: {
        code: "TRANSFER_VERSION_CONFLICT",
        message: "This transfer changed. Reload to see the latest.",
      },
    });

    await userEvent.click(screen.getByRole("button", { name: "Save transfer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This transfer changed. Reload to see the latest.",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows the message of a rejected arrival and stays open", async () => {
    open({ gap: 1 });
    await screen.findByRole("dialog");
    answer(400, {
      error: { code: "TRANSFER_ARRIVAL_BEFORE", message: "Arrival must be after departure." },
    });

    await userEvent.click(screen.getByRole("button", { name: "Save transfer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Arrival must be after departure.");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("asks before deleting, then deletes and refreshes", async () => {
    open({ gap: 1, action: "delete", prefill: editing });

    const dialog = await screen.findByRole("dialog", {
      name: "Delete the transfer from Cartagena to Santa Marta?",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    answer(204);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/v1/trips/trip-1/transfers/t1");
    expect(init.method).toBe("DELETE");
    expect(refresh).toHaveBeenCalled();
  });

  it("does not delete when the traveler cancels", async () => {
    open({ gap: 1, action: "delete", prefill: editing });
    await screen.findByRole("dialog");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
