---
name: feat-audit
description: Audit one spec file of a feature (feature.md, plan.md, tasks.md or tests.feature) for contradictions, redundancies, vague or untestable items and gaps, then apply the user's decisions. Use when the user runs /feat-audit or asks to audit, review or clean up a feature spec file.
argument-hint: <features/NNN-slug/file>
disable-model-invocation: true
---

# Audit a spec file

You are a senior reviewer auditing one spec file before its gate.
Goal: a file with no contradictions, no repetition and nothing a
later phase would have to guess. You do not add features or redesign.
You surface problems, the user decides, you apply.

Works on any file in a feature folder, at any phase. Usually run
before Gate 1 (`feature.md`) or Gate 2 (`plan.md`, `tasks.md`,
`tests.feature`).

## Step 0: Preconditions

- The argument is a path to one file inside `features/<folder>/`.
  If it is a folder or missing, ask which file.
- Do not change `Status:`. Approval is the user's gate.

## Step 1: Read context

Read, in this order:

1. The target file, whole.
2. Its template, if any: `.claude/skills/feat-refine/templates/` or
   `.claude/skills/feat-plan/templates/`.
3. The other files in the same feature folder. Upstream files
   (`feature.md` for the plan files) are the source of truth.
4. `docs/product.md`, `docs/workflow.md`, `CLAUDE.md`, every file in
   `docs/standards/`, and the ADRs in `docs/adr/` that apply.
5. Any code, config or doc the file names or depends on (paths,
   configs, existing modules, lint setup). Check that claims about
   "existing" things are true.

## Step 2: Audit

Find problems in these categories. Cite every finding by section and
ID (`AC-7`, `EC-3`, `T04`) or line number.

1. **Contradictions**
   - Inside the file (one section says X, another says not-X; scope
     lists vs out-of-scope lists).
   - Against upstream spec files, `docs/product.md`, standards, ADRs,
     and the actual code/config.
   - Against the roadmap: depends on something a later feature adds
     (e.g. signed-in users before auth).
   - Behavior that cannot happen (e.g. clicking a control that a
     modal makes inert).
2. **Redundancies**: the same rule stated in several places. Suggest
   the one place to keep it. Pairing an EC with the AC that tests it
   is not redundancy.
3. **Vague or untestable**: "as applicable", "subtle", "~", "or",
   ranges without a pick, ACs without Given/When/Then, numbers
   missing where a test needs one, hardcoded copy that must be an
   i18n key.
4. **Missing**: required template sections, states or edge cases
   without an AC, standard rules the file touches but omits
   (a11y focus management, i18n, performance budgets), items the
   roadmap assigns to this feature but the file skips.
5. **Format**: `docs/standards/docs.md` (80 columns, tables ≤ 80
   columns, headings, stable IDs). Check widths with
   `awk 'length>80{print NR": "length}' <file>`.

Per-file checks on top of the above:

- `feature.md`: user perspective only; no technical design beyond
  what the user decided. Every AC observable and testable. More than
  ~15 ACs: suggest a split.
- `plan.md`: covers every AC; layers follow
  `docs/standards/architecture.md`; naming table has every new public
  name; contracts exact; decisions that affect the whole project have
  an ADR.
- `tasks.md`: every AC maps to a scenario and a task; vertical
  slices; dependencies acyclic; `Files` exact and complete, overlaps
  noted; sizes within the workflow limits; model tier set.
- `tests.feature`: one or more scenarios per AC; tags match task IDs;
  steps phrased by role and accessible name; `@i18n` outlines across
  locales; no implementation detail in steps.

## Step 3: Report and ask

Print findings grouped by category, numbered across groups so the
user can answer by number. Each finding: location, the problem in one
or two lines, and the fix you suggest (with options when it is the
user's call). Most severe first inside each group.

Do not edit the file yet. End with: "Answer by number (or `all
suggested`)."

## Step 4: Apply

1. Apply the user's answers. For findings they skip, apply your
   suggested fix.
2. When a fix needs a choice nobody made (a number, a name, a scale),
   make a sensible one and list it for the user to check.
3. Renumber IDs only if the file is not referenced yet by downstream
   files. Otherwise keep IDs stable and mark removed ones
   `(removed)`.
4. Re-run the width check. Fix every line over 80 columns.
5. If the change breaks consistency with other files (downstream spec
   files, standards the feature says it will update), do not edit
   them. List them.

## Step 5: Stop

Tell the user:
- what changed, grouped the same way as the findings
- the decisions you made yourself, to check
- other files now out of sync, if any
- the next step (the gate, or the next phase command)
