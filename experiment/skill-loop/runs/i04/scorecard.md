# Scorecard — skill-loop iteration i04

| # | Category | Score | Max | Evidence summary |
|---|----------|-------|-----|------------------|
| 1 | Build integrity | 15 | 15 | build_pass=true, tsc_errors=0 (mechanized) |
| 2 | Component adoption | 15 | 15 | 54 distinct named imports; handrolled_total=0; every rubric surface library-built; deep cuts: Reveal, Steps, Collapse FAQ, Menu, Tabs, Progress, Media+Avatar(s) |
| 3 | Prop fidelity | 14 | 15 | inline=0, rawcls=0; custom_css_added_lines=12 (2 over the ≤10 anchor); both App.css rules --bulma-*-derived |
| 4 | Hallucination penalty | 10 | 10 | 0 error TS, 0 "not assignable"; only 3 Edits, all refinements; ~20 risky props verified real vs bulma-ui/src; string-typed FA icon names all exist in FA free 7.3.1 |
| 5 | Custom-component conformance | 10 | 10 | StatCard + SectionHeading carry the full spine (Omit+BulmaClassesProps, useBulmaClasses, classNames merge, className passthrough, ...rest); usePrefixedClassNames omitted — inert at Rung 1 (no CSS targets a root class) |
| 6 | Theming approach | 10 | 10 | Theme isRoot HSL trios + bulmaVars + working colorMode toggle; zero hex in src (grep-verified) |
| 7 | Site completeness | 15 | 15 | 8/8 surfaces across 7 pages; "Ten times the model" hero; 7-suite benchmark table + Progress viz + methodology; pricing + rate table + Collapse FAQ; Media/Avatar testimonials; content.ts 403 lines with fictional-figures disclaimer |
| 8 | Skill & docs engagement | 10 | 10 | 4 Skill invocations before any code (13/32/33/56); 7 reference files read; Theme trios, StatCard-mirrors-example, iconLibrary="fa" + lockfile rule followed; headless renderToString smoke per the skill's fallback |
|   | **Total** | **99** | **100** | |

## Key evidence

- Cat 3: App.css:3-9 hero radial wash from --bulma-link-h/s; :10-12 .section-alt on --bulma-scheme-main-bis — decorative, theme-derived, dark-mode-safe, not expressible via helper props. has-navbar-fixed-top on <html> (index.html:2) is Bulma's documented companion class, not an escape hatch. 2 trivial lines over budget → 14.
- Cat 4: builder pre-empted hallucination by grepping installed .d.ts/index.esm.js ~15 times (transcript 133-219) before using APIs — verify-then-write. Props verified real incl. Progress color="grey-light", Button color="text", radius="radiusless", Collapse trigger, Reveal animation="fade-up", Steps hasMarker/showStepNumbers, Avatar name/initials/size, Menu.Item active/as/href, Icon variant/ariaLabel.
- Cat 8: claude_md_read=false is the auto-inject artifact; every house rule observably followed (no inline style, no utility classNames, Span/Paragraph/Strong wrappers, gap only on Grid/Columns, PM matched to lockfile via pnpm).

## Top 5 friction points

1. **No sanctioned recipe for decorative section treatments** — the only lost point: hero wash + section band cost 12 lines; no skill offers a ≤10-line pattern for marketing-page section alternation (--bulma-scheme-main-bis unreachable via helper props).
2. **Helper-prop value unions require node_modules spelunking** — ~15 greps against dist/*.d.ts to confirm values (validJustifyContents, validAlignItems, Table subcomponent exports). Produces clean results but means references don't carry (or aren't trusted to carry) compact valid-value tables.
3. **Navbar fixed="top" companion class** — builder correctly hand-added has-navbar-fixed-top to <html>, which superficially violates the "never hand-write Bulma classes" house rule; stated nowhere in loaded guidance (needs a sanctioned-exception line where the rule lives).
4. **.claude/launch.json pinned port 5173 collided** with an existing process (orphaned dev server from a prior harness iteration — harness artifact, not model error); dev server started twice, final report notes "used 5178".
5. **Spine ambiguity for zero-CSS compositions** — canonical spine includes usePrefixedClassNames; both custom components reasonably drop it at Rung 1; the skill never says the root class is optional there. (Related: custom-component SKILL.md never invoked — pattern arrived via example file + CLAUDE.md pointer, which sufficed.)

## 3 transcript quotes

1. Line 3 (first assistant message): "I'll start by exploring the project structure and the relevant skills." — four Skill invocations before any code.
2. Line 180 (after grepping validJustifyContents/validAlignItems from the package): "Now fixing the height helper and continuing with the remaining pages." — verify-then-write.
3. Line 324 (final report, honest about headless limits): "I owe you a visual pass. No browser automation is available in this environment, so I checked structure by grepping the rendered HTML rather than looking at it."
