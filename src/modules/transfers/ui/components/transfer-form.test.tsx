import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Gap } from "@/modules/transfers/domain/gaps";
import cardMessages from "@/modules/transfers/messages/en/card.json";
import formMessages from "@/modules/transfers/messages/en/form.json";
import { TransferForm } from "@/modules/transfers/ui/components/transfer-form";
import sharedMessages from "@/shared/i18n/messages/en.json";
import { renderWithIntl } from "../../../../../tests/setup/intl";

const messages = { ...sharedMessages, transfers: { form: formMessages, card: cardMessages } };

const cartagena = { name: "Cartagena", code: "CTG", tz: "America/Bogota" };
const santaMarta = { name: "Santa Marta", code: "SMR", tz: "America/Bogota" };
const bogota = { name: "Bogotá", code: "BOG", tz: "America/Bogota" };

const between: Gap = {
  index: 1,
  kind: "between",
  from: cartagena,
  to: santaMarta,
  date: "2027-03-19",
  window: { from: "2027-03-15", to: "2027-03-19" },
};

const outbound: Gap = {
  index: 0,
  kind: "outbound",
  from: bogota,
  to: cartagena,
  date: "2027-03-15",
  window: { from: null, to: "2027-03-15" },
};

const back: Gap = {
  index: 2,
  kind: "return",
  from: santaMarta,
  to: bogota,
  date: null,
  window: { from: "2027-03-19", to: null },
};

function renderForm(
  gap: Gap,
  props: Partial<React.ComponentProps<typeof TransferForm>> = {},
  onSubmit = vi.fn().mockResolvedValue(null),
) {
  renderWithIntl(<TransferForm gap={gap} tripCurrency="COP" onSubmit={onSubmit} {...props} />, {
    messages,
  });
  return onSubmit;
}

const field = (name: string) => screen.getByRole("textbox", { name }) as HTMLInputElement;
const save = () => userEvent.click(screen.getByRole("button", { name: "Save transfer" }));

describe("TransferForm", () => {
  it("prefills from and to, and the day, from a gap between two stops", () => {
    renderForm(between);

    expect(field("From")).toHaveValue("Cartagena");
    expect(field("To")).toHaveValue("Santa Marta");
    expect(screen.getByLabelText("Departure date")).toHaveValue("2027-03-19");
  });

  it("prefills the trip's origin and the destination of an outbound gap", () => {
    renderForm(outbound);

    expect(field("From")).toHaveValue("Bogotá");
    expect(field("To")).toHaveValue("Cartagena");
  });

  it("prefills only the origin of a return gap", () => {
    renderForm(back);

    expect(field("From")).toHaveValue("Santa Marta");
    expect(field("To")).toHaveValue("");
  });

  it("sends the transfer with the gap's zones once times are entered", async () => {
    const onSubmit = renderForm(between);

    await userEvent.selectOptions(screen.getByLabelText("Type"), "bus");
    await userEvent.type(screen.getByLabelText("Departure time"), "09:00");
    await userEvent.type(screen.getByLabelText("Arrival time"), "12:30");
    await save();

    expect(onSubmit).toHaveBeenCalledWith({
      gap: 1,
      mode: "bus",
      from: "Cartagena",
      to: "Santa Marta",
      departDate: "2027-03-19",
      departTime: "09:00",
      departTz: "America/Bogota",
      arriveDate: null,
      arriveTime: "12:30",
      arriveTz: "America/Bogota",
      cost: null,
      currency: null,
      rate: null,
      charge: "all",
      bookingRef: null,
      link: null,
      notes: null,
    });
  });

  it("hides the time zone fields when both cities have a zone", () => {
    renderForm(between);

    expect(screen.queryByRole("textbox", { name: "Departure time zone" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Arrival time zone" })).toBeNull();
  });

  it("asks for the zone of a city that has none and sends it", async () => {
    const unknown: Gap = { ...between, to: { name: "Santa Marta", code: "SMR", tz: null } };
    const onSubmit = renderForm(unknown);

    expect(screen.queryByRole("textbox", { name: "Departure time zone" })).toBeNull();
    await userEvent.type(screen.getByLabelText("Arrival time"), "12:30");
    await userEvent.type(field("Arrival time zone"), "America/Bogota");
    await save();

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ arriveTime: "12:30", arriveTz: "America/Bogota" }),
    );
  });

  it("sends no zone for a time that was not entered", async () => {
    const onSubmit = renderForm(between);

    await save();

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        departTime: null,
        departTz: null,
        arriveTime: null,
        arriveTz: null,
      }),
    );
  });

  it("asks for the rate only when the currency differs from the trip's", async () => {
    renderForm(between);

    expect(screen.queryByLabelText(/^1 COP/)).toBeNull();
    expect(screen.queryByLabelText(/^1 USD/)).toBeNull();
    await userEvent.type(screen.getByLabelText("Price per person"), "100");
    const currency = screen.getByLabelText("Currency");
    await userEvent.clear(currency);
    await userEvent.type(currency, "usd");

    expect(screen.getByLabelText("1 USD = ? COP")).toBeInTheDocument();
  });

  it("sends the cost in major units with its currency and rate", async () => {
    const onSubmit = renderForm(between);

    await userEvent.type(screen.getByLabelText("Price per person"), "100");
    const currency = screen.getByLabelText("Currency");
    await userEvent.clear(currency);
    await userEvent.type(currency, "usd");
    await userEvent.type(screen.getByLabelText("1 USD = ? COP"), "4000");
    await save();

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ cost: 100, currency: "USD", rate: "4000" }),
    );
  });

  it("lets the traveler choose who pays", async () => {
    const onSubmit = renderForm(between);

    await userEvent.click(screen.getByRole("radio", { name: "Opt-in" }));
    await save();

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ charge: "opt-in" }));
  });

  it("does not submit without a city or a departure date", async () => {
    const onSubmit = renderForm(back);

    await save();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Add the cities and the departure date.");
  });

  it("shows the error the save answered with", async () => {
    const onSubmit = vi.fn().mockResolvedValue("Arrival must be after departure.");
    renderForm(between, {}, onSubmit);

    await save();

    expect(await screen.findByRole("alert")).toHaveTextContent("Arrival must be after departure.");
  });

  it("shows the values of the transfer being edited, details included", () => {
    renderForm(between, {
      initial: {
        id: "t1",
        version: 2,
        mode: "train",
        from: "Cartagena",
        to: "Santa Marta",
        departDate: "2027-03-18",
        departTime: "08:00",
        cost: 25.5,
        currency: "COP",
        charge: "opt-in",
        bookingRef: "AV9512",
      },
    });

    expect(screen.getByLabelText("Type")).toHaveValue("train");
    expect(screen.getByLabelText("Departure date")).toHaveValue("2027-03-18");
    expect(screen.getByLabelText("Departure time")).toHaveValue("08:00");
    expect(screen.getByLabelText("Price per person")).toHaveValue(25.5);
    expect(screen.getByRole("radio", { name: "Opt-in" })).toBeChecked();
    expect(screen.getByLabelText("Booking reference")).toBeVisible();
    expect(screen.getByLabelText("Booking reference")).toHaveValue("AV9512");
  });
});
