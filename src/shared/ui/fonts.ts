import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";

// D-10: self-hosted at build, no runtime request to Google.
// `adjustFontFallback` defaults to true (metric-matched fallback,
// EC-2). `latin` covers the accented characters this app needs
// (á é í ó ú ñ ü ¿ ¡).
export const fredoka = Fredoka({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fredoka",
  fallback: ["ui-rounded", "system-ui", "sans-serif"],
});

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
  fallback: ["system-ui", "sans-serif"],
});
