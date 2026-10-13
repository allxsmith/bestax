---
slug: state-of-react-2026-10
title: 'The State of React: October 2026'
description: 'An October 2026 snapshot comparing bestax against Mantine, MUI, Chakra UI, shadcn/ui, React-Bootstrap, and react-bulma-components: what each one shipped since September 26, and the cells the last edition had wrong.'
authors: [asmith]
tags: [state-of-react, comparison, react, bulma, mantine, mui, chakra, shadcn]
canonical_url: https://bestax.io/blog/state-of-react-2026-10
publish_to_devto: false
hide_table_of_contents: true
image: /img/state-of-react/2026-10.png
cover_image: /img/state-of-react/2026-10.png
---

import ComparisonChanges from '@site/src/components/ComponentComparison/Changes';
import september2026 from '@site/src/data/state-of-react/2026-09.json';
import october2026 from '@site/src/data/state-of-react/2026-10.json';

<img
  className="sor-cover"
  src="/img/state-of-react/2026-10.svg"
  alt="The State of React, October 2026, drawn as a synthwave radio-show cover: a glowing cyan React atom orbits a striped setting sun, equalizer bars rise along a pink horizon over a neon grid floor, THE STATE OF sits in gold above REACT in cyan and white, LIVE SET reads in the top left corner, EP. 003 in the top right, and a caption along the bottom reads October 2026, React component libraries, compared"
/>

Two kinds of change landed in the table this month. Some of it shipped, mostly from Mantine and from bestax. More of it is me fixing cells the September edition had wrong, and this time the table marks those apart.

:::info Snapshot: October 2026
This edition reflects each library **as of October 13, 2026** and covers everything since the [August and September edition](/blog/state-of-react-2026-09). The full matrix lives on its own [comparison page](/docs/guides/getting-started/compare), and the [latest edition of _The State of React_](/blog/tags/state-of-react) always has the freshest data.
:::

<!-- truncate -->

If you haven't read one of these before, _The State of React_ is a dated, side-by-side look at the mainstream React component libraries, capability by capability, with every cell linking to that library's own docs. I maintain [bestax](/docs/intro), a React component library for Bulma v1, so I've got a horse in this race. That's why every cell links out: you shouldn't have to take my word for any of it.

In the ring: **[bestax](/docs/intro)** (Bulma v1), **[react-bulma-components](https://react-bulma.dev/)** (the other Bulma wrapper), **[Mantine](https://mantine.dev/)**, **[MUI](https://mui.com/)**, **[Chakra UI](https://chakra-ui.com/)**, **[shadcn/ui](https://ui.shadcn.com/)**, and **[React-Bootstrap](https://react-bootstrap.netlify.app/)**.

## What Shipped Since September

### Mantine

Mantine shipped the most again, nearly all of it in one release.

- **[9.7.0](https://github.com/mantinedev/mantine/releases/tag/9.7.0)** (October 5) added four components:
  - **[Toggle](https://mantine.dev/core/toggle/)**, a button that stays pressed.
  - **[Toolbar](https://mantine.dev/core/toolbar/)**, a row of controls you move through with the arrow keys, with toggle groups and dividers inside.
  - **[Tour](https://mantine.dev/core/tour/)**, a step-by-step onboarding walkthrough that spotlights each part of the page.
  - **[JsonViewer](https://mantine.dev/code-highlight/json-viewer/)**, a collapsible JSON tree in `@mantine/code-highlight`.
- The same release has some opt-in extras: image upload in RichTextEditor, resizable AppShell sections, a light variant for Checkbox and Radio, and `notifications.promise()`, which shows a loading notification and updates it when the promise settles.
- Two defaults changed, so they're worth a look before you upgrade. Tooltip now hides when its target leaves the page or scrolls out of view (`hideDetached={false}` brings the old behavior back, and Jest or Vitest needs `env="test"` on `MantineProvider`). HoverCard now opens on keyboard focus and closes on Escape, and it no longer opens on a tap.
- [9.7.1](https://github.com/mantinedev/mantine/releases/tag/9.7.1) (October 6) and [9.7.2](https://github.com/mantinedev/mantine/releases/tag/9.7.2) (October 11) are fixes.

### MUI

Another polish stretch for Material UI, and steady work on MUI X.

- **Material UI [v9.5](https://github.com/mui/material-ui/releases/tag/v9.5.0)** (October 9): Autocomplete can work with [options that carry a plain value](https://mui.com/material-ui/react-autocomplete/#object-options-with-primitive-values), like an ID, through a new opt-in `getOptionValue` prop. The package now ships its own docs as Markdown, and the site has a new [accessibility conformance report](https://mui.com/material-ui/getting-started/accessibility/) with a table of known gaps. It calls itself a self-assessed draft that covers part of the library so far.
- **[v10.0.0-alpha.0](https://github.com/mui/material-ui/releases/tag/v10.0.0-alpha.0)** (October 12) is out on npm's `next` tag. Its one breaking change so far is a higher default elevation on the Autocomplete popup, and I haven't seen a date for a stable v10.
- **MUI X**: the September edition missed [v9.14](https://github.com/mui/mui-x/releases/tag/v9.14.0) from September 17, whose Scheduler time grid now opens at 7 AM unless you set `initialScrollTime`. [v9.15](https://github.com/mui/mui-x/releases/tag/v9.15.0) (October 6) added an opt-in `height` prop that sizes the Data Grid without a wrapper, an `onCancel` callback on the pickers, and Home, End, and Page Up/Down keys in Charts, whose keyboard navigation is on by default. The Scheduler is still in beta, and Chat is still in alpha.

### Chakra UI

No release this stretch. [3.37.0](https://github.com/chakra-ui/chakra-ui/releases/tag/%40chakra-ui%2Freact%403.37.0) from August 28, the one that added DateInput, is still the latest. A patch is waiting in an [open release PR](https://github.com/chakra-ui/chakra-ui/pull/10956), with bug and accessibility fixes and a better v2-to-v3 codemod, but no new components.

On v4, a maintainer [said on October 1](https://github.com/chakra-ui/chakra-ui/discussions/10959#discussioncomment-18702745) there's no date yet, guessing "later this year or early next year." It waits on a stable v6 of Ark UI, the headless library underneath Chakra, and Ark's v6 prereleases have only just started.

### shadcn/ui

No new components, and no [changelog](https://ui.shadcn.com/docs/changelog) entries since the [`cn` package](https://ui.shadcn.com/docs/changelog/2026-09-cn) in September. The CLI got four patch releases, [4.21.1](https://github.com/shadcn-ui/ui/releases/tag/shadcn%404.21.1) through [4.21.4](https://github.com/shadcn-ui/ui/releases/tag/shadcn%404.21.4) (October 1 to 7). The first one moved the engine behind the CLI into its own package, [`@shadcn/registry`](https://github.com/shadcn-ui/ui/releases/tag/%40shadcn%2Fregistry%400.1.0), which other tools can now depend on. Nothing changes if you just use the CLI.

### React-Bootstrap

Still quiet. The latest stable release is [2.10.10](https://github.com/react-bootstrap/react-bootstrap/releases) from May 2025, and the newest v3 beta, beta.5, is from September 2025. The last commit to the main branch is still [this April's](https://github.com/react-bootstrap/react-bootstrap/commits/master).

A small **correction** to the September edition here: it said v3 had been in beta since September 2025. The first v3 beta came out in May 2025. September 2025 is when the latest one did.

### react-bulma-components

No change. The last release is still 4.1.0 from February 2022, built for Bulma 0.9, and the [last commit](https://github.com/couds/react-bulma-components/commits) is still from January 2024.

### bestax

This is the one I work on. The September edition listed five gaps in my own column: a popover, a hover card, an accordion, a date range picker, and a data grid. Four of those shipped.

- `@allxsmith/bestax-bulma` went from 5.16 to 5.31, with seven new components:
  - **[Popover](/docs/api/components/popover)**, **[HoverCard](/docs/api/components/hovercard)**, and **[ContextMenu](/docs/api/components/contextmenu)**, a menu that opens on right-click or long press.
  - **[DateRangeInput](/docs/api/form/datetime/daterangeinput)**, plus [month and year pickers](/docs/api/form/datetime/dateinput#month-and-year-pickers) on DateInput through a `granularity` prop.
  - **[Collapses](/docs/api/components/collapses)**, an accordion group for Collapse.
  - **[ToggleButton](/docs/api/elements/togglebutton)**, a button that stays pressed, which also slots into `Buttons` as a group.
  - **[Loader](/docs/api/elements/loader)**, Bulma's inline spinner.
- Three things the library had inside are exported for your own overlays: [Portal](/docs/api/helpers/portal), [useFocusTrap](/docs/api/helpers/usefocustrap), and [ClientOnly](/docs/api/helpers/clientonly). ConfigProvider can also set where portaled content goes.
- Bulma's [gap](/docs/guides/helpers/flex#gap), position, overflow, radius, and aspect-ratio helpers are props on every component now.
- The docs have recipes for a [split button](/docs/api/components/dropdown#split-button), a [password reveal](/docs/api/form/input#password-reveal), and a [copy button](/docs/api/form/input#copy-button), and the table counts them as ◐.
- A lot of fit and finish, most of it accessibility:
  - [Tabs](/docs/api/components/tabs) follow the WAI-ARIA keyboard pattern, Tooltip can be hovered, dismissed with Escape, and opened with a tap, and Dropdown has typeahead.
  - A batch of [ARIA structure fixes](https://github.com/allxsmith/bestax/issues/942) in Rate, Icon, Autocomplete, Dropdown, and the time wheels.
  - [Pagination](/docs/api/components/pagination) can render its own page links from `total`, `current`, and `onPageChange`.
- One fix I should own: until 5.27.1, an app that imported only `Button` still bundled nearly the whole library. The ESM build now ships one file per module, so a bundler drops what you don't import.
- The tools kept going too:
  - **[`bestax-mcp`](/docs/guides/llms#mcp-server)** is listed in the official [MCP Registry](https://registry.modelcontextprotocol.io) as of October 3, and it now releases with every bestax-bulma release, so its index keeps up.
  - **[`bestax-migrate`](/docs/guides/getting-started/migration/bulma-classes)** kept growing for apps written in plain Bulma class markup. Grids, menus, pagination, panels, tabs, images, the parts inside a modal, a file input inside a field, and the new helper classes all convert now.
  - The **[ESLint plugin](/docs/guides/getting-started/eslint-plugin)** checks the new gap props. Its opt-in [rule for raw Bulma markup](/docs/guides/getting-started/eslint-plugin#no-bulma-component-class), which landed the same day as the last edition, flags markup a bestax component could replace, so it doesn't creep back in after a migration.

## What the September Table Got Wrong

Right after the September edition went out, I audited every column against each library's current docs, and the table had a lot wrong: 130 cells. Most of it ran one way. A library that offered something through a prop, a mode, or a docs example often got a dash instead of ◐, so 114 of those fixes went up. Releases have since overtaken two of them, both in my own column (Toggle button by ToggleButton, Accordion by Collapses), so the table below shows 128 as corrections.

How does a table get 130 cells wrong? I never wrote down what earns a mark, so I applied it differently from one column to the next. The rules are on the [comparison page](/docs/guides/getting-started/compare#how-to-read-it) now. The gist, library by library:

- **shadcn/ui** moved the most. A lot of what it does comes from composing its own pieces, and the September table mostly counted only dedicated components. It also had DatePicker and DataTable as dedicated, and they're compositions.
- **Chakra UI** had exports I'd missed, like Toggle, FocusTrap, Sticky, and Em, plus the ◐ cells its docs examples earn.
- **MUI**'s month and year calendars are dedicated components, while its Transfer List is a docs demo and its focus trap is only documented as part of Modal.
- **Mantine**'s range picker is a mode of DatePickerInput, `Grid.Col` counts as a grid cell, and a plain grid isn't an image gallery.
- **React-Bootstrap**'s ThemeProvider sets class prefixes rather than a theme, and its textarea, color, and file inputs are modes of `Form.Control`.
- **react-bulma-components** has no Delete export but does have a Loader.
- **bestax**, my own column, was undersold too. Taginput is a pills input, DateInput's inline mode is a calendar, and the flex, visibility, and overlay helpers count for Flex, Center, Visually hidden, and Backdrop.

[The first fix](https://github.com/allxsmith/bestax/pull/766) has the full list, and [a second pass](https://github.com/allxsmith/bestax/pull/843) settled the cells I wasn't sure about.

One row got a new name, too. `Box (polymorphic primitive)` is now `Styling primitive (unstyled, any tag)`. Bulma's `Box` is a padded, shadowed surface, so bestax's `Box` sits on the Paper row, and a row called Box with a dash under bestax read like a mistake. It's a rename, and no marks moved with it, so it isn't in the table below.

The audit and its second pass also added thirteen rows for capabilities the matrix had no place for. Those are **matrix additions**, not things that shipped this month.

## What Changed in the Table

The table below shows only the rows that moved since September. Highlighted cells changed because something shipped: Mantine's Toggle, and fifteen cells in bestax's column. A **dashed** cell is a correction from the section above. Rows marked **new** are the matrix additions: a toolbar, selectable cards, an event calendar, links, a context menu, a menubar, color swatches, a marquee, floating panels, an anchored positioning primitive, chat, a locale or direction provider, and a skip link. Two of them do carry something from this month: Mantine's Toolbar and bestax's ContextMenu.

Hover any cell for the component name, or click it to open that component's docs.

<ComparisonChanges from={september2026} to={october2026} />

## What the Matrix Says

:::tip bestax is a superset of react-bulma-components
Within the Bulma world there isn't much of a contest. react-bulma-components covers Bulma core only and hasn't shipped since February 2022. bestax covers everything it does except Bulma's old `Tile` and an unstyled `Element` primitive, and adds 55 more rows of the full matrix: date, range, and time inputs, autocomplete, rating, tag input, slider, switch, Carousel, Steps, Avatar, Badge, Toast, Tooltip, Popover, HoverCard, ContextMenu, Skeleton, Sidebar, and Reveal, among others.
:::

A few honest takeaways across the wider field:

- **Mantine** still has the widest first-party catalog, and it's still the one moving fastest: a toggle, a toolbar, a guided tour, and a JSON viewer in one release.
- **MUI** still owns heavy data and app-frame surfaces through its X packages: Data Grid, Charts, Tree View, and Date Pickers, plus FAB and Speed Dial. This stretch was polish, and v10 has started as an alpha.
- **Chakra UI** didn't release this time. It's still the closest peer to bestax's prop-driven styling model, and it still has no dedicated data grid.
- **React-Bootstrap** is still the smallest set: a faithful Bootstrap wrapper with no date or time pickers, rating, autocomplete, stepper, or tag input.
- **bestax** covers the mainstream set and adds the Bulma layout pieces most libraries leave to composition: Hero, Level, Media, Section, and Panel. The gaps worth knowing about now: no data grid, tree view, command palette, color picker, charts, dropzone, or rich text editor. The [order I'm working through them in](https://github.com/allxsmith/bestax/issues/778) is public.

:::note shadcn/ui plays by different rules
shadcn/ui looks broad because it's a **copy-paste registry**, not an npm dependency. Its behavior comes from Base UI, Radix, or React Aria, plus cmdk, TanStack Table, and react-day-picker. You own the code it drops into your project. That's powerful, and it's a different maintenance model from everything else here.
:::

## Corrections Welcome

I compile this by hand from each library's source and docs, and this edition is mostly me fixing my own table. That's the point of doing it in the open. A fix lands on the [comparison page](/docs/guides/getting-started/compare) first, and the next edition marks it as a correction.

:::caution Spot something off?
Please [open an issue](https://github.com/allxsmith/bestax/issues). Corrections make the next edition better.
:::

## One Last Track

The series is named after [_A State of Trance_](https://www.astateoftrance.com/), Armin van Buuren's weekly radio show, so each edition ends with what Armin and Gryffin, my two favorite DJs, have been up to.

- **Armin van Buuren** closed his Monday residency at UNVRS in Ibiza on October 5 with a [five-hour set](https://www.unvrs.com/events/2026/armin-van-buuren-asot/05-10-2026). The radio show aired [episode 1298](https://www.youtube.com/watch?v=pCDF-OVaH14) on October 8, with a guest mix from Paul Oakenfold, so 1300 is two episodes away. That same day, at a surprise pop-up in Los Angeles, he [announced](https://weraveyou.com/2026/10/a-state-of-trance-los-angeles-2027-armin-van-buuren) the first two-day _A State of Trance_ festival in the US, [in LA on June 11 and 12, 2027](https://festival.astateoftrance.com/losangeles/). And "[Nirvana](https://www.edmtunes.com/2026/10/09/armin-van-buuren-and-funk-tribu-take-listeners-to-nirvana/)," his first full collaboration with Funk Tribu, came out October 9.
- **Gryffin** is between releases, and _ELEMENTS I_, the album "World Away" comes from, still doesn't have a date I can find. His _Ten Years of Music. One Night._ shows hit [Brooklyn on October 17 and Los Angeles on October 24](https://www.edmtunes.com/2026/03/gryffin-announces-headline-show-at-exposition-park-in-la/), and the run [finishes at Red Rocks](https://www.thatericalper.com/2026/10/04/gryffin-saves-red-rocks-for-the-finale-of-ten-years-of-music/) on November 13, his fifth headline there. "This venue and this place always made sense to save for last," he said.

The cover's back to **LIVE SET**, since this one's a single month.

See you in the next one.
