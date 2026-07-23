# Scorecard — skill-loop iteration i01 (baseline, unmodified skills)

| # | Category | Score | Max | Evidence summary |
|---|----------|-------|-----|------------------|
| 1 | Build integrity | 15 | 15 | `build_pass=true`, `tsc_errors=0` (metrics.json — mechanized) |
| 2 | Component adoption | 15 | 15 | `handrolled_total=0`; 39 named imports; every rubric surface uses the library component, incl. real `Table` for benchmarks/pricing and full form kit |
| 3 | Prop fidelity | 8 | 15 | `inline_style_count=0`, no auto-cap, but `raw_bulma_classnames=42` (~30 on Table.Th/Td where `textAlign`/`textColor`/`textWeight` helper props exist) + 77-line App.css |
| 4 | Hallucination penalty | 5 | 10 | Two invented APIs (`Tag isLight` ×3 sites, helper props on `Card.Content`), one tsc round, both self-corrected; zero invented APIs survive in final code |
| 5 | Custom-component conformance | 7 | 10 | 4 custom components are pure library compositions, but reusable `SectionHead`/`CodeSample` skip the spine: no `useBulmaClasses`, no `className` passthrough, no rest spread |
| 6 | Theming approach | 10 | 10 | `Theme isRoot` + `primaryH/S/L`, `linkH/S/L`, `bulmaVars`; dark mode via `Theme colorMode` with working toggle; App.css entirely `--bulma-*`-derived, zero hex |
| 7 | Site completeness | 15 | 15 | All 8 required surfaces present with coherent Netadyne/Skynet/Fable copy, plus bonus Models/Docs/Contact pages and hash routing |
| 8 | Skill & docs engagement | 10 | 10 | 3 relevant skills invoked before any code (layout-scaffold, theming, icons); references read; patterns demonstrably applied |
|   | **Total** | **85** | **100** | |

## Per-category evidence

- **1 — Build integrity (15/15).** Mechanized: `build_pass=true`, `tsc_errors=0`, `result_subtype=success`.
- **2 — Component adoption (15/15).** `handrolled_total=0` across all 9 tracked tags. 39 distinct named imports. Navbar → `SiteNavbar.tsx:33-93` (`Navbar.Brand/Burger/Menu/Start/End`); hero → `Home.tsx:105-185` (`Hero.Body`); benchmarks → `Benchmarks.tsx:55-112` (`Table.Thead/Tbody/Tr/Th/Td`); pricing → `Pricing.tsx:39-115` (`Grid`/`Cell`/`Card`); testimonials → `Home.tsx:412-447` (`Box`/`Media`); forms → `Contact.tsx:134-253` (`Input`/`Select`/`TextArea`/`Checkbox`/`Field`); docs sidebar → `Docs.tsx:188-212` (`Menu`); tabbed code → `CodeSample.tsx:18-33` (`Tabs` + `Pre`); footer → `SiteFooter.tsx:76-158`.
- **3 — Prop fidelity (8/15).** Fails 15-anchor on `raw_bulma_classnames=42` and `custom_css_added_lines=77`. No auto-cap (0 inline styles, 77 ≤ 80). ~30 of 42 are `className="has-text-right"`/`has-text-grey`/`has-text-weight-*` on `Table.Th/Td` (`Benchmarks.tsx:60-100`, `Pricing.tsx:133-163`, `Models.tsx:85-107`, `Docs.tsx:261-293`) although `Td`/`Th` extend `BulmaClassesProps` so `textAlign="right"` etc. existed; rest are utility classes on raw `<span>`/`<p>`/`<a>` where no helper prop exists. App.css does only what helper props can't (gradient hero/CTA, grid texture, sticky footer, alternating sections) — all variable-derived.
- **4 — Hallucination (5/10).** Transcript L276 (`tsc -b`): `Tag isLight` invented at 3 sites; helper props invented on `Card.Content` (`Pricing.tsx(53)`). Both repaired next edits (clean build L287). No silent survivors (Icon `features`, `overflow="clipped"`, `textTransform`, `fontFamily="code"`, Theme HSL props all verified real). Builder proactively grepped `dist/types/*.d.ts` before writing (L53, L68, L107, L120, L146); the `Card.Content` miss was induced by the catalog's false blanket claim (friction #1).
- **5 — Custom-component conformance (7/10).** `SectionHead.tsx:10-24` and `CodeSample.tsx:10-15` declare narrow domain-prop interfaces with no `BulmaClassesProps`, no `className` passthrough, no rest spread — the skill's own `examples/stat-card.tsx` applies the full spine even to a pure composition. Everything else honored (composition-first, zero new component CSS, no inline styles, `--bulma-*`-only CSS, browser + dark-mode verification) → 7.
- **6 — Theming (10/10).** `App.tsx:62-81`: `Theme isRoot colorMode` + HSL trios + `bulmaVars`; working dark/light toggle; `App.css:11-65` derives every color from `--bulma-*`; zero hex anywhere; fixed-color surfaces handled per the theming skill's rule. Both modes screenshot-verified (transcript L423-434).
- **7 — Completeness (15/15).** All 8 surfaces: navbar; hero ("Ten times fewer errors than Fable. On every benchmark."); features; benchmarks vs Fable (Table + Tags + methodology); pricing tiers + per-token table + FAQ; testimonials; CTA + full footer; responsive (`sizeMobile/Tablet/Desktop`, `Grid fixedCols*`, `isMultiline`, `Navbar.Burger`). 6 routed pages via hash routing.
- **8 — Skill & docs engagement (10/10).** Skill invocations at L13 (layout-scaffold), L33 (theming), L36 (icons) — all before the first Write (L111); `bestax-form/references/patterns.md` read via `sed` at L84. Applied: Theme HSL-trio matches `bestax-theming/SKILL.md:26-36,67`; `ConfigProvider iconLibrary="fa"` + FA dep matches `bestax-icons/SKILL.md:19`; landing rhythm from `archetypes.md`. (`claude_md_read=false` is a non-signal — CLAUDE.md is auto-injected; its house rules were visibly followed.)

## Top 5 friction points

1. **The generated catalog's blanket claim is false for `Card.Content`.** `component-catalog.md:13-16` says "Every component also accepts the shared Bulma helper props", but `CardContentProps` extends only `React.HTMLAttributes`. Directly produced the tsc failure at L276 and forced a `className="is-flex is-flex-direction-column is-flex-grow-1"` escape at `Pricing.tsx:53-55`.
2. **No per-component modifier reference for common variants.** No loaded skill lists which components take `isLight`; builder pattern-matched it from Button/Notification onto `Tag` and burned a repair round across 3 call sites.
3. **Table-cell alignment idiom undocumented in what was loaded.** Nothing shows `textAlign`/`textColor`/`textWeight` on `Table.Th/Td`, so the builder wrote `has-text-*` classNames ~30 times — the single largest prop-fidelity leak.
4. **The `bgColor="light"` dark-mode trap wasn't preempted.** Fixed-color light sections shipped; illegibility found via screenshot (L330); the `--bulma-scheme-main-bis` alternating-section token is documented at `css-variables.md:83` — a reference never opened; `archetypes.md` (which WAS read) shows section rhythm without it. Same pattern for navbar selected-item hue (L416).
5. **No story for styling raw inline fragments.** Where no library element exists (no `Span`), builder fell back to `mb-2`, `is-size-7 has-text-grey` etc. on plain `<span>`/`<p>` — the "helper props, never classNames" stance offers no sanctioned alternative at that granularity.

## 3 transcript quotes

1. **Skill front-loading (L14; first code Write not until L111):** "Launching skill: bestax-layout-scaffold" — followed by reads of `layout-components.md`, `archetypes.md`, `examples/landing.tsx` (L24-28) before any app code.
2. **Theming vocabulary applied to a real bug (L330):** "Rendering well, but the `bgColor=\"light\"` sections are a fixed-color surface fighting dark mode — the 'The gap, measured the honest way' heading is nearly invisible. Fixing with a scheme-derived background:"
3. **Verify-in-browser honored across both schemes (L287, L423):** "Build is clean. Let me lint and then look at it in a browser:" … "Now let me verify light mode works, since the whole design has to survive the toggle:"
