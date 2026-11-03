import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import cardsEn from "@/modules/trips/messages/en/cards.json";
import homeEn from "@/modules/trips/messages/en/home.json";
import cardsEs from "@/modules/trips/messages/es/cards.json";
import homeEs from "@/modules/trips/messages/es/home.json";
import type { TripDto } from "@/modules/trips/service/schemas";
import { TripLine } from "@/modules/trips/ui/home/trip-line";
import { renderWithIntl } from "../../../../../tests/setup/intl";

const en = { trips: { home: homeEn, cards: cardsEn } };
const es = { trips: { home: homeEs, cards: cardsEs } };

function city(name: string, code: string) {
  return { cityId: null, code, name };
}

function tripWith(dates: Array<string | null>): TripDto {
  const names: Array<[string, string]> = [
    ["Bogotá", "BOG"],
    ["Madrid", "MAD"],
    ["Barcelona", "BCN"],
    ["Bogotá", "BOG"],
  ];
  const legs = dates.map((date, index) => ({
    from: city(...(names[index] as [string, string])),
    to: city(...(names[index + 1] as [string, string])),
    date,
  }));
  const dated = dates.filter((date) => date !== null);

  return {
    id: "t1",
    name: "Europe",
    currency: "USD",
    version: 1,
    role: "owner",
    memberCount: 1,
    startDate: dated[0] ?? null,
    endDate: dated[dated.length - 1] ?? null,
    legs,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TripLine", () => {
  const trip = tripWith(["2027-03-10", "2027-03-13", "2027-03-18"]);

  it("lists takeoff, stops and back home in order inside a named region", () => {
    renderWithIntl(<TripLine trip={trip} today="2027-03-01" />, { messages: en });

    const region = screen.getByRole("region", { name: "Trip stops" });
    const items = within(region).getAllByRole("listitem");

    expect(items).toHaveLength(4);
    expect(items[0]?.textContent).toContain("Takeoff");
    expect(items[1]?.textContent).toContain("MAD");
    expect(items[2]?.textContent).toContain("BCN");
    expect(items[3]?.textContent).toContain("Back home");
  });

  it("shows stop position and nights", () => {
    renderWithIntl(<TripLine trip={trip} today="2027-03-01" />, { messages: en });

    expect(screen.getByText("Stop 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("3 nights")).toBeInTheDocument();
    expect(screen.getByText("5 nights")).toBeInTheDocument();
  });

  it("uses the singular for one night", () => {
    renderWithIntl(
      <TripLine trip={tripWith(["2027-03-10", "2027-03-11", "2027-03-18"])} today="2027-03-01" />,
      { messages: en },
    );

    expect(screen.getByText("1 night")).toBeInTheDocument();
  });

  it("shows Date TBD and no nights for an undated stop", () => {
    renderWithIntl(<TripLine trip={tripWith([null, null, null])} today="2027-03-01" />, {
      messages: en,
    });

    expect(screen.getAllByText("Date TBD").length).toBeGreaterThan(0);
    expect(screen.queryByText(/night/)).toBeNull();
  });

  it("marks only the current stop", () => {
    renderWithIntl(<TripLine trip={trip} today="2027-03-14" />, { messages: en });

    const marked = screen.getAllByText("Current stop");

    expect(marked).toHaveLength(1);
    expect(marked[0]?.closest("li")?.textContent).toContain("BCN");
  });

  it("marks no stop after the trip", () => {
    renderWithIntl(<TripLine trip={trip} today="2027-04-01" />, { messages: en });

    expect(screen.queryByText("Current stop")).toBeNull();
  });

  it("counts down to takeoff with plural forms", () => {
    renderWithIntl(<TripLine trip={trip} today="2027-03-09" />, { messages: en });
    expect(screen.getByText("1 day to go")).toBeInTheDocument();
    cleanup();

    renderWithIntl(<TripLine trip={trip} today="2027-03-10" />, { messages: en });
    expect(screen.getByText("Today!")).toBeInTheDocument();
    cleanup();

    renderWithIntl(<TripLine trip={trip} today="2027-03-12" />, { messages: en });
    expect(screen.getByText("On the way")).toBeInTheDocument();
  });

  it("counts down to the end of the trip at back home", () => {
    renderWithIntl(<TripLine trip={trip} today="2027-03-10" />, { messages: en });

    expect(screen.getByText("Trip ends in 8 days")).toBeInTheDocument();
  });

  it("renders Spanish copy with Spanish plurals", () => {
    renderWithIntl(<TripLine trip={trip} today="2027-03-01" />, { messages: es, locale: "es" });

    expect(screen.getByRole("region", { name: "Paradas del viaje" })).toBeInTheDocument();
    expect(screen.getByText("3 noches")).toBeInTheDocument();
    expect(screen.getByText("Parada 1 de 2")).toBeInTheDocument();
  });

  it("makes the region keyboard focusable only when the line overflows", () => {
    renderWithIntl(<TripLine trip={trip} today="2027-03-01" />, { messages: en });
    expect(screen.getByRole("region", { name: "Trip stops" })).not.toHaveAttribute("tabindex");
    cleanup();

    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(2000);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(500);
    renderWithIntl(<TripLine trip={trip} today="2027-03-01" />, { messages: en });

    expect(screen.getByRole("region", { name: "Trip stops" })).toHaveAttribute("tabindex", "0");
  });
});
