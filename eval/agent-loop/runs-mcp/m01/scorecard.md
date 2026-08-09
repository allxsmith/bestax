# Scorecard — MCP eval m01 (MCP server only, no skills, no CLAUDE.md)

Gate: `app_modified=true` (18 files changed vs baseline) — scoring proceeds.

Category 8 is graded against the re-anchored version in `notes.md`; categories 1–7 are
`rubric.md` as written.

| #   | Category                     | Score  | Max     | Evidence summary                                                                                                                                                                                    |
| --- | ---------------------------- | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Build integrity              | 15     | 15      | build_pass=true, tsc_errors=0 (mechanized)                                                                                                                                                          |
| 2   | Component adoption           | 15     | 15      | 51 distinct named imports; handrolled_total=0 across all 9 tracked tags; deep cuts: Reveal, Steps, Collapse, Panel, Menu, Tabs, Progress, Slider, Switch, Breadcrumb                                |
| 3   | Prop fidelity                | 13     | 15      | inline_style_count=0; custom_css_added_lines=13 (3 over the ≤10 anchor); raw_bulma_classnames=1 (`ListItem className="is-active"`, Docs.tsx:305)                                                    |
| 4   | Hallucination penalty        | 2      | 10      | 3 error-TS rounds, 12 distinct messages, **7 distinct invented APIs/values**, all self-corrected, 0 surviving — well past the "≥3 invented" anchor, scored above 0 only because none survived       |
| 5   | Custom-component conformance | 5      | 10      | 3 extracted components (SectionHeading, SiteNavbar, SiteFooter); **none** carries any part of the spine — no `useBulmaClasses`, no `className` passthrough, no `...rest` (grep-verified: zero hits) |
| 6   | Theming approach             | 10     | 10      | `Theme isRoot` HSL trios (primary/link/info/scheme) + working `colorMode` toggle; zero hardcoded hex in src (grep-verified); the 3 CSS rules all derive from `--bulma-*`                            |
| 7   | Site completeness            | 15     | 15      | 8/8 required surfaces across 7 pages; Netadyne/Skynet/Fable naming throughout; benchmark `Table` with an explicit "what 10x means" error-reduction framing                                          |
| 8   | Skill & docs engagement      | 10     | 10      | 41 MCP calls, 7 distinct tools; `list_skills`+`list_components` are tool calls #1 and #2; 4 skills pulled via `get_skill` incl. both the addendum names; output visibly shapes the code             |
|     | **Total**                    | **85** | **100** |                                                                                                                                                                                                     |

**85-pt core (categories 1–6, 8): 70.**

## Key evidence

- **Cat 2:** `bestax_import_list` spans all seven source folders — layout (Hero, Section,
  Container, Footer, Level), columns _and_ grid (Columns/Column, Grid/Cell), form
  (Field, Input, Select, TextArea, Checkbox, Slider, Switch), and the bestax extras
  (Reveal, Collapse, Divider, Steps). Nothing in the tracked-tag set was hand-rolled.
- **Cat 3:** `App.css` is 3 rules / 13 lines: a hero radial wash from
  `--bulma-primary-h/s`, a `.section-alt` band on `--bulma-scheme-main-bis`, and a
  `.card.is-featured` ring on `--bulma-primary`. All theme-derived and dark-mode-safe —
  the same decorative-section gap i04 lost its point to. The third rule is the one i07's
  loop specifically taught away from (a featured ring is expressible as a scoped
  `Theme bulmaVars`), and that lesson lives in the theming skill's prose rather than in
  any prop table, so nothing the builder queried carried it.
  `ListItem className="is-active"` (Docs.tsx:305) is a genuine escape: `ListItem` has no
  `active` prop — verified against `bestax-mcp/data/components/ListItem.json`.
- **Cat 4 — the 7 root causes,** each from a distinct `tsc -b` failure:
  1. `textColor` (a helper prop) on `Table.Td` — `TdProps` does not accept it
  2. `Column size="7"` as a string — `BulmaColumnSize` is numeric
  3. `Title`/`SubTitle` `size={2}` as a number — that one is the string union `"1"…"6"`
  4. `textAlign="center"` — the union is `"centered"` (tsc emitted the did-you-mean)
  5. `Card.FooterItem` given `as`/`href` — not on `CardFooterItemProps`
  6. `--bulma-shadow` in `Theme bulmaVars` — not a real Bulma variable
  7. `--bestax-card-shadow` in `Theme bulmaVars` — arbitrary custom properties are
     rejected by the typed record
- **Cat 4 — scoring:** (2) and (3) are the same mistake in opposite directions on the same
  prop name, three MCP `get_props` calls apart. Precedent: i05 scored 3 for 4 self-corrected
  inventions; 7 root causes scores 2.
- **Cat 5:** `SectionHeading.tsx` is the clearest case — it takes `eyebrow`/`title`/`lead`/
  `centered` and forwards helper props _to_ the primitives it composes, but exposes none of
  its own, accepts no `className`, and spreads no rest. It is a correct composition and an
  incomplete component. i04's equivalent (also called `SectionHeading`) carried the full
  spine and scored 10.
- **Cat 7:** (a) `SiteNavbar` fixed-top with a controlled burger and `Navbar.Dropdown`;
  (b) `Hero size="large"` with live error-rate bars; (c) 6 feature cards in
  `Grid fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={3}`;
  (d) `Table isFullwidth isHoverable isStriped isResponsive` with Fable/Skynet/reduction
  columns plus a written "10x = 10x error reduction, not 10x headline accuracy" section;
  (e) Pricing with a live monthly-spend calculator and an annual toggle; (f) testimonials
  in `Columns`; (g) a primary CTA hero + a 143-line `Footer`; (h) responsive via the Grid
  breakpoint props above and `Columns isMobile isMultiline`.
- **Cat 8:** the applied-guidance link is direct: `bestax-layout-scaffold` → the Home page
  follows the landing archetype's section order; `bestax-theming` → `Theme isRoot` with HSL
  trios rather than hex; `bestax-icons` → `ConfigProvider iconLibrary="fa"` plus
  `@fortawesome/fontawesome-free` as the one added dependency.

## Top 5 friction points

1. **`size` means two different types and nothing warns.** `Column size` is numeric,
   `Title`/`SubTitle` `size` is the string union `"1"…"6"`. The builder queried both
   through `get_props` and still got both wrong, in opposite directions — the per-component
   prop table is correct but gives the reader no signal that the neighbouring component
   disagrees. Two of the seven inventions, and the most repeated (7 call sites).
2. **Helper props are not universal, and the MCP presents them as if they were.**
   `get_helper_props` returns the spacing/colour/typography surface with no statement of
   which components consume it; `Table.Td` does not, and `textColor` on a `Td` was the
   first build failure. The skills carry this as the "Td/Th cell idiom" (added in i01);
   the MCP has no tool that would surface it at the point of use.
3. **`Theme bulmaVars` accepts only real Bulma variables, discoverable only by failing.**
   Two of the seven inventions were invented variable names. `get_css_variables` exists and
   is per-component; nothing tells a builder writing a global theme that the record is
   closed, and the tsc error prints ~500 union members rather than a near-miss.
4. **No spine guidance ever reached the builder.** `list_skills` was called first,
   `bestax-custom-component` was in the list, and it was the one skill of relevance the
   builder never pulled — so all three extracted components skipped the spine. The MCP has
   no way to say "you are about to write a component, read this"; the skills channel gets
   that from `CLAUDE.md` sitting in the project.
5. **The ≤10-line decorative-CSS budget is invisible over MCP.** It is a rule the loop
   taught into `CLAUDE.md` and the theming skill's prose, not a prop or a variable, so no
   query surfaces it. 13 lines is close, and unlike i04's overage one of the three rules
   was avoidable.

## 3 transcript quotes

1. **Line 5, the first assistant turn:** _"I'll start by exploring the scaffolded project and
   looking up the bestax component library."_ — followed immediately by
   `mcp__bestax__list_skills` and `mcp__bestax__list_components` as tool calls #1 and #2,
   then 19 more MCP calls before the first `Write`.
2. **Lines 6–30, the discovery block:** `get_skill{bestax-layout-scaffold}` →
   `get_skill{bestax-layout-scaffold, reference:"archetypes"}` → `get_skill{bestax-theming}`
   → `get_component{Navbar|Hero|Card|Table|Grid|Icon, include:["props","examples"]}`. The
   builder used the reference-drilling path the skills were designed around, over MCP,
   without a `.claude/skills/` directory existing.
3. **Line 462, the final report:** _"Seven pages behind a fixed navbar (controlled burger and
   `Navbar.Dropdown`), a shared footer, and a light/dark toggle wired to
   `<Theme isRoot colorMode>`"_ — the theming skill's central pattern, described back
   accurately.
