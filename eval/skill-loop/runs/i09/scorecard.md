# Scorecard — skill-loop iteration i09

| #   | Category                     | Score  | Max     | Evidence summary                                                                                                                                                                                              |
| --- | ---------------------------- | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Build integrity              | 15     | 15      | build_pass=true, tsc_errors=0; vite preview booted + curled 200                                                                                                                                               |
| 2   | Component adoption           | 15     | 15      | 46 imports; handrolled_total=1 is a FALSE POSITIVE — `<button` in a JSX comment (SiteNavbar.tsx:73) whose adjacent code correctly uses Button as="a"; zero actual raw tags with equivalents                   |
| 3   | Prop fidelity                | 14     | 15      | inline=0, rawcls=0; css=12 (> ≤10 by 2; 2 of 12 are comments; replaced 4 scaffold lines, css_files_added=0; both rules --bulma-*-derived)                                                                     |
| 4   | Hallucination penalty        | 10     | 10      | Zero invented APIs; 3 error-TS matches all mechanics: TS5083 stale tsc-buildinfo after pnpm add (~7 events to diagnose) + TS6133 unused import ×2 (one import, reported twice); ~30 risky props verified real |
| 5   | Custom-component conformance | 10     | 10      | StatTile spine verbatim from stat-card.tsx; zero-CSS waiver applies; featured ring via sanctioned scoped Theme bulmaVars                                                                                      |
| 6   | Theming approach             | 10     | 10      | Theme isRoot HSL channels (violet 258), colorMode toggle, bulmaVars radius; zero hex; wash re-themes from --bulma-primary-h/s                                                                                 |
| 7   | Site completeness            | 15     | 15      | 8/8 + Models/Contact; advantage() computed not hand-typed; fictional-comparison disclaimer                                                                                                                    |
| 8   | Skill & docs engagement      | 10     | 10      | 4 skills invoked before any code + 7 reads; has-navbar-fixed-top per SKILL.md:59; no-gap-helper rule cited in a comment; headless SSR fallback per custom-component skill                                     |
|     | **Total**                    | **99** | **100** |                                                                                                                                                                                                               |

## Top 5 friction points

1. **Prop-level detail missing from references → .d.ts spelunking** (Table/Tag/Progress/Collapse/Reveal props read from dist/types). Recurring since i01; check-then-use works but is verbose.
2. **Decorative wash/band remains the only route** (12 lines incl. 2 comments; helper props would break dark mode). Structural floor of the frozen rubric.
3. **tsc -b stale buildinfo after pnpm add (TS5083)** cost ~7 diagnosis events; `tsconfig.tsbuildinfo` left committed — SCAFFOLD FLAG: template .gitignore doesn't exclude it.
4. **No site-level headless-verification recipe** — improvised whole-site SSR smoke + vite preview + curl again; component-level fallback exists, site-level doesn't.
5. **Metrics false positive**: handrolled-tag counter matches tags inside JSX comments — penalizes exactly the rationale comments the skills encourage. HARNESS FLAG.

## 3 transcript quotes

1. Event 33→42: "Launching skill: bestax-layout-scaffold" → layout-components.md, archetypes.md, landing.tsx reads; sequence repeats for theming/icons/form before first page write.
2. Event 307: "No browser-automation tool is available in this session — only WebFetch, which won't execute the SPA's JS. I've already done a full SSR render of every page (real component tree, not just types) plus a clean production build."
3. Event 310: "The build is verified end-to-end. Let me record one project memory about the browser-verification gap, then summarize."
