# Agent-Loop Grading Rubric v2 — brief-agnostic core

**Rubric version: 2**

**Frozen for the duration of a loop, not forever.** Never edit it mid-loop — runs stop being
comparable the moment the yardstick moves. Between loops, refine it freely if it is
measuring the wrong thing, and record which rubric version a loop ran against (the runner
writes `rubric_version` into `metrics.json`).

**Total 100 pts = core (75) + brief-specific (25).** Categories 1–6 and 8 are the core and
apply to any brief. Categories 7 (site completeness, 15) and 9 (library differentiators, 10)
cannot be brief-agnostic — both draw their lists from the brief's completeness addendum
(`briefs/<name>.completeness.md`), handed to the grader as `$COMPLETENESS`.

**Comparability:** the 75-pt core is directly comparable across briefs. Categories 7 and 9
are defined per brief, so they — and therefore the **total** — compare only _within_ a
single brief. Comparing totals across briefs is the error this split exists to prevent.

**Not comparable to version 1.** v1 totals used different weights and had no category 9;
a v1 score and a v2 score are different scales. Compare v2 runs to v2 runs.

Grade the app produced by the incognito builder against this rubric. Mechanized metrics in
`metrics.json` are ground truth where referenced — a grader may not contradict them. Score
each category with the anchors; interpolate only between adjacent anchors, and state the
evidence (file:line or transcript event) for every deduction.

## What changed from v1, and why

Across the thirteen runs graded under v1, categories 1, 2, 6 and 7 scored their maximum
**every single time** — 55 points that never once discriminated — and category 8 moved once.
All separation came from categories 3, 4 and 5. v1 also could not see the ~22 components
this library ships **beyond stock Bulma**: the highest-scoring run under v1 used two of them
and still scored 98.

v2 moves weight off the saturated categories, tightens two sets of anchors that everything
cleared, and adds category 9 for the differentiators. It is a harder rubric on purpose;
expect v2 scores to sit below v1 scores for equivalent work.

## Gate — check `app_modified` before scoring anything

If `metrics.app_modified` is `false` the builder changed no file, so the app being graded
**is the pristine scaffold**. There is nothing to score: the **total is 0**. Record it as a
failed run with a one-line reason and stop.

This is not a formality. An untouched scaffold reads as _excellent_ on every mechanized
input — `build_pass=true`, `tsc_errors=0`, `inline_style_count=0`, `raw_bulma_classnames=0`,
`handrolled_total=0`, `custom_css_added_lines=0` — and, having invented no APIs and written
no custom components, it satisfies the **top anchor of categories 3, 4 and 5 outright**. No
per-category wording can be trusted to catch this, which is why the gate sits above all of
them. (v2 makes it harder for a do-nothing run to score well — categories 1 and 2 now
require positive evidence — but the gate still governs.)

## 1. Build integrity — 10 pts [mechanized]

Scored directly from metrics.json, after the gate above.

- 10: `build_pass=true` and `tsc_errors=0`.
- 5: tsc has 1–5 errors OR vite build fails but the app is dev-renderable (src parses,
  imports resolve).
- 0: >5 tsc errors, or build and typecheck both fail, or the app is skeletal.

_Reduced from 15: every run in two loops scored the top anchor. A zero here is still
catastrophic, which is why it keeps real weight._

## 2. Component adoption — 15 pts

Did it use the library's components (87 in the catalog) instead of hand-rolling HTML/CSS
equivalents? Judge `src/**/*.tsx` against metrics `bestax_named_imports` and
`handrolled_tags`.

- 15: Every UI surface with a library equivalent uses it; `handrolled_tags` ≈ 0; **and
  `bestax_named_imports` ≥ 45**, i.e. the build reached across the catalog rather than
  cycling the same dozen primitives.
- 8: Mostly library components, but 1–3 surfaces hand-rolled where an equivalent exists, **or**
  `bestax_named_imports` is 25–44 with no hand-rolling.
- 0: Site is substantially raw JSX/HTML with the library used only incidentally
  (<10 distinct components).

_Breadth added to the top anchor: under v1 "no hand-rolled tags" alone cleared it every time,
which rewarded a narrow build as highly as a broad one._

## 3. Prop fidelity — 15 pts

Helper props (`color`, `size`, `m*`/`p*` spacing, `textAlign`, `textWeight`, `textColor`,
`bgColor`, viewport modifiers) vs escape hatches.

- 15: `inline_style_count=0`, `custom_css_added_lines<=10` (trivial),
  `raw_bulma_classnames=0`; spacing/color/alignment done via helper props.
- 8: Scattered escapes: 1–5 inline `style={{}}`, or one small custom .css file, or a handful
  of `className="is-*/has-*"` utility strings where a helper prop exists.
- 0: Systematic escapes: >5 inline styles, or a custom stylesheet doing what helper props or
  Theme do, or pervasive raw Bulma utility classNames.

Auto-cap: if `inline_style_count>5` or `custom_css_added_lines>80`, score ≤ 8.

_Unchanged from v1 — spans 8–15 across the archive, the widest spread in the set._

## 4. Hallucination penalty — 10 pts (start at 10, deduct)

Invented components, props, or APIs. tsc errors mentioning unknown exports/props are the
primary signal; also count silent ones (props that typecheck as ignored, or wrong string
values) found by inspection. Count **root causes**, not error lines: one wrong prop repeated
at seven call sites is one invention.

- 10: Zero invented imports/props in the final code AND no transcript churn from inventing
  then repairing APIs.
- 5: 1–2 invented APIs that were self-corrected after a tsc/docs check, or one surviving
  invalid prop value in final code.
- 0: ≥3 invented APIs, or final code still imports non-existent components.

Interpolate for self-corrected runs above the 0 anchor: nothing surviving is worth credit
over something surviving, but seven self-corrected inventions is not a 5.

_Unchanged from v1 — spans 2–10._

## 5. Custom-component conformance — 10 pts

Any NEW reusable component must follow the bestax spine (per the bestax-custom-component
skill): `useBulmaClasses` to consume helper props, `usePrefixedClassNames`/classNames
composition, `className` passthrough, rest-prop spread.

- 10: All custom components follow the spine (or the site legitimately needed none and
  composed library primitives inline — score 10, note "N/A-composed"). Singleton page chrome
  with no styling surface (a site's one navbar or footer) does not need the spine.
- 5: Custom components exist and accept some helper props but skip the spine (hardcoded class
  strings, no passthrough).
- 0: Custom components are plain styled JSX ignoring the pattern entirely.

_Unchanged from v1 — spans 5–10._

## 6. Theming approach — 10 pts

- 10: Brand identity via `Theme` / `ConfigProvider` / `--bulma-*` variables; zero hardcoded
  hex in JSX/CSS for anything the variables cover; **and both** a root-level theme (`isRoot`)
  **and** at least one scoped `Theme` doing local work; if dark mode is attempted it is via
  `Theme colorMode` and is **verified correct in both schemes**, not merely wired up.
- 5: Some Theme/variable use but mixed with hardcoded colors or ad-hoc CSS overrides, **or**
  root-only theming with no scoped use, **or** a colorMode toggle that leaves a surface
  unreadable in one scheme.
- 0: No Theme usage; colors hardcoded or restyled via custom CSS.

_Top anchor tightened: under v1, `Theme isRoot` + a colorMode toggle cleared it every time.
Scoped theming is the mechanism the loop taught (i07) and nothing was checking for it._

## 7. Site completeness — 15 pts [brief-specific]

What "complete" means depends on what the brief asked for. **The required-surface list comes
from `$COMPLETENESS`** — the brief's completeness addendum. Grade against that list, not
against any other brief's.

The scoring _shape_ is fixed here so the 15-pt scale means the same thing whatever the brief,
and is proportional so addenda may list any number of surfaces:

- 15: ≥85% of the addendum's required surfaces present and coherent, with plausible
  brief-appropriate copy (including any naming the addendum calls for).
- 8: ≥50% and <85% present, or all present but skeletal (lorem-level copy, empty sections).
- 0: <50% present.

If `$COMPLETENESS` was not supplied, do **not** improvise a surface list and do not fall back
to another brief's — stop and report the missing addendum, exactly as you would a missing
rubric.

## 8. Skill & docs engagement — 5 pts [mechanized + transcript]

From metrics `skill_file_reads`, `skill_files`, `claude_md_read`, `docs_fetches`,
`mcp_tool_calls`, `mcp_tools_used` and transcript review. Counter caveats you must not
over-trust: `skill_file_reads` counts any tool input mentioning `.claude/skills/`, so a bare
directory listing inflates it; `skill_files` is a complete inventory only when
`skill_files_complete` is `true` (`null` means never established — treat it as unknown, never
as a pass); and `claude_md_read=false` can be an auto-injection artifact rather than evidence
the file went unread.

- 5: Read the project's guidance early, loaded ≥2 relevant skills — at minimum the ones
  `$COMPLETENESS` names as expected for this brief — and demonstrably applied them (patterns
  from references appear in code).
- 3: Read some guidance but late/partially, or read it and visibly ignored it.
- 0: Never opened any guidance.

**Channel re-anchoring.** A run whose scaffold has no `.claude/skills/` and no `CLAUDE.md`
(an MCP-only channel) scores zero on every skill counter for reasons that have nothing to do
with engagement. Re-anchor this category onto `mcp_tool_calls` / `mcp_tools_used` **in that
run's `notes.md`** — never by editing this file. `runs-mcp/m01/notes.md` is the worked
example.

_Reduced from 10: max in 12 of 13 runs, and it is the one category that needs re-anchoring
per channel, which makes it the least comparable thing in the rubric._

## 9. Library differentiators — 10 pts [brief-specific]

**New in v2.** This library is not a Bulma wrapper — it ships ~22 components beyond stock
Bulma. Under v1 nothing measured whether a build found them, and the top-scoring run used
two.

**The expected-extras list comes from `$COMPLETENESS`**, which maps each to the surface the
brief demands it through. The brief never names a component; the addendum is where the
mapping lives. Use `metrics.json`'s `bestax_import_list` to establish presence, then **open
the source** — presence is not the bar.

- 10: ≥85% of the addendum's expected slots satisfied, each **load-bearing** in the surface
  that asked for it, and used correctly (right props, right compound parts, interactive ones
  actually wired to state).
- 5: ≥50% and <85%, **or** ≥85% present but inert — a `Dialog` that never opens, a `Toast`
  that never fires, an `Autocomplete` with no options, a `Tooltip` on nothing.
- 0: <50% satisfied.

The load-bearing clause is the point. A brief that demands extras invites shoehorning, and an
imported-but-dead component must score as **absent**, not present. Where the addendum marks a
slot as accepting alternatives, count the slot once, satisfied by either route.

A low score here on an otherwise complete, green build is a **finding about the guidance
channels** — the thing this eval exists to measure. Report it as evidence, do not soften it.

If `$COMPLETENESS` supplies no expected-extras list, this category is not gradeable for that
brief: score it `n/a`, reduce the total to 90, and say so — do not improvise a roster.

## Scorecard format (grader must emit exactly this)

```
| # | Category | Score | Max | Evidence summary |
|---|----------|-------|-----|------------------|
| 1 | Build integrity | … | 10 | … |
| 2 | Component adoption | … | 15 | … |
| 3 | Prop fidelity | … | 15 | … |
| 4 | Hallucination penalty | … | 10 | … |
| 5 | Custom-component conformance | … | 10 | … |
| 6 | Theming approach | … | 10 | … |
| 7 | Site completeness | … | 15 | … |
| 8 | Skill & docs engagement | … | 5 | … |
| 9 | Library differentiators | … | 10 | … |
|   | **Total** | … | **100** | |
```

Followed by: per-category evidence bullets (file:line / transcript refs), a **per-slot table
for category 9** (each expected extra: present? load-bearing? where), **top 5 friction
points** observed (what guidance was missing/wrong/ignored), and **3 transcript quotes**
showing guidance engagement or its absence.
