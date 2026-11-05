import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import joinMessages from "@/modules/trips/messages/en/join.json";
import type { InvitePreviewDto } from "@/modules/trips/service/schemas";
import { JoinScreen } from "@/modules/trips/ui/join/join-screen";
import sharedMessages from "@/shared/i18n/messages/en.json";
import { renderWithIntl } from "../../../../../tests/setup/intl";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("@/shared/i18n/navigation", () => ({
  useRouter: () => ({ push }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const messages = { ...sharedMessages, trips: { join: joinMessages } };

const preview: InvitePreviewDto = {
  tripId: "trip-1",
  tripName: "Europe",
  ownerName: "Jose",
  startDate: "2026-11-20",
  endDate: "2026-12-03",
  memberCount: 1,
};

function renderJoin({ signedIn = true } = {}) {
  renderWithIntl(
    <JoinScreen token="token-1" preview={preview} signedIn={signedIn}>
      <p>Sign in form</p>
    </JoinScreen>,
    { messages },
  );
}

function joinButton() {
  return screen.getByRole("button", { name: "Join trip" });
}

afterEach(() => {
  vi.unstubAllGlobals();
  push.mockReset();
});

describe("JoinScreen", () => {
  it("shows who invited the visitor, the trip, its dates and travelers", () => {
    renderJoin();

    expect(screen.getByText("Jose invited you to")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Europe" })).toBeInTheDocument();
    expect(screen.getByText(/Nov 20.*Dec 3/)).toBeInTheDocument();
    expect(screen.getByText("1 traveler")).toBeInTheDocument();
  });

  it("offers the sign-in slot instead of the join button to a signed-out visitor", () => {
    renderJoin({ signedIn: false });

    expect(screen.getByText("Sign in form")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Join trip" })).not.toBeInTheDocument();
  });

  it("joins through the API and opens the trip with the joined toast", async () => {
    const fetchMock = vi.fn(async () => Response.json({ tripId: "trip-1", alreadyMember: false }));
    vi.stubGlobal("fetch", fetchMock);
    renderJoin();

    fireEvent.click(joinButton());

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/invites/token-1/join", { method: "POST" });
    expect(push).toHaveBeenCalledWith("/trips/trip-1?joined=1");
  });

  it("disables the join button while the request is pending", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );
    renderJoin();

    fireEvent.click(joinButton());

    await waitFor(() => expect(screen.getByRole("button", { name: "Joining…" })).toBeDisabled());
  });

  it("shows the expired message asking the trip owner when the link stops working mid-join", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: {} }, { status: 410 })),
    );
    renderJoin();

    fireEvent.click(joinButton());

    expect(
      await screen.findByRole("heading", {
        name: "This invite link has expired. Ask the trip owner for a new one.",
      }),
    ).toBeInTheDocument();
  });

  it("shows the full message when the trip has 20 travelers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: {} }, { status: 409 })),
    );
    renderJoin();

    fireEvent.click(joinButton());

    expect(
      await screen.findByRole("heading", { name: "This trip is full (20 travelers)" }),
    ).toBeInTheDocument();
  });
});

describe("JoinScreen while offline", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "onLine");
  });

  it("disables Join trip when the browser is offline", () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });

    renderJoin();

    expect(joinButton()).toBeDisabled();
  });
});

describe("JoinScreen offline note", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "onLine");
  });

  it("says why Join trip is unavailable while offline", () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });

    renderJoin();

    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });
});
