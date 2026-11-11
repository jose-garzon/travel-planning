import { describe, expect, it } from "vitest";
import { renderMagicLinkEmail } from "@/modules/auth/data/magic-link-email-template";

describe("renderMagicLinkEmail", () => {
  it("puts the sign-in link and expiry in both the html and text parts", () => {
    const url = "https://example.com/api/auth/magic-link/verify?token=abc";
    const { html, text } = renderMagicLinkEmail({ url, expiresInMinutes: 15, locale: "en" });

    expect(html).toContain(`href="${url}"`);
    expect(html).toContain("Expires in 15 min");
    expect(text).toContain(url);
    expect(text).toContain("15 minutes");
  });

  it("escapes the url so it cannot break out of the href", () => {
    const { html } = renderMagicLinkEmail({
      url: 'https://example.com/?a=1&b="><script>',
      expiresInMinutes: 15,
      locale: "en",
    });

    expect(html).toContain("a=1&amp;b=&quot;&gt;&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("renders Spanish copy for the es locale", () => {
    const { subject, html, text } = renderMagicLinkEmail({
      url: "https://example.com/verify",
      expiresInMinutes: 15,
      locale: "es",
    });

    expect(subject).toBe("Tu enlace para entrar a Parche");
    expect(html).toContain('<html lang="es">');
    expect(html).toContain("Vence en 15 min");
    expect(text).toContain("vence en 15 minutos");
  });
});
