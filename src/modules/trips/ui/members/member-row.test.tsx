import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Role } from "@/modules/trips/domain/trip";
import membersMessages from "@/modules/trips/messages/en/members.json";
import type { MemberDto } from "@/modules/trips/service/schemas";
import { MemberRow } from "@/modules/trips/ui/members/member-row";
import sharedMessages from "@/shared/i18n/messages/en.json";
import { renderWithIntl } from "../../../../../tests/setup/intl";

vi.mock("@/shared/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const messages = { ...sharedMessages, trips: { members: membersMessages } };

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

/** Renders one row for `row` as seen by `viewer` (the signed-in member). */
function renderRow(row: MemberDto, viewer: MemberDto) {
  renderWithIntl(
    <ul>
      <MemberRow
        member={row}
        tripId="trip-1"
        tripName="Europe"
        viewerId={viewer.userId}
        viewerRole={viewer.role}
        onRemoved={() => {}}
      />
    </ul>,
    { messages },
  );
}

describe("MemberRow", () => {
  it("offers Remove to the owner on an editor's row", () => {
    renderRow(laura, jose);

    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("offers no Remove on the owner's own row", () => {
    renderRow(jose, jose);

    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
  });

  it("offers no Remove to an editor, even on another editor's row", () => {
    renderRow(ana, laura);

    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
  });

  it("offers Leave to an editor on their own row", () => {
    renderRow(laura, laura);

    expect(screen.getByRole("button", { name: "Leave trip" })).toBeInTheDocument();
  });

  it("offers no Leave to the owner", () => {
    renderRow(jose, jose);

    expect(screen.queryByRole("button", { name: "Leave trip" })).toBeNull();
  });

  it("offers no Leave to an editor on another editor's row", () => {
    renderRow(ana, laura);

    expect(
      within(screen.getByRole("listitem")).queryByRole("button", { name: "Leave trip" }),
    ).toBeNull();
  });
});
