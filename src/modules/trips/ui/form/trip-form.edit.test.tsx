import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import cityMessages from "@/modules/trips/messages/en/city.json";
import editMessages from "@/modules/trips/messages/en/edit.json";
import formMessages from "@/modules/trips/messages/en/form.json";
import type { TripDto } from "@/modules/trips/service/schemas";
import { TripForm } from "@/modules/trips/ui/form/trip-form";
import { renderWithIntl } from "../../../../../tests/setup/intl";

const push = vi.fn();
vi.mock("@/shared/i18n/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const messages = { trips: { form: formMessages, city: cityMessages, edit: editMessages } };

const trip: TripDto = {
  id: "trip-1",
  name: "Europe",
  currency: "COP",
  version: 4,
  role: "owner",
  memberCount: 1,
  startDate: "2999-01-10",
  endDate: "2999-01-10",
  legs: [
    {
      from: { cityId: null, code: "BOG", name: "Bogotá" },
      to: { cityId: null, code: "MAD", name: "Madrid" },
      date: "2999-01-10",
    },
  ],
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  push.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function setup() {
  const user = userEvent.setup();
  renderWithIntl(<TripForm trip={trip} />, { messages });
  return user;
}

describe("TripForm in edit mode", () => {
  it("starts from the saved trip", () => {
    setup();

    expect(screen.getByLabelText("Trip name")).toHaveValue("Europe");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("saves with the version it read and returns home", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(trip), { status: 200 }));
    const user = setup();

    await user.clear(screen.getByLabelText("Trip name"));
    await user.type(screen.getByLabelText("Trip name"), "Europe 2027");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/trips/trip-1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toMatchObject({ name: "Europe 2027", version: 4 });
  });

  it("shows the conflict message when the version is stale", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "TRIP_VERSION_CONFLICT" } }), { status: 409 }),
    );
    const user = setup();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("This trip changed. Reload to see the latest.")).toBeVisible();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows the connection message when the request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const user = setup();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/connection/i);
  });

  it("deletes only after the dialog is confirmed, then goes home with a deleted flag", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const user = setup();

    await user.click(screen.getByRole("button", { name: "Delete trip" }));
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith({ pathname: "/", query: { deleted: "1" } }),
    );
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/trips/trip-1");
    expect(init.method).toBe("DELETE");
  });

  it("shows an error toast and stays on the form when the delete fails", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    const user = setup();

    await user.click(screen.getByRole("button", { name: "Delete trip" }));
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn’t delete the trip/i);
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Trip name")).toHaveValue("Europe");
  });

  it("returns focus to the delete button when the dialog is dismissed", async () => {
    const user = setup();
    const trigger = screen.getByRole("button", { name: "Delete trip" });

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Keep trip" }));

    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
