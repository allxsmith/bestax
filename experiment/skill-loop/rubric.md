# Skill-Loop Grading Rubric (FROZEN — never edit after iteration 0)

Grade the app produced by the incognito builder against this rubric. Total: 100 points.
Mechanized metrics in `metrics.json` are ground truth where referenced — a grader may not
contradict them. Score each category with the anchors; interpolate only between adjacent
anchors, and state the evidence (file:line or transcript event) for every deduction.

## 1. Build integrity — 15 pts   [mechanized]

Scored directly from metrics.json.

- 15: `build_pass=true` and `tsc_errors=0`.
- 8:  tsc has 1–5 errors OR vite build fails but the app is dev-renderable (src parses,
      imports resolve).
- 0:  >5 tsc errors, or build and typecheck both fail, or app is skeletal/unmodified.

## 2. Component adoption — 15 pts

Did it use the library's components (87 in the catalog) instead of hand-rolling HTML/CSS
equivalents? Judge `src/**/*.tsx` against metrics `bestax_named_imports` and
`handrolled_tags`.

- 15: Every UI surface with a library equivalent uses it (Navbar, Hero, Columns/Grid, Card,
      Table, Button, Section, Footer, Tag/Notification, form controls...);
      `handrolled_tags` ≈ 0.
- 8:  Mostly library components, but 1–3 surfaces hand-rolled where an equivalent exists
      (e.g. raw `<table>` for benchmarks, raw `<nav>`, pricing cards built from divs).
- 0:  Site is substantially raw JSX/HTML with bestax used only incidentally (<10 distinct
      library components).

## 3. Prop fidelity — 15 pts

Helper props (`color`, `size`, `m*`/`p*` spacing, `textAlign`, `textWeight`, `textColor`,
`bgColor`, viewport modifiers) vs escape hatches.

- 15: `inline_style_count=0`, `custom_css_added_lines<=10` (trivial),
      `raw_bulma_classnames=0`; spacing/color/alignment done via helper props.
- 8:  Scattered escapes: 1–5 inline `style={{}}`, or one small custom .css file, or a
      handful of `className="is-*/has-*"` utility strings where a helper prop exists.
- 0:  Systematic escapes: >5 inline styles, or a custom stylesheet doing what helper props
      or Theme do, or pervasive raw Bulma utility classNames.

Auto-cap: if `inline_style_count>5` or `custom_css_added_lines>80`, score ≤ 8.

## 4. Hallucination penalty — 10 pts (start at 10, deduct)

Invented components, props, or APIs. tsc errors mentioning unknown exports/props are the
primary signal; also count silent ones (props that typecheck as ignored, or wrong string
values) found by inspection.

- 10: Zero invented imports/props in the final code AND no transcript churn from inventing
      then repairing APIs.
- 5:  1–2 invented APIs that were self-corrected after a tsc/docs check, or one surviving
      invalid prop value in final code.
- 0:  ≥3 invented APIs, or final code still imports non-existent components.

## 5. Custom-component conformance — 10 pts

Any NEW reusable component must follow the bestax spine (per the bestax-custom-component
skill): `useBulmaClasses` to consume helper props, `usePrefixedClassNames`/classNames
composition, `className` passthrough, rest-prop spread.

- 10: All custom components follow the spine (or the site legitimately needed none and
      composed library primitives inline — score 10, note "N/A-composed").
- 5:  Custom components exist and accept some helper props but skip the spine (hardcoded
      class strings, no passthrough).
- 0:  Custom components are plain styled JSX ignoring the pattern entirely.

## 6. Theming approach — 10 pts

- 10: Brand identity via `Theme` / `ConfigProvider` / `--bulma-*` variables (isRoot or
      scoped); dark mode intent, if attempted, via `Theme colorMode`; zero hardcoded hex
      in JSX/CSS for things the variables cover.
- 5:  Some Theme/variable use but mixed with hardcoded colors or ad-hoc CSS overrides.
- 0:  No Theme usage; colors hardcoded or restyled via custom CSS.

## 7. Site completeness (SaaS brief) — 15 pts

Required surfaces for the brief: (a) navbar, (b) hero selling Skynet, (c) features,
(d) benchmarks/comparison vs Fable (table or equivalent, "10x" claim represented),
(e) pricing, (f) testimonials/social proof, (g) CTA + footer, (h) responsive behavior
(Columns/Grid breakpoints or viewport props — judged from code, not a browser).

- 15: ≥7 of 8 present and coherent with plausible copy (Netadyne/Skynet/Fable naming used).
- 8:  4–6 present, or all present but skeletal (lorem-level copy, empty sections).
- 0:  ≤3 present (hero-only landing).

## 8. Skill & docs engagement — 10 pts   [mechanized + transcript]

From metrics `skill_file_reads`, `claude_md_read`, `docs_fetches` and transcript review.

- 10: Read CLAUDE.md early, loaded ≥2 relevant skills (layout-scaffold/theming at minimum
      for this brief) and demonstrably applied them (patterns from references appear in
      code).
- 5:  Read some guidance but late/partially, or read it and visibly ignored it.
- 0:  Never opened CLAUDE.md or any skill.

## Scorecard format (grader must emit exactly this)

```
| # | Category | Score | Max | Evidence summary |
|---|----------|-------|-----|------------------|
| 1 | Build integrity | … | 15 | … |
| 2 | Component adoption | … | 15 | … |
| 3 | Prop fidelity | … | 15 | … |
| 4 | Hallucination penalty | … | 10 | … |
| 5 | Custom-component conformance | … | 10 | … |
| 6 | Theming approach | … | 10 | … |
| 7 | Site completeness | … | 15 | … |
| 8 | Skill & docs engagement | … | 10 | … |
|   | **Total** | … | **100** | |
```

Followed by: per-category evidence bullets (file:line / transcript refs), **top 5 friction
points** observed (what guidance was missing/wrong/ignored), and **3 transcript quotes**
showing skill engagement or its absence.
