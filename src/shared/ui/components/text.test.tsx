import { describe, expect, it } from "vitest";
import { renderWithIntl } from "../../../../tests/setup/intl";
import { Text } from "./text";

describe("Text", () => {
  it.each([
    ["p", "P"],
    ["span", "SPAN"],
    ["h1", "H1"],
    ["h2", "H2"],
    ["h3", "H3"],
    ["h4", "H4"],
    ["strong", "STRONG"],
    ["code", "CODE"],
  ] as const)("renders the %s element for as=%s", (as, tagName) => {
    const { container } = renderWithIntl(<Text as={as}>content</Text>);

    expect(container.firstElementChild?.tagName).toBe(tagName);
  });

  it.each([
    ["xs", "text-xs"],
    ["sm", "text-sm"],
    ["md", "text-md"],
    ["lg", "text-lg"],
    ["xl", "text-xl"],
    ["2xl", "text-2xl"],
    ["3xl", "text-3xl"],
  ] as const)("maps size=%s to the %s token class", (size, className) => {
    const { container } = renderWithIntl(<Text size={size}>content</Text>);

    expect(container.firstElementChild).toHaveClass(className);
  });

  it.each([
    ["default", "text-text"],
    ["muted", "text-text-muted"],
    ["accent", "text-accent"],
    ["success", "text-success"],
    ["warning", "text-warning"],
    ["error", "text-error"],
  ] as const)("maps tone=%s to the %s token class", (tone, className) => {
    const { container } = renderWithIntl(<Text tone={tone}>content</Text>);

    expect(container.firstElementChild).toHaveClass(className);
  });

  it("renders a plain string child as is", () => {
    renderWithIntl(<Text>Bogotá → Cartagena</Text>);

    expect(document.body).toHaveTextContent("Bogotá → Cartagena");
  });

  it("translates a translateId prop", () => {
    renderWithIntl(<Text translateId="common.appName" />);

    expect(document.body).toHaveTextContent("Parche");
  });
});
