import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CurrencySelect } from "@/modules/trips/ui/form/currency-select";
import { renderWithIntl } from "../../../../../tests/setup/intl";

const messages = { trips: { form: { currency: "Currency" } } };

describe("CurrencySelect", () => {
  it("shows the labelled list with the given currency selected", () => {
    renderWithIntl(<CurrencySelect value="COP" onChange={() => {}} />, { messages });

    expect(screen.getByRole("combobox", { name: "Currency" })).toHaveValue("COP");
    expect(screen.getByRole("option", { name: /EUR/ })).toBeInTheDocument();
  });

  it("names currencies in the active locale", () => {
    renderWithIntl(<CurrencySelect value="COP" onChange={() => {}} />, { messages, locale: "es" });

    expect(screen.getByRole("option", { name: /peso colombiano/i })).toBeInTheDocument();
  });

  it("reports the chosen currency code", async () => {
    const onChange = vi.fn();
    renderWithIntl(<CurrencySelect value="USD" onChange={onChange} />, { messages });

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Currency" }), "EUR");

    expect(onChange).toHaveBeenCalledWith("EUR");
  });
});
