import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CityCombobox } from "@/modules/trips/ui/form/city-combobox";
import { renderWithIntl } from "../../../../../tests/setup/intl";

const messages = {
  trips: { form: { to: "To" }, city: { noResults: "No city found", listLabel: "Cities" } },
};

const MADRID = { cityId: "3", code: "MAD", name: "Madrid", country: "ES" };
const LONDON = { cityId: "1", code: "LON", name: "London", country: "GB" };

type Deferred = { resolve: (items: unknown[]) => void; url: string; signal?: AbortSignal | null };

let pending: Deferred[];

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  pending = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      const request = new Promise<Response>((resolve) => {
        pending.push({
          url,
          signal: init?.signal,
          resolve: (items) => resolve(new Response(JSON.stringify({ items }))),
        });
      });
      return request;
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function setup(props: Partial<React.ComponentProps<typeof CityCombobox>> = {}) {
  const onChange = vi.fn();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  renderWithIntl(
    <CityCombobox label={{ translateId: "trips.form.to" }} onChange={onChange} {...props} />,
    { messages },
  );
  return { user, onChange, input: screen.getByRole("combobox", { name: "To" }) };
}

async function settle(ms = 200) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

async function answer(items: unknown[], index = pending.length - 1) {
  await act(async () => {
    pending[index]?.resolve(items);
    await vi.advanceTimersByTimeAsync(0);
  });
}

describe("CityCombobox", () => {
  it("opens the list on focus with suggestions", async () => {
    const { user, input } = setup();

    await user.click(input);
    await settle();
    await answer([MADRID, LONDON]);

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(screen.getByRole("option", { name: /MAD Madrid/ })).toBeInTheDocument();
  });

  it("debounces typing into a single request", async () => {
    const { user, input } = setup();
    await user.click(input);
    await settle();
    await answer([]);
    const before = pending.length;

    await user.type(input, "lond");
    await settle();

    expect(pending.length - before).toBe(1);
    expect(pending.at(-1)?.url).toContain("q=lond");
  });

  it("aborts the stale request and ignores its late answer", async () => {
    const { user, input } = setup();
    await user.click(input);
    await settle();
    await answer([]);

    await user.type(input, "lo");
    await settle();
    const first = pending.length - 1;
    await user.type(input, "nd");
    await settle();

    expect(pending[first]?.signal?.aborted).toBe(true);
    await answer([LONDON]);
    await answer([MADRID], first);

    expect(screen.getByRole("option", { name: /LON London/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /MAD Madrid/ })).not.toBeInTheDocument();
  });

  it("moves with the arrows, picks with Enter and reports the city", async () => {
    const { user, onChange, input } = setup();
    await user.click(input);
    await settle();
    await answer([MADRID, LONDON]);

    await user.keyboard("{ArrowDown}{ArrowDown}");
    const active = screen.getByRole("option", { name: /LON London/ });
    expect(input).toHaveAttribute("aria-activedescendant", active.id);
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenLastCalledWith({ cityId: "1", code: "LON", name: "London" });
    expect(input).toHaveValue("London");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes the list with Escape and keeps the typed text", async () => {
    const { user, input } = setup();
    await user.click(input);
    await settle();
    await answer([MADRID]);
    await user.keyboard("Mad");

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveValue("Mad");
  });

  it("picks an option with the pointer", async () => {
    const { user, onChange, input } = setup();
    await user.click(input);
    await settle();
    await answer([MADRID]);

    await user.click(screen.getByRole("option", { name: /MAD Madrid/ }));

    expect(onChange).toHaveBeenLastCalledWith({ cityId: "3", code: "MAD", name: "Madrid" });
  });

  it("asks the server to leave out the excluded city", async () => {
    const { user, input } = setup({ exclude: "3" });

    await user.click(input);
    await settle();

    expect(pending.at(-1)?.url).toContain("exclude=3");
  });

  it("does not show a city the answer carries when it is excluded", async () => {
    const { user, input } = setup({ exclude: "3" });
    await user.click(input);
    await settle();

    await answer([MADRID, LONDON]);

    expect(screen.queryByRole("option", { name: /MAD Madrid/ })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: /LON London/ })).toBeInTheDocument();
  });

  it("reports free text without a city id while typing", async () => {
    const { user, onChange, input } = setup();

    await user.type(input, "Quibdó");

    expect(onChange).toHaveBeenLastCalledWith({ cityId: null, code: "QUI", name: "Quibdó" });
  });

  it("offers 'No city found' and keeps the free text when nothing matches", async () => {
    const { user, onChange, input } = setup();
    await user.click(input);
    await settle();
    await answer([]);
    await user.type(input, "Quibdó");
    await settle();
    await answer([]);

    const none = screen.getByRole("option", { name: "No city found" });
    await user.click(none);

    expect(onChange).toHaveBeenLastCalledWith({ cityId: null, code: "QUI", name: "Quibdó" });
    expect(input).toHaveValue("Quibdó");
  });

  it("keeps free text and commits on blur", async () => {
    const onCommit = vi.fn();
    const { user, input } = setup({ onCommit });
    await user.type(input, "Quibdó");

    await user.tab();

    expect(input).toHaveValue("Quibdó");
    expect(onCommit).toHaveBeenCalledTimes(1);
  });
});
