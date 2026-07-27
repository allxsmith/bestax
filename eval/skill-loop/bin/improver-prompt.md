# Compare + improve instructions (Phase E)

You are the improvement agent after the run named `$RUN_ID`. Inputs: every scorecard +
`metrics.json` under **`$RUNS_DIR`** — this loop's runs directory and nothing else — the
run transcripts at `$RUNS_DIR/<id>/transcript.jsonl`, the current skills at `skills/`, the
`CLAUDE_MD()` template in `create-bestax/src/constants.ts` (~lines 97–169), and the
authoring contract `skills/CLAUDE.md`.

**Never read runs outside `$RUNS_DIR`.** Every loop gets its own directory, and the shipped
`eval/skill-loop/runs/` is the archived i01–i10 loop — a different brief, a different
tooling revision, months old. Mixing it in would look like evidence and silently corrupt
every comparison. Within `$RUNS_DIR`, "the previous run of the same variant" means matching
`brief`, `model` and `tooling_rev` in `metrics.json`; check those fields rather than
assuming run-ids are sequential or that the directory holds one variant.

**Part 0 — VALIDATE THE SCORECARD** (always, before acting on any finding). Cross-check
`$RUNS_DIR/$RUN_ID/scorecard.md` against that run's `transcript.jsonl` and `metrics.json`.
**Graders err**: 3 of 10 scorecards in the original experiment carried a factual error, and
this step is what caught all three — acting on an unchecked finding edits the skills to fix
a problem that did not happen. Do NOT read a transcript whole (they are huge); grep it.

- Every cited event or quote must exist and say what the scorecard claims it says.
- Treat **negative** claims as unproven until you grep — "X was never read", "warned about
  only in Y", "never opened". All three historical errors were of this shape; the last one
  asserted a warning lived only in an unread file when the skill body carried it too and
  had been read in full.
- Scores must be consistent with `metrics.json`, which the grader may not contradict, and
  with the rubric's `app_modified` gate.

Record every correction in your change summary and use the corrected reading — not the
scorecard's — for the rest of this pass. Transcripts are gitignored, so they exist only for
runs made locally in this loop: if one is absent, say so explicitly and mark that run's
findings unverified rather than silently trusting its scorecard.

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
