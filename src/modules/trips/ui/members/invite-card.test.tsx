import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import inviteMessages from "@/modules/trips/messages/en/invite.json";
import { InviteCard } from "@/modules/trips/ui/members/invite-card";
import sharedMessages from "@/shared/i18n/messages/en.json";
import { renderWithIntl } from "../../../../../tests/setup/intl";

const messages = { ...sharedMessages, trips: { invite: inviteMessages } };

const DAY_MS = 24 * 60 * 60 * 1000;
const LINK = {
  url: "https://travel.test/join/token-1",
  expiresAt: new Date(Date.now() + 7 * DAY_MS).toISOString(),
};

function renderCard() {
  renderWithIntl(
    <InviteCard
      tripId="trip-1"
      tripName="Europe"
      trigger={<button type="button">Invite</button>}
    />,
    { messages },
  );
}

/** Opens the card and waits for the link it loads. */
async function openCard(): Promise<HTMLInputElement> {
  fireEvent.click(screen.getByRole("button", { name: "Invite" }));
  return (await screen.findByRole("textbox", { name: "Invite link" })) as HTMLInputElement;
}

function setClipboard(writeText: () => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn(writeText) },
    configurable: true,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "clipboard");
  Reflect.deleteProperty(navigator, "share");
});

describe("InviteCard", () => {
  it("shows the link and how many days it has left", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(LINK)),
    );
    renderCard();

    const field = await openCard();

    expect(field).toHaveValue(LINK.url);
    expect(screen.getByText("Expires in 7 days")).toBeInTheDocument();
  });

  it("shows an error when the link cannot load", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 500 })),
    );
    renderCard();

    await openCard().catch(() => undefined);

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn’t load the invite link");
  });

  it("hides Share when the browser has no Web Share API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(LINK)),
    );
    renderCard();

    await openCard();

    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
  });

  it("offers Share when the browser has the Web Share API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(LINK)),
    );
    Object.defineProperty(navigator, "share", { value: vi.fn(), configurable: true });
    renderCard();

    await openCard();

    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
  });

  it("shares the trip name with the link", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(LINK)),
    );
    const share = vi.fn(async () => {});
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    renderCard();

    await openCard();
    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(share).toHaveBeenCalledWith({ title: "Europe", url: LINK.url });
  });

  it("copies the link and announces Copied", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(LINK)),
    );
    setClipboard(async () => {});
    renderCard();

    await openCard();
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(LINK.url);
    expect(await screen.findByRole("status")).toHaveTextContent("Copied");
  });

  it("selects the link and shows an error when copying fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(LINK)),
    );
    setClipboard(async () => {
      throw new Error("denied");
    });
    renderCard();

    const field = await openCard();
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Couldn’t copy the link");
    await waitFor(() => expect(field).toHaveFocus());
    expect(field.selectionStart).toBe(0);
    expect(field.selectionEnd).toBe(LINK.url.length);
    expect(within(alert).queryByText("Copied")).toBeNull();
  });
});
