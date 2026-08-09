# Scorecard — skill-loop iteration i02

| #   | Category                     | Score  | Max     | Evidence summary                                                                                                                           |
| --- | ---------------------------- | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Build integrity              | 15     | 15      | metrics: build_pass=true, tsc_errors=0                                                                                                     |
| 2   | Component adoption           | 15     | 15      | handrolled_total=0; 51 distinct bestax imports; every rubric surface uses library components                                               |
| 3   | Prop fidelity                | 12     | 15      | inline_style_count=0, raw_bulma_classnames=0, but custom_css_added_lines=56 (>10); all 56 lines var-driven with no helper-prop equivalent  |
| 4   | Hallucination penalty        | 5      | 10      | 2 invented APIs (`Tag size="small"`, `Tags isCentered`) self-corrected after one tsc round; zero surviving in final code                   |
| 5   | Custom-component conformance | 7      | 10      | Pure compositions, zero hardcoded class strings, but reused BenchmarkBar skips the spine (no BulmaClassesProps/className/rest passthrough) |
| 6   | Theming approach             | 10     | 10      | Theme isRoot + HSL props + bulmaVars; colorMode dark/light toggle; zero hardcoded hex; CSS consumes only --bulma-* vars                    |
| 7   | Site completeness            | 15     | 15      | 8/8 surfaces present with coherent Netadyne/Skynet/Fable copy; 10x claim derived programmatically                                          |
| 8   | Skill & docs engagement      | 10     | 10      | 3 skills invoked before any code (events 13/31/45), 5+ reference files read, patterns demonstrably applied                                 |
|     | **Total**                    | **89** | **100** |                                                                                                                                            |

## Per-category evidence

- **1 (15/15, mechanized)** — `build_pass=true`, `tsc_errors=0`; event 273 shows `tsc -b && vite build` green plus eslint clean.
- **2 (15/15)** — `handrolled_total=0`, `bestax_named_imports=51`. Navbar (`SiteNavbar.tsx:37`), Hero (`HomePage.tsx:51`), Grid/Cell stat row (`HomePage.tsx:127`), Card lineup (`HomePage.tsx:207`), real Table family for benchmarks (`BenchmarksPage.tsx:130`), full form stack (`ContactPage.tsx:141-246`), Menu sidebar (`DocsPage.tsx:163`), Tabs (`BenchmarksPage.tsx:119`), Progress meters (`BenchmarkBar.tsx:85`), Footer (`SiteFooter.tsx:60`). Remaining raw elements (`<form>`, `<option>`, `<p>`/`<ol>` inside Content) have no library equivalent or are Content's designed idiom.
- **3 (12/15)** — Deduction solely for `custom_css_added_lines=56` (`index.css:1-60`), above the ≤10 bar. Mitigating: zero inline styles, zero raw Bulma classNames (mechanized), every rule consumes `--bulma-*` vars (scheme bands, hsl() from `--bulma-primary-h/s`, `--bulma-border-weak` grid) — rung 2 of the styling ladder with commented rationale rejecting `bgColor="light"` (`index.css:6-8`). `.link-list` forced — `UnorderedList` has no bullet-suppression prop. Centralized principled escape, not scattered → 12.
- **4 (5/10)** — One tsc round (event 261): 4 errors, 2 root causes — `Tag size="small"` ×3 (valid union `'normal'|'medium'|'large'`, `Tag.tsx:23`) and `Tags isCentered` (nonexistent; Tags has only hasAddons/isMultiline). Self-corrected after checking `Tags.d.ts` (event 265); final fix uses `justifyContent="center"` (`HomePage.tsx:156`). All other final-code APIs verified real against bulma-ui/src — no silent hallucinations.
- **5 (7/10)** — Custom components (SiteNavbar, SiteFooter, BenchmarkBar+Series, PlanCard) are exemplary compositions with zero custom styling and zero hardcoded class strings. But BenchmarkBar is genuinely reusable (two pages, showBlurb variant) and skips the spine mandated by `SKILL.md:61-63` for "every reusable component — including pure compositions": no BulmaClassesProps, no className merge, no rest spread.
- **6 (10/10)** — `App.tsx:34-56`: Theme isRoot with HSL triplets + bulmaVars (radius/fonts); colorMode toggle persisted to localStorage; zero hex in tsx/ts; index.css all var-derived (the `#000` at :46 is a mask alpha ramp).
- **7 (15/15)** — All 8 surfaces; benchmarks as Table + Progress bars with "10×" framed as 10x-fewer-errors and a published derivation rule (`content.ts:22-23`); pricing with annual toggle + token table + FAQs; 3 named testimonials; responsive via sizeMobile/Tablet/Desktop, fixedCols*, Level isMobile, Table isResponsive, burger.
- **8 (10/10)** — Skills invoked before any app code: layout-scaffold (13), theming (31), form (45); reads incl. layout-components.md, landing.tsx, icons SKILL.md, component-catalog.md, icon-libraries.md grep (58). Applied: ConfigProvider iconLibrary="fa" + FA package per icons skill, Theme HSL pattern, field-wrapper form props, landing archetype. CLAUDE.md house rules visibly followed.

## Top 5 friction points

1. **Shipped `.d.ts` hides valid prop values behind aliases.** Builder proactively grepped `Tag.d.ts` (event 83) but got `size?: TagSize;` — opaque — while `Progress.d.ts` in the same output showed literal unions; it pattern-matched "small" onto Tag and lost a repair round. No loaded reference documents Tag's sizes (catalog is one-liners, no prop-value tables).
2. **No guidance for centering a `Tags` group.** Buttons has isCentered, Tags doesn't; builder assumed symmetry, tsc failed, fix (`justifyContent="center"`) discovered mid-repair from Tags.d.ts. One reference line would prevent the round-trip.
3. **No sanctioned pattern for decorative hero backdrops/section banding.** Landing example offers a plain Hero; visual distinctiveness forced 56 lines of custom CSS — executed exactly per the rung-2 ladder but it still ate the prop-fidelity budget. The skills offer no helper-prop or Theme-level route to this common marketing-site need.
4. **The custom-component spine rule never reached the builder.** It read only `component-catalog.md` from that skill — not SKILL.md/patterns.md — so BenchmarkBar shipped spineless. The catalog reference doesn't mention the spine exists.
5. **Theme typography vars declared but fonts never loaded.** bulmaVars sets `--bulma-family-primary: 'Inter'` / code: 'JetBrains Mono' (`App.tsx:52-55`) but nothing loads those fonts (index.html has no font links) — silent fallback to system-ui. No skill connects Theme font variables to shipping the font.

## 3 transcript quotes

1. Event 13, first substantive action after listing the scaffold: `Skill -> {'skill': 'bestax-layout-scaffold'}` (then bestax-theming at 31, bestax-form at 45).
2. Event 58, grounding icon setup in the skill reference: `grep -n -A 12 -i "font awesome" .claude/skills/bestax-icons/references/icon-libraries.md` — immediately followed by `pnpm add @fortawesome/fontawesome-free` and `ConfigProvider iconLibrary="fa"`.
3. Event 265, repair turn checks the real API before fixing: `grep -nE "^\s+[a-zA-Z]+\??:" node_modules/@allxsmith/bestax-bulma/dist/types/elements/Tags.d.ts` then `sed` removing `size="small"`.
