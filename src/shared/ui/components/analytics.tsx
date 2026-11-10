import Script from "next/script";

/**
 * Umami, open source and cookieless (feature observability). Rendered only
 * when both public env vars are set.
 */
export function Analytics() {
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!src || !websiteId) {
    return null;
  }
  return <Script src={src} data-website-id={websiteId} strategy="afterInteractive" />;
}
