# Compare + improve instructions (Phase E) — parameterized by N (current iteration)

You are the improvement agent after iteration iN. Inputs: all scorecards + metrics so far
(`experiment/skill-loop/runs/i01..iN/`), the current skills at `skills/`, the `CLAUDE_MD()`
template in `create-bestax/src/constants.ts` (~lines 97–169), and the authoring contract
`skills/CLAUDE.md`.

**Part 1 — COMPARE** (always): identify concrete deltas vs the previous iteration — named
regressions/improvements ("still hand-rolls `<table>` for benchmarks", "inline styles
7→0"), not just score totals. For i01 (baseline), inventory the failure modes instead.

**Part 2 — IMPROVE** (skipped after i10 — compare only): design and apply the **minimal**
set of edits to the skills / CLAUDE_MD template that address the top findings.

HARD GUARDRAILS:
a. Never edit `experiment/skill-loop/rubric.md`, `base-prompt.md`, or anything under
   `experiment/skill-loop/runs/`.
b. Guidance stays **GENERIC** to any app built with this library. Never mention skynet,
   Netadyne, Fable, LLM-vendor marketing, or this experiment. If the finding is "it
   hand-rolled the benchmarks table", the fix is generic `Table` guidance.
c. Respect `skills/CLAUDE.md` authoring rules: SKILL.md lean, depth in `references/`; fix
   the guidance that produced the bad output, not just an example. Context economy is a
   standing preference: few-shot over prose, no no-op instructions ("be careful with
   props" is banned), prefer replacing weak lines over adding. LINE BUDGET: the
   hand-written skill bundle (all SKILL.md + references/ + examples/, excluding
   component-catalog.md) measured 4,162 lines at i01 baseline and must never exceed
   4,300; net growth ≤ +60 lines per iteration unless offset by deletions — deletions
   that tighten prose are encouraged. `CLAUDE_MD()` rendered output ≤ 90 lines.
d. NEVER hand-edit `skills/bestax-custom-component/references/component-catalog.md` — it
   is generated. If catalog content itself is the gap, you MAY edit
   `scripts/gen-component-catalog.mjs` or the source docs pages under `docs/docs/api/`,
   but flag this prominently in your change summary as a generator-level change.
e. Editable surface, nothing else: `skills/**` (hand-written files),
   `create-bestax/src/constants.ts` (the CLAUDE_MD template only),
   `scripts/gen-component-catalog.mjs`, `docs/docs/api/**` (only per d).
f. Do not commit and do not rebuild — the orchestrator does both.

NOISE RULE: one build is one sample. Act on a finding only if (a) a mechanized metric
corroborates it, (b) it repeats from a prior iteration, or (c) it is a plain factual gap in
the guidance (missing prop, wrong statement). Park one-off behavioral quirks.

End with a change summary: per-file what/why, each mapped to a scorecard finding, plus a
"deliberately not acted on" list (single-run noise). Return this summary as your final
message text.
