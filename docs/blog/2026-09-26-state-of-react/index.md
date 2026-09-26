---
slug: state-of-react-2026-09
title: 'The State of React: August and September 2026'
description: 'A late, combined August and September snapshot comparing bestax against Mantine, MUI, Chakra UI, shadcn/ui, React-Bootstrap, and react-bulma-components, plus what each one shipped since July.'
authors: [asmith]
tags: [state-of-react, comparison, react, bulma, mantine, mui, chakra, shadcn]
canonical_url: https://bestax.io/blog/state-of-react-2026-09
publish_to_devto: false
hide_table_of_contents: true
image: /img/state-of-react/2026-09.png
cover_image: /img/state-of-react/2026-09.png
---

import ComparisonChanges from '@site/src/components/ComponentComparison/Changes';
import july2026 from '@site/src/data/state-of-react/2026-07.json';
import september2026 from '@site/src/data/state-of-react/2026-09.json';

<img
  className="sor-cover"
  src="/img/state-of-react/2026-09.svg"
  alt="The State of React, August and September 2026, drawn as a synthwave radio-show cover: a glowing cyan React atom orbits a striped setting sun, equalizer bars rise along a pink horizon over a neon grid floor, THE STATE OF sits in gold above REACT in cyan and white, B2B SET reads in the top left corner, EP. 002 in the top right, and a caption along the bottom reads August + September 2026, React component libraries, compared"
/>

This one's late. August came and went without an edition, so this is a combined August and September issue of _The State of React_, and I'm sorry for the gap.

:::info Snapshot: September 2026
This edition reflects each library **as of September 26, 2026** and covers everything since the [July edition](/blog/state-of-react-2026-07). The full matrix now lives on its own [comparison page](/docs/guides/getting-started/compare), and the [latest edition of _The State of React_](/blog/tags/state-of-react) always has the freshest data.
:::

<!-- truncate -->

If you're new here, _The State of React_ is a dated, side-by-side look at the mainstream React component libraries, capability by capability, with every cell linking to that library's own docs. I maintain [bestax](/docs/intro), a React component library for Bulma v1, so I've got a horse in this race. That's why every cell links out: you shouldn't have to take my word for any of it.

As for why it's late: most of August went into bestax itself (more on that below), and the edition slipped. Two months of release notes is a lot, so I've kept this to what you'd actually notice in an app.

In the ring: **[bestax](/docs/intro)** (Bulma v1), **[react-bulma-components](https://react-bulma.dev/)** (the other Bulma wrapper), **[Mantine](https://mantine.dev/)**, **[MUI](https://mui.com/)**, **[Chakra UI](https://chakra-ui.com/)**, **[shadcn/ui](https://ui.shadcn.com/)**, and **[React-Bootstrap](https://react-bootstrap.netlify.app/)**.

## What Shipped Since July

### Mantine

Mantine shipped the most, by a wide margin.

- **[9.5.0](https://github.com/mantinedev/mantine/releases/tag/9.5.0)** landed July 27, the same day as the last edition, so it didn't make the table. It added a **Cascader** for nested selects, **SunburstChart** and **BulletChart**, and keyboard navigation for charts, on by default.
- **[9.6.0](https://github.com/mantinedev/mantine/releases/tag/9.6.0)** (August 31) added a new `@mantine/lightbox` package, an **ActionBar** for bulk actions on selected items, and four more chart types: Gauge, Waffle, Matrix, and Candlestick. Notifications can stack now, too. One breaking change to know about: Dropzone moved to react-dropzone 20, so picking more files than `maxFiles` now accepts files up to the limit instead of rejecting the whole batch.
- The [patch releases](https://github.com/mantinedev/mantine/releases) since then are bug and accessibility fixes.

### MUI

A polish stretch. Material UI added no new components, and every release carried accessibility work.

- **Material UI [v9.3](https://github.com/mui/material-ui/releases/tag/v9.3.0)** (August 5): Toggle Button Group moves to roving-tabindex keyboard navigation, and Autocomplete announces its loading and no-options messages to screen readers.
- **[v9.4](https://github.com/mui/material-ui/releases/tag/v9.4.0)** (August 28): an opt-in `theme.focusVisible` gives every component the same keyboard focus ring, and Tooltip works on a disabled button without a wrapper element.
- **MUI X**: Data Grid Premium picked up spreadsheet-style [formulas and a Formula Bar](https://mui.com/x/react-data-grid/formulas/) in [v9.12](https://github.com/mui/mui-x/releases/tag/v9.12.0) (August 21), and Charts got better keyboard navigation in [v9.13](https://github.com/mui/mui-x/releases/tag/v9.13.0) (September 4). The Scheduler is still in beta.

### Chakra UI

- **[3.37.0](https://github.com/chakra-ui/chakra-ui/releases/tag/%40chakra-ui%2Freact%403.37.0)** (August 28) added **[DateInput](https://chakra-ui.com/docs/components/date-input)**, a segmented field for typing dates, with a range mode and a time-only mode.
- Chakra v4 is still in the planning stage, and the [discussion](https://github.com/chakra-ui/chakra-ui/discussions/10959) is public if you want to follow it.

I also owe Chakra a **correction**. The July edition said it ships no date pickers, charts, or carousel. That was already wrong on July 27: Chakra had a [DatePicker](https://chakra-ui.com/docs/components/date-picker), [Carousel](https://chakra-ui.com/docs/components/carousel), [Charts](https://chakra-ui.com/docs/charts/installation), [TreeView](https://chakra-ui.com/docs/components/tree-view), [TagsInput](https://chakra-ui.com/docs/components/tags-input), [Splitter](https://chakra-ui.com/docs/components/splitter), [ScrollArea](https://chakra-ui.com/docs/components/scroll-area), and [CodeBlock](https://chakra-ui.com/docs/components/code-block). The table has all of them now, and Chakra's column went from 79 checkmarks to 90.

### shadcn/ui

- The `cn()` helper every shadcn project kept in `lib/utils.ts` is now its own [`cn` package](https://ui.shadcn.com/docs/changelog/2026-09-cn) (CLI 4.21, September 4). New projects get it from `init`, `shadcn migrate cn` moves an existing one over, and nothing changes where you call it.
- A new **[Questionnaire](https://ui.shadcn.com/docs/changelog/2026-08-questionnaire)** component handles multi-step question flows (surveys, onboarding, intake forms), for Base UI, Radix, and React Aria.
- The [CLI](https://github.com/shadcn-ui/ui/releases) can now read registries from `package.json` and pull from private GitHub registries.

None of that moves a cell in the table.

### React-Bootstrap

Quiet. The latest stable release is still [2.10.10](https://www.npmjs.com/package/react-bootstrap?activeTab=versions) from May 2025, v3 has been in beta since September 2025, and the last commit to the main branch was this April. Nothing in the table moved.

### react-bulma-components

Also quiet, and that's been true for a while. The last release is 4.1.0 from February 2022, which targets Bulma 0.9, and the [last commit](https://github.com/couds/react-bulma-components/commits) landed in January 2024. The July edition called it inactive since about 2021, which was a little early; those two dates are the accurate version.

### bestax

This is the one I work on, and it's where August went.

- `@allxsmith/bestax-bulma` went from 5.8 to 5.16. There are no new components, so the bestax column didn't move, but there's a lot of fit and finish:
  - **Modal** caught up with Dialog on accessibility: Escape closes it, the page stops scrolling behind it, focus moves in and comes back out, and it can portal out of a parent that clips it ([#617](https://github.com/allxsmith/bestax/issues/617)).
  - Refs now forward on Button, LinkButton, Modal, Dropdown, and Navbar.
  - Smaller Bulma-parity additions: `isFullwidth` on every full-width component, group sizes on Buttons, Tags, and Message, `isLight` on Tag, touch-only responsive viewports, and the white-bis and white-ter colors.
  - The CommonJS build ships as `.cjs` with its own type declarations, so `require()` and TypeScript both resolve it cleanly.
- Three tools grew up around the library:
  - **[`bestax-mcp`](/docs/guides/llms#mcp-server)** hit 1.0 on August 12. It's an MCP server that hands an AI coding agent the component docs, props, and examples.
  - An **[ESLint plugin](/docs/guides/getting-started/eslint-plugin)** hit 1.0 on September 20. It flags bestax code that doesn't do what it looks like it does, such as a helper prop value that quietly renders nothing.
  - The **[`bestax-migrate`](/docs/guides/getting-started/migration)** codemod already moved apps off react-bulma-components. It now handles [rbx](/docs/guides/getting-started/migration/rbx), [bloomer](/docs/guides/getting-started/migration/bloomer), and [plain Bulma class markup](/docs/guides/getting-started/migration/bulma-classes) too.

And one **correction** on my own column: the July table said bestax had no burger menu. `Navbar.Burger` was there the whole time. It's marked now.

## What Changed in the Table

The full matrix got long enough that it was hard to read inside a post, so it has moved to its own **[comparison page](/docs/guides/getting-started/compare)**. There you can pick the libraries and feature groups you care about, search for a component, and hide the rows where your picks all agree. From here on, each edition shows just what changed since the last one.

That's the table below. Highlighted cells changed (before → after), and the rest of each row is there for context. Most of it is the Chakra correction, plus new rows for an **action bar**, a **cascader**, and a **lightbox**, the capabilities that showed up since July. I also fixed a batch of doc links that had moved, so every cell opens a live page again. Hover any cell for the component name, or click it to open that component's docs.

<ComparisonChanges from={july2026} to={september2026} />

## What the Matrix Says

:::tip bestax is a superset of react-bulma-components
Within the Bulma world there isn't much of a contest. react-bulma-components covers Bulma core only and hasn't shipped since February 2022. bestax covers everything it does except Bulma's old `Tile` and a polymorphic `Element` primitive, and adds 41 more rows of the full matrix: date and time inputs, autocomplete, rating, tag input, slider, switch, Carousel, Steps, Avatar, Badge, Toast, Tooltip, Skeleton, Sidebar, Dialog, and Reveal, among others.
:::

A few honest takeaways across the wider field:

- **Mantine** still has the widest first-party catalog, and it's also the one moving fastest: a cascader, a lightbox, an action bar, and six chart types in two months.
- **Chakra UI** is a lot bigger than the last edition gave it credit for: DatePicker and the new DateInput, Carousel, Charts, TreeView, and Splitter. It's still the closest peer to bestax's prop-driven styling model. The big thing it doesn't ship is a data grid.
- **MUI** still owns heavy data and app-frame surfaces through its X packages (Data Grid, Charts, Tree View, and Date Pickers), plus FAB, Speed Dial, and Transfer List. This stretch was about accessibility, not new surface.
- **React-Bootstrap** is still the smallest set: a faithful Bootstrap wrapper with no date or time pickers, rating, autocomplete, stepper, or tag input.
- **bestax** covers the mainstream set and adds the Bulma layout pieces most libraries leave to composition: Hero, Level, Media, Section, and Panel. The gaps worth knowing about: no popover, hover card, accordion, date range picker, or data grid.

:::note shadcn/ui plays by different rules
shadcn/ui looks broad because it's a **copy-paste registry**, not an npm dependency. Its behavior comes from Base UI, Radix, or React Aria, plus cmdk, TanStack Table, and react-day-picker. You own the code it drops into your project. That's powerful, and it's a different maintenance model from everything else here.
:::

## Corrections Welcome

I compile this by hand from each library's source and docs, and this edition shows it has edges: it fixes a Chakra column that undersold Chakra by a lot, and a cell in my own column. It's meant to be honest, not perfect.

:::caution Spot something off?
Please [open an issue](https://github.com/allxsmith/bestax/issues). Corrections make the next edition better.
:::

## One Last Track

Since you made it to the end, a confession: this series was never really named after React. It's named after [_A State of Trance_](https://www.astateoftrance.com/), Armin van Buuren's weekly radio show, which turns 25 this year. Armin and Gryffin are my two favorite DJs, so here's what they've been up to while I was busy missing deadlines.

- **Armin van Buuren** just put out "[Take Me Home](https://weraveyou.com/2026/09/armin-van-buuren-take-me-home-red-hot-chili-peppers-by-the-way-trance-armada/)" (September 25), a trance version of Red Hot Chili Peppers' "By the Way" that keeps the melody and rewrites the lyrics. He's also playing [five-hour sets every Monday at UNVRS in Ibiza](https://www.arminvanbuuren.com/2026/08/28/out-now-a-state-of-trance-ibiza-2026-mixed-by-armin-van-buuren/) through October 5, and the _A State of Trance_ festival is [back at Rotterdam Ahoy](https://www.edmsauce.com/2026/08/25/a-state-of-trance-locks-in-february-2027-dates-at-rotterdam-ahoy/) on February 26 and 27, 2027. The radio show aired [episode 1296](https://www.youtube.com/watch?v=hc14S3cdUtw) on September 24, so 1300 is about a month out.
- **Gryffin** teamed up with BUNT. on "[World Away](https://www.edmtunes.com/2026/07/gryffin-bunt-finally-team-up-on-world-away-with-inez/)," with vocals from Inez. It's a single off his fourth album, _ELEMENTS I_, which is due this fall. He also [headlines Red Rocks](https://www.redrocksonline.com/events/gryffin-1394914/) on November 13, with Oliver Heldens and AR/CO in support.

That's also why the cover says **B2B** this time. Two months, one set.

See you in the next one.
