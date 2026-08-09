# Completeness addendum — `skynet-platform`

Category-7 anchors for the brief in [`skynet-platform.md`](skynet-platform.md), the
category-9 extras roster, and the skills category 8 expects. Supplied to the grader as
`$COMPLETENESS`.

> **Grader-only. Never give this to the builder.** Handing it the surface list would tell it
> what it is being scored on and void the measurement — and here that matters more than for
> `skynet-saas`, because this file names the components the brief deliberately never names.
> The runner only ever `cat`s the brief path it was passed, and the builder is started in the
> scaffolded app, which the runner forces to live outside this repo tree.
>
> That is a convention, **not enforced isolation** — see the same warning in
> [`skynet-saas.completeness.md`](skynet-saas.completeness.md) for what would be required to
> guarantee it.

Frozen for the duration of a loop, like the rubric. Pairs with
[`../rubric-v2.md`](../rubric-v2.md) (rubric version 2), **not** `rubric.md` — category 9
does not exist in version 1.

## Required surfaces (8) — feeds rubric-v2 §7

- **(a) Home** — 10x claim, supporting numbers, differentiators, rotating customer stories,
  closing call to action
- **(b) Benchmarks** — suite-by-suite comparison against Fable in a readable table, an
  explanation of what "10x" means, a methodology note
- **(c) Playground** — model selection, prompt entry, the three tuning controls, stop
  sequences, per-setting explanations, a generating state, copy-with-confirmation
- **(d) Pricing** — tiers, monthly/annual toggle, a usage-driven estimate that moves, FAQ
- **(e) Docs** — numbered quickstart, a code sample, breadcrumbs
- **(f) Console** — account menu, usage-over-time with a loading state, a paged table of
  recent calls, the team, an unread count, navigation that collapses on narrow screens
- **(g) Book a demo** — day and time, seats, support plan, regions, optional attachment,
  a confirm step that echoes the choices, a success confirmation
- **(h) Brand + responsive** — dark mode throughout, brand identity that is not default
  Bulma, works at phone width

Apply the proportional anchors in `rubric-v2.md` §7. With 8 surfaces: 15 = ≥7 present and
coherent; 8 = 4–6, or all present but skeletal; 0 = ≤3.

**Brief-appropriate copy** for the top anchor means the Netadyne / Skynet / Fable naming is
used rather than lorem placeholder.

## Expected extras (22) — feeds rubric-v2 §9

The components beyond stock Bulma. The brief demands each through product behaviour and
never names one; this is the mapping the grader scores against. `metrics.json`'s
`bestax_import_list` establishes presence — but **presence is not enough**: §9's top anchor
requires each to be load-bearing in the surface that asked for it.

| Surface     | Expected extras                                                                              |
| ----------- | -------------------------------------------------------------------------------------------- |
| Home        | `Carousel`, `Rate`, `Reveal`                                                                 |
| Playground  | `Autocomplete`, `Slider`, `Numberinput`, `Switch`, `Taginput`, `Tooltip`, `Loading`, `Toast` |
| Pricing     | `Slider`, `Switch`, `Collapse`                                                               |
| Docs        | `Steps`                                                                                      |
| Console     | `Skeleton`, `Avatars`, `Avatar`, `Badge`, `Sidebar`                                          |
| Book a demo | `DateInput`, `TimeInput`, `DateTimeInput`, `Numberinput`, `Dialog`, `LinkButton`, `Toast`    |

**Two slots accept alternatives — count the slot satisfied, not each name:**

- **Date/time**: `DateTimeInput` alone satisfies it, **or** `DateInput` + `TimeInput`
  together. Do not count it twice or penalise whichever route was taken.
- **`LinkButton`**: satisfied by any genuinely text-styled secondary action next to the
  confirm button. A second `Button` with a colour variant does **not** satisfy it — the brief
  explicitly asked for "not two identical buttons".

Two names are casing traps the library actually exports: **`Numberinput`** and
**`Taginput`**, lowercase `i`. A build that wrote `NumberInput`/`TagInput` and repaired it
scores the invention under §4 as normal; that is a legitimate finding, not a grading quirk.

**Denominator for the proportional anchors is 20 slots** (22 names less the two collapsed by
the date/time alternative). 10 = ≥17 slots load-bearing; 5 = 10–16, or present but inert;
0 = ≤9.

## Core Bulma this brief also reaches

Not scored separately — they land in §2 component adoption — but worth checking, because no
run in any previous loop has used them: `Pagination` (the paged call log), `Dropdown` (the
account menu), `Radios` (support plan), `Checkboxes` (regions), `File` (the dataset
attachment), `Code` (the docs sample), `Breadcrumb` (docs).

## Expected skills (feeds rubric-v2 §8)

`bestax-layout-scaffold`, `bestax-theming` and `bestax-form` at minimum — unlike
`skynet-saas`, this brief contains two real forms (the playground controls and the booking
flow), so the form skill is genuinely required rather than merely relevant.
`bestax-custom-component` and `bestax-icons` are relevant; the brief does not force either.

For a run whose scaffold has no `.claude/skills/` (an MCP-only channel), re-anchor §8 in
that run's `notes.md` as `runs-mcp/m01/notes.md` does — do not edit the rubric.
