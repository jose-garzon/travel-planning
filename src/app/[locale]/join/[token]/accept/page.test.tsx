import { beforeEach, describe, expect, it, vi } from "vitest";

const { joinTrip, getCurrentUser } = vi.hoisted(() => ({
  joinTrip: vi.fn(),
  getCurrentUser: vi.fn(),
}));

class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super("NEXT_REDIRECT");
  }
}

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectSignal(url);
  },
}));
vi.mock("@/app/_composition/trip-members", () => ({ tripMembers: { joinTrip } }));
vi.mock("@/modules/auth", () => ({ getCurrentUser }));

const { default: AcceptPage } = await import("./page");

const TOKEN = "token-1";
const member = {
  id: "user-1",
  displayName: "Laura",
  email: "laura@example.com",
  needsDisplayName: false,
};

/** The path the page redirected to during render. */
async function visit(): Promise<string> {
  try {
    await AcceptPage({
      params: Promise.resolve({ locale: "en", token: TOKEN }),
    } as never);
  } catch (error) {
    if (error instanceof RedirectSignal) {
      const target = new URL(error.url, "http://localhost:3000");
      return `${target.pathname}${target.search}`;
    }
    throw error;
  }
  throw new Error("expected the page to redirect");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/[locale]/join/[token]/accept page", () => {
  it("sends a signed-out visitor back to the join page", async () => {
    getCurrentUser.mockResolvedValue(null);

    expect(await visit()).toBe(`/en/join/${TOKEN}`);
    expect(joinTrip).not.toHaveBeenCalled();
  });

  it("asks a new user for a name first, then comes back here", async () => {
    getCurrentUser.mockResolvedValue({ ...member, needsDisplayName: true });

    expect(await visit()).toBe(`/en?next=${encodeURIComponent(`/en/join/${TOKEN}/accept`)}`);
    expect(joinTrip).not.toHaveBeenCalled();
  });

  it("joins the trip and opens it with the joined toast", async () => {
    getCurrentUser.mockResolvedValue(member);
    joinTrip.mockResolvedValue({ ok: true, value: { tripId: "trip-1", alreadyMember: false } });

    expect(await visit()).toBe("/en/trips/trip-1?joined=1");
    expect(joinTrip).toHaveBeenCalledWith({
      userId: "user-1",
      token: TOKEN,
      now: expect.any(Date),
    });
  });

  it("opens the trip with the already toast when the visitor is a member", async () => {
    getCurrentUser.mockResolvedValue(member);
    joinTrip.mockResolvedValue({ ok: true, value: { tripId: "trip-1", alreadyMember: true } });

    expect(await visit()).toBe("/en/trips/trip-1?already=1");
  });

  it("sends an expired or deleted link to the join page with the expired state", async () => {
    getCurrentUser.mockResolvedValue(member);
    joinTrip.mockResolvedValue({ ok: false, error: { code: "INVITE_EXPIRED" } });

    expect(await visit()).toBe(`/en/join/${TOKEN}?expired=1`);
  });

  it("sends a full trip to the join page with the full state", async () => {
    getCurrentUser.mockResolvedValue(member);
    joinTrip.mockResolvedValue({ ok: false, error: { code: "TRIP_FULL" } });

    expect(await visit()).toBe(`/en/join/${TOKEN}?full=1`);
  });
});
