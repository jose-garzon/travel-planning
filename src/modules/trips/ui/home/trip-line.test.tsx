import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CityRef } from "@/modules/trips/domain/trip";
import cardsEn from "@/modules/trips/messages/en/cards.json";
import homeEn from "@/modules/trips/messages/en/home.json";
import cardsEs from "@/modules/trips/messages/es/cards.json";
import homeEs from "@/modules/trips/messages/es/home.json";
import type { TripDto } from "@/modules/trips/service/schemas";
import { TripLine } from "@/modules/trips/ui/home/trip-line";
import { renderWithIntl } from "../../../../../tests/setup/intl";

const en = { trips: { cards: cardsEn, home: homeEn } };
const es = { trips: { cards: cardsEs, home: homeEs } };

function city(name: string): CityRef {
  return { cityId: null, code: name.slice(0, 3).toUpperCase(), name };
}

function trip(
  dates: Array<string | null>,
  route: string[] = ["Bogota", "Madrid", "Barcelona", "Bogota"],
): TripDto {
  return {
    id: "t1",
    name: "Europe",
    currency: "EUR",
    version: 1,
    role: "owner",
    memberCount: 1,
    startDate: dates[0] ?? null,
    endDate: dates[dates.length - 1] ?? null,
    legs: dates.map((date, index) => ({
      from: city(route[index] as string),
      to: city(route[index + 1] as string),
      date,
    })),
  };
}

const DATED = trip(["2027-03-10", "2027-03-13", "2027-03-18"]);

function stationTexts() {
  return screen.getAllByRole("listitem").map((item) => item.textContent ?? "");
}

describe("TripLine", () => {
  it("lists takeoff, each stop and back home in order", () => {
    renderWithIntl(<TripLine trip={DATED} today="2027-03-01" />, { messages: en });

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent("Takeoff BOG");
    expect(items[1]).toHaveTextContent("MAD");
    expect(items[2]).toHaveTextContent("BAR");
    expect(items[3]).toHaveTextContent("Back home BOG");
  });

  it("shows the stop's place in the route and its nights", () => {
    renderWithIntl(<TripLine trip={DATED} today="2027-03-01" />, { messages: en });

    expect(stationTexts()[1]).toContain("Stop 1 of 2");
    expect(stationTexts()[1]).toContain("3 nights");
    expect(stationTexts()[2]).toContain("Stop 2 of 2");
    expect(stationTexts()[2]).toContain("5 nights");
  });

  it("says one night in the singular and in the active locale", () => {
    const oneNight = trip(["2027-03-10", "2027-03-11", "2027-03-18"]);
    const { unmount } = renderWithIntl(<TripLine trip={oneNight} today="2027-03-01" />, {
      messages: en,
    });
    expect(stationTexts()[1]).toContain("1 night");
    expect(stationTexts()[1]).not.toContain("1 nights");
    unmount();

    renderWithIntl(<TripLine trip={DATED} today="2027-03-01" />, { messages: es, locale: "es" });
    expect(stationTexts()[1]).toContain("Parada 1 de 2");
    expect(stationTexts()[1]).toContain("3 noches");
  });

  it("omits nights and shows a placeholder when a date is unknown", () => {
    renderWithIntl(<TripLine trip={trip(["2027-03-10", null, null])} today="2027-03-01" />, {
      messages: en,
    });

    expect(stationTexts()[2]).toContain("Date TBD");
    expect(stationTexts()[2]).not.toContain("night");
  });

  it("marks the first stop as current before the trip", () => {
    renderWithIntl(<TripLine trip={DATED} today="2027-03-01" />, { messages: en });

    const current = screen.getAllByText(/./, { selector: "[aria-current='step']" });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("MAD");
  });

  it("marks the stop that covers today", () => {
    renderWithIntl(<TripLine trip={DATED} today="2027-03-14" />, { messages: en });

    const current = screen.getAllByText(/./, { selector: "[aria-current='step']" });
    expect(current[0]).toHaveTextContent("BAR");
  });

  it("marks no stop once the trip is back home", () => {
    renderWithIntl(<TripLine trip={DATED} today="2027-04-01" />, { messages: en });

    expect(document.querySelector("[aria-current='step']")).toBeNull();
  });

  it("counts down to the current stop and to takeoff", () => {
    renderWithIntl(<TripLine trip={DATED} today="2027-03-08" />, { messages: en });

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("2 days to go");
    expect(items[1]).toHaveTextContent("In 2 days");
  });

  it("puts the line in a labelled, keyboard-focusable scroller", () => {
    renderWithIntl(<TripLine trip={DATED} today="2027-03-01" />, { messages: en });

    const scroller = screen.getByRole("region", { name: "Route" });
    expect(scroller).toHaveAttribute("tabindex", "0");
    expect(within(scroller).getByRole("list")).toBeInTheDocument();
  });
});
