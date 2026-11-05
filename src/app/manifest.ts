import type { MetadataRoute } from "next";

/** Installable PWA (feature PWA). Offline behavior lives in `public/sw.js`. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Parche",
    short_name: "Parche",
    description: "Plan and budget trips together.",
    start_url: "/",
    display: "standalone",
    // Manifest colors cannot read CSS tokens; these mirror surface-1 and sun.
    // biome-ignore lint/plugin: no token access in the web manifest.
    background_color: "#ffffff",
    // biome-ignore lint/plugin: no token access in the web manifest.
    theme_color: "#ffb000",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
