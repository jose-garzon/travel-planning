---
target: / page
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/home/flanagan/workspace/github.com/jose-garzon/travel-planning/src/app/[locale]/page.tsx"
target_fingerprint: "sha256:12532dfa00153a5493dac0ef0b29aa89a789c51e6cb672f0987a24d51dcfe276"
target_path: /home/flanagan/workspace/github.com/jose-garzon/travel-planning/src/app/[locale]/page.tsx
timestamp: 2026-11-10T00-05-34Z
slug: src-app-locale-page-tsx
---
# Critique: / (home route) — 28/40
Method: dual-agent. Detector: 0 findings (CLI, URL, in-browser).
Heuristics: 1:3 2:4 3:3 4:3 5:3 6:3 7:2 8:3 9:3 10:1
Priority issues:
- [P1] Next-stop ticket hides trip name (only in ~11px barcode caption), next-stop.tsx ~L238-325. Fix: trip name eyebrow above city.
- [P1] Mobile ticket min-h-ticket (next-stop.tsx:238) leaves ~250px dead space. Fix: drop min-height below lg or fill with day activities / your share.
- [P2] Next trip missing from "Your trips" (home-screen.tsx uses otherTrips). Fix: include as first row or rename "Later trips".
- [P2] Station codes = first 3 letters (CAR, BAR) look like wrong IATA codes. Fix: full first word or editable code.
- [P3] Small low-contrast captions (landing example card, ticket id). Fix: label size 0.875rem/600, check dark AA.
Persona flags: organizer has no invite CTA on home after create; invited friend sees generic landing, carousel dots aria-hidden w/o "Day 1 of N"; SR user: nested link in ticket, off-screen slides possibly focusable.
Minor: duplicate how-it-works wording; amber used for both time and to-do; landing card ends high at 1280; dark amber chip bright.
Questions: boarding pass vs metro metaphor? per-person money on home? invited-only, nothing-planned home?
