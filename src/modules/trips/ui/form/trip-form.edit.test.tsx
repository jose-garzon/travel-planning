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

  it("hides Delete trip from an editor, who can still save", () => {
    renderWithIntl(<TripForm trip={{ ...trip, role: "editor" }} />, { messages });

    expect(screen.queryByRole("button", { name: "Delete trip" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("goes home with a removed flag when the save finds the trip gone (EC-5)", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));
    const user = setup();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith({ pathname: "/", query: { removed: "1" } }),
    );
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/trips/trip-1");
    expect(init.method).toBe("PATCH");
  });

  it("shows an error toast and stays on the form when the delete fails", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    const user = setup();

    await user.click(screen.getByRole("button", { name: "Delete trip" }));
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn’t delete the trip/i);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Trip name")).toHaveValue("Europe");
  });
});
