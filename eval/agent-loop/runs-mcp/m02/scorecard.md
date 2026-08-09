# Scorecard — MCP eval m02 (MCP server + shipped skills, as it ships)

Gate: `app_modified=true` (20 files changed vs baseline) — scoring proceeds.

All eight categories graded against `rubric.md` **as written** — this scaffold has both
guidance channels, so category 8's original anchors apply. The MCP counters are reported as
supporting evidence, not as a substitute.

| #   | Category                     | Score  | Max     | Evidence summary                                                                                                                                                                   |
| --- | ---------------------------- | ------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Build integrity              | 15     | 15      | build_pass=true, tsc_errors=0 (mechanized)                                                                                                                                         |
| 2   | Component adoption           | 15     | 15      | 51 distinct named imports; handrolled_total=0 across all 9 tracked tags; deep cuts: Collapse FAQ, Grid/Cell, Message, Steps, Panel, Media                                          |
| 3   | Prop fidelity                | 15     | 15      | Hits all three top-anchor conditions: inline_style_count=0, raw_bulma_classnames=0, custom_css_added_lines=9 (≤10)                                                                 |
| 4   | Hallucination penalty        | 8      | 10      | **1** distinct invented API across 1 tsc round (`--bulma-shadow` in `Theme bulmaVars`), self-corrected, 0 surviving                                                                |
| 5   | Custom-component conformance | 10     | 10      | StatCard, FeatureCard, SectionHeading carry the full spine (`Omit`+`BulmaClassesProps`, `useBulmaClasses`, `classNames` merge, `className` passthrough, `...rest`)                 |
| 6   | Theming approach             | 10     | 10      | `Theme isRoot` HSL trios (primary/link/info/scheme) + working `colorMode` toggle; zero hardcoded hex in src (grep-verified)                                                        |
| 7   | Site completeness            | 15     | 15      | 8/8 required surfaces across 5 pages; Netadyne/Skynet/Fable naming throughout, incl. a code snippet using `@netadyne/sdk`                                                          |
| 8   | Skill & docs engagement      | 10     | 10      | skill_file_reads=7, skill_files_complete=true, 9 paths incl. both skills `$COMPLETENESS` names; patterns from the references appear verbatim in code; 17 MCP calls for prop lookup |
|     | **Total**                    | **98** | **100** |                                                                                                                                                                                    |

**85-pt core (categories 1–6, 8): 83.**

## Key evidence

- **Cat 3:** `App.css` is 3 rules / 9 lines, inside the ≤10 budget the loop taught — the hero
  radial wash from `--bulma-primary-h/s`, a `.section-alt` band on
  `--bulma-scheme-main-bis`, and `.tier-featured`. The third carries the builder's own
  comment, `/* Theme can't reach --bulma-shadow */`: it tried the zero-CSS route first,
  found the typed record closed, and fell back deliberately rather than reaching for CSS by
  default.
- **Cat 4:** the single invention is that same `--bulma-shadow`. It is exactly one of m01's
  seven, and the only one that survived contact with the skills — the other six were all
  prevented. Precedent: i03 scored 8 for one round of two near-miss names; one invention in
  one round scores 8.
- **Cat 5:** `StatCard.tsx` is the spine in full — it extends both
  `Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>` and
  `Omit<BulmaClassesProps, 'color'>`, destructures `useBulmaClasses(props)`, merges through
  `classNames(bulmaHelperClasses, className)`, spreads `{...rest}`, and carries TSDoc on
  every member. `FeatureCard` and `SectionHeading` match it.
  `BenchmarkTable`, `SiteNavbar` and `SiteFooter` skip it — singleton page chrome with no
  styling surface, the same call i04's scorecard made. `usePrefixedClassNames` is omitted
  throughout, inert at Rung 1 (no CSS targets a root class).
- **Cat 7:** (a) `SiteNavbar`; (b) Home hero with the "10x better than Fable" headline and
  the nine-in-ten-errors framing; (c) feature Grid; (d) `BenchmarkTable`, a
  `Table isFullwidth isHoverable isResponsive`, plus a "Read this before you quote us"
  `Message` on methodology; (e) Pricing with tier Grid; (f) testimonial quotes in
  `Grid`/`Cell` with `quote-left` icons; (g) a "Run the eval yourself" CTA section and a
  112-line `Footer`; (h) responsive via `Grid isFixed fixedColsMobile/Tablet/Desktop` at
  six sites.
- **Cat 8:** the applied link is direct and checkable — the custom-component skill's
  `examples/stat-card.tsx` was read and `StatCard.tsx` mirrors its structure;
  `bestax-layout-scaffold/references/archetypes.md` and `examples/landing.tsx` were read and
  Home follows the landing archetype's section order;
  `bestax-icons/references/icon-libraries.md` was read and `ConfigProvider iconLibrary="fa"`
  plus the FA dependency followed. `claude_md_read=false` is the auto-inject artifact i04's
  scorecard identified, not evidence the file went unread.

## The m01 → m02 delta

|                          | m01 (MCP only) | m02 (MCP + skills) |
| ------------------------ | -------------- | ------------------ |
| Total                    | 85             | **98**             |
| 85-pt core               | 70             | **83**             |
| Cat 4 hallucination      | 2              | **8**              |
| Cat 5 spine              | 5              | **10**             |
| Cat 3 prop fidelity      | 13             | **15**             |
| Distinct invented APIs   | 7              | **1**              |
| `custom_css_added_lines` | 13             | **9**              |
| `raw_bulma_classnames`   | 1              | **0**              |
| Cost                     | $11.10         | **$6.66**          |
| Turns                    | 126            | **83**             |
| MCP tool calls           | 41             | 17                 |
| Skill file reads         | 0              | 7                  |

Every point of the 13-point gap sits in categories 4, 5 and 3 — and the cheaper run is the
better one. m02 spent **40% less** and took 43 fewer turns while scoring 13 points higher,
because six of m01's seven invented APIs never happened and so never had to be repaired.

The channels divide the work rather than duplicating it: m02 made **fewer** MCP calls (17 vs 41) and used them for prop lookup, while the skills carried the conceptual load — which
component to reach for, what shape a custom component takes, how much decorative CSS is too
much. m01 proves the MCP can answer any question asked of it; m02 shows the skills are what
make the builder ask the right ones.

## Top 5 friction points

1. **`--bulma-shadow` is the one gap both runs hit.** `Theme bulmaVars` is a closed typed
   record, and a builder reaching for a shadow token finds that out from a tsc error listing
   ~500 union members. It is the only invention the skills failed to prevent, and it cost
   m02 both its lost points _and_ its only custom-CSS rule. A named "no shadow variable —
   use a scoped ring" line in the theming skill would close it.
2. **The spine is reached through an example, not a rule.** `StatCard.tsx` is right because
   `bestax-custom-component/examples/stat-card.tsx` was read and copied. The `SKILL.md` was
   read too, but the three chrome components that skip the spine suggest the boundary —
   "which components need this" — is carried by the example's shape rather than stated.
3. **`usePrefixedClassNames` omitted in all six components,** for the fifth run running
   (i04 flagged this as spine ambiguity at Rung 1). It is a defensible omission every time,
   which is the argument for saying so in the skill rather than leaving each builder to
   re-derive it.
4. **`claude_md_read=false` again**, as in i04 — the metric cannot see an auto-injected
   `CLAUDE.md`, so category 8's first anchor clause ("read CLAUDE.md early") is unverifiable
   from metrics and has to be inferred from behaviour every time.
5. **Nothing routes between the two channels.** The builder chose well unaided, but neither
   the skills nor the MCP tool descriptions say "props and examples: ask the server;
   patterns and budgets: read the skill." The efficient split m02 found is not documented
   anywhere it could be relied on.

## 3 transcript quotes

1. **`skill_files` (mechanized):** `bestax-custom-component/examples/stat-card.tsx` sits in
   the harvested list, and `StatCard.tsx` reproduces its
   `useBulmaClasses`/`classNames`/`...rest` structure — the clearest applied-guidance link
   in either run.
2. **`src/App.css:7` (the builder's own comment):** `/* Theme can't reach --bulma-shadow */`
   — it attempted the zero-CSS route the theming skill prescribes, hit a real library limit,
   and documented the fallback instead of silently widening the stylesheet.
3. **`src/App.tsx:40`:** `{/* Netadyne brand: teal primary, violet links, on Bulma's HSL
trios. */}` above `<Theme isRoot colorMode …>` — the theming skill's central pattern,
   named as such in the code.
