# Scorecard — v01 (skills channel, `skynet-platform` brief, rubric v2)

Gate: `app_modified=true` (28 files changed vs baseline) — scoring proceeds.

Graded against [`rubric-v2.md`](../../rubric-v2.md) (`rubric_version: 2` in `metrics.json`)
and the [`skynet-platform` addendum](../../briefs/skynet-platform.completeness.md). **Not
comparable to any v1 score** — different weights, different category count.

| #   | Category                     | Score  | Max     | Evidence summary                                                                                                           |
| --- | ---------------------------- | ------ | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | Build integrity              | 10     | 10      | `build_pass=true`, `tsc_errors=0` (mechanized)                                                                             |
| 2   | Component adoption           | 15     | 15      | **72** distinct named imports (anchor ≥45); `handrolled_total=1`                                                           |
| 3   | Prop fidelity                | **0**  | 15      | **`custom_css_added_lines=647`** — a 596-line `.nd-*` design system doing what helper props do. Auto-cap ≤8; 0 anchor met. |
| 4   | Hallucination penalty        | 3      | 10      | 6 tsc rounds, **4 root-cause inventions**, all self-corrected, 0 surviving                                                 |
| 5   | Custom-component conformance | 10     | 10      | 4 of 6 carry the full spine (StatTile, HintLabel, CodeBlock, UsageChart); SiteNav/SiteFooter are singleton chrome          |
| 6   | Theming approach             | 5      | 10      | `Theme isRoot` + `colorMode` only — **no scoped `Theme` anywhere**, which v2's top anchor requires                         |
| 7   | Site completeness            | 15     | 15      | 8/8 surfaces across 7 pages; Netadyne/Skynet/Fable naming throughout                                                       |
| 8   | Skill & docs engagement      | 5      | 5       | 8 skill-file reads across 6 files spanning all three expected skills; each visibly applied                                 |
| 9   | Library differentiators      | 10     | 10      | 17/20 slots (85%), **every one load-bearing in the surface that asked for it** — but see the calibration warning below     |
|     | **Total**                    | **73** | **100** |                                                                                                                            |

**75-pt core (1–6, 8): 48.**

## Verdict on the pre-registered split criteria: **one brief holds**

| Criterion                            | Result                    |
| ------------------------------------ | ------------------------- |
| `result_subtype != "success"`        | `success` — not truncated |
| `build_pass=false` or `tsc_errors>5` | `true` / `0`              |
| Category 7 < 8                       | 15/15                     |

It fit with room to spare: **$23.18 of $30 (77%)**, **2 733 s of 3 600 (76%)**, 4 402 lines
across 18 files, 165 turns. No split needed. `skynet-platform` stays one brief.

## The instrument now discriminates

That was the other thing v01 had to prove. Under v1 the last four runs scored 85, 96, 98 and
96, with four categories pinned at maximum. Under v2 this run spreads across the full range —
0, 3, 5, 5, 10, 10, 15, 15, 15 — and the two lowest scores are the two most interesting
findings in the run. Categories 3 and 6 moved for the first time in fifteen runs.

## Key evidence

- **Cat 3 — the headline finding.** `App.css` is 596 lines defining a parallel design system:
  `.nd-page`, `.nd-measure`, `.nd-band`, `.nd-card`, `.nd-chip`, `.nd-stat-value`,
  `.nd-gradient-text`, `.nd-on-ink`, `.nd-hairline-top` and ~40 more. Previous runs on the
  marketing brief added **9–16 lines**. Nothing about the new surfaces requires this — it is
  the same helper-prop territory (spacing, colour, alignment, surface treatment) rebuilt by
  hand. This is a **scale effect**: given a bigger, more app-like build, the builder stopped
  composing helper props and started writing CSS. No previous brief was large enough to
  expose it, and it is invisible in every v1 scorecard.
- **Cat 4 — the four inventions:** `isAligned` on `Table.Td` (4 error lines, one root cause —
  `TdProps` has no such prop); `as`/`href` on `Dropdown.Item`; `UsageChartProps` extending
  both `Omit<SVGAttributes<SVGSVGElement>,'color'>` and `Omit<BulmaClassesProps,'color'>`,
  which cannot be satisfied simultaneously; and an object passed where a string was expected.
  Two further tsc failures were config/infra (`tsconfig.node.json` emit, a transient
  `node_modules` read) and are **not** counted as inventions. Precedent: i05 scored 3 for four
  self-corrected inventions.
- **Cat 6:** one `<Theme isRoot colorMode>` in `App.tsx:47` and nothing else. Zero hardcoded
  hex, brand HSL trios present — so it clears v1's anchor exactly as the last fifteen runs
  did. v2's top anchor also asks for at least one **scoped** `Theme` doing local work, and
  there is none: every local surface treatment went into `.nd-*` CSS instead. Categories 3
  and 6 are the same failure seen from two angles.
- **Cat 5:** `UsageChart.tsx` is the interesting one — the builder applied the spine to an
  **SVG** component, hit a real type conflict, and repaired it rather than dropping the spine.
  Its comment (`* against style={{}} holds while the shape still depends on the data`) shows
  it reasoned about the inline-style rule rather than ignoring it.
- **Cat 8:** `bestax-layout-scaffold/examples/app-shell.tsx`, `bestax-theming/SKILL.md`,
  `bestax-form/SKILL.md` + `references/patterns.md`, `bestax-icons/SKILL.md`,
  `bestax-custom-component/examples/stat-card.tsx` — all three expected skills plus two more.
  `skill_files_complete=false` (`skill_refs_unresolved=2`), so that inventory is a floor, not
  a total.

## Category 9 — per-slot

| Slot           | Present | Load-bearing | Where                                                   |
| -------------- | ------- | ------------ | ------------------------------------------------------- |
| Carousel       | ✓       | ✓            | `pages/Home.tsx` — the rotating stories                 |
| Rate           | ✓       | ✓            | `pages/Home.tsx` — the out-of-five score                |
| Reveal         | ✓       | ✓            | `pages/Home.tsx` ×5 — scroll-in sections                |
| Autocomplete   | ✓       | ✓            | `pages/Playground.tsx` — model picker                   |
| Slider         | ✓       | ✓            | `pages/Playground.tsx`, `pages/Pricing.tsx` ×3          |
| Numberinput    | ✓       | ✓            | `pages/Playground.tsx`, `pages/Demo.tsx`                |
| Switch         | ✓       | ✓            | `pages/Playground.tsx`, `pages/Pricing.tsx`             |
| Taginput       | ✓       | ✓            | `pages/Playground.tsx` — stop sequences                 |
| Tooltip        | ✓       | ✓            | `components/HintLabel.tsx`, Benchmarks, Console ×3      |
| Loading        | ✓       | ✓            | `pages/Playground.tsx` — generating state               |
| **Toast**      | ✗       | —            | **substituted `Notification`** (`Playground.tsx:405`)   |
| Collapse       | ✓       | ✓            | `pages/Pricing.tsx` — FAQ                               |
| Steps          | ✓       | ✓            | `pages/Docs.tsx` — quickstart                           |
| Avatars        | ✓       | ✓            | `pages/Console.tsx` ×4 — the team                       |
| Avatar         | ✓       | ✓            | `pages/Home.tsx`, `pages/Console.tsx`                   |
| Badge          | ✓       | ✓            | `pages/Console.tsx` — unread count                      |
| Sidebar        | ✓       | ✓            | `pages/Console.tsx` ×5 — collapsing nav                 |
| date/time      | ✓       | ✓            | `DateInput` + `TimeInput` in `pages/Demo.tsx`           |
| **Dialog**     | ✗       | —            | **substituted `Modal` + `Modal.Card`** (`Demo.tsx:414`) |
| **LinkButton** | ✗       | —            | **substituted `Button color="text"`** (`Demo.tsx:500`)  |

**17/20 = 85%, every hit load-bearing → the 10 anchor, exactly.**

**Calibration warning.** Scoring 10/10 while missing three purpose-built components is the
anchor being too loose, not the build being perfect. At 20 slots, ≥85% tolerates three
misses; at category 7's 8 surfaces it tolerated one. The anchors are **frozen for this loop**,
so v01 is graded as written and the defect is recorded rather than patched mid-run — raise the
top anchor to ≥95% (≥19/20) in the next revision.

**The substitutions are themselves the finding.** All three misses are the same mechanism: a
core Bulma component the model already knows was good enough, so the purpose-built bestax
component was never looked for. `Dialog` is documented as "confirmation and alert dialogs";
`Toast` as "brief notification messages". The builder even wrote
`{/* One real action, one plain way back — not two identical buttons. */}` above the
`Button color="text"` — it understood the requirement precisely and solved it without ever
discovering `LinkButton`.

## Top 5 friction points

1. **Scale breaks helper-prop discipline.** 647 lines of custom CSS against 9–16 on every
   smaller brief. The ≤10-line budget is stated in `CLAUDE.md` and the theming skill as a
   flat rule with no guidance for a build with seven interactive pages — so at that size the
   builder silently replaced the whole system. The guidance needs a section on what to do when
   a site genuinely needs a design language: scoped `Theme` + `bulmaVars`, not `.nd-*`.
2. **No skill teaches scoped `Theme`.** Cats 3 and 6 share a root cause. `bestax-theming`
   covers the root theme and `colorMode` well — every run gets those right — and nothing shows
   scoping a `Theme` to a section to restyle it without CSS, which is the mechanism that would
   have absorbed most of those 596 lines.
3. **Core Bulma crowds out the bestax extras.** `Modal` for `Dialog`, `Notification` for
   `Toast`, `Button color="text"` for `LinkButton`. The model reaches for what it already
   knows; nothing in either channel says "we ship a purpose-built one". A "you may already
   know X — we have Y" mapping would close all three.
4. **Helper props still aren't universal, and it still bites.** `isAligned` on `Table.Td` —
   the third run in a row to put a non-existent prop on a table cell (m01 did it with
   `textColor`). The Td/Th cell idiom exists in the skills; it is not reaching the point of
   use.
5. **The spine has no story for non-`div` roots.** `UsageChartProps` extending both
   `SVGAttributes` and `BulmaClassesProps` is a real conflict the builder had to discover by
   failing. Every skill example is a `div`-rooted component.

## 3 transcript quotes

1. **`app-src/src/components/UsageChart.tsx:34`** — _"against `style={{}}` holds while the
   shape still depends on the data; colours…"_ — the builder reasoning explicitly about the
   house inline-style rule while writing an SVG, then applying the spine to it.
2. **`app-src/src/pages/Demo.tsx:489`** — _"One real action, one plain way back — not two
   identical buttons."_ — the brief's `LinkButton` sentence understood exactly, and solved
   with core Bulma.
3. **`metrics.json` `skill_files`** — `bestax-layout-scaffold/examples/app-shell.tsx` and
   `bestax-custom-component/examples/stat-card.tsx` both read, and `StatTile.tsx` mirrors the
   stat-card spine. As in m02, the examples carry the guidance that lands.
