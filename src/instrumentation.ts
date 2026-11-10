import type { Instrumentation } from "next";

/**
 * Server error reporting (feature observability). Posts a small JSON
 * report to `ERROR_WEBHOOK_URL` (GlitchTip, a self-hosted collector, a
 * chat webhook). No request bodies, cookies or headers are sent.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const url = process.env.ERROR_WEBHOOK_URL;
  if (!url) {
    return;
  }
  const failure = error instanceof Error ? error : new Error(String(error));
  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message: failure.message,
      digest: (failure as Error & { digest?: string }).digest,
      stack: failure.stack?.split("\n").slice(0, 10).join("\n"),
      method: request.method,
      path: request.path.split("?")[0],
      routePath: context.routePath,
      routeType: context.routeType,
      at: new Date().toISOString(),
    }),
  }).catch(() => {});
};
