import { describe, expect, it, vi } from "vitest";

const getOrCreateInvite = vi.hoisted(() =>
  vi.fn(async () => ({ ok: false, error: { code: "TRIP_FORBIDDEN" } })),
);

vi.mock("@/modules/auth", () => ({ getCurrentUser: async () => ({ id: "laura" }) }));
vi.mock("@/app/_composition/trip-members", () => ({ tripMembers: { getOrCreateInvite } }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

const { POST } = await import("./route");

describe("POST /api/v1/trips/[tripId]/invite", () => {
  it("answers an editor 403 TRIP_FORBIDDEN", async () => {
    const request = new Request("http://localhost/api/v1/trips/trip-1/invite", {
      method: "POST",
    });

    const response = await POST(request, { params: Promise.resolve({ tripId: "trip-1" }) });

    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("TRIP_FORBIDDEN");
    expect(getOrCreateInvite).toHaveBeenCalledWith({
      userId: "laura",
      tripId: "trip-1",
      origin: "http://localhost",
      now: expect.any(Date),
    });
  });
});
