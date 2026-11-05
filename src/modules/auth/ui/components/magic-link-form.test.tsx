import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import landingMessages from "@/modules/auth/messages/en/landing.json";
import { MagicLinkForm } from "@/modules/auth/ui/components/magic-link-form";
import sharedMessages from "@/shared/i18n/messages/en.json";
import { renderWithIntl } from "../../../../../tests/setup/intl";

const messages = { ...sharedMessages, auth: { landing: landingMessages } };

afterEach(() => {
  vi.unstubAllGlobals();
});

function requestSignInLink(email: string) {
  fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
    target: { value: email },
  });
  fireEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }));
}

describe("MagicLinkForm", () => {
  it("sends the callback URL it was given with the sign-in request", async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => Response.json({}));
    vi.stubGlobal("fetch", fetchMock);
    renderWithIntl(<MagicLinkForm callbackURL="/en/join/token-1/accept" />, { messages });

    requestSignInLink("laura@example.com");

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({
      email: "laura@example.com",
      callbackURL: "/en/join/token-1/accept",
    });
  });

  it("confirms the email is on its way once the link is sent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({})),
    );
    renderWithIntl(<MagicLinkForm />, { messages });

    requestSignInLink("laura@example.com");

    expect(
      await screen.findByText(
        "Check your email for a sign-in link. We sent it to laura@example.com.",
      ),
    ).toBeInTheDocument();
  });
});
