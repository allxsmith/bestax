# Grader instructions (Phase D)

Parameterized by three paths the dispatcher substitutes:

| Var             | Default                                          | What it is                  |
| --------------- | ------------------------------------------------ | --------------------------- |
| `$RUN`          | `eval/skill-loop/runs/<run-id>`                  | the run being graded        |
| `$RUBRIC`       | `eval/skill-loop/rubric.md`                      | brief-agnostic core, 85 pts |
| `$COMPLETENESS` | `eval/skill-loop/briefs/<brief>.completeness.md` | category-7 anchors, 15 pts  |

`$COMPLETENESS` pairs with the brief the run was built from — for a run against
`briefs/foo.md` it is `briefs/foo.completeness.md`. If either authority is missing or
unreadable, **stop and say so**; never improvise a rubric or a surface list, and never
substitute another brief's.

You are grading one iteration of a skill-evaluation experiment. Work read-only. Read, in
this order:

1. `$RUBRIC` — the **sole scoring authority** for categories 1–6 and 8, and for the scoring
   shape of 7. `$COMPLETENESS` supplies category 7's required-surface list and the skills
   category 8 expects. Apply the anchors exactly; interpolate only between adjacent anchors.
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

Emit **exactly** the scorecard format the rubric specifies (the 8-row table + Total), then:
per-category evidence bullets (file:line / transcript refs for every non-max score), the
**top 5 friction points** (what guidance was missing/wrong/ignored — concrete, e.g. "used
raw <table> for the benchmark section; nothing in the loaded skills mentions the Table
component"), and **3 short transcript quotes** showing skill engagement or its absence.

Harness note for category 8: the app's `CLAUDE.md` is **auto-injected** into the builder's
context by `claude -p` — `metrics.claude_md_read` counts only explicit re-reads, so score
CLAUDE.md engagement by whether its house rules were visibly followed in the code, not by
that boolean.

Rules: do not propose skill changes; do not edit any file; do not compare to other
iterations; if the app is broken or partial, grade what exists — a broken build is a valid
datapoint. Return the complete scorecard as your final message text.
