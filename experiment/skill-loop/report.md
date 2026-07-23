# Skill-Loop Experiment — Final Report

**What this is:** 10 iterations of an empirical improvement loop for the AI tooling that
create-bestax ships (7 Claude Code skills + the generated app CLAUDE.md). Each iteration:
scaffold a fresh app with the *current* tooling → a cold-start, memoryless ("incognito")
Opus 4.8 `claude -p` session builds a fixed SaaS-site brief in it → grade against a frozen
100-point rubric → revise the tooling from the findings → rebuild create-bestax → repeat.
i01 ran the unmodified shipped tooling as the baseline. After i10, a compare-only pass ran
(no edits), so everything on this branch is validated by at least one subsequent build.

**Headline results**

- Baseline **85/100 → revised-runs mean 95.2** (i02–i10; median 96, min 89, max 99, sd ≈ 3.4).
- Builder cost **−43%** and turns **−38%** per run after revisions (mean $6.00 / 79 turns
  vs $10.55 / 127) — better guidance measurably reduced churn, not just errors.
- Every category except hallucination **saturated from i03 onward** (non-hallucination
  points: 88–90 of 90 in all of i03–i10).
- The loop **self-corrected its own mistake**: an over-broad rule introduced after i05 was
  detected from i06's failure and fixed on all three surfaces that carried it; zero
  recurrence after.
- Three grader errors across 10 scorecards were caught by cross-checks against transcripts
  (i08, i09, i10) — recorded and corrected in the iteration log, not propagated.

## Method

- **Frozen inputs** (committed in the harness commit, never edited after): `base-prompt.md`
  (the user's Skynet/Netadyne SaaS brief, wrapped with "the project in cwd was just
  scaffolded"), `rubric.md` (8 anchored categories / 100 pts), the builder invocation
  (`env -u CLAUDECODE claude -p … --model opus --setting-sources project
  --no-session-persistence --dangerously-skip-permissions`, 45-min watchdog, $15 budget
  cap), and `bin/collect-metrics.mjs` (mechanized counts the grader may not contradict).
- **Isolation:** scaffold targets live outside the repo tree (fresh cwd ⇒ no repo
  CLAUDE.md, empty auto-memory, registry-installed `@allxsmith/bestax-bulma@5.8.0`).
  Builders had network but **used it zero times in all 10 runs** — `docs_fetches=0`
  throughout; the skills plus the installed package's `.d.ts` files fully substituted for
  web documentation.
- **Roles:** builder (cold Opus), grader (read-only subagent, frozen rubric), improver
  (subagent editing only `skills/**`, the `CLAUDE_MD()` template in
  `create-bestax/src/constants.ts`, and `scripts/gen-component-catalog.mjs`; generic
  guidance only; line budgets; noise rule: act only on metric-corroborated, repeated, or
  plainly factual findings), orchestrator (this session: scaffolds, launches, commits,
  rebuilds).
- **Noise stance:** one build per iteration (cost); mechanized metrics carry the trend;
  anchored rubric pins grader variance; direction-of-travel over 10 points, not
  iteration-pair deltas.

## Score trajectory

| Iter | Total | Build | Adopt | Props | Halluc | Custom | Theme | Complete | Engage | css lines | error-TS churn | $ | min |
|------|-------|-------|-------|-------|--------|--------|-------|----------|--------|-----------|----------------|-----|-----|
| i01 (baseline) | 85 | 15 | 15 | 8 | 5 | 7 | 10 | 15 | 10 | 77 | 1 round (2 invented) | 10.55 | 19 |
| i02 | 89 | 15 | 15 | 12 | 5 | 7 | 10 | 15 | 10 | 56 | 1 round (2 invented) | 5.77 | 12 |
| i03 | 96 | 15 | 15 | 13 | 8 | 10 | 10 | 15 | 10 | 18 | 1 round (2 near-miss names) | 5.68 | 12 |
| i04 | 99 | 15 | 15 | 14 | 10 | 10 | 10 | 15 | 10 | 12 | none | 6.18 | 13 |
| i05 | 91 | 15 | 15 | 13 | 3 | 10 | 10 | 15 | 10 | 19 | 4 invented, self-corrected | 6.46 | 13 |
| i06 | 97 | 15 | 15 | 15 | 7 | 10 | 10 | 15 | 10 | 10 | 2 pre-tsc drafts + 1 mechanics | 6.60 | 14 |
| i07 | 95 | 15 | 15 | 13 | 7 | 10 | 10 | 15 | 10 | 21 | 3 pre-tsc wobbles, 0 error-TS | 8.43 | 18 |
| i08 | 98 | 15 | 15 | 13 | 10 | 10 | 10 | 15 | 10 | 13 | none | 5.51 | 11 |
| i09 | 99 | 15 | 15 | 14 | 10 | 10 | 10 | 15 | 10 | 12 | mechanics only | 6.57 | 10 |
| i10 | 93 | 15 | 15 | 15 | 4 | 10 | 10 | 15 | 9 | 10 | 1 round + 1 SURVIVING no-op | 2.83 | 7 |

Mechanized durables: `inline_style_count` **0 in 10/10 runs**; `raw_bulma_classnames`
42 (baseline) then **0 in all 9 revised runs**; `handrolled_total` 0 in real terms in
10/10 (i09's "1" was a `<button` inside a JSX comment — metrics false positive);
`custom_css_added_lines` 77 → 56 → 18 → 12 → 19 → 10 → 21 → 13 → 12 → 10.

## Per-category analysis

- **Build integrity, adoption, theming, completeness — 100% attainment in all 10 runs.**
  Even the unmodified baseline used 39 distinct library components with zero hand-rolled
  equivalents: the shipped CLAUDE.md house style already lands the big strokes. The
  experiment's value concentrated in the finer-grained categories below.
- **Prop fidelity (86.7% attainment; 8 → mostly 13–15).** Baseline lost 7 pts to 42 raw
  `className="is-*/has-*"` strings (mostly `has-text-*` on `Table.Th/Td`) and 77 lines of
  custom CSS. The i01-pass fixes (Td/Th `textAlign`/`textWeight` idiom;
  `Span`/`Paragraph`/`Strong` wrapper elements) eliminated raw classNames permanently.
  Custom CSS converged onto the sanctioned two-rule pattern (hero wash + section band, all
  `--bulma-*`-derived) and hit the ≤10-line anchor in i06 and i10. The residual ~10-line
  floor is structural: no zero-CSS route exists for a scheme-aware section band
  (library-level gap, below).
- **Hallucination (69% attainment — the sole unstable category: 5,5,8,10,3,7,7,10,10,4).**
  The mechanism narrowed steadily: variant flags (i01: `Tag isLight`) → value unions
  (i02: `Tag size="small"`) → near-miss names of real props (i03: `isFullWidTH`-casing,
  `ariaLabel`) → zero invented APIs in i04 → then two distinct residual failure modes:
  - **Loading-probability failures** (i05, i10): the guard exists in the bundle but the
    run never opened the file carrying it. i05 invented 4 APIs, one explicitly warned
    about in the two files it didn't load; i10 shipped the series' only surviving defect
    (`Progress color="grey"` — typechecks, emits `is-grey`, no CSS ships for it) whose
    warning lives only in `themeable-components.md`, pointed at twice, never opened.
  - **Retention/verification failures** (i10): `Tag isLight` was re-invented ×5 *after
    reading the ban in full* — a read warning is not an applied warning. The three 10/10
    runs (i04, i08, i09) all showed check-then-use discipline (grep the installed `.d.ts`
    before writing); the low runs didn't. Documentation cannot compel a habit; type-level
    enforcement can (see library recommendations).
- **Custom-component conformance (94%; 7 → 10/10 for the final 8 runs).** The spine rule
  existed from the start but lived in a skill file baseline builders didn't open. Echoing
  it into the auto-injected CLAUDE.md (i02 pass) + a catalog-header pointer + the worked
  example fixed it permanently, including the i04-pass clarification that
  `usePrefixedClassNames` is optional for zero-CSS compositions.
- **Engagement (99%).** Skills loaded before any code in 10/10 runs. i10's −1 was for
  pointing at the truth-table reference twice without opening it.

## The core finding: placement beats content

Every durable win came from moving exact, verified facts onto **surfaces that always load**:

1. the auto-injected app CLAUDE.md (spine rule, compound-sub-part rule, PM-lockfile rule,
   companion-class exception, absolute-path nudge),
2. SKILL.md bodies that trigger reliably for the task (layout-scaffold's extras-API block,
   CSS few-shot, wrapper-element idiom),
3. the component catalog — the reference builders actually open (sub-part exceptions,
   alias-grep technique, `dist/types` path — all generator-level so they can't drift).

Facts that lived one reference-hop away failed stochastically (i05, i10) even when the
pointer itself was read. The corollary was validated in both directions: the two runs that
skipped the always-loaded surfaces' guards still executed every ambient rule perfectly —
by i10, helper-props/no-inline-styles/spine/theming are simply "how you write bestax code,"
even in the cheapest, least-engaged run of the series.

## Per-iteration change log (commits on `chore/skill-improvement-loop`)

| Iter | Commit | Skill/tooling changes (all verified against bulma-ui source before writing) |
|------|--------|------------------------------------------------------------------------------|
| harness | (first commit) | Frozen rubric, base prompt, metrics script, grader/improver protocols |
| i01 | `f096985` | Generator: catalog-header helper-prop truth-claim fix (sub-part exceptions). Skills: variant-flag roster (`isLight` = Button/LinkButton/Notification only); Td/Th cell idiom + Span/Paragraph/Strong wrappers; alternating-band token; spine applies to compositions; fixed false claims in themeable-components.md; card-grid footer bug |
| i02 | `efaf307` | Analogy-ban broadened to value unions/group props; ~10-line decorative-CSS budget + few-shot; font-loading note; spine echoed into CLAUDE_MD; generator: alias-grep technique + spine pointer in catalog header |
| i03 | `9312281` | Casing trap (`isFullWidth`/`isFullwidth`); `ariaLabel` vs `aria-label` split; `has-navbar-fixed-top` at point of use (replacing the classList hack the reference itself prescribed); headless-verify fallback; ~800 KB expected-CSS note; PM-lockfile rule in CLAUDE_MD |
| i04 | `0c9d153` | Net 0 lines: few-shot compressed to ≤10-line transcription; companion-class sanctioned exception in CLAUDE_MD; `usePrefixedClassNames` optional at rung 1; flex-values line |
| i05 | `032ab5e` | Interactive-extras state APIs (Collapse/Tabs/Dropdown/Steps); markerless-list + no-resets facts; `message`/`messageColor` ownership pinned; compound-sub-part rule echoed into CLAUDE_MD |
| i06 | `9102455` | Steps `items` shape; `Tabs.Tab index` (correcting the i05 rule's own falsehood on all three carrying surfaces); Reveal cascade scope; form `label`/`htmlFor` a11y warning + `labelProps` workaround (the checklist previously asserted the false association) |
| i07 | `db12257` | Types-wider-than-CSS rule + verified examples; corrected false Box row (its `color` renders `has-text-*`); Tabs.Content containment; zero-CSS featured-ring via scoped `Theme bulmaVars`; generator: `dist/types` path in catalog header |
| i08 | `ef61cfe` | Net +1 line: comments-count clause in CSS budget; absolute-path nudge in CLAUDE_MD |
| i09 | `8961561` | Net 0: header-comment ban in CSS budget wording (validated by i10 hitting the anchor) |
| i10 | `9169702` | Compare-only — no edits. Final analysis |

Total tooling diff vs baseline: 18 files, +230/−88. Hand-written skill bundle
4,162 → 4,260 lines (cap 4,300 respected); CLAUDE_MD rendered ~47 → ~60 lines (cap 90).

## What mattered most (ranked)

1. **Td/Th idiom + wrapper elements** (i01 pass) — single largest metric move
   (42 raw classNames → 0, permanently).
2. **Always-loaded placement of the spine + sub-part rules** (i02/i05 passes) — turned the
   two chronically stuck categories into 8-run streaks at max.
3. **Generator-level catalog header** (i01/i02/i07) — fixed a false shipped claim, taught
   the alias-grep/check-then-use technique correlated with every 10/10 hallucination run,
   and can't drift (CI staleness gate).
4. **The decorative-CSS budget few-shot + scoped-Theme ring** (i02/i04/i07) — 77 lines →
   a stable, themeable, dark-mode-safe ~10-line pattern; the i07 ring recipe removed the
   last CSS-pressure source and was adopted by every subsequent run.
5. **Micro-facts that each killed a repair-round class**: extras state APIs, casing trap,
   `message` ownership, fixed-top at point of use, markerless lists, PM-lockfile rule.

## Remaining gaps and recommendations

**(a) Proposed skill/tooling changes — unvalidated (next loop's candidates)**
1. Echo the two remaining hallucination guards onto always-loaded surfaces: one
   variant-flag line + one no-op-color line in CLAUDE_MD house style (~3 rendered lines).
   Precedent: the i05 sub-part echo produced 5 clean runs.
2. **Generate per-component value unions into the catalog** from the `.d.ts` at gen time —
   attacks the oldest gap (prop-detail thinness → `.d.ts` spelunking every run) at the
   most-read surface without hand-written-table drift.
3. Ship the site-level headless-verification recipe (SSR smoke over all routes) — seven
   runs improvised the same pattern convergently.
4. A CLAUDE_MD line preferring full skill loads over partial `cat`/`head` reads (i10's
   head-100 truncation missed only low-value tail, but the truncation habit is risk).

**(b) Library-level (bulma-ui issues to open)**
1. **Narrow per-component color unions to shipped CSS** — `Progress`/`Notification`/`Hero`
   accept the grey family that has no CSS; this class produced i07's two drafts and i10's
   shipped defect, and it is invisible to tsc today. Union narrowing converts it into a
   compile error (evidence: tsc caught `Tag isLight` both times it was invented).
2. **`Tag isLight`**: either add it (Bulma ships `.tag.is-*.is-light` CSS — make the
   natural guess correct; invented in 2 of 10 runs) or keep the ban and accept recurrence.
3. **Box `color` falls through to `has-text-*`** — never a box variant; likely bug (i07).
4. **Form `label` prop wires no `htmlFor`/`id`** — a11y trap (i06); skills now teach the
   `labelProps={{htmlFor}}` workaround, but the default remains broken.
5. **Scheme-valued backgrounds** (`bgColor` scheme values or a Section background var) —
   would zero the last ~10 CSS lines every marketing site needs (recurring since i02).
6. **`Card.*` sub-parts accept no helper props** — forces Box swaps for flex pinning (i07).
7. **`isFullWidth`/`isFullwidth` unification** (alias + deprecation) — the documented trap
   held for 7 runs but remains a footgun for unguided agents.

**(c) create-bestax scaffold/template-level**
1. Add `*.tsbuildinfo` to the template `.gitignore` (i09: stale-buildinfo TS5083 cost ~7
   diagnosis events and the artifact shipped committed).
2. `src/display.ts` hardcodes `pnpm install` in next-steps despite the PM-agnostic design.
3. Reconsider `--strictPort` 5173 in `.claude/launch.json` or document a fallback (i04
   collision with an orphaned dev server).

**(d) Harness/metrics-level (for future loops)**
1. Handrolled-tag counter must ignore JSX comments (i09 false positive penalizes exactly
   the rationale comments the guidance encourages).
2. `skill_files` extraction should parse Bash `cat`/`sed`/`grep` paths, not only Read-tool
   inputs (lists were empty in i05/i08/i10 while reads occurred).
3. Provide a browser tool in nested builder sessions, or bless the SSR smoke recipe as the
   official fallback (flagged honestly by builders in 7 runs).
4. Keep the improver's grader cross-check step — it caught 3 scorecard errors in 10 runs.
5. Keep the pre-launch orphaned-dev-server sweep (added at i05 after the port collision).

## Threats to validity

- **n=1 build per iteration**: single-run swings of ±6 points occurred (i05, i10) with
  identical tooling classes; the trajectory's meaning lives in the mechanized metrics and
  the 8-run streaks, not adjacent-pair deltas.
- **Single brief, single model**: one SaaS marketing brief, Opus 4.8 only. The saturated
  categories may partly reflect this brief's shape (e.g., forms lightly exercised;
  bestax-migrate/optimize skills never triggered).
- **Rubric floor**: the ≤10-line CSS anchor is not reachable by better guidance alone
  while the library lacks scheme-valued backgrounds — prop-fidelity's ceiling is partly
  library-shaped.
- **Grader variance**: anchored rubric + mechanized ground truth held it mostly stable,
  but 3 of 10 scorecards contained a factual error (all caught by transcript
  cross-checks; corrected in the iteration log).
- **Builder-behavior confound**: i10's cost/turn collapse is partly reduced scope
  (single page, no icons), not purely guidance efficiency.

## Artifact map

- Per-run artifacts: `experiment/skill-loop/runs/i01..i10/` — `metrics.json`,
  `scorecard.md`, `builder.diff`, `app-src/`, `notes.md` (i01/i10);
  `transcript.jsonl` + `builder-stderr.log` on disk, gitignored.
- Running log with per-iteration detail: `experiment/skill-loop/iteration-log.md`.
- Loop state machine: `experiment/skill-loop/state.json` (all 10 commit SHAs).
- Frozen inputs: `base-prompt.md`, `rubric.md`, `bin/collect-metrics.mjs`,
  `bin/grader-prompt.md`, `bin/improver-prompt.md`.
