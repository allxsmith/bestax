---
slug: state-of-react-libs-2026-07
title: 'A State of React Libs — July 2026'
description: 'A dated, linkable snapshot comparing bestax against Mantine, MUI, Chakra UI, shadcn/ui, React-Bootstrap, and react-bulma-components — capability by capability, with every cell linking to the real docs.'
authors: [asmith]
tags:
  [state-of-react-libs, comparison, react, bulma, mantine, mui, chakra, shadcn]
canonical_url: https://bestax.io/blog/state-of-react-libs-2026-07
publish_to_devto: false
hide_table_of_contents: true
image: /img/state-of-react-libs/2026-07.png
cover_image: /img/state-of-react-libs/2026-07.png
---

import ComponentComparison from '@site/src/components/ComponentComparison';

<img
  className="sorl-cover"
  src="/img/state-of-react-libs/2026-07.svg"
  alt="A State of React Libs — July 2026: React component libraries, compared"
/>

Picking a React component library is one of the bigger architectural calls in a project, and the honest answer to “which one” depends entirely on what you’re building. We maintain [bestax](/docs/intro), a component library for Bulma v1, so we spend a lot of time studying the field. This post maps it out **fairly and in the open**: every user-facing capability across seven React libraries, with each cell linking straight to that library’s own documentation so you can check our work.

It’s a point-in-time capture — the first edition of something we plan to refresh regularly. Call it _A State of React Libs_ (with apologies to Armin).

:::info Snapshot — July 2026
The table below reflects each library **as of July 27, 2026**. Component catalogs move fast; for the newest edition, see [the latest **A State of React Libs**](/blog/tags/state-of-react-libs).
:::

In the ring: **[bestax](/docs/intro)** (Bulma v1), **[react-bulma-components](https://react-bulma.dev/)** (the other Bulma wrapper), **[Mantine](https://mantine.dev/)**, **[MUI](https://mui.com/)**, **[Chakra UI](https://chakra-ui.com/)**, **[shadcn/ui](https://ui.shadcn.com/)**, and **[React-Bootstrap](https://react-bootstrap.netlify.app/)**.

<!-- truncate -->

Each row is a capability; read across to see who ships it. **✓** is a dedicated component, **◐** is available via a prop or by composition, and a muted dash means no first-party equivalent. The columns are abbreviated (hover a header for the full name); **hover any cell for the component name, or click it** to open that component’s docs.

<ComponentComparison />

## What the matrix says

:::tip bestax is a superset of react-bulma-components
Within the Bulma world there isn’t much contest left. `react-bulma-components` covers Bulma-core only and has been inactive since ~2021. bestax matches essentially all of it (bar Bulma’s `Tile`) and adds roughly 50 more components — date/time pickers, autocomplete, rating, tag input, slider, switch, Carousel, Steps, Avatar, Badge, Toast, Tooltip, Skeleton, Sidebar, Dialog, and Reveal.
:::

A few honest takeaways across the wider field:

- **Mantine** has the widest first-party catalog — rich inputs (color, PIN, JSON), plus Spotlight, ScrollArea, HoverCard, and a full app-shell layout system.
- **MUI** owns heavy data and app-frame surfaces through its X packages: Data Grid, Charts, Tree View, and Date Pickers, plus FAB, Speed Dial, and Transfer List.
- **Chakra UI** is the closest peer to bestax’s prop-driven styling model and is deep on form controls — but ships **no** date pickers, charts, carousel, or data grid.
- **React-Bootstrap** is the smallest set: a faithful Bootstrap wrapper with no date/time pickers, rating, autocomplete, stepper, or tag input.
- **bestax** covers the mainstream set and adds Bulma-idiomatic layout — Hero, Level, Media, Section, Panel — that most libraries leave to composition.

:::note shadcn/ui plays by different rules
shadcn/ui looks broad because it’s a **copy-paste registry**, not an npm dependency: its behavior comes from Radix UI, cmdk, TanStack Table, and react-day-picker. You own the code it drops into your project — powerful, but a different maintenance model than the others here.
:::

## Corrections welcome

We compiled this by hand from each library’s component source and documentation, so it will have edges — a mislabelled cell, a capability we scoped wrong, or a competitor link that’s drifted. It’s meant to be honest, not perfect.

:::caution Spot something off?
Please [open an issue](https://github.com/allxsmith/bestax/issues) — corrections make the next edition better.
:::

See you in the next one.
