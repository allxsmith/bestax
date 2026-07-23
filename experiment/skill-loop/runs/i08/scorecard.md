# Scorecard — skill-loop iteration i08

| # | Category | Score | Max | Evidence summary |
|---|----------|-------|-----|------------------|
| 1 | Build integrity | 15 | 15 | build_pass=true, tsc_errors=0 |
| 2 | Component adoption | 15 | 15 | handrolled_total=0; 46 imports; deep cuts: Tabs compound, Steps (mobileMode="compact"), Collapse, Reveal, IconText/Level/Divider/Pre |
| 3 | Prop fidelity | 13 | 15 | inline=0, rawcls=0; custom_css_added_lines=13 > ≤10 gate — but 3 of 13 are comment lines; two rules var-derived, not prop-expressible; has-navbar-fixed-top on <html> is the documented companion, not an escape |
| 4 | Hallucination penalty | 10 | 10 | Zero invented APIs; check-then-use throughout (validVisibilities grepped BEFORE the invisible-Tag edit); zero error TS; lone "Cannot find" was the builder's own SSR harness mispath |
| 5 | Custom-component conformance | 10 | 10 | StatCard + BenchmarkBar full-spine (zero-CSS waiver applies); featured ring via the sanctioned scoped Theme bulmaVars pattern (--bulma-card-shadow from --bulma-primary) |
| 6 | Theming approach | 10 | 10 | ConfigProvider + Theme isRoot colorMode, HSL trios + bulmaVars radius; dark-first with working toggle; zero hex |
| 7 | Site completeness | 15 | 15 | 8/8 over 5 pages; benchmark Table with Tfoot mean row + Progress charts + methodology tab; residual-error 10x framing |
| 8 | Skill & docs engagement | 10 | 10 | 4 invocations + 5 reads all before first Write; FA wired per icons skill; StatCard mirrors the worked example; pnpm matched to lockfile |
|   | **Total** | **98** | **100** | |

## Top 5 friction points

1. **cwd resets broke relative skill-reference reads** — `cd .claude/skills/... && cat references/...` then bare retry; 2 wasted round-trips. Harness/environment behavior; a "use absolute paths" nudge would help.
2. **No valid-values tables for helper props** — ~6 dist-types greps (validVisibilities etc.). Check-then-use works but is verbose.
3. **has-navbar-fixed-top discovered via SSR smoke, not guidance** — despite the i06 point-of-use note in archetypes App-shell skeleton; i08 built from the landing/marketing path. Placement/coverage gap between archetypes.
4. **No sanctioned headless-verification recipe** — improvised vite SSR build + hand-shimmed globals (~6 calls incl. a /tmp mispath); ended honest: "I verified the DOM but haven't *looked* at the rendered pages."
5. **No zero-CSS route for the scheme-aware alternating band** — bgColor has no scheme values; Section registers no background var. LIBRARY-LEVEL FLAG (recurring since i02); .section-alt CSS remains the only route and is what costs the ≤10 gate (with comments counted).

## 3 transcript quotes

1. Second tool call: `cat package.json && ls .claude/skills/` → Skill: bestax-layout-scaffold → archetypes.md read (16:50:10-16).
2. Check-then-use: grep validVisibilities from bulmaClassHelpers.d.ts → ["hidden","sr-only","invisible"] → immediately the visibility={...'invisible'} edit (268-270).
3. Closing summary: "StatCard and BenchmarkBar are custom components with the library spine (useBulmaClasses, merged className, spread rest)."
