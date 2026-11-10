# PWA: installable, offline read-only

Status: approved (self-approved in a bulk run, 2026-11-04; review in PR)


## Acceptance criteria

- AC-1 Web manifest with name, icons (192, 512, maskable, svg),
  standalone display, theme color.
- AC-2 Service worker (production only): network first for pages,
  RSC and GET `/api/v1`; last good copy served offline.
- AC-3 Writes, auth and agent calls are never cached.
- AC-4 Screens show an offline notice and disable edits.
