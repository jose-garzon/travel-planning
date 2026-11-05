---
target: assistant panel and dock
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/home/flanagan/workspace/github.com/jose-garzon/travel-planning/src/modules/agent/ui/components/agent-panel.tsx"
target_fingerprint: "sha256:22a7f92b34ee51e2e26cd4ba09704c4d8574f7f8c5d3f06454242824a90881c5"
target_path: /home/flanagan/workspace/github.com/jose-garzon/travel-planning/src/modules/agent/ui/components/agent-panel.tsx
timestamp: 2026-11-06T03-20-56Z
slug: src-modules-agent-ui-components-agent-panel-tsx
closed: true
---
# Critique: assistant panel and dock (run 4)
Method: dual-agent. 28/40. Heuristics 1=3 2=4 3=2 4=3 5=2 6=3 7=3 8=2 9=3 10=3.
Detector: 2 advisory design-system-radius, fly-to-station.ts:71,102, false positives.
## Priority issues
1. [P1] Opening the drawer on a phone focuses the composer, so the keyboard covers the starters. Focus the dialog or the first starter while the chat is empty. harden.
2. [P1] Added items cannot be undone from the chat; Add all is a bulk write to shared trip data with no undo. Add Undo on AddedNote via a DELETE call. harden.
3. [P2] Edit "Done" stays enabled with invalid fields and drops the typed value; approveFailed says "below" but the fields are above. clarify.
4. [P2] Desktop rail shows about one card: display-size header plus New chat row plus composer chrome take about 270px. Use a compact header once the chat is not empty. distill.
5. [P2] Phone drawer: Close is 40px (under the 44px touch size), no safe-area bottom padding, private line clipped. adapt.
## Minor
Live region reads raw Markdown (asterisks); several AddedNote role=status announcements compete after Add all; daily-limit message uses error/alert styling; after Undo, focus lands on Add to trip; textarea not described by the private/offline note; es addAllResult has no noun.
