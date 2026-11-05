import { describe, expect, it, vi } from "vitest";
import { AGENT_DAILY_LIMIT } from "@/modules/agent/domain/suggestion";
import { askAgent, systemPrompt } from "@/modules/agent/service/ask-agent";
import type { AgentTripContext } from "@/modules/agent/service/ports";

const trip: AgentTripContext = {
  name: "Spain",
  currency: "EUR",
  startDate: "2027-05-01",
  endDate: "2027-05-10",
  stops: [{ from: "Bogotá", city: "Madrid", date: "2027-05-01" }],
  memberIds: ["u1", "u2"],
};

function deps(overrides: { used?: number; trip?: AgentTripContext | null; fail?: boolean } = {}) {
  return {
    trips: { get: vi.fn(async () => (overrides.trip === undefined ? trip : overrides.trip)) },
    usage: { take: vi.fn(async () => overrides.used ?? 0) },
    model: {
      reply: vi.fn(async () => {
        if (overrides.fail) {
          throw new Error("down");
        }
        return {
          text: "Here you go",
          suggestions: [
            {
              kind: "budget" as const,
              category: "lodging" as const,
              label: "Hostel",
              amount: 200,
              currency: "EUR",
              perPerson: false,
              sourceUrl: null,
            },
          ],
        };
      }),
    },
    ids: { next: () => "s1" },
  };
}

const command = {
  userId: "u1",
  tripId: "t1",
  locale: "es" as const,
  today: "2027-01-01",
  messages: [{ role: "user" as const, content: "hola" }],
};

describe("askAgent", () => {
  it("returns the reply with ids on suggestions", async () => {
    const result = await askAgent(command, deps());
    expect(result).toEqual({
      ok: true,
      value: {
        reply: "Here you go",
        suggestions: [expect.objectContaining({ id: "s1", label: "Hostel" })],
      },
    });
  });

  it("hides trips from non-members", async () => {
    expect(await askAgent(command, deps({ trip: null }))).toEqual({
      ok: false,
      error: { code: "TRIP_NOT_FOUND" },
    });
  });

  it("stops at the daily limit without calling the model", async () => {
    const d = deps({ used: AGENT_DAILY_LIMIT });
    expect(await askAgent(command, d)).toEqual({
      ok: false,
      error: { code: "AGENT_RATE_LIMITED" },
    });
    expect(d.model.reply).not.toHaveBeenCalled();
  });

  it("maps model failures to AGENT_UNAVAILABLE", async () => {
    expect(await askAgent(command, deps({ fail: true }))).toEqual({
      ok: false,
      error: { code: "AGENT_UNAVAILABLE" },
    });
  });
});

describe("systemPrompt", () => {
  it("names the locale, route and currency", () => {
    const prompt = systemPrompt(trip, "es", "2027-01-01");
    expect(prompt).toContain("Spanish");
    expect(prompt).toContain("Bogotá → Madrid");
    expect(prompt).toContain("EUR");
  });
});
