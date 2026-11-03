import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import cityMessages from "@/modules/trips/messages/en/city.json";
import editMessages from "@/modules/trips/messages/en/edit.json";
import formMessages from "@/modules/trips/messages/en/form.json";
import type { TripDto } from "@/modules/trips/service/schemas";
import { TripForm } from "@/modules/trips/ui/form/trip-form";
import { renderWithIntl } from "../../../../../tests/setup/intl";

vi.mock("@/shared/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const messages = { trips: { form: formMessages, city: cityMessages, edit: editMessages } };

const trip: TripDto = {
  id: "trip-1",
  name: "Europe",
  currency: "COP",
  version: 1,
  role: "owner",
  memberCount: 1,
  startDate: "2999-01-10",
  endDate: "2999-01-20",
  legs: [
    {
      from: { cityId: null, code: "BOG", name: "Bogotá" },
      to: { cityId: null, code: "MAD", name: "Madrid" },
      date: "2999-01-10",
    },
    {
      from: { cityId: null, code: "MAD", name: "Madrid" },
      to: { cityId: null, code: "ROM", name: "Rome" },
      date: "2999-01-20",
    },
  ],
};

describe("TripForm saved cities in edit mode", () => {
  it("shows the saved From and To city names", () => {
    renderWithIntl(<TripForm trip={trip} />, { messages });

    const [from] = screen.getAllByRole("combobox", { name: "From" });
    const toFields = screen.getAllByRole("combobox", { name: "To" });

    expect(from).toHaveValue("Bogotá");
    expect(toFields.map((field) => (field as HTMLInputElement).value)).toEqual(["Madrid", "Rome"]);
  });
});
