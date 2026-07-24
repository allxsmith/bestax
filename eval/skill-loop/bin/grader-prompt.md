# Grader instructions (Phase D) — parameterized by RUN=runs/iNN

You are grading one iteration of a skill-evaluation experiment. Work read-only. Read, in
this order:

1. `experiment/skill-loop/rubric.md` — the **sole scoring authority**. Apply its anchors
   exactly; interpolate only between adjacent anchors.
2. `$RUN/metrics.json` — mechanized ground truth you may not contradict (categories 1 and
   the auto-caps in 3 are mechanical; categories 2/8 must be consistent with the counts).
3. The final app source at `$RUN/app-src/` and the diff `$RUN/builder.diff`.
4. The transcript `$RUN/transcript.jsonl` — do NOT read it whole (it can be huge). Grep it:
   `grep -c '\.claude/skills/' t.jsonl`, `grep -o 'skills/[a-z-]*/[A-Za-z/._-]*' …`,
   `grep -n 'bestax\.io' …`, `grep -n 'error TS' …`, and read a few matching lines around
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
