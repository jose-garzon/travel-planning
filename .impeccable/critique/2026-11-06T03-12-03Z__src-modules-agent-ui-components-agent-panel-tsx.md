---
target: assistant panel and dock
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/home/flanagan/workspace/github.com/jose-garzon/travel-planning/src/modules/agent/ui/components/agent-panel.tsx"
target_fingerprint: "sha256:0acb056faadab73b71e144f293a6740a52f59330c983dc5410d9e3e5d55d2011"
target_path: /home/flanagan/workspace/github.com/jose-garzon/travel-planning/src/modules/agent/ui/components/agent-panel.tsx
timestamp: 2026-11-06T03-12-03Z
slug: src-modules-agent-ui-components-agent-panel-tsx
---
# Critique: assistant panel and dock (run 3)
Method: dual-agent. 28/40. Heuristics 1=3 2=3 3=2 4=3 5=3 6=3 7=3 8=2 9=3 10=3.
Detector: 2 advisory design-system-radius, fly-to-station.ts:71,102, false positives.
## Priority issues
1. [P1] "Add all" fails silently: addAll drops approve() errors, failed card looks pending, no announcement, no fly-to. harden.
2. [P1] DismissedRow focuses Undo on mount, so a restored chat with dismissed cards steals focus on page load. Focus only right after a dismiss. harden.
3. [P2] Scrolling to the bottom on a new reply hides the reply text and the estimate note above the cards. Scroll the new assistant turn to the top. layout.
4. [P2] Every card has the same solid primary button; Edit cannot be closed and silently drops the card from Add all. distill.
5. [P3] Daily-limit state leaks: starters stay enabled, isLimited resets on reload, no reset time in the message. clarify.
## Minor
forYou copy says "Added" before adding; "Nothing changes until you add it" printed twice; es "Descartada" gender; restored copy awkward; drawer open focuses a disabled textarea when offline or limited; page behind the drawer not inert; FIGURE regex tags "LAX 2".
