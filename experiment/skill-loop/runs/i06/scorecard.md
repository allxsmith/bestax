# Scorecard — skill-loop iteration i06

| # | Category | Score | Max | Evidence summary |
|---|----------|-------|-----|------------------|
| 1 | Build integrity | 15 | 15 | build_pass=true, tsc_errors=0 |
| 2 | Component adoption | 15 | 15 | 51 named imports; handrolled_total=0; no raw div/a/span/h1-h3/img anywhere — footer lists are UnorderedList/ListItem, code samples are Pre |
| 3 | Prop fidelity | 15 | 15 | inline=0, rawcls=0, custom_css_added_lines=10 (site.css: hero-wash + section-alt, var-consuming) — first run at the full-marks anchor |
| 4 | Hallucination penalty | 7 | 10 | Final code clean (~25 risky APIs verified incl. both isFullwidth/isFullWidth casings correct); 2 drafted APIs self-caught PRE-tsc (maxWidth helper on SubTitle; Steps.Item label/details → rewrote to items={[{label}]} after proactive .d.ts grep); 1 tsc round = mechanics (Tabs.Tab missing required index ×2, one-round fix) |
| 5 | Custom-component conformance | 10 | 10 | All 4 reusable components (SectionHeading/StatTile/BenchmarkBar/CodeBlock) full-spine; zero-CSS compositions omit usePrefixedClassNames per the sanctioned exemption |
| 6 | Theming approach | 10 | 10 | ConfigProvider iconLibrary="mdi" + Theme isRoot HSL trios + bulmaVars; colorMode toggle; zero hex |
| 7 | Site completeness | 15 | 15 | 8/8 + Models/Docs/Safety pages; Tabs-filtered 10-row benchmark Table + Progress pairs; arithmetically consistent 10x framing; validated Contact form |
| 8 | Skill & docs engagement | 10 | 10 | ls .claude/skills was tool call #2; 3 Skill invocations + 7 reads across 5 skills BEFORE first source write ("Everything I need is loaded. Building the site now."); catalog deep cuts (Steps/Collapse/Reveal/IconText) |
|   | **Total** | **97** | **100** | |

## Top 5 friction points

1. **Steps app-facing API under-specified in loaded material** — drafted plausible `<Steps.Item label details>`; real API is `items={[{label}]}` — discovered via .d.ts grep (225→239). One usage snippet would have prevented the session's only invention.
2. **Tabs.Tab requires `index`** — the session's only tsc failure (2× TS2741); surfaced nowhere the builder looked.
3. **Reveal cascade semantics vs Grid** — wrapped whole Grid first, restructured to per-Cell delay after output inspection (366-370).
4. **Form convenience `label` prop doesn't wire htmlFor/id** — discovered by grepping dist (325-339); compensated with aria-label duplication. Real library a11y trap the form skill never mentions. LIBRARY-LEVEL FLAG for final report.
5. **No browser tooling** (ToolSearch at 292 found none) — SSR renderToStaticMarkup smoke over 7 pages + curl; visuals shipped unverified. Harness-level.

## 3 transcript quotes

1. Line 27: "Base directory for this skill: …/.claude/skills/bestax-layout-scaffold — # Scaffolding a page layout with @allxsmith/bestax-bulma".
2. Line 107 (after 3 invocations + 4 reads, before first Write): "Everything I need is loaded. Building the site now."
3. Line 299: "No browser tool here, so I'll do a server-render smoke test to catch runtime errors, then boot the dev server."
