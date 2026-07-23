# Scorecard — skill-loop iteration i03

| # | Category | Score | Max | Evidence summary |
|---|----------|-------|-----|------------------|
| 1 | Build integrity | 15 | 15 | metrics: build_pass=true, tsc_errors=0; vite build + eslint clean in transcript |
| 2 | Component adoption | 15 | 15 | 39 distinct library components, handrolled_total=0; every surface (nav, hero, tables, tabs, forms, footer) is library-built |
| 3 | Prop fidelity | 13 | 15 | inline_style=0, raw_bulma_classnames=0, but custom_css_added_lines=18 exceeds the ≤10 "trivial" anchor |
| 4 | Hallucination penalty | 8 | 10 | Zero invented APIs in final code (all verified vs bulma-ui/src); one tsc round repaired 2 prop-name slips (ariaLabel, isFullWidth-on-Select) |
| 5 | Custom-component conformance | 10 | 10 | All 4 reusable components implement the full spine: BulmaClassesProps, useBulmaClasses, usePrefixedClassNames, className merge, ...rest spread |
| 6 | Theming approach | 10 | 10 | Theme isRoot + HSL channel props + colorMode toggle; zero hardcoded hex; the 2 CSS rules derive from --bulma-* variables |
| 7 | Site completeness | 15 | 15 | 8 of 8 surfaces, 7 routed pages, coherent Netadyne/Skynet/Fable copy, 10x claim framed as residual error |
| 8 | Skill & docs engagement | 10 | 10 | 5 relevant skills invoked early (before any Write), 4 reference/example files read, patterns demonstrably applied; CLAUDE.md rules visibly enforced |
|   | **Total** | **96** | **100** | |

## Per-category evidence

**1 (15/15, mechanized)** — build_pass=true, tsc_errors=0. Line 238: `npx eslint . && npm run build` succeed; line 269 re-runs `tsc -b && eslint` → CLEAN.

**2 (15/15)** — 43 named imports, handrolled_total=0. Benchmarks: real `Table` compound (`BenchmarksPage.tsx:131-172`) with Tabs-driven table⇄bars toggle; bar widths via `Progress` (`BenchmarkBar.tsx:112`). Forms: Input/Select/TextArea/Checkbox with label/message/messageColor field API (`ContactPage.tsx:155-256`). Raw HTML confined to legitimate slots (`<option>` inside Select, `<form>`, `<ul>/<li>` inside Content; UnorderedList/ListItem used standalone in `SiteFooter.tsx:74-82`).

**3 (13/15)** — inline=0, rawcls=0; helper props throughout (mb, p, textAlign, textColor, flexGrow, sizeTablet/Desktop). Deduction: custom_css_added_lines=18 exceeds ≤10. Mitigating: exactly two rules (hero gradient wash + scheme-main-bis band), both `--bulma-*`-derived, neither expressible via helper props (verified: backgroundColor validColors has no scheme-main-bis; no gradient helper). Rung-2 ladder done as prescribed; overage is line count, not an escape hatch.

**4 (8/10)** — zero invented APIs in final code (Theme HSL channels, Tabs value/onChange/toggle/boxed, Input field API, Grid isFixed/fixedCols*/gap, Box hasShadow, Table isResponsive, Navbar fixed, Button color="text", Notification onDelete/isLight, Media.Left/Content, Divider/Pre/IconText — all verified real). One tsc round (line 230): `ariaLabel` on Navbar (should be aria-label) and `isFullWidth` on Select (Select uses `isFullwidth`; Button legitimately uses `isFullWidth` — library-internal casing trap). Both self-corrected in one pass, Button's casing correctly preserved. Near-miss names of real props ≠ invented APIs → 8.

**5 (10/10)** — all four exported reusable components (StatCard, FeatureCard, SectionHeading, BenchmarkBar) implement the complete spine: `extends Omit<HTMLAttributes,'color'>, Omit<BulmaClassesProps,'color'>`; `useBulmaClasses(props)`; `usePrefixedClassNames`; `classNames(main, bulmaHelperClasses, className)`; `{...rest}` on root (e.g. `StatCard.tsx:33-44`). Consumption is real: callers pass `flexGrow="1"` (`HomePage.tsx:105`), `mb="6"` (119) and they land as classes. SiteNav/SiteFooter are single-use chrome with domain props — spine not required.

**6 (10/10)** — ConfigProvider + Theme isRoot HSL channels (`App.tsx:35-48`); colorMode toggle (`SiteNav.tsx:54-67`); zero hardcoded hex; only CSS colors are hsl(var(--bulma-primary-h)…) compositions and var(--bulma-scheme-main-bis) (`App.css:6,11,17`).

**7 (15/15)** — all 8 surfaces, none skeletal: fixed navbar + burger + `has-navbar-fixed-top` on `<html>` with explanatory comment (`index.html:2-3`); hero "Ten times better than Fable. On every benchmark."; 6 features + 6 capabilities; 14-benchmark Table + Progress view with per-row "Nx fewer errors" Tags and a Message explaining the 10x-as-residual-error framing (`BenchmarksPage.tsx:93-105`); 3 plans + token table + 6 FAQs; 3 testimonials via Media; repeated CTAs + full Footer; responsive via Grid fixedCols*/Column sizeTablet/Desktop/Table isResponsive/Level isMobile. Bonus: platform/company/contact pages, hash routing, honest "illustrative data" notices.

**8 (10/10)** — skill_invocations=5, skill_file_reads=6. All five relevant skills invoked early: layout-scaffold at line 26 of 326 (first Write at 154), theming (42), icons (46), form (76), custom-component (87); reads: archetypes.md, layout-components.md, landing.tsx, stat-card.tsx. Spine mirrors stat-card.tsx adapted, not copied; ConfigProvider iconLibrary="fa" per archetypes verbatim; FA installed per icons skill. Verified APIs against dist/types .d.ts before writing (lines 55-82) — docs_fetches=0 compensated. Final self-audit grep for style={{/raw classNames (line 322); summary section headed "Per CLAUDE.md and the skills" (324).

## Top 5 friction points

1. **`isFullWidth` vs `isFullwidth` casing trap cost the only repair round.** Button exposes `isFullWidth`; Select/Table expose `isFullwidth`. Builder applied Button's casing to Select → TS2322. Nothing in the loaded skills (notably bestax-form) warns about this library-internal inconsistency.
2. **The skills disagree on aria labeling, seeding the `ariaLabel` slip.** stat-card.tsx uses an `ariaLabel` prop on Icon while archetypes.md shows `aria-label="menu"` on Navbar.Burger; builder generalized `ariaLabel` to Navbar, where it doesn't exist.
3. **Fixed-navbar offset undocumented where fixed="top" is prescribed.** Archetypes prescribe `Navbar fixed="top"` without the required `has-navbar-fixed-top` on `<html>`; builder discovered late, shipped a useEffect DOM hack, then refactored to index.html (lines 267→263) — two extra iterations for a one-line fact.
4. **No browser in the harness leaves "verify in the browser" unfulfillable.** Builder improvised an SSR smoke render of all 7 pages + class greps (285-299) and flagged "I have no browser tool here" — visual regressions (wash legibility, dark-mode contrast) unverified.
5. **Package-manager ambiguity.** `npm install @fortawesome/fontawesome-free` failed against the scaffold's lockfile; fell back to `pnpm add` (54→63); nothing states which PM the created app expects. (Related: builder itself flagged 899 kB raw CSS and pointed at bestax-optimize only post-hoc.)

## 3 transcript quotes

1. Line 161 (before writing components): "Now the reusable components (each with the library's spine):"
2. Line 324 (final summary): "Per CLAUDE.md and the skills: `ConfigProvider iconLibrary=\"fa\"` + `Theme isRoot` at the root — indigo primary / cyan link via HSL trios, `colorMode` pinned (never `system`) with a light/dark toggle in the navbar."
3. Line 322 (final self-audit): `grep -rn "style={{\|className=\"has-\|className=\"is-" src/ | grep -v "hero-wash\|section-alt"` → "Zero inline style={{}}, zero hand-written Bulma utility classes; decorative CSS is 2 rules (hero wash + section band), all --bulma-*-derived."
