import { describe, expect, it, vi } from "vitest";

class NotFoundSignal extends Error {}
const notFound = vi.fn(() => {
  throw new NotFoundSignal();
});
const getTripAccess = vi.fn(async () => "member");

vi.mock("next/navigation", () => ({ notFound }));
vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/modules/auth", () => ({ getCurrentUser: async () => ({ id: "user-1" }) }));
vi.mock("@/modules/trips", () => ({
  getTrip: async () => ({ ok: false, error: { code: "TRIP_NOT_FOUND" } }),
}));
vi.mock("@/modules/trips/ui", () => ({ TripForm: () => null }));
vi.mock("@/app/_composition/trip-members", () => ({
  tripMembers: { listTripMembers: async () => ({ ok: true, value: [] }), getTripAccess },
}));
vi.mock("@/shared/i18n/navigation", () => ({ Link: () => null, redirect: vi.fn() }));

const { default: EditTripPage } = await import("./page");
const { redirect } = await import("@/shared/i18n/navigation");

describe("EditTripPage", () => {
  it("answers a missing trip with a real not-found", async () => {
    const params = Promise.resolve({ locale: "en", tripId: "missing" });

    await expect(EditTripPage({ params } as never)).rejects.toBeInstanceOf(NotFoundSignal);
    expect(notFound).toHaveBeenCalled();
  });

  it("sends a removed member home with the removed toast when they are no longer on the trip", async () => {
    getTripAccess.mockResolvedValueOnce("not-member");
    const params = Promise.resolve({ locale: "en", tripId: "trip-1" });

    await EditTripPage({ params, searchParams: Promise.resolve({}) } as never);

    expect(redirect).toHaveBeenCalledWith({
      href: { pathname: "/", query: { removed: "1" } },
      locale: "en",
    });
  });
});
