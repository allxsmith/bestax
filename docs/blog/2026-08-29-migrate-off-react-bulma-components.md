---
slug: migrate-off-react-bulma-components
title: Escape an Unmaintained Bulma Library
description: 'react-bulma-components stopped shipping in 2022 and still targets Bulma 0.9. Here is the codemod that moves a React app onto Bulma v1, and what it does when it cannot be sure.'
authors: [asmith]
tags: [migrate, bulma, react, codemod]
canonical_url: https://bestax.io/blog/migrate-off-react-bulma-components
publish_to_devto: true
image: /img/migrate-off-react-bulma-components.png
cover_image: /img/migrate-off-react-bulma-components.png
---

![Escape an Unmaintained Bulma Library, drawn as pixel art: a robot wheels a cart stacked with component crates labeled Card, Hero, and Form out of a dim cobwebbed doorway marked 2022 and toward a glowing teal archway marked Bulma v1](/img/migrate-off-react-bulma-components.svg)

So you've got a React app built on react-bulma-components. It works. It also hasn't had a release since 2022, it targets Bulma 0.9, and every v1 feature you actually want (CSS variables, dark mode that just happens, the Grid components) sits on the far side of a rewrite nobody has budget for.

<!-- truncate -->

Here's the good news: most of that rewrite is mechanical. bestax-bulma is our React component library for Bulma v1, and it covers nearly all of the same component surface. Same Bulma, newer Bulma. So the work is mostly renaming things, and renaming things is what computers are for.

That's `bestax-migrate`: a codemod that reads your source, rewrites what it can prove, and tells you about everything it can't. This post walks a real migration, including the parts the tool refuses to do for you.

## One Command

Start with the dry run. It writes nothing.

```bash
pnpm dlx bestax-migrate react-bulma-components src/ --dry
```

You get a summary of what would change and a report of everything left over. Happy with it? Drop the flag:

```bash
pnpm dlx bestax-migrate react-bulma-components src/
```

`npx bestax-migrate` and `yarn dlx bestax-migrate` work the same way. The codemod needs Node 22 or newer, which is a fact about the machine running it, not about your app: your source is read as text and never executed.

Then run your formatter. The codemod rewrites syntax, it doesn't style it, and every snippet in this post is shown the way prettier leaves it.

The rest of the flag surface is small:

| Flag                            | What it does                                                |
| ------------------------------- | ----------------------------------------------------------- |
| `--dry`, `-d`                   | Report what would change without writing files              |
| `--print`, `-p`                 | Echo transformed sources to stdout                          |
| `--extensions`, `-e`            | Which files to consider (default `js,jsx,ts,tsx,scss,sass`) |
| `--css <mode>`                  | Stylesheet target: `bestax` (default), `bulma`, or `keep`   |
| `--no-deps`                     | Skip the `package.json` update                              |
| `--telemetry`, `--no-telemetry` | Turn the opt-in anonymous usage event on or off             |

One thing worth knowing up front: the run exits 0 even when it leaves work behind. Leftover TODOs are the expected output of a careful migration, not a failure, and your CI shouldn't treat them as one.

## What It Transforms

![What the codemod transforms, drawn as pixel art: three grey label plates reading renderAs, Form.Textarea, and mobile size 4 feed into a lit machine marked bestax migrate, and emerge on the right as teal plates reading as, TextArea, and sizeMobile 4, all riding a conveyor belt across the bottom](/img/migrate-off-react-bulma-components-transforms.png)

Under the hood it's [jscodeshift](https://github.com/facebook/jscodeshift) for anything JavaScript-shaped, plus a separate line-based pass for stylesheets. Seven categories of change:

| Category               | What changes                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| **Imports**            | The package specifier, including namespace imports and the `const { Input } = Form` destructure |
| **Components**         | Renames and compound reshuffles, like `Form.Textarea` to `TextArea`                             |
| **Props**              | `renderAs` to `as`, boolean modifiers gain their prefixes, numeric sizes become string unions   |
| **Responsive objects** | `mobile={{ size: 4 }}` flattens to `sizeMobile={4}`                                             |
| **Structure**          | Patterns bestax models differently: `Table.Container`, Navbar dropdowns, icon-font children     |
| **Stylesheets**        | Bulma 0.9's `@import` and `$var` overrides become the v1 module system                          |
| **Dependencies**       | Your `package.json`, rewritten but never installed                                              |

Nine lines of real input, taken from the codemod's own test fixtures:

```tsx
import * as Bulma from 'react-bulma-components';

export const Note = () => (
  <Bulma.Box textAlign="center" mt={4}>
    <Bulma.Tag color="info" rounded>
      New
    </Bulma.Tag>
  </Bulma.Box>
);
```

and what comes back:

```tsx
import { Box, Tag } from '@allxsmith/bestax-bulma';

export const Note = () => (
  <Box textAlign="centered" mt="4">
    <Tag color="info" isRounded>
      New
    </Tag>
  </Box>
);
```

Three different conversions in nine lines. The namespace import collapsed into named imports of only what the file uses. `textAlign="center"` became `"centered"`, because that's the value Bulma v1 wants. And `mt={4}` became `mt="4"`, because bestax spacing props are string unions. That last one is the kind of change you'd never finish by hand across a real app, and would never get right by find-and-replace.

The compound components are where the tedium really lives, and they're all table-driven:

- `Card.Footer.Item` becomes `Card.FooterItem`
- `Hero.Footer` becomes `Hero.Foot`
- `Media.Item align="left"` becomes `MediaLeft`
- `Heading subtitle` becomes `SubTitle`, and plain `Heading` becomes `Title`
- `Image size={64}` becomes `size="64x64"`

Every one of react-bulma-components' 32 exports has an entry in that table, and so does each of their 57 compound sub-components. Most convert outright. A handful convert with caveats. Two of them, `Element` and `Tile`, have no bestax equivalent at all, which brings us to the interesting part.

## When It Can't Be Sure

![The codemod refusing to guess, drawn as pixel art: a dark code editor panel with rows of muted code, one row highlighted in yellow and reading TODO(bestax-migrate), a yellow flag planted beside that row, and a robot with yellow eyes standing at the right](/img/migrate-off-react-bulma-components-todo.png)

A codemod that rewrites your source in place has exactly one way to lose your trust, and that's guessing. So this one has a rule: never a silent skip, and never a best-guess rewrite of a value it can't see. When it isn't sure, it says so, in a comment on the code and again in the report.

Watch it do both things at once:

```tsx
<Columns.Column
  mobile={{ size: 12 }}
  tablet={{ size: 6, narrow: true }}
  desktop={{ size: 4, offset: 2 }}
  touch={{ size: 10 }}
>
  Side
</Columns.Column>
```

```tsx
// TODO(bestax-migrate): no bestax-bulma helper variants for the `touch` breakpoint; restyle with CSS or drop it
<Column
  touch={{ size: 10 }}
  sizeMobile={12}
  sizeTablet={6}
  isNarrowTablet
  sizeDesktop={4}
  offsetDesktop={2}
>
  Side
</Column>
```

Three of the four breakpoint objects flattened cleanly. The fourth, `touch`, has no equivalent in bestax, so it was left exactly where it was, with a comment naming the problem and a suggested way out. Not deleted, not approximated into something that looks close. Left alone, and reported.

Every one of those comments also lands in the run's report, grouped by rule and sorted by how often it fired. Here's a slice of a real run against the project's own kitchen-sink fixture app:

```text
bestax-migrate — react-bulma-components (v4) → @allxsmith/bestax-bulma (dry run)
10 file(s) scanned, 10 transformed, 31 TODO(s) left

  ...

  responsive (2)
    fixtures/kitchen-sink/src/leftovers.tsx:45 — no bestax-bulma helper variants for the `touch` breakpoint; restyle with CSS or drop it
    fixtures/kitchen-sink/src/leftovers.tsx:45 — no bestax-bulma helper variants for the `untilWidescreen` breakpoint; restyle with CSS or drop it

  prop:renderAs (2)
    fixtures/kitchen-sink/src/leftovers.tsx:45 — `renderAs` — this bestax component has no `as` prop; restructure the element instead
    fixtures/kitchen-sink/src/leftovers.tsx:49 — `renderAs` — this bestax component has no `as` prop; restructure the element instead
```

The same restraint shows up everywhere it matters:

- **Components with no replacement are kept, not dropped.** `Element` and `Tile` have nothing to migrate to, so the codemod leaves a trimmed import of the old library behind, carrying just those two, with a TODO on it. That's what makes this a migration instead of a big-bang rewrite. One wrinkle worth knowing: the same run drops `react-bulma-components` from your `package.json`, so a clean install won't resolve that retained import. Clear those two TODOs before you install, or hold the manifest back with `--no-deps` until you have.
- **Dynamic values go through where they safely can.** A pure rename carries an expression straight across, so `loading={busy}` comes out as `isLoading={busy}`. The codemod only stops when the conversion depends on what the value actually _is_: when the prop decides which component you end up with, or which modifier lands, an expression it can't evaluate earns a TODO rather than a guess.
- **Files it can't parse are reported, not skipped.** An `.astro`, `.vue`, `.svelte`, or `.mdx` file that imports the old library shows up in the report as `unsupported-file`. It never gets quietly passed over.
- **Computed Sass stays put.** A variable defined by a function call rather than a literal is preserved with a TODO instead of being folded into a config it might break.

## Your Stylesheets Move Too

Bulma v1 replaced the old `@import` world with the Sass module system, which means a 0.9-era stylesheet doesn't just need new variable names, it needs a new shape. That transform runs too. Before:

```scss
$primary: #1e6b99;
$family-primary: 'Nunito', sans-serif;

@import 'bulma/bulma.sass';

.app-shell {
  min-height: 100vh;
}
```

After:

```scss
@use 'bulma/sass' with (
  $primary: #1e6b99,
  $family-primary: (
    'Nunito',
    sans-serif,
  )
);
@use '@allxsmith/bestax-bulma/scss/extras';

.app-shell {
  min-height: 100vh;
}
```

Your overrides moved from loose `$var` declarations into the `with (...)` configuration clause, where v1 expects them, and your own rules came along untouched. The `--css` flag picks the target. `bestax`, the default, is what you just saw in Sass: Bulma v1 and the bestax extras as two `@use` lines. A plain CSS import gets the same pairing as the single `bestax.css` bundle instead. `bulma` gives you stock Bulma if you'd rather keep the original look, and in a plain CSS import it pulls the extras in alongside, because the themed Radio and Checkbox need them. `keep` is the minimal option: it leaves your stylesheet choices where they are, apart from react-bulma-components' own bundle, which no longer exists at all, so that one becomes Bulma v1 with a TODO attached.

Your `package.json` gets the same treatment. The old library comes out, bestax-bulma goes in, Bulma moves up to v1, and the long-dead `node-sass` is swapped for dart `sass`. The codemod never runs an install, so nothing reaches the network on your behalf and the next step is always yours. It even sniffs your existing indentation before writing, so the diff stays limited to the dependencies that actually changed.

## Safe by Design

![The supply-chain posture, drawn as pixel art: on the left a sealed cabinet plated TEXT ONLY holds lines of source behind locked glass, on the right a shelf unit labeled node_modules holds teal bestax and bulma crates beside jscodeshift and chalk, and its bottom shelf is an empty dashed outline reading no slot here, with a robot standing between them](/img/migrate-off-react-bulma-components-supply-chain.png)

Here's a thing that sounds like a small detail and isn't: **react-bulma-components is never installed anywhere in this project.** Not as a dependency, not as a dev dependency, not transitively. It's absent from the lockfile entirely.

That takes some doing, because you can't map an API you can't see. The answer is that the old library's public surface is vendored as plain data, transcribed from its type declarations, and the test fixtures are read as text. Nothing from an unmaintained package is ever installed, executed, or typechecked here. What does get typechecked is the migration's output, against the real bestax types, which is the half that has to be correct.

There's a second check that runs against the real world. The old library's own Storybook stories are MIT licensed, so the project fetches them at a pinned commit, as text, and runs the codemod over all of them to see what breaks. It's a nice detail that the pinned commit is from January 2024, which tells you plenty about the state of the library on its own. That check deliberately isn't part of CI, because CI shouldn't be reaching out to third-party repositories on every pull request. It's a gate that gets run locally before releases and after any change to the mapping table.

The tool itself ships with signed provenance and publishes through short-lived credentials, so there's no long-lived token sitting around to be stolen. And it can send a single anonymous event about the shape of a run, only if you opt in when it asks. `--no-telemetry` switches it off, and so do `DO_NOT_TRACK=1` and `BESTAX_TELEMETRY=0` as long as you haven't passed a flag, because an explicit flag on the command line is resolved before either of them.

## Finish the Job

The codemod does the mechanical part and hands you a list. Two things are built to work through that list with you.

**The skill**, if you use a coding agent. It drives the codemod and then resolves the TODOs it left, using reference files for the component map, the prop map, the stylesheet migration, and the cases with no clean answer.

```bash
npx skills add https://github.com/allxsmith/bestax --skill bestax-migrate
```

**The MCP server**, which serves that same skill as a prompt, and adds the thing a half-migrated file actually makes you want: the target API, on demand. What props does `Navbar.Brand` take now? Which CSS variables does this component read? It answers offline from an index built for one specific release, and it checks which version your project actually resolved, so when the two drift far enough apart to matter, a minor or a major, it says so instead of confidently describing props you don't have.

```bash
claude mcp add bestax -- npx -y bestax-mcp@1
```

One more thing worth saying plainly: react-bulma-components is the only source library supported today. The architecture takes as many as we care to write, and each one registers itself the same way, but a seam isn't a promise. If you're stranded on a different React Bulma package, [say which one](https://github.com/allxsmith/bestax/issues/new?template=feature-request.md) and we'll know it's worth building.

## Documentation

- [Migrating from react-bulma-components](/docs/guides/getting-started/migration/react-bulma-components), the full walkthrough, including a table of the recurring TODOs and what to do about each
- [Bulma 0.9 to v1](/docs/guides/getting-started/migration/bulma-0-9-to-1), for the styling changes that aren't code-level
- [The bestax-migrate skill](/docs/skills/migrate) and [the rest of the skills](/docs/skills/intro)
- [Telemetry](/docs/guides/telemetry), every field and every control
- [Grid](/docs/api/grid), where tiles went

An unmaintained dependency isn't a crisis, it's a chore, and chores are worth automating. Run the dry run on a branch, read the report, and see how much of yours is already done. The [blog plan](https://github.com/allxsmith/bestax/issues/384) has what's coming next.

Your app doesn't have to stay stuck in 2022.
