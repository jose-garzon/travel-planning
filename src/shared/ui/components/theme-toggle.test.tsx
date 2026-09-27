import { fireEvent, screen } from "@testing-library/react";
import { Profiler } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../../../../tests/setup/intl";
import { ThemeToggle } from "./theme-toggle";

// Local messages so this test does not depend on the implementer
// having added the real keys to en.json yet.
const messages = {
  header: {
    themeToggle: {
      toDark: "Switch to dark theme",
      toLight: "Switch to light theme",
    },
  },
};

/** Stubs `matchMedia` so the component's OS-preference fallback is deterministic. */
function stubSystemScheme(prefersDark: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: prefersDark,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

function renderToggle(onRender: () => void = vi.fn()) {
  return renderWithIntl(
    <Profiler id="theme-toggle" onRender={onRender}>
      <ThemeToggle
        toDarkLabel={{ translateId: "header.themeToggle.toDark" }}
        toLightLabel={{ translateId: "header.themeToggle.toLight" }}
      />
    </Profiler>,
    { messages },
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.cookie = "parche-theme=; Max-Age=0";
    stubSystemScheme(false);
  });

  it("renders a single button identified as the theme toggle", () => {
    renderToggle();

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute("data-ui", "theme-toggle");
  });

  it("sets html.dataset.theme to dark when the current theme is light", () => {
    renderToggle();

    fireEvent.click(screen.getByRole("button"));

    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("toggles html.dataset.theme back to light on a second click", () => {
    renderToggle();
    const button = screen.getByRole("button");

    fireEvent.click(button);
    fireEvent.click(button);

    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("falls back to the OS scheme when html has no data-theme attribute", () => {
    stubSystemScheme(true);
    renderToggle();

    fireEvent.click(screen.getByRole("button"));

    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("writes a cookie with the chosen theme on click", () => {
    renderToggle();

    fireEvent.click(screen.getByRole("button"));

    expect(document.cookie).toContain("parche-theme=dark");
  });

  it("sets the cookie Max-Age to one year", () => {
    const setCookie = vi.spyOn(document, "cookie", "set");
    renderToggle();

    fireEvent.click(screen.getByRole("button"));

    expect(setCookie).toHaveBeenCalledWith(expect.stringContaining("Max-Age=31536000"));
  });

  it("sets the cookie SameSite to Lax", () => {
    const setCookie = vi.spyOn(document, "cookie", "set");
    renderToggle();

    fireEvent.click(screen.getByRole("button"));

    expect(setCookie).toHaveBeenCalledWith(expect.stringContaining("SameSite=Lax"));
  });

  it("does not cause a React render when clicked", () => {
    const onRender = vi.fn();
    renderToggle(onRender);
    onRender.mockClear();

    fireEvent.click(screen.getByRole("button"));

    expect(onRender).not.toHaveBeenCalled();
  });
});
