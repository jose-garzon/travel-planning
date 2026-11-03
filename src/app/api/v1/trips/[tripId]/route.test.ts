import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/auth", () => ({ getCurrentUser: async () => ({ id: "user-1" }) }));
vi.mock("@/modules/trips", () => ({
  tripInputSchema: {
    extend: () => ({ safeParse: () => ({ success: false, error: { issues: [] } }) }),
  },
  getTrip: async () => ({ ok: false, error: { code: "TRIP_NOT_FOUND" } }),
  deleteTrip: async () => ({ ok: false, error: { code: "TRIP_FORBIDDEN" } }),
  updateTrip: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("next-intl/server", () => ({
  getTranslations: async ({ locale }: { locale: string }) => {
    return (key: string) => `${locale}:${key}`;
  },
}));

const { GET, DELETE } = await import("./route");

const context = { params: Promise.resolve({ tripId: "trip-1" }) };

function request(language: string): Request {
  return new Request("http://localhost/api/v1/trips/trip-1", {
    headers: { "accept-language": language },
  });
}

describe("/api/v1/trips/[tripId] errors", () => {
  it("answers a missing trip in the request language", async () => {
    const english = await GET(request("en"), context);
    const spanish = await GET(request("es-ES,es;q=0.9"), context);

    expect(english.status).toBe(404);
    expect((await english.json()).error.message).toBe("en:TRIP_NOT_FOUND");
    expect((await spanish.json()).error.message).toBe("es:TRIP_NOT_FOUND");
  });

  it("answers a forbidden delete in the request language", async () => {
    const response = await DELETE(request("es"), context);

    expect(response.status).toBe(403);
    expect((await response.json()).error.message).toBe("es:TRIP_FORBIDDEN");
  });
});
