# Observability: analytics and error monitoring

Status: approved (self-approved in a bulk run, 2026-11-04; review in PR)


## Acceptance criteria

- AC-1 Umami (open source, cookieless) script when
  `NEXT_PUBLIC_UMAMI_SRC` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID` are set.
- AC-2 Server errors (`onRequestError`) are posted as JSON to
  `ERROR_WEBHOOK_URL` when set: message, digest, short stack, method,
  path without query, route. No cookies, headers or bodies.
- AC-3 Nothing loads or posts when the vars are unset.
