---
target: assistant section
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/home/flanagan/workspace/github.com/jose-garzon/travel-planning/src/modules/agent/ui/components/agent-panel.tsx"
target_fingerprint: "sha256:0236b4cd33623c737e1a42fb3491bd4aeaa8a63b2d93fc04b639aa415b4c61ee"
target_path: /home/flanagan/workspace/github.com/jose-garzon/travel-planning/src/modules/agent/ui/components/agent-panel.tsx
timestamp: 2026-11-06T02-26-46Z
slug: src-modules-agent-ui-components-agent-panel-tsx
---
# Critique: assistant section (agent-panel, assistant-dock, agent-reply, fly-to-station)
Method: dual-agent. Score 26/40 (Good). Specificity ~7/10: product-specific inner parts, generic chat container.
Heuristics: 1=3 2=4 3=2 4=3 5=2 6=3 7=2 8=3 9=1 10=3.
Detector: 2 advisory design-system-radius at fly-to-station.ts:71,102, both false positives (`${STATION/2}px` circle).
## Priority issues
1. [P1] Failed ask cannot be recovered: draft cleared before request (agent-panel.tsx:264), no retry, 429 has no wait time. harden.
2. [P1] Suggestions cannot be edited before adding; approveFailed copy points to details the user cannot change. harden + clarify.
3. [P1] aria-live on whole conversation <ol> (agent-panel.tsx:355): noisy screen reader announcements. audit.
4. [P2] Phone drawer: no focus trap (assistant-dock.tsx:94), #itinerary link scrolls the page behind the open drawer, focus lost on dismiss. harden.
5. [P2] Chat history only in memory (agent-panel.tsx:208), no new chat, starters gone after first turn, long intro. onboard/distill.
## Minor
sun token used beyond time/dates; FIGURE /\d/ tags "Terminal 2"; launcher hover inverts; accent border competes with the route line; "…" placeholder; es copy: repeated "conexión", Peninsular "Prueba a preguntar".
