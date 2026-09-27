import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "../../../tests/setup/intl";
import { type Translatable, useTranslatable } from "./translatable";

// useTranslatable() is a hook, so it needs a component to run in.
function Sample({ text }: { text: Translatable }) {
  const translate = useTranslatable();
  return <span data-testid="output">{translate(text)}</span>;
}

describe("useTranslatable", () => {
  it("returns a plain string as is", () => {
    renderWithIntl(<Sample text="Bogotá → Cartagena" />);

    expect(screen.getByTestId("output")).toHaveTextContent("Bogotá → Cartagena");
  });

  it("translates a message key", () => {
    renderWithIntl(<Sample text={{ translateId: "common.appName" }} />);

    expect(screen.getByTestId("output")).toHaveTextContent("Parche");
  });

  it("applies ICU values to a translated key", () => {
    renderWithIntl(<Sample text={{ translateId: "common.tagline", values: { name: "Ana" } }} />, {
      messages: { common: { appName: "Parche", tagline: "Hola, {name}" } },
    });

    expect(screen.getByTestId("output")).toHaveTextContent("Hola, Ana");
  });

  it("fails typecheck for an unknown translateId", () => {
    const invalid: Translatable = {
      // @ts-expect-error "common.doesNotExist" is not a MessageKey
      translateId: "common.doesNotExist",
    };

    expect(invalid).toEqual({ translateId: "common.doesNotExist" });
  });
});
