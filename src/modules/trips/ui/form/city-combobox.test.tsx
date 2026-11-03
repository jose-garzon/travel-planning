import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CityCombobox } from "@/modules/trips/ui/form/city-combobox";
import { renderWithIntl } from "../../../../../tests/setup/intl";

const messages = {
  trips: {
    form: { to: "To" },
    city: {
      suggestions: "Suggested cities",
      noResults: "No city found",
      results: "{count} results",
    },
  },
};

const london = { cityId: "g1", code: "LON", name: "London", country: "United Kingdom" };
const madrid = { cityId: "g2", code: "MAD", name: "Madrid", country: "Spain" };

type Deferred = { resolve: (items: unknown[]) => void; signal: AbortSignal | undefined };

function stubFetch(handler: (url: URL, signal: AbortSignal | undefined) => unknown[]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const items = handler(new URL(String(input), "http://localhost"), init?.signal ?? undefined);
    return Response.json({ items });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderCombobox(props: Partial<React.ComponentProps<typeof CityCombobox>> = {}) {
  const onChange = vi.fn();
  const onCommit = vi.fn();
  renderWithIntl(
    <CityCombobox
      label={{ translateId: "trips.form.to" }}
      onChange={onChange}
      onCommit={onCommit}
      {...props}
    />,
    { messages },
  );
  return { onChange, onCommit, input: screen.getByRole("combobox", { name: "To" }) };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CityCombobox", () => {
  it("opens the list on focus, before typing", async () => {
    stubFetch(() => [london, madrid]);
    const { input } = renderCombobox();

    await userEvent.click(input);

    expect(await screen.findByRole("option", { name: /LON London/ })).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("shows the code, city and country in each option", async () => {
    stubFetch(() => [london]);
    const { input } = renderCombobox();

    await userEvent.click(input);

    const option = await screen.findByRole("option", { name: /LON London United Kingdom/ });
    expect(option).toBeInTheDocument();
  });

  it("searches what is typed", async () => {
    const fetchMock = stubFetch((url) => (url.searchParams.get("q") === "lond" ? [london] : []));
    const { input } = renderCombobox();

    await userEvent.type(input, "lond");

    expect(await screen.findByRole("option", { name: /LON London/ })).toBeInTheDocument();
    const lastUrl = new URL(String(fetchMock.mock.calls.at(-1)?.[0]), "http://localhost");
    expect(lastUrl.searchParams.get("q")).toBe("lond");
  });

  it("asks the server to leave out the excluded city", async () => {
    const fetchMock = stubFetch(() => [london]);
    const { input } = renderCombobox({ exclude: "g2" });

    await userEvent.click(input);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]), "http://localhost");
    expect(url.searchParams.get("exclude")).toBe("g2");
  });

  it("never shows the excluded city", async () => {
    stubFetch(() => [london, madrid]);
    const { input } = renderCombobox({ exclude: "g2" });

    await userEvent.click(input);

    await screen.findByRole("option", { name: /LON London/ });
    expect(screen.queryByRole("option", { name: /MAD Madrid/ })).not.toBeInTheDocument();
  });

  it("moves with the arrow keys and picks with Enter", async () => {
    stubFetch(() => [london, madrid]);
    const { input, onChange, onCommit } = renderCombobox();
    await userEvent.click(input);
    await screen.findByRole("option", { name: /LON London/ });

    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: /MAD Madrid/ }).id,
    );
    await userEvent.keyboard("{ArrowUp}");
    await userEvent.keyboard("{Enter}");

    expect(onChange).toHaveBeenLastCalledWith({ cityId: "g1", code: "LON", name: "London" });
    expect(input).toHaveValue("London");
    expect(onCommit).toHaveBeenCalled();
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("picks an option with the pointer", async () => {
    stubFetch(() => [london, madrid]);
    const { input, onChange } = renderCombobox();
    await userEvent.click(input);

    await userEvent.click(await screen.findByRole("option", { name: /MAD Madrid/ }));

    expect(onChange).toHaveBeenLastCalledWith({ cityId: "g2", code: "MAD", name: "Madrid" });
  });

  it("closes the list on Escape and keeps what was typed", async () => {
    stubFetch(() => [london]);
    const { input } = renderCombobox();
    await userEvent.type(input, "lo");
    await screen.findByRole("option", { name: /LON London/ });

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveValue("lo");
  });

  it("keeps free text with no id when nothing matches", async () => {
    stubFetch(() => []);
    const { input, onChange } = renderCombobox();

    await userEvent.type(input, "Atlantis");

    expect(await screen.findByRole("option", { name: "No city found" })).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith({ cityId: null, code: "ATL", name: "Atlantis" });
  });

  it("keeps the free text when the user leaves the field", async () => {
    stubFetch(() => []);
    const { input, onChange, onCommit } = renderCombobox();
    await userEvent.type(input, "Atlantis");

    await userEvent.tab();

    expect(input).toHaveValue("Atlantis");
    expect(onChange).toHaveBeenLastCalledWith({ cityId: null, code: "ATL", name: "Atlantis" });
    expect(onCommit).toHaveBeenCalled();
  });

  it("keeps the free text when the no-result option is chosen", async () => {
    stubFetch(() => []);
    const { input, onChange } = renderCombobox();
    await userEvent.type(input, "Atlantis");

    await userEvent.click(await screen.findByRole("option", { name: "No city found" }));

    expect(input).toHaveValue("Atlantis");
    expect(onChange).toHaveBeenLastCalledWith({ cityId: null, code: "ATL", name: "Atlantis" });
  });

  it("ignores the answer of a request that is no longer current", async () => {
    const pending: Deferred[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        return new Promise<Response>((resolve) => {
          pending.push({
            signal: init?.signal ?? undefined,
            resolve: (items) => resolve(Response.json({ items })),
          });
        });
      }),
    );
    const { input } = renderCombobox();

    await userEvent.type(input, "lo");
    await waitFor(() => expect(pending.length).toBeGreaterThan(0));
    const first = pending[0];
    await userEvent.type(input, "nd");
    await waitFor(() => expect(pending.length).toBeGreaterThan(1));

    // The newest request answers first, then the stale one arrives late.
    pending.at(-1)?.resolve([london]);
    await screen.findByRole("option", { name: /LON London/ });
    first?.resolve([madrid]);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(first?.signal?.aborted).toBe(true);
    expect(screen.queryByRole("option", { name: /MAD Madrid/ })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: /LON London/ })).toBeInTheDocument();
  });
});
