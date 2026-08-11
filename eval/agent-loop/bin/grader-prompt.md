# Grader instructions (Phase D)

Parameterized by three paths the dispatcher substitutes:

| Var             | Default                                          | What it is                 |
| --------------- | ------------------------------------------------ | -------------------------- |
| `$RUN`          | `eval/agent-loop/runs/<run-id>`                  | the run being graded       |
| `$RUBRIC`       | `eval/agent-loop/rubric.md`                      | the scoring authority      |
| `$COMPLETENESS` | `eval/agent-loop/briefs/<brief>.completeness.md` | the brief-specific anchors |

**Which rubric.** `$RUN/metrics.json` records `rubric` and `rubric_version` — the yardstick
the run was launched against. Grade against **that** file; if the `$RUBRIC` you were handed
disagrees with what `metrics.json` names, stop and say so rather than picking one. The
versions differ in weights and in how many categories exist (v1: 8 categories, core 85 +
category 7; v2: 9 categories, core 75 + categories 7 and 9), so emit the scorecard format
**your rubric** specifies, not the one below if they conflict.

`$COMPLETENESS` pairs with the brief the run was built from — for a run against
`briefs/foo.md` it is `briefs/foo.completeness.md`. If either authority is missing or
unreadable, **stop and say so**; never improvise a rubric or a surface list, and never
substitute another brief's.

You are grading one iteration of a skill-evaluation experiment. Work read-only. Read, in
this order:

1. `$RUBRIC` — the **sole scoring authority** for the core categories and for the scoring
   _shape_ of the brief-specific ones. `$COMPLETENESS` supplies their content: category 7's
   required-surface list, the skills category 8 expects, and — under rubric v2 — category
   9's expected-extras roster. Apply the anchors exactly; interpolate only between adjacent
   anchors.
2. `$RUN/metrics.json` — mechanized ground truth you may not contradict (categories 1 and
   the auto-caps in 3 are mechanical; categories 2/8 must be consistent with the counts).
   **Apply the rubric's `app_modified` gate before scoring any category.** "Ground truth you
   may not contradict" cuts both ways: an untouched scaffold reports clean zeros across the
   mechanized inputs and satisfies the top anchor of categories 1–5, so taking the numbers
   at face value scores 50/100 for a run in which the builder changed nothing.
3. The final app source at `$RUN/app-src/` and the diff `$RUN/builder.diff`.
4. The transcript `$RUN/transcript.jsonl` — do NOT read it whole (it can be huge). Grep it:
   `grep -c '\.claude/skills/' "$RUN/transcript.jsonl"`,
   `grep -o 'skills/[a-z-]*/[A-Za-z/._-]*' "$RUN/transcript.jsonl"`,
   `grep -n 'bestax\.io' "$RUN/transcript.jsonl"`, `grep -n 'error TS' "$RUN/transcript.jsonl"`,
   and read a few matching lines around
   skill loads and TS-error repair churn for category 4/8 evidence.

Emit **exactly** the scorecard format your rubric specifies — 8 category rows plus Total
under v1, 9 plus Total under v2. Then: per-category evidence bullets (file:line / transcript
refs for every non-max score), the **top 5 friction points** (what guidance was
missing/wrong/ignored — concrete, e.g. "used raw <table> for the benchmark section; nothing
in the loaded skills mentions the Table component"), and **3 short transcript quotes**
showing guidance engagement or its absence.

**Category 9 (rubric v2 only) also needs a per-slot table** — one row per expected extra
from `$COMPLETENESS`: present in `bestax_import_list`? load-bearing? where (file:line).
Presence is not the bar: an imported component that never renders, never opens, or is wired
to nothing scores as **absent**, and the table has to show that you checked. Where the
addendum marks a slot as accepting alternatives, count the slot once.

Harness note for category 8: the app's `CLAUDE.md` is **auto-injected** into the builder's
context by `claude -p` — `metrics.claude_md_read` counts only explicit re-reads, so score
CLAUDE.md engagement by whether its house rules were visibly followed in the code, not by
that boolean.

Rules: do not propose skill changes; do not edit any file; do not compare to other
iterations; if the app is broken or partial, grade what exists — a broken build is a valid
datapoint. Return the complete scorecard as your final message text.
