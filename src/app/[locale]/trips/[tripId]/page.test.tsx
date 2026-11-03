import { describe, expect, it, vi } from "vitest";

class NotFoundSignal extends Error {}
const notFound = vi.fn(() => {
  throw new NotFoundSignal();
});

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
vi.mock("@/shared/i18n/navigation", () => ({ Link: () => null, redirect: vi.fn() }));

const { default: EditTripPage } = await import("./page");

describe("EditTripPage", () => {
  it("answers a missing trip with a real not-found", async () => {
    const params = Promise.resolve({ locale: "en", tripId: "missing" });

    await expect(EditTripPage({ params } as never)).rejects.toBeInstanceOf(NotFoundSignal);
    expect(notFound).toHaveBeenCalled();
  });
});
