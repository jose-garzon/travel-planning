import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Role } from "@/modules/trips/domain/trip";
import membersMessages from "@/modules/trips/messages/en/members.json";
import type { MemberDto } from "@/modules/trips/service/schemas";
import { TravelersCard } from "@/modules/trips/ui/members/travelers-card";
import sharedMessages from "@/shared/i18n/messages/en.json";
import { renderWithIntl } from "../../../../../tests/setup/intl";

vi.mock("@/shared/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const messages = { ...sharedMessages, trips: { members: membersMessages } };

const LONG_NAME = "Maria Fernanda de los Angeles Rodriguez Gomez";

function member(userId: string, name: string, role: Role): MemberDto {
  return {
    userId,
    name,
    email: `${userId}@example.com`,
    role,
    joinedAt: "2027-01-01T10:00:00.000Z",
  };
}

const jose = member("jose", "Jose", "owner");
const laura = member("laura", "Laura", "editor");
const ana = member("ana", "Ana", "editor");

/** A traveler's row. A listitem has no accessible name, so rows are found by their text. */
function rowOf(name: string): HTMLElement {
  const row = screen.getAllByRole("listitem").find((item) => item.textContent?.includes(name));
  if (row === undefined) {
    throw new Error(`no traveler row for ${name}`);
  }
  return row;
}

function renderCard(members: MemberDto[], role: Role = "owner") {
  renderWithIntl(
    <TravelersCard
      tripId="trip-1"
      tripName="Europe"
      viewerId="jose"
      members={members}
      role={role}
    />,
    { messages },
  );
}

describe("TravelersCard", () => {
  it("lists the travelers by name in the order given", () => {
    renderCard([jose, laura, ana]);

    const items = screen.getAllByRole("listitem").map((item) => item.textContent ?? "");

    expect(items.map((text) => text.includes("Jose"))).toEqual([true, false, false]);
    expect(items[1]).toContain("Laura");
    expect(items[2]).toContain("Ana");
  });

  it("marks the owner with the Owner badge and no one else", () => {
    renderCard([jose, laura]);

    expect(within(rowOf("Jose")).getByText("Owner")).toBeInTheDocument();
    expect(within(rowOf("Laura")).queryByText("Owner")).toBeNull();
  });

  it("shows the invite prompt when the owner is alone", () => {
    renderCard([jose]);

    expect(screen.getByText("Invite friends to plan together")).toBeInTheDocument();
  });

  it("hides the invite prompt once another traveler has joined", () => {
    renderCard([jose, laura]);

    expect(screen.queryByText("Invite friends to plan together")).toBeNull();
  });

  it("offers the Invite button to the owner", () => {
    renderCard([jose]);

    expect(screen.getByRole("button", { name: "Invite" })).toBeInTheDocument();
  });

  it("does not offer the Invite button to an editor", () => {
    renderCard([jose, laura], "editor");

    expect(screen.queryByRole("button", { name: "Invite" })).toBeNull();
  });

  it("names a long traveler in full", () => {
    renderCard([jose, member("maria", LONG_NAME, "editor")]);

    expect(screen.getByText(LONG_NAME)).toBeInTheDocument();
  });

  it("expands the mobile disclosure when its button is pressed", () => {
    renderCard([jose, laura]);

    const toggle = screen.getByRole("button", { name: /Travelers/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});
