---
target: assistant panel and dock
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/home/flanagan/workspace/github.com/jose-garzon/travel-planning/src/modules/agent/ui/components/agent-panel.tsx"
target_fingerprint: "sha256:7773edf789c9faa46121acddeb18cdae9933d4ea50fe7bf23ef998b2cad57bd0"
target_path: /home/flanagan/workspace/github.com/jose-garzon/travel-planning/src/modules/agent/ui/components/agent-panel.tsx
timestamp: 2026-11-06T02-54-08Z
slug: src-modules-agent-ui-components-agent-panel-tsx
---
# Critique: assistant panel and dock (run 2)
Method: dual-agent. 28/40. Heuristics 1=3 2=3 3=2 4=3 5=2 6=3 7=3 8=3 9=3 10=3.
Detector: 2 advisory design-system-radius, fly-to-station.ts:71,102, false positives.
## Priority issues
1. [P1] Focus lost after a "See it in…" link click inside the drawer (assistant-dock.tsx:93-97): the drawer goes inert while it holds focus. Focus the target section (tabindex=-1); on phones, play the fly animation after the drawer closes. harden.
2. [P1] Edit fields silently corrupt values: blank amount -> 0 (agent-panel.tsx:638), blank cost -> Free (628), cleared date ignored (618), no date min/max, summary line does not update while editing. harden.
3. [P2] No rate-limit (429) handling or cooldown, no way to cancel a long ask, no "still searching" copy. harden.
4. [P2] Restored chat not marked as earlier; old prices still actionable. clarify.
5. [P3] Three equal-weight buttons per card, Dismiss has no undo, user and assistant turns both start-aligned, no "Add all". distill.
## Minor
"Searching…" announced twice (pending li role=status plus announcement region); grab handle without swipe-to-close; New chat has no confirm or undo; per-person budget suggestion goes only to the viewer without saying so; "Cost"/"Gasto" label for other is vague.
