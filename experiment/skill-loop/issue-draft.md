# Drafted GitHub issue (ready to paste — user files it)

**Suggested title:** `skill-loop findings: validated AI-tooling improvements on branch + library/scaffold follow-ups`

**Suggested labels:** `enhancement`, plus per-item scope labels when split out.

---

## Body

We ran a 10-iteration empirical improvement loop on the AI tooling create-bestax ships
(the 7 skills + the generated app CLAUDE.md). Each iteration: scaffold a fresh app with
the current tooling → a cold-start, memoryless Opus 4.8 `claude -p` session builds a fixed
SaaS-site brief in it → grade against a frozen 100-pt rubric (component adoption, helper-prop
fidelity vs escape hatches, hallucinated APIs, custom-component spine conformance, theming,
completeness, skill engagement) → revise the tooling from findings → rebuild → repeat.
Full method, rubric, per-run artifacts (metrics, scorecards, diffs, src snapshots), and the
final analysis live on the branch: **`chore/skill-improvement-loop`**, under
`experiment/skill-loop/` (see `report.md` there for the complete writeup).

### Results

| | Baseline (i01, shipped tooling) | Revised runs (i02–i10) |
|---|---|---|
| Score | 85/100 | **mean 95.2** (median 96, min 89, max 99) |
| Raw Bulma classNames in output | 42 | **0 in all 9 runs** |
| Inline `style={{}}` / hand-rolled tags | 0 / 0 | 0 / 0 (held) |
| Custom CSS added | 77 lines | 10–21, converging on a sanctioned ~10-line pattern |
| Invented APIs surviving in final code | 0 (2 invented + repaired) | 0 in 8 of 9 runs (1 silent no-op shipped in i10 — see library items) |
| Builder cost / turns per run | $10.55 / 127 | **mean $6.00 (−43%) / 79 (−38%)** |

Core finding: **placement beats content**. Facts moved onto always-loaded surfaces (the
generated CLAUDE.md, SKILL.md bodies, the component catalog itself) held in every
subsequent run; facts one reference-hop away failed stochastically even when the pointer
was read. Categories other than hallucination saturated from i03 onward.

### 1. Validated tooling changes — on the branch, ready for review/PR

One commit per iteration (`f096985 … 9169702`), all guidance verified against bulma-ui
source before writing, all generic (nothing eval-specific):

- **Generator** (`scripts/gen-component-catalog.mjs`): catalog header's false "every
  component accepts helper props" claim corrected with verified sub-part exceptions;
  alias-grep technique + `dist/types` path (kills a ~6-call node_modules hunt per run);
  spine pointer.
- **layout-scaffold skill**: Td/Th `textAlign`/`textWeight` idiom + `Span`/`Paragraph`/
  `Strong` wrappers (the single biggest metric win); interactive-extras API block
  (Collapse/Tabs/Dropdown/Steps state props, Steps `items` shape, `Tabs.Tab index`,
  Tabs.Content containment, Reveal cascade scope); ≤10-line decorative-CSS budget with a
  copy-paste few-shot + the zero-CSS featured-ring recipe (scoped `Theme bulmaVars`);
  markerless-list and no-resets facts; `has-navbar-fixed-top` at the point of use
  (replacing a classList hack the reference itself used to prescribe).
- **theming skill**: variant-flag/analogy ban with verified rosters (`isLight` =
  Button/LinkButton/Notification only; `Tag` sizes; `Tags` centering); types-wider-than-CSS
  warning; corrected two factually false rows in `themeable-components.md` (Tag/Input
  `textColor`; Box `color` behavior); font-loading note (declared `--bulma-family-*` needs
  the font actually loaded).
- **form skill**: `isFullWidth`(Button) vs `isFullwidth`(Select/Table/File) casing trap;
  `message`/`messageColor` ownership (inputs, not `Field`); **`label` a11y warning** — the
  checklist previously *asserted* an association the library doesn't make; now teaches the
  `id` + `labelProps={{htmlFor}}` wiring.
- **icons skill / custom-component skill**: `ariaLabel` (Icon/Delete/Slider/Carousel only)
  vs standard `aria-label` split; spine applies to compositions, `usePrefixedClassNames`
  optional for zero-CSS ones.
- **CLAUDE_MD template** (`create-bestax/src/constants.ts`): spine rule; compound-sub-part
  rule (+ `Tabs.Tab index` correction); PM-match-the-lockfile rule; sanctioned
  companion-class exception (`has-navbar-fixed-top`); absolute-path nudge.

Bundle stayed within budget (4,162 → 4,260 lines; template ~60 rendered lines).
Note for the PR: merged skill changes may warrant matching `bulma-ui/src/skill-examples/`
showcase updates per `skills/CLAUDE.md`.

### 2. Library-level follow-ups (bulma-ui — each can become its own issue)

1. **Narrow per-component color unions to shipped CSS.** `Progress`/`Notification`/`Hero`
   accept grey-family values with no CSS behind them; `Progress color="grey"` typechecked
   and shipped rendering default-styled in i10. tsc caught `Tag isLight` both times it was
   invented — union narrowing gives the same guarantee here.
2. **`Tag isLight`**: Bulma ships `.tag.is-*.is-light` CSS; the natural guess was invented
   in 2 of 10 runs. Either expose the prop or keep the documented ban.
3. **`Box color` falls through to `has-text-*`** (never a box variant) — likely bug.
4. **Form `label` prop wires no `htmlFor`/`id`** — a11y gap; workaround now documented in
   the skill, default still broken.
5. **Scheme-valued backgrounds** (`bgColor` scheme values or a Section background var) —
   the only reason every marketing-site build needs ~10 lines of CSS at all.
6. **`Card.*` sub-parts accept no helper props** — forces Box swaps for flex pinning.
7. **`isFullWidth`/`isFullwidth` unification** (alias + deprecation path).

### 3. create-bestax scaffold follow-ups

1. Add `*.tsbuildinfo` to the template `.gitignore` (stale-buildinfo TS5083 cost a run ~7
   diagnosis events; the artifact shipped committed).
2. `src/display.ts` hardcodes `pnpm install` in next-steps despite the PM-agnostic design.
3. Reconsider `--strictPort` on 5173 in `.claude/launch.json`, or document a fallback.

### 4. Proposed next-loop experiments (unvalidated)

- Echo the two remaining hallucination guards (variant flags, no-op colors) into the
  always-loaded CLAUDE_MD (~3 rendered lines) — precedent: the same move ended sub-part
  inventions for 5 straight runs.
- **Generate per-component prop value unions into the catalog** at gen time — attacks the
  oldest gap (prop-detail thinness → `.d.ts` spelunking in every run) without
  hand-maintained tables.
- Ship the site-level headless SSR-smoke recipe seven builders improvised convergently.

### Threats to validity (short)

n=1 build/iteration (±6-pt single-run swings observed with identical tooling); one brief,
one model; the CSS-line rubric floor is partly library-shaped; 3 of 10 machine scorecards
contained an error, all caught by transcript cross-checks (details in `report.md`).
