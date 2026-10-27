import { Barlow_Condensed, Onest } from "next/font/google";

// D-10: self-hosted at build, no runtime request to Google.
// `adjustFontFallback` defaults to true (metric-matched fallback,
// EC-2). `latin` covers the accented characters this app needs
// (á é í ó ú ñ ü ¿ ¡). Barlow Condensed is the station-sign voice
// (headings, city names, the wordmark); Onest is the plain, highly
// legible body face.
export const barlowCondensed = Barlow_Condensed({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  // `optional`, not `swap`: the condensed caps are far narrower than
  // any metric-adjusted fallback, so a late swap rewraps every heading
  // (AC-16 shift budget). A first visit on a slow link keeps the
  // fallback; the cached face is used from then on.
  display: "optional",
  variable: "--font-barlow-condensed",
  fallback: ["Arial Narrow", "system-ui", "sans-serif"],
});

export const onest = Onest({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-onest",
  fallback: ["system-ui", "sans-serif"],
});
