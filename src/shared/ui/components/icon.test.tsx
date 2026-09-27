import { screen } from "@testing-library/react";
import { CircleAlert } from "lucide-react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "../../../../tests/setup/intl";
import { Icon } from "./icon";

describe("Icon", () => {
  it("is hidden from assistive tech when no label is given", () => {
    renderWithIntl(<Icon icon={CircleAlert} />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(document.querySelector('[data-ui="icon"]')).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes a string label as an image", () => {
    renderWithIntl(<Icon icon={CircleAlert} label="Warning" />);

    expect(screen.getByRole("img", { name: "Warning" })).toBeInTheDocument();
  });

  it("exposes a translated label as an image", () => {
    renderWithIntl(<Icon icon={CircleAlert} label={{ translateId: "common.appName" }} />);

    expect(screen.getByRole("img", { name: "Parche" })).toBeInTheDocument();
  });
});
