# skill-loop iteration log

One entry per iteration: scores, mechanized-metric highlights, changes applied, anomalies.
Newest entries at the bottom. Commit SHAs recorded so the report can link per-iteration diffs.

---

## i00 — setup (2026-07-23)

- Worktree `chore/skill-improvement-loop` created from main @ 4aecef2; `pnpm install` +
  `pnpm --filter create-bestax build` green (sync-skills copied all 7 skills).
- Smoke test: scaffolded `smoke` app (note: scaffolder requires a **bare dir name** relative
  to cwd — absolute paths are rejected by the project-name validator), registry install
  resolved `@allxsmith/bestax-bulma@5.8.0`, nested
  `env -u CLAUDECODE claude -p … --setting-sources project` run discovered **all 7 skills**,
  read CLAUDE.md, exited 0 with parseable stream-json and `total_cost_usd` populated
  ($0.127). `< /dev/null` added to the frozen invocation (skips a 3s stdin wait).
- Frozen from here on: `base-prompt.md`, `rubric.md`, invocation flags, caps
  (45 min / $15 / opus).

## i01 — baseline, unmodified skills (2026-07-23)

**Total 85/100** — build 15, adoption 15, prop-fidelity 8, hallucination 5, custom-comp 7,
theming 10, completeness 15, engagement 10. Build: 19 min, $10.55, 127 turns, success.

- Metrics: `tsc_errors=0`, `build_pass=true`, `inline_style_count=0`, `handrolled_total=0`,
  `bestax_named_imports=39`, `raw_bulma_classnames=42`, `custom_css_added_lines=77`,
  `deps_added=[@fortawesome/fontawesome-free]`, skills read: layout-scaffold (+theming,
  icons invoked), `docs_fetches=0`.
- Top frictions: (1) generated catalog's false "every component accepts helper props"
  claim → induced `Card.Content` hallucination; (2) no variant-flag roster → `Tag isLight`
  invented; (3) Td/Th alignment idiom undocumented → ~30 raw `has-text-*` classNames;
  (4) `bgColor="light"` dark-mode trap → screenshot-repair round; (5) no sanctioned story
  for inline text fragments (`Span`/`Paragraph` unknown to builder).
- Improve pass (generic, verified against bulma-ui types): **generator-level fix** to
  `gen-component-catalog.mjs` header (sub-part helper-prop exceptions, catalog
  regenerated); variant-flag rule (`isLight` = Button/LinkButton/Notification only);
  Td/Th cell idiom + `Span`/`Paragraph`/`Strong` wrappers in layout skill; alternating-band
  `--bulma-scheme-main-bis` idiom in theming SKILL.md + landing archetype; spine applies to
  zero-CSS compositions; fixed latent false claims in `themeable-components.md` (Tag/Input
  have no `textColor`); card-grid footer raw-className bug fixed. Bundle 4,162 → 4,179
  (+17). Parked: navbar hue one-off, App.css 77 lines (under cap), css-variables.md trim.

## i02 — first revised-skills run (2026-07-23)

**Total 89/100** (+4) — build 15, adoption 15, prop-fidelity **12** (+4), hallucination 5,
custom-comp 7, theming 10, completeness 15, engagement 10. Build: 12 min, $5.77, 74 turns.

- Metrics: `raw_bulma_classnames` **42→0** (i01 fix landed — Span/Paragraph/Strong now
  imported), `custom_css_added_lines` 77→56 (still decorative backdrops), `tsc_errors=0`,
  `inline=0`, `handrolled=0`, imports 39→51. Faster + cheaper than baseline (127→74 turns,
  $10.55→$5.77) — guidance reduced churn.
- Hallucination mechanism SHIFTED, not gone: i01 variant flags (isLight — did not recur);
  i02 value unions (`Tag size="small"`) + group-prop symmetry (`Tags isCentered`). Root
  cause: shipped .d.ts hides unions behind opaque aliases (TagSize). Spine stuck at 7/10:
  builder read only component-catalog.md from the custom-component skill — SKILL.md (with
  the spine rule) loaded in NEITHER run.
- Improve pass: analogy-ban broadened to value unions/group props (verified facts in
  theming SKILL.md); ~10-line decorative-CSS budget + `.hero-wash`/`.section-alt` few-shot
  in layout SKILL.md; font-loading note (css-variables.md + example — declared families
  silently fall back if not loaded); spine rule added to CLAUDE_MD template (auto-injected
  — only surface guaranteed to reach builders); **generator-level**: catalog header gains
  the alias-grep technique + spine pointer (the catalog was the only custom-component file
  i02 read). Bundle 4,179→4,206 (+27); CLAUDE_MD render 47→50 lines.
- Strategic learning: place facts in surfaces that demonstrably load (SKILL.md on trigger,
  CLAUDE_MD auto-inject, the catalog itself); references read in neither run are dead
  weight for critical facts.

## i03 — second revised-skills run (2026-07-23)

**Total 96/100** (+7) — build 15, adoption 15, prop-fidelity **13** (+1), hallucination
**8** (+3), custom-comp **10** (+3), theming 10, completeness 15, engagement 10.
Build: 12 min, $5.68, 74 turns.

- Metrics: css_added 56→**18** (exactly the two-rule budget few-shot, adopted nearly
  verbatim); rawcls/inline/handrolled all 0 (held); imports 43; 5 skills invoked early
  incl. custom-component via the catalog's new spine pointer → **full spine in all 4
  reusable components** (StatCard/FeatureCard/SectionHeading/BenchmarkBar), callers
  demonstrably pass helper props through it.
- Hallucination: invented APIs **eliminated** (i02's class gone); residual churn = near-miss
  names of real props: `ariaLabel` (real on Icon/Delete/Slider/Carousel, generalized to
  Navbar) + `isFullWidth` (Button) vs `isFullwidth` (Select/Table/File) — a genuine
  library-internal casing inconsistency, now warned about in bestax-form.
- Improve pass (+19 lines, all verified): casing-trap fact (form SKILL.md + api.md);
  ariaLabel-vs-aria-label split stated in icons SKILL.md + stat-card comment;
  `has-navbar-fixed-top` moved to the point of use in archetypes (static-first, replacing
  the classList.add hack the reference itself used to prescribe); headless verify fallback
  line; ~800 KB expected-CSS note + bestax-optimize pointer in layout checklist; CLAUDE_MD
  "match the PM to the lockfile" bullet (scaffold is PM-agnostic by design).
- Flagged for the final report (outside improver surface):
  `create-bestax/src/display.ts` hardcodes `pnpm install` in next-steps despite PM-agnostic
  design; `UnorderedList` lacks a bullet-suppression prop (library API gap, hit i02+i03).

## i04 — third revised-skills run (2026-07-23)

**Total 99/100** (+3) — prop-fidelity **14** (+1, css 18→12), hallucination **10** (+2,
zero error-TS in the whole transcript — casing/aria warnings preempted the last churn
class), all other categories max. Build: 13 min, $6.18, 79 turns, imports 54.

- Adoption deepened: Reveal, Steps, Collapse FAQ, Avatar(s) — 54 named imports, still
  0 handrolled/inline/raw. Builder greps installed .d.ts ~15× before using APIs
  (verify-then-write now the norm). PM-lockfile rule followed first-try.
- Harness artifact found+fixed: orphaned vite dev servers from earlier builders squatted
  :5173 (strictPort) — killed; cleanup sweep added before each launch from i05 on.
- Improve pass (plateau mode, net 0 bundle lines): few-shot compressed so its natural
  transcription is ≤10 CSS lines; sanctioned-exception clause for Bulma companion classes
  (has-navbar-fixed-top) added to the CLAUDE_MD house rule; usePrefixedClassNames declared
  optional for zero-CSS Rung-1 compositions; one flex-values line in layout-components.md.

## i05 — fourth revised-skills run (2026-07-23)

**Total 91/100** (−8) — hallucination **3** (−7: 4 invented APIs, all self-corrected, none
surviving: Collapse active/onToggle, Card.FooterItem as/href, Field message/messageColor,
UnorderedList listStyleType; plus Column size string/number churn); prop-fidelity 13 (css
12→19 — added a redundant body-margin reset; Bulma ships minireset). All else max.
Build: 13 min, $6.46, 86 turns, imports 48.

- STRUCTURAL FINDING: guidance effectiveness depends on which files a run happens to load.
  i03/i04 read the catalog (header carries the sub-part rule) → 10/10 hallucination; i05
  loaded only Skill-invoked SKILL.md bodies + cat'd references — never the catalog or
  custom-component SKILL.md — and one invention (Card.FooterItem) is explicitly warned
  about in the two files it didn't open. Prior fixes held (no isFullwidth/Tag recurrence).
- Improve pass (+14 lines, verified): critical rules moved to ALWAYS-LOADED paths —
  interactive-extras state APIs (Collapse/Tabs/Dropdown/Steps) + bare-UnorderedList-is-
  markerless + no-resets clause into layout SKILL.md; message/messageColor ownership pinned
  in form SKILL.md intro; Column numeric-sizes-are-numbers note at the union definition
  (the reference's own gap rows seeded the confusion); compound-sub-part rule echoed into
  CLAUDE_MD house style (unconditionally injected — immune to loading luck).
