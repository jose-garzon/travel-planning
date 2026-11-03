import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/auth", () => ({ getCurrentUser: async () => null }));
vi.mock("@/modules/trips", () => ({
  createTrip: vi.fn(),
  listMyTrips: vi.fn(),
  tripInputSchema: { safeParse: () => ({ success: false, error: { issues: [] } }) },
}));
vi.mock("next-intl/server", () => ({
  getTranslations: async ({ locale }: { locale: string }) => {
    return (key: string) => `${locale}:${key}`;
  },
}));

const { GET, POST } = await import("./route");

function request(language: string): Request {
  return new Request("http://localhost/api/v1/trips", {
    method: "POST",
    headers: { "accept-language": language },
    body: "{}",
  });
}

describe("/api/v1/trips errors", () => {
  it("answers in English by default", async () => {
    const response = await POST(request("en-US"));

    expect(response.status).toBe(401);
    expect((await response.json()).error).toMatchObject({
      code: "UNAUTHENTICATED",
      message: "en:UNAUTHENTICATED",
    });
  });

  it("answers in Spanish for an es Accept-Language", async () => {
    const response = await GET(request("es-CO"));

    expect((await response.json()).error.message).toBe("es:UNAUTHENTICATED");
  });
});
