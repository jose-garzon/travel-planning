/**
 * Magic-link email in the Parche look (DESIGN.md "The Metro Line"):
 * white ground, ink signboard rule, magenta route line with ringed
 * stations, condensed upper-case station-sign headings, ink pill button,
 * amber time chip. Email clients ignore CSS variables and most <style>,
 * so the token values are inlined here (light theme only; dark-mode
 * clients invert on their own) and the layout is table-based.
 */

const COLORS = {
  line: "#c4006b",
  ink: "#141414",
  inkMuted: "#575757",
  ground: "#ffffff",
  surface2: "#f4f4f1",
  border: "#dcdcd7",
  time: "#ffb000",
  onTime: "#141414",
} as const;

import en from "@/modules/auth/messages/en/magicLinkEmail.json";
import es from "@/modules/auth/messages/es/magicLinkEmail.json";
import type { Locale } from "@/shared/i18n/routing";

const MESSAGES: Record<Locale, typeof en> = { en, es };

/** Sign-in links last 15 minutes (better-auth.ts uses this too). */
export const MAGIC_LINK_EXPIRES_IN_SECONDS = 15 * 60;

const DISPLAY_FONT = "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";
const BODY_FONT = "Onest, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

export type MagicLinkEmailContent = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** One row of the route diagram: a ringed station plus its label. */
function stationRow(label: string, meta: string, isLast: boolean): string {
  const ringStyle = isLast
    ? `border:3px dashed ${COLORS.line};background:${COLORS.ground};`
    : `border:3px solid ${COLORS.ink};background:${COLORS.ground};`;
  const lineCell = isLast
    ? ""
    : `<tr><td style="padding:0 0 0 9px;"><div style="width:6px;height:28px;background:${COLORS.line};"></div></td><td></td></tr>`;
  return `
    <tr>
      <td width="24" valign="middle" style="width:24px;">
        <div style="width:18px;height:18px;border-radius:9999px;${ringStyle}"></div>
      </td>
      <td valign="middle" style="padding-left:12px;">
        <div style="font-family:${DISPLAY_FONT};font-size:20px;font-weight:700;letter-spacing:0.02em;text-transform:uppercase;color:${COLORS.ink};line-height:1;">${label}</div>
        <div style="font-family:${BODY_FONT};font-size:13px;color:${COLORS.inkMuted};line-height:1.5;padding-top:2px;">${meta}</div>
      </td>
    </tr>${lineCell}`;
}

export function renderMagicLinkEmail({
  url,
  expiresInMinutes,
  locale,
}: {
  url: string;
  expiresInMinutes: number;
  locale: Locale;
}): MagicLinkEmailContent {
  const m = MESSAGES[locale];
  const minutes = (message: string) => message.replace("{minutes}", String(expiresInMinutes));
  const safeUrl = escapeHtml(url);
  const subject = m.subject;
  const preheader = minutes(m.preheader);

  const html = `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${subject}</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Onest:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${COLORS.surface2};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.surface2};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:${COLORS.ground};border:2px solid ${COLORS.ink};border-radius:16px;">
        <tr>
          <td style="height:8px;background:${COLORS.line};border-radius:14px 14px 0 0;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:28px 32px 0;">
            <div style="font-family:${DISPLAY_FONT};font-size:28px;font-weight:800;letter-spacing:0.02em;text-transform:uppercase;color:${COLORS.line};line-height:1;">Parche</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 0;">
            <h1 style="margin:0;font-family:${DISPLAY_FONT};font-size:44px;font-weight:700;letter-spacing:0.02em;text-transform:uppercase;color:${COLORS.ink};line-height:1;">${m.headingLine1}<br>${m.headingLine2}</h1>
            <p style="margin:16px 0 0;font-family:${BODY_FONT};font-size:17px;line-height:1.5;color:${COLORS.ink};">${m.lead}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" bgcolor="${COLORS.ink}" style="border-radius:9999px;">
                  <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;font-family:${BODY_FONT};font-size:16px;font-weight:600;color:${COLORS.ground};text-decoration:none;border-radius:9999px;">${m.button}</a>
                </td>
              </tr>
            </table>
            <div style="padding-top:16px;">
              <span style="display:inline-block;padding:4px 12px;border-radius:9999px;background:${COLORS.time};color:${COLORS.onTime};font-family:${BODY_FONT};font-size:14px;font-weight:600;line-height:1.5;">${minutes(m.expires)}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              ${stationRow(m.stationOpen, m.stationOpenMeta, false)}
              ${stationRow(m.stationIn, m.stationInMeta, true)}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 28px;">
            <div style="border-top:1px solid ${COLORS.border};padding-top:20px;font-family:${BODY_FONT};font-size:13px;line-height:1.5;color:${COLORS.inkMuted};">
              ${m.fallback}<br>
              <a href="${safeUrl}" style="color:${COLORS.line};word-break:break-all;">${safeUrl}</a>
              <br><br>
              ${m.ignore}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    "PARCHE",
    "",
    `${m.headingLine1} ${m.headingLine2}.`,
    minutes(m.textOpen),
    url,
    "",
    m.ignore,
  ].join("\n");

  return { subject, html, text };
}
