# Scorecard — skill-loop iteration i10 (final measured run)

| # | Category | Score | Max | Evidence summary |
|---|----------|-------|-----|------------------|
| 1 | Build integrity | 15 | 15 | build_pass=true, tsc_errors=0 |
| 2 | Component adoption | 15 | 15 | handrolled_total=0; 34 imports; all 8 surfaces library-composed; only raw elements have no equivalent (<form>, grouping <div>, <br/>) |
| 3 | Prop fidelity | 15 | 15 | inline=0, rawcls=0, css=10 EXACTLY at the anchor (two var-consuming rules); has-navbar-fixed-top via the sanctioned exception |
| 4 | Hallucination penalty | 4 | 10 | 2 invented props with tsc churn (Tag isLight ×5 sites, Title spaced→isSpaced), both self-corrected; PLUS 1 SURVIVING silent no-op: Progress color="grey" (typechecks, emits is-grey, no .progress.is-grey rule ships — Fable bar renders default-styled) |
| 5 | Custom-component conformance | 10 | 10 | N/A-composed (prop-less section components; Tier takes one data prop); featured ring via sanctioned scoped Theme bulmaVars |
| 6 | Theming approach | 10 | 10 | Theme isRoot colorMode="dark" + primaryH/S/L; site.css derives from --bulma-primary-h/s + scheme-main-bis; zero hex |
| 7 | Site completeness | 15 | 15 | 8/8 incl. "Where 10x is literal" table, waitlist CTA with validated email + success Notification |
| 8 | Skill & docs engagement | 9 | 10 | 10 file reads (cat/sed, no Skill-tool invocations) before first component write; patterns applied; −1: theming SKILL.md's pointer to themeable-components.md was read TWICE but the truth table never opened — it pre-documents BOTH cat-4 defects verbatim ("no isLight" for Tag; "greys typecheck, no CSS" naming .progress.is-grey) |
|   | **Total** | **93** | **100** | |

## Top 5 friction points

1. **The theming truth table is one hop too far** — read the pointer twice, needed exactly that data twice, guessed both times. Both misses pre-documented in the pointed-to file.
2. **Progress absent from layout-components.md** — builder grepped for "Level|Progress|Table|Hero"; Progress has zero mentions anywhere in layout-scaffold despite landing archetypes naturally needing it.
3. **Progress color type over-promises** (17 validColors vs ~11 with shipped CSS) — LIBRARY FLAG: narrowed per-component unions would let tsc catch this like it caught Tag isLight.
4. **Tag isLight asymmetry invites the guess** — Bulma CSS itself ships .tag.is-primary.is-light and Button/Notification expose isLight; the only warning lives in the unread truth table.
5. **Navbar-CTA nested-anchor hazard untaught** — Navbar.Item defaults to <a>; wrapping Button href nests anchors; builder self-discovered as="div" fix from .d.ts (turns 195-204).

## 3 transcript quotes

1. Turn 41: "Let me quickly check the theming skill for the Theme API (custom primary + color mode), then build."
2. Turn 63: "Let me grab the Level/Progress/Table props and the form input onChange pattern." (lookup came back empty for Progress)
3. Turn 203: "Navbar.Item defaults to <a>, so wrapping a Button in it nests anchors. Let me render that item as a div:"
