# Agent-Loop Grading Rubric — migrating a raw-Bulma app

**Rubric version: 3**

**Frozen for the duration of a loop, not forever.** Never edit it mid-loop; refine it
between loops and record which version a loop ran against (the runner writes
`rubric_version` into `metrics.json`).

This rubric grades a **migration**, not a build: the builder is handed a working app written
in Bulma's classes (the `bulma-migrate` brief, whose hook makes that app the baseline) and
asked to move it onto `@allxsmith/bestax-bulma` without changing what it looks like or does.
`metrics.json` carries each source count twice, now and under `baseline`, so a count reads
as how far the builder moved it.

Every count falls when markup is deleted as surely as when it is converted, so `baseline`
carries the tree's size too: `src_tsx_files` and `src_total_lines`. A migrated tree is
usually somewhat smaller, since one component says what nested markup did. One much smaller
than that, or with fewer files, means reading the diff for what went: markup deleted rather
than converted counts as left in categories 2 and 4, and as lost in category 3.

**Not comparable to versions 1 or 2.** Those score a site built from an empty scaffold; this
scores a conversion of a fixed app. Compare version 3 runs only to version 3 runs.

Mechanized metrics are ground truth where referenced; a grader may not contradict them.
Score each category with its anchors, interpolate only between adjacent anchors, and give
the evidence (file:line or transcript event) for every deduction. `$COMPLETENESS` supplies
the brief-specific content: the components each section should land on, the families, what
must survive, and the guidance expected.

## Gate — check `app_modified` and the conversion count before scoring anything

If `metrics.app_modified` is `false`, the builder changed nothing and the app is the
untouched raw-Bulma baseline: **total 0**. It builds and typechecks, and it has lost
nothing, so without this gate it would score 40 in categories 1, 3 and 6 for doing no work.

The same holds when `bulma_component_classes`, with deleted markup counted back in as
above, is not below `baseline.bulma_component_classes`: whatever else the builder wrote or
removed, it converted nothing. A null count cannot answer this; category 2 says what a null
means.

## 1. Build integrity — 10 pts [mechanized]

- 10: `build_pass=true` and `tsc_errors=0`.
- 5: 1–5 tsc errors, or the vite build fails while the source still parses and resolves.
- 0: more than 5 tsc errors, or build and typecheck both fail.

## 2. Conversion coverage — 25 pts [mechanized]

How much of the markup that has a bestax component still does not use it. Read
`bulma_component_classes` against `baseline.bulma_component_classes`: the count of plain
elements styled with a Bulma class bestax has a component for, as the ESLint plugin's
`no-bulma-component-class` rule reports them. The share left is now ÷ baseline.

- 25: none left.
- 20: 10% or less left.
- 12: a third or less left.
- 5: two thirds or less left.
- 0: more than two thirds left.

A null count is not a share. With `unparsed_files` listed, those files do not parse, so
nothing in them can be shown converted: score 0. With `unparsed_files` null too, the
collector ran without the ESLint plugin build and the run cannot be graded on this category:
say so and stop, rather than guess.

## 3. Nothing lost — 25 pts [brief-specific]

Every item in `$COMPLETENESS`'s "What must survive" list, checked against `builder.diff` and
the final source. An item that is gone, does nothing, or renders differently is lost.

- 25: nothing lost.
- 15: one or two items lost.
- 5: three to five items lost.
- 0: more than five, or the page no longer renders.

## 4. Faithful props — 15 pts [mechanized + diff]

Whether each converted element says what its classes said through the component's own props,
rather than by carrying the classes along or restyling it another way. Read
`raw_bulma_classnames` and `inline_style_count` against their `baseline` values, and
`custom_css_added_lines` as it stands, since it already counts from the baseline. Then
spot-check the diff: a modifier left in `className` where the component has a prop for it
(`className="is-primary"` on a `Button`) is the finding.

- 15: `raw_bulma_classnames` is 10% of its baseline or less, and what is left has no prop to
  go to; no new inline styles; `custom_css_added_lines` of 10 or fewer.
- 8: some modifiers left as classes where a prop exists, or 1–5 new inline styles, or a
  small custom stylesheet doing what a prop would.
- 0: most modifiers left as classes, or the look rebuilt with inline styles or custom CSS.

## 5. Families built from their parts — 10 pts [brief-specific]

The families `$COMPLETENESS` names are the conversions a codemod cannot make, because each
component renders parts of its own. A family counts as converted only when it is built from
the component and its parts; a component wrapped around the old part markup
(`<Card><header className="card-header">…`) is not converted, and neither is a family left
as markup.

- 10: every family converted.
- 5: at least half converted.
- 0: fewer than half.

## 6. Codemod TODOs resolved — 5 pts [mechanized + transcript]

`bestax_migrate_todos`: the `TODO(bestax-migrate)` comments left in the source. Deleting the
comment does not resolve it: when the transcript shows the codemod's report, each TODO it
lists whose element is still raw markup counts as left, comment or not. A builder that never
ran the codemod has none.

- 5: none left.
- 3: one or two left.
- 0: more.

## 7. Guidance engagement — 10 pts [mechanized + transcript]

From `skill_file_reads`, `skill_files`, `mcp_tool_calls`, `mcp_tools_used` and the
transcript, against the guidance `$COMPLETENESS` expects. The same counter caveats as
rubric-v2 §8 apply: a bare directory listing inflates `skill_file_reads`, and `skill_files`
is a full inventory only when `skill_files_complete` is `true`.

- 10: consulted the migration guidance before editing, and it shows in the code (the codemod
  ran, or conversions follow the references' mappings and recipes).
- 5: consulted it late or partly, or consulted it and visibly ignored it.
- 0: never consulted any.

**Channel re-anchoring.** An MCP-only run scores zero on the skill counters for reasons
unrelated to engagement: re-anchor this category onto `mcp_tools_used` in that run's
`notes.md`, never by editing this file.

## Scorecard format (grader must emit exactly this)

```
| # | Category | Score | Max | Evidence summary |
|---|----------|-------|-----|------------------|
| 1 | Build integrity | … | 10 | … |
| 2 | Conversion coverage | … | 25 | … |
| 3 | Nothing lost | … | 25 | … |
| 4 | Faithful props | … | 15 | … |
| 5 | Families built from their parts | … | 10 | … |
| 6 | Codemod TODOs resolved | … | 5 | … |
| 7 | Guidance engagement | … | 10 | … |
|   | **Total** | … | **100** | |
```

Followed by: per-category evidence bullets (file:line / transcript refs), a **table for
category 3** (each item: kept? where), a **table for category 5** (each family: converted?
where), **top 5 friction points** (what guidance was missing, wrong or ignored), and **3
transcript quotes** showing guidance engagement or its absence.
