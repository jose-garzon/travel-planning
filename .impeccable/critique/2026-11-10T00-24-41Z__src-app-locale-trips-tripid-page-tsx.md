---
target: /trips/id
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/home/flanagan/workspace/github.com/jose-garzon/travel-planning/src/app/[locale]/trips/[tripId]/page.tsx"
target_fingerprint: "sha256:86ceec628a095f83e11559a9a132ed2d8a936c86c21768bd6f2c18c19d3f0952"
target_path: /home/flanagan/workspace/github.com/jose-garzon/travel-planning/src/app/[locale]/trips/[tripId]/page.tsx
timestamp: 2026-11-10T00-24-41Z
slug: src-app-locale-trips-tripid-page-tsx
---
# Critique: trip detail page (/trips/[tripId])
Score 28/40 (Good). Detector CLI: 0 findings in 17 files. Overlay: 1 (skipped-heading h2 Itinerary -> h4 Activities). axe: 0 violations.

Heuristics: 1=3 2=3 3=3 4=2 5=3 6=3 7=2 8=3 9=3 10=3

## Priority issues
- [P1] Activity row shows controls before content (itinerary-card.tsx:224-256). Fix: time+title first line, Join trailing. /impeccable layout
- [P1] Budget + Travelers are generic cards, break metro world (budget-card.tsx:62-131). Fix: fare-board signboards, cap as line gauge. /impeccable bolder
- [P2] Default open stop = first, not today's (page.tsx:159). Fix: open trainPosition stop. /impeccable clarify
- [P2] Heading order h2->h4->h3 (itinerary-card.tsx:118/154); two Share entry points (page.tsx:118-132,197-208). /impeccable audit
- [P3] Undated leg hides train silently (page.tsx:73-75). Fix: muted hint. /impeccable clarify
