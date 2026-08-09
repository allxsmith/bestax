# Scorecard — s01 (skills channel, current tooling)

Gate: `app_modified=true` (23 files changed vs baseline) — scoring proceeds.

A **regression check**, not a new loop: the original `skynet-saas` brief, its frozen
addendum, the same caps, the default scaffold — run from `eval/agent-loop/` after the
harness gained the guidance-channel options and was renamed, to confirm the skills path is
intact. Graded against `rubric.md` as written; no adaptation.

| #   | Category                     | Score  | Max     | Evidence summary                                                                                                                                       |
| --- | ---------------------------- | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Build integrity              | 15     | 15      | build_pass=true, tsc_errors=0 (mechanized)                                                                                                             |
| 2   | Component adoption           | 15     | 15      | 49 distinct named imports; handrolled_total=0 across all 9 tracked tags; 7 pages                                                                       |
| 3   | Prop fidelity                | 13     | 15      | inline_style_count=0, raw_bulma_classnames=0; custom_css_added_lines=16 (6 over the ≤10 anchor)                                                        |
| 4   | Hallucination penalty        | 8      | 10      | 1 tsc round, **2** root-cause inventions (`Column size` as a string; `--bulma-shadow` in `Theme bulmaVars`), self-corrected, 0 surviving               |
| 5   | Custom-component conformance | 10     | 10      | 4 of 6 carry the full spine (StatBlock, SectionHeading, CodeSample, FeaturedRing); SiteNav/SiteFooter are singleton chrome with no styling surface     |
| 6   | Theming approach             | 10     | 10      | `Theme isRoot` + `colorMode` toggle; zero hardcoded hex in src (grep-verified); all 4 CSS rules derive from `--bulma-*`                                |
| 7   | Site completeness            | 15     | 15      | 8/8 surfaces across 7 pages; Netadyne/Skynet/Fable naming; "one tenth as many mistakes" 10x framing; benchmark `Table`; 13 responsive breakpoint props |
| 8   | Skill & docs engagement      | 10     | 10      | 5 `Skill` invocations incl. **both** skills `$COMPLETENESS` names; `archetypes.md` and `icon-libraries.md` read; each visibly applied                  |
|     | **Total**                    | **96** | **100** |                                                                                                                                                        |

**85-pt core (categories 1–6, 8): 81.**

## Regression verdict: pass

96 sits at the revised-run mean of the original loop (95.2, range 91–99 for i02–i10) and 11
points above the i01 baseline. The skills channel measures exactly as it did before the
harness changes.

The new metrics fields are correctly **inert** on this run: `mcp_tool_calls: 0`,
`mcp_tools_used: []`, `mcp_resource_reads: 0`. Every pre-existing field is populated as
before.

One measurement caveat, pre-existing and unrelated to these changes:
`skill_files_complete=false` with `skill_refs_unresolved=1`. The builder reached two
references through `bash cd … && cat`, so `skill_files` lists only the two directory names
it could resolve. Per `rubric.md` §8 that inventory is **not** to be trusted as complete —
the score above rests on the 5 `Skill` invocations and the transcript, not on `skill_files`.

## Key evidence

- **Cat 3:** four rules / 16 lines — the hero wash and `.section-alt` band both seen in i04
  and m02, plus `.featured-ring` and a `.code-sample { max-height }` for long listings. All
  theme-derived; 6 lines over budget costs 2 points on i03's precedent (13 at 18 lines).
- **Cat 4:** `Column size="7"` as a string is the same numeric-vs-string confusion m01 hit
  from the other direction. `--bulma-shadow` is the identical invention m01 and m02 both
  made. Two root causes, one round, nothing surviving.
- **Cat 5:** `FeaturedRing.tsx` is notable — the builder extracted the featured-card ring
  into a spine-carrying component rather than a bare CSS rule, which is closer to i07's
  intent than either MCP run managed.
- **Cat 8:** `Skill` invocations for `bestax-layout-scaffold`, `bestax-theming`,
  `bestax-icons`, `bestax-form`, `bestax-custom-component`, then targeted reference reads.
  The applied links: archetypes → page structure; theming → `Theme isRoot` with no hex;
  icons → `ConfigProvider` + the one FA dependency; custom-component → four spine components.

## Cross-run finding: `--bulma-shadow` is 3 for 3

| Invention                       | m01 (MCP) | m02 (both) | s01 (skills) |
| ------------------------------- | --------- | ---------- | ------------ |
| `--bulma-shadow` in `bulmaVars` | ✗         | ✗          | ✗            |
| `Column size` numeric-vs-string | ✗         | —          | ✗            |

Every run in this eval, on every channel, tried to set a shadow through `Theme`'s
`bulmaVars` and was rejected by the typed record. Neither channel prevents it, because it is
not a wrong prop or a wrong value — it is a variable that does not exist, discovered from a
tsc error printing ~500 union members. s01 shows the workaround that does work
(`.featured-ring { --bulma-shadow: … }` set in CSS, then consumed by a spine component), so
the fix is a documented recipe, not new library surface. **The highest-value single edit
this eval surfaced.**
