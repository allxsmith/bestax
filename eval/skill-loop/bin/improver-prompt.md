# Compare + improve instructions (Phase E)

You are the improvement agent after the run named `$RUN_ID`. Inputs: every scorecard +
`metrics.json` produced so far in **this loop** (under `eval/skill-loop/runs/`, whatever
run-id scheme the loop uses — `i01…`, `briefA-1…`, etc.), the current skills at `skills/`,
the `CLAUDE_MD()` template in `create-bestax/src/constants.ts` (~lines 97–169), and the
authoring contract `skills/CLAUDE.md`.

**Part 1 — COMPARE** (always): identify concrete deltas vs the previous run of the same
variant — named regressions/improvements ("still hand-rolls `<table>` where the Table
component applies", "inline styles 7→0"), not just score totals. Compare the brief-agnostic
core (rubric categories 1–6 and 8) when runs span different briefs; category 7 and the
total are only comparable within one brief. On the loop's first run, inventory the failure
modes instead of comparing.

**Part 2 — IMPROVE** (skipped on the loop's **final** run — compare only, so nothing ships
unvalidated): design and apply the **minimal** set of edits to the skills / CLAUDE_MD
template that address the top findings.

HARD GUARDRAILS:
a. Never edit `eval/skill-loop/rubric.md`, `eval/skill-loop/briefs/**`, or anything under
`eval/skill-loop/runs/`.
b. Guidance stays **GENERIC** to any app built with this library. Never mention skynet,
Netadyne, Fable, LLM-vendor marketing, or this experiment. If the finding is "it
hand-rolled the benchmarks table", the fix is generic `Table` guidance.
c. Respect `skills/CLAUDE.md` authoring rules: SKILL.md lean, depth in `references/`; fix
the guidance that produced the bad output, not just an example. Context economy is a
standing preference: few-shot over prose, no no-op instructions ("be careful with
props" is banned), prefer replacing weak lines over adding. LINE BUDGET — **measure it,
never assume a number**. At loop start record BASE as:

```sh
find skills -type f \( -name '*.md' -o -name '*.tsx' -o -name '*.ts' \) \
  ! -name 'component-catalog.md' ! -name 'CLAUDE.md' -print0 | xargs -0 cat | wc -l
```

The bundle must never exceed **BASE + 140** across the whole loop; net growth ≤ +60 lines
per iteration unless offset by deletions — deletions that tighten prose are encouraged.
`CLAUDE_MD()` rendered output ≤ 90 lines. (The original experiment ran BASE = 4,162 with an
absolute 4,300 ceiling. That number is now stale — the bundle has since grown past 4,250 —
which is exactly why the budget is expressed relative to a measurement rather than frozen.)
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
