---
slug: state-of-react-2026-11
title: 'The State of React: November 2026'
description: 'A November 2026 snapshot comparing bestax against Ant Design, Mantine, MUI, Chakra UI, shadcn/ui, React-Bootstrap, and react-bulma-components: Ant Design joins the table, and what each library shipped since October 13.'
authors: [asmith]
tags:
  [
    state-of-react,
    comparison,
    react,
    bulma,
    ant-design,
    mantine,
    mui,
    chakra,
    shadcn,
  ]
canonical_url: https://bestax.io/blog/state-of-react-2026-11
publish_to_devto: false
hide_table_of_contents: true
image: /img/state-of-react/2026-11.png
cover_image: /img/state-of-react/2026-11.png
---

import ComparisonChanges from '@site/src/components/ComponentComparison/Changes';
import october2026 from '@site/src/data/state-of-react/2026-10.json';
import november2026 from '@site/src/data/state-of-react/2026-11.json';

<img
  className="sor-cover"
  src="/img/state-of-react/2026-11.svg"
  alt="The State of React, November 2026, drawn as a synthwave radio-show cover: a glowing cyan React atom orbits a striped setting sun, equalizer bars rise along a pink horizon over a neon grid floor, THE STATE OF sits in gold above REACT in cyan and white, LIVE SET reads in the top left corner, EP. 004 in the top right, and a caption along the bottom reads November 2026, React component libraries, compared"
/>

Ant Design joins the table this month, so it's eight libraries now. The rest is a big stretch for bestax, a big Mantine release the day before this snapshot, and a command palette from Chakra.

:::info Snapshot: November 2026
This edition reflects each library **as of November 10, 2026** and covers everything since the [October edition](/blog/state-of-react-2026-10). The full matrix lives on its own [comparison page](/docs/guides/getting-started/compare), and the [latest edition of _The State of React_](/blog/tags/state-of-react) always has the freshest data.
:::

<!-- truncate -->

If you haven't read one of these before, _The State of React_ is a dated, side-by-side look at the mainstream React component libraries, capability by capability, with every cell linking to that library's own docs. I maintain [bestax](/docs/intro), a React component library for Bulma v1, so I've got a horse in this race. That's why every cell links out: you shouldn't have to take my word for any of it. It isn't affiliated with Devographics' annual State of React survey, which shares the name.

In the ring: **[bestax](/docs/intro)** (Bulma v1), **[react-bulma-components](https://react-bulma.dev/)** (the other Bulma wrapper), **[Ant Design](https://ant.design/)**, **[Mantine](https://mantine.dev/)**, **[MUI](https://mui.com/)**, **[Chakra UI](https://chakra-ui.com/)**, **[shadcn/ui](https://ui.shadcn.com/)**, and **[React-Bootstrap](https://react-bootstrap.netlify.app/)**.

## Ant Design Joins the Table

Leaving Ant Design out made this table look smaller than the real field. Its React package, [`antd`](https://www.npmjs.com/package/antd), had about 5.3 million npm downloads in the week of November 3. Of the other libraries here that you install as a dependency, only MUI's `@mui/material` had more, and Mantine's core package had about 3.7 million. The [repo](https://github.com/ant-design/ant-design) goes back to 2015 and calls it "an enterprise-class UI design language and React UI library." Its catalog reads that way, heavy on tables, forms, trees, and pickers.

How I filled in its column:

- It follows the current release, **6.7.0**, and the `antd` package first.
- Official companion packages count too, the same rule that counts Mantine's `@mantine/*` and MUI's `@mui/x-*`. That's `@ant-design/icons` for icons, [Ant Design X](https://x.ant.design/) for chat bubbles, agent traces, and code highlighting, and [Ant Design Charts](https://ant-design-charts.antgroup.com/) for charts and a gauge.
- Pro Components doesn't count. It's a layer of page-level business components built on top of `antd`, and its stable release only supports `antd` 4 and 5 anyway. Ant Design Mobile doesn't count either, since it's a separate library.
- A few 6.x deprecations decide cells. `Button.Group` gave way to `Space.Compact`, the input addons moved to `Space.Compact` and `Space.Addon`, and the `List` component gave way to `Listy`, so those are what the column links.

It lands on 140 of the 180 rows: 90 with a dedicated component and 50 through a prop, a mode, or a docs demo. That's the most ◐ cells of any column, and it says something about how Ant Design is built. It leans on a few big components with a lot of modes. `DatePicker` picks a month, a year, a week, or a quarter through its `picker` prop. `Select` does multi-select and tags through `mode`. `Typography` does copy buttons, keyboard keys, and text clamping through props.

It's the only library in the table with a dedicated [transfer list](https://ant.design/components/transfer/), and it's one of two with a [cascader](https://ant.design/components/cascader/), a [product tour](https://ant.design/components/tour/), and a speed dial. Where it's empty is mostly the low-level pieces: no portal, focus trap, or transition primitive you can use on their own, no CSS grid, scroll area, or container, and no command palette. It hands you the finished component, not the parts to build your own.

Some names will trip you up if you're coming from elsewhere. `Anchor` is a table of contents, `message` and `notification` are toasts, `Space` is a gap container, `Layout` is the app shell, and `Empty` is the empty state.

As for this month, [6.7.0](https://github.com/ant-design/ant-design/releases/tag/6.7.0) (November 4) adds no components, but it has a long list of props and accessibility work. It adds a `suffix` prop that replaces `suffixIcon` on the pickers and selects, accessible names for clear buttons, keyboard and screen reader fixes in DatePicker, TimePicker, Select, and Table's row selection, and a `shimmer` prop on Typography. [6.6.7](https://github.com/ant-design/ant-design/releases/tag/6.6.7) (October 20) and [6.6.8](https://github.com/ant-design/ant-design/releases/tag/6.6.8) (October 26) are fixes.

To see the whole column, [filter the comparison page to bestax and Ant Design](/docs/guides/getting-started/compare?libs=bestax,antd), or add whichever libraries are on your own shortlist.

## What Shipped since October

### Mantine

Mantine shipped the most again, and most of it came out the day before this snapshot.

- **[9.8.0](https://github.com/mantinedev/mantine/releases/tag/9.8.0)** (November 9) added a pile of components:
  - **[Mentions](https://mantine.dev/core/mentions/)**, a textarea that opens suggestions when you type `@` or another trigger.
  - **[PhoneInput](https://mantine.dev/core/phone-input/)**, an international phone field with a country selector and formatting masks. Flags aren't bundled, so you draw them with `renderFlag`.
  - **[Diff](https://mantine.dev/code-highlight/diff/)** in `@mantine/code-highlight`, which compares two strings in a unified or side-by-side view.
  - **[WeekPicker](https://mantine.dev/dates/week-picker/)** and **[QuarterPicker](https://mantine.dev/dates/quarter-picker/)**, each with an input version, plus **[MaskedDateInput](https://mantine.dev/dates/masked-date-input/)**, which types a date into separate masked fields for the day, month, and year.
  - A new **`@mantine/emoji`** package with an [EmojiPicker](https://mantine.dev/emoji/emoji-picker/), an input, and a popover. It ships no emoji data, so you install a data package and pass it in ([getting started](https://mantine.dev/emoji/getting-started/)).
- One behavior change to know before you upgrade: the `@mantine/dates` pickers now return focus to the input when the dropdown closes. That's usually what you want, but a test that checks focus after closing may notice.
- [9.7.3](https://github.com/mantinedev/mantine/releases/tag/9.7.3) (October 17), [9.7.4](https://github.com/mantinedev/mantine/releases/tag/9.7.4) (October 25), and [9.7.5](https://github.com/mantinedev/mantine/releases/tag/9.7.5) (November 4) are fixes plus small opt-in props, like `loaderProps` on every input.

### MUI

No new components this stretch, and no Material UI release at all.

- **Material UI** is still on [v9.5](https://github.com/mui/material-ui/releases/tag/v9.5.0) from October 9, with v10.0.0-alpha.0 on npm's `next` tag. MUI's main branch has picked up more breaking changes for v10 since that alpha. The biggest is that Stack, and the action rows in Dialog, Card, and Accordion, now [space their children with CSS `gap`](https://github.com/mui/material-ui/pull/49728), so Stack's `useFlexGap` prop goes away. None of it is published yet, and I still haven't seen a date for v10.
- **MUI X** shipped [v9.16](https://github.com/mui/mui-x/releases/tag/v9.16.0) (October 20) and [v9.17](https://github.com/mui/mui-x/releases/tag/v9.17.0) (October 30). Charts Premium can export to Excel, Data Grid Premium has computed columns, and Data Grid Pro's row and column reordering now works with touch and a pen.
- The Scheduler got a confirmation before deleting an event and right-to-left support. If you're already on its beta, though, the one in 9.17 has breaking changes: recurring events in the Event Timeline are opt-in now, and `dateLocale` takes a locale string instead of a date-fns object. The Scheduler is still in beta, and Chat is still in alpha.

### Chakra UI

The release that was waiting last month shipped.

- **[3.38.0](https://github.com/chakra-ui/chakra-ui/releases/tag/%40chakra-ui%2Freact%403.38.0)** (November 3) added **[Command](https://chakra-ui.com/docs/components/command)**, a searchable command menu that works inline or in a dialog, along with a `useHotkeys` hook to open it with a shortcut and `KbdGroup` to show the shortcut's keys.
- The [announcement](https://chakra-ui.com/blog/chakra-3.38-command) calls it backward compatible with two things to check. `Field.ErrorText` now links to its field through `aria-describedby`, so a test using `toHaveAccessibleErrorMessage` should switch to `toHaveAccessibleDescription`. And `Popover.Title` renders an `h2` now.
- The v2-to-v3 codemod was rebuilt too, with a dry run and new transforms.
- On v4, still no date and no beta. The [v4 discussion](https://github.com/chakra-ui/chakra-ui/discussions/10959) was rewritten into a plan on October 31: Panda as the only styling engine, no Emotion in core, and Server Components without a provider. It still waits on a stable v6 of [Ark UI](https://github.com/chakra-ui/ark/releases), which is at its first prerelease from October 6.

### shadcn/ui

One [changelog entry](https://ui.shadcn.com/docs/changelog/2026-10-ai-elements) this stretch, on October 14, and it's all about UI for AI agents.

- **[Trace](https://ui.shadcn.com/docs/components/base/trace)** lists the steps an agent takes, like reasoning, tool calls, and sources, with running and error states.
- **[Code Block](https://ui.shadcn.com/docs/components/base/code-block)** shows code, terminal output, logs, and diffs. Syntax highlighting is an opt-in hook.
- **[AI Elements](https://ui.shadcn.com/docs/ai-elements)** are 21 copy-in patterns built from those two and the rest of the registry: chat, a prompt input, reasoning, plans, a file tree, and more. shadcn says they replace AI SDK Elements, which it plans to deprecate.
- The CLI shipped [4.21.5](https://github.com/shadcn-ui/ui/releases/tag/shadcn%404.21.5) through [4.23.0](https://github.com/shadcn-ui/ui/releases/tag/shadcn%404.23.0). If you only run the CLI, nothing changes. If you import from the package, [4.22.0](https://github.com/shadcn-ui/ui/releases/tag/shadcn%404.22.0) moved its schemas to Zod 4, and 4.23.0 moved its MCP server to version 2 of the MCP SDK.

### React-Bootstrap

A little movement. **[v3.0.0-beta.6](https://github.com/react-bootstrap/react-bootstrap/releases/tag/v3.0.0-beta.6)** (October 22) is two bug fixes, and it's the first v3 prerelease in 13 months. The stable release is still 2.10.10 from May 2025.

Last month I said the newest commit on the main branch was from April. That's out of date now. From October 25 to 31 the maintainers merged [a week of work](https://github.com/react-bootstrap/react-bootstrap/commits/master), including two breaking v3 fixes: Navbar no longer forces the light variant, which fixes it on dark themes, and stacked progress bars get Bootstrap's own wrapper. None of it is released yet.

### react-bulma-components

No change. The last release is still 4.1.0 from February 2022, built for Bulma 0.9, and the [last commit](https://github.com/couds/react-bulma-components/commits) is still from January 2024.

### bestax

This is the one I work on, and it was a big month. The October edition ended with a list of gaps in my own column: a data grid, a tree view, a command palette, a color picker, charts, a dropzone, and a rich text editor. Five of those seven shipped.

- `@allxsmith/bestax-bulma` went from 5.31 to 5.67, with 36 new components. The ones that closed October's gaps:
  - **[DataTable](/docs/api/components/datatable)**, a table you can sort, search, page, and select, built on the `Table` parts. Its `useDataTable` hook is public, and it can write its rows out as CSV.
  - **[TreeView](/docs/api/components/treeview)**, with checkbox modes and branches that load their children, and **[TreeSelect](/docs/api/form/treeselect)**, a form field that picks from one.
  - **[Command](/docs/api/components/command)**, a search over things to do, inline or as a command palette.
  - **[ColorPicker](/docs/api/form/colorpicker)**, **[ColorInput](/docs/api/form/colorinput)**, and **[ColorSwatch](/docs/api/elements/colorswatch)**.
  - **[Dropzone](/docs/api/form/dropzone)**, an area to drop files on that checks and lists them.
- More form controls: [SegmentedControl](/docs/api/components/segmentedcontrol), [Combobox](/docs/api/form/combobox), [PinInput](/docs/api/form/pininput), [PasswordInput](/docs/api/form/passwordinput), [CheckboxCard](/docs/api/form/checkboxcard) and [RadioCard](/docs/api/form/radiocard), and [Fieldset](/docs/api/form/fieldset).
- Layout: [AppFrame](/docs/api/layout/appframe), the frame an app's pages sit in, plus [Stack](/docs/api/layout/stack), [Group](/docs/api/layout/group), [Center](/docs/api/layout/center), [Flex](/docs/api/layout/flex), [Splitter](/docs/api/layout/splitter), [ScrollArea](/docs/api/components/scrollarea), and [Affix](/docs/api/components/affix).
- Showing data: [Timeline](/docs/api/components/timeline), [DescriptionList](/docs/api/elements/descriptionlist), [Stat](/docs/api/elements/stat) and [Stats](/docs/api/elements/stats), [NumberFormatter](/docs/api/elements/numberformatter), [RingProgress](/docs/api/elements/ringprogress), [Kbd](/docs/api/elements/kbd), [EmptyState](/docs/api/components/emptystate), [Lightbox](/docs/api/components/lightbox), and [TableOfContents](/docs/api/components/tableofcontents).
- Buttons: [IconButton](/docs/api/elements/iconbutton), which requires a name, and [CopyButton](/docs/api/elements/copybutton).
- [LocaleProvider](/docs/api/helpers/localeprovider) sets the language and writing direction, and the date pickers, number formatting, and search matching all read it.
- For Next.js, the client modules are marked `'use client'` now, so a Server Component can import bestax, and the parts of compound components like `Card.Header` are exported by name for the places a Server Component can't reach them ([setup](/docs/guides/getting-started/react-setups#nextjs)).
- The tools kept going too:
  - **[create-bestax](/docs/guides/intro#create-a-bestax-app)** went from 4.2 to 4.7, with templates for React Router, TanStack Router, the Next.js App Router, and the React Compiler. New projects lint with Oxlint, with ESLint one flag away, and the TypeScript ones get TypeScript 7.
  - **[`bestax-migrate`](/docs/guides/getting-started/migration/bulma-classes#from-an-html-page)** converts a whole Bulma HTML page now, not just JSX that uses Bulma classes.
  - The docs have a **[Templates page](/templates)** with Bulma templates rebuilt with bestax, and live examples open in StackBlitz or CodeSandbox.

Charts and a rich text editor are still missing, and five of the six rows Mantine's release added are gaps in my column too. The sixth, a phone input, is only an example on the Input page. The [order I'm working through them in](https://github.com/allxsmith/bestax/issues/778) is public.

## What Changed in the Table

The table below shows only the rows that moved since October. Highlighted cells changed because something shipped: 35 cells in bestax's column, Chakra's Command, and shadcn/ui's Code Block. There are no corrected cells this time.

Twelve rows are **new**, and they're not all the same kind of new:

- Six are from Mantine's 9.8.0: mentions, a phone input, an emoji picker, a diff viewer, a week picker, and a quarter picker. Most of the other marks on those rows were already there. Ant Design's `Mentions` and its week and quarter modes, for example, predate the release. The exception is shadcn/ui's diff lines, which came with this month's Code Block.
- Two shipped this month too: bestax's Stat (Chakra already had one) and shadcn/ui's Trace.
- Four are **matrix additions**, things Mantine was already shipping in October that had no row: a masked input, a JSON viewer, a rolling number, and a product tour.

The Ant Design column shows up on every row. It's new, so on the rows October already had there's nothing to compare it against, and its cells there aren't highlighted.

One row got a new name, too. `Affix (sticky)` is now `Affix (fixed or sticky)`, since Mantine's Affix, and now bestax's, pins an element to a corner of the viewport rather than making it sticky. It's a rename, so the table compares the row with its old self, and the change in bestax's cell is the new Affix component.

Hover any cell for the component name, or click it to open that component's docs.

<ComparisonChanges from={october2026} to={november2026} />

## What the Matrix Says

:::tip bestax is a superset of react-bulma-components
Within the Bulma world there isn't much of a contest. react-bulma-components covers Bulma core only and hasn't shipped since February 2022. bestax covers everything it does except Bulma's old `Tile` and an unstyled `Element` primitive, and adds 83 more rows of the full matrix: date, range, and time inputs, autocomplete, a data table, a tree view, a command palette, a color picker, a dropzone, Carousel, Steps, Toast, Tooltip, Popover, Timeline, and AppFrame, among others.
:::

A few honest takeaways across the wider field:

- **Mantine** still has the widest first-party catalog, 163 of 180 rows, and it's still the one moving fastest. Six of this edition's new rows exist because of one Mantine release.
- **Ant Design** comes in at 140 rows, close to Chakra and bestax, but it gets there differently: fewer components, each with more modes. If your app is a back office full of tables, forms, and trees, it's built for exactly that.
- **MUI** still owns the heavy data and app surfaces through its X packages: Data Grid, Charts, Tree View, Date Pickers, and the Scheduler beta. This stretch was features in X and no Material UI release, with v10 still an alpha.
- **Chakra UI** closed its command palette gap with Command. It's still the closest peer to bestax's prop-driven styling model, and it still has no dedicated data grid.
- **React-Bootstrap** is still the smallest set, a faithful Bootstrap wrapper, but its main branch is moving again.
- **bestax** covers 143 rows now, with 121 dedicated components. That puts it second by count, but I pick the rows, so take the count lightly. What it adds that most libraries leave to composition are the Bulma layout pieces: Hero, Level, Media, Section, and Panel. The gaps worth knowing about: charts, a rich text editor, an event calendar, a transfer list, a product tour, and Mantine's new inputs.

:::note shadcn/ui plays by different rules
shadcn/ui looks broad because it's a **copy-paste registry**, not an npm dependency. Its behavior comes from Base UI, Radix, or React Aria, plus cmdk, TanStack Table, and react-day-picker. You own the code it drops into your project. That's powerful, and it's a different maintenance model from everything else here.
:::

## Corrections Welcome

I compile this by hand from each library's source and docs, and a whole new column is the likeliest place for me to have gotten something wrong. A fix lands on the [comparison page](/docs/guides/getting-started/compare) first, and the next edition marks it as a correction.

:::caution Spot something off?
Please [open an issue](https://github.com/allxsmith/bestax/issues). Corrections make the next edition better.
:::

## One Last Track

The series is named after [_A State of Trance_](https://www.astateoftrance.com/), Armin van Buuren's weekly radio show, so each edition ends with what Armin and Gryffin, my two favorite DJs, have been up to.

- **Armin van Buuren** got to episode 1300 of the radio show on October 22, with a 13-hour [ADE special](https://www.astateoftrance.com/listen-now-asot-1300-ade-special/) live from Amsterdam, and fans got [their first listen](https://weraveyou.com/2026/10/armin-van-buuren-asot-2027-anthem-asot-1300-ade/) of the ASOT 2027 anthem during it. Its name isn't settled yet: the show's own tracklists have called it both "Into The Known" and "[Into The Unknown](https://www.astateoftrance.com/listen-now-asot-1302/)." The Los Angeles festival from last month [got its shape](https://www.edmtunes.com/2026/10/19/asot-los-angeles/): three stages, produced with Insomniac, tickets on sale since October 22, and [no lineup yet](https://festival.astateoftrance.com/losangeles/). Two new tracks came out: OMIKI's remix of "[Sunny Days](https://music.apple.com/us/album/sunny-days-feat-josh-cumbee-single/6818567321)" (October 23) and "[What If I Told You](https://weraveyou.com/2026/10/armin-van-buuren-douwe-bob-what-if-i-told-you/)" with Douwe Bob (October 30), which they first played to 40,000 people at AMF on October 24. And _Piano_, his acoustic album, [won the Edison public prize](https://weraveyou.com/2026/10/armin-van-buuren-edison-klassiek-publieksprijs-piano/) for classical music on October 29. One I missed last time: DJ Mag's Top 100 came out on October 6, with Armin at [No. 7](https://www.technoairlines.com/blog/dj-mag-top-100-djs-2026-results) and named the world's No. 1 trance DJ.
- **Gryffin** didn't put out anything new this stretch. Last month I said he was between releases, but the [orchestral edit of "World Away"](https://music.apple.com/us/album/world-away-orchestral-edit-feat-bunt-single/6819430330) had come out October 9, so that wasn't quite right. _ELEMENTS I_ still doesn't have a date I can find. The Los Angeles show grew to two nights, and he [apologized](https://exronmusic.com/2026/10/27/gryffin-issues-apology-exposition-park-venue-issues/) on his Instagram story for the long lines getting in. The run [finishes at Red Rocks](https://www.redrocksonline.com/?p=21722) this Friday, November 13, with Oliver Heldens, AR/CO, and Ember.

The cover stays on **LIVE SET**, one month again.

See you in the next one.
