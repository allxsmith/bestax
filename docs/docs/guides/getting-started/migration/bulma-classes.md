---
title: Migrating from plain Bulma classes
sidebar_label: From Bulma classes
sidebar_position: 8
---

# Migrating from plain Bulma classes

Most React apps that use Bulma never picked a wrapper library. They import Bulma's stylesheet and
write its classes on plain JSX:

```tsx
<div className="columns is-mobile">
  <div className="column is-half">
    <a className="button is-primary is-large" href="/signup">
      Sign up
    </a>
    <p className="has-text-centered mt-4">No card needed</p>
  </div>
</div>
```

That works, and it stays working. What you give up is the part React is good at: typed props,
autocomplete on every color and size, and components you can find in your editor instead of
class strings you have to remember. The `bulma-classes` codemod moves that markup onto
`@allxsmith/bestax-bulma`:

```tsx
<Columns isMobile>
  <Column size="half">
    <Button as="a" color="primary" size="large" href="/signup">
      Sign up
    </Button>
    <Paragraph textAlign="centered" mt="4">
      No card needed
    </Paragraph>
  </Column>
</Columns>
```

bestax renders Bulma's own classes, so the page renders the same. The codemod converts an
element only when the component renders **the markup the element did**: same tag, same
classes, same attributes, with only the order of the classes free to change. The exceptions are
deliberate. Font Awesome's own `<i aria-hidden="true">` in a `.icon` that carries nothing else
assistive tech reads becomes `Icon`, which puts that attribute on the `.icon` instead, and the
glyph is hidden either way. And Bulma 0.9's `is-marginless` and `is-paddingless`, which style
nothing under v1, become `m="0"` and `p="0"`. Everything else stays as you wrote it, with a `TODO(bestax-migrate)`
comment when there's a decision to make.

## Run the codemod

```bash
# Preview the changes and the TODO report without writing anything
pnpm dlx bestax-migrate bulma-classes src/ --dry

# Apply it
pnpm dlx bestax-migrate bulma-classes src/
```

(`npx bestax-migrate …` works the same.) The flags are the same as for the library sources:
`--print`, `--extensions`, `--css bestax|bulma|keep` for the stylesheet target, and
`--no-deps` to leave `package.json` alone.

Your styling stays yours. This source defaults to `--css keep`, because your Bulma stylesheet
already styles every class a converted element renders: your stylesheet imports, your Sass and
your Bulma version stay as they are, and `package.json` just gains `@allxsmith/bestax-bulma`.
Moving to Bulma v1 is its own step, whenever you want it. `--css bestax` swaps your stylesheet
import for bestax's bundle, moves a Bulma 0.9 Sass setup onto v1's `@use` form, bumps a
pre-1.0 Bulma and swaps `node-sass` for `sass`; `--css bulma` does the same but keeps Bulma's
stock stylesheet.

## What converts

- **Components**: `button`, `buttons`, `columns`, `column`, `grid`, `cell`, `container`,
  `section`, `hero` and its parts, `title`, `subtitle`, `box`, `content`, `block`,
  `notification`, `tag`, `tags`, `level` and its parts, `media` and its parts, `card` and its
  parts, `navbar` and most of its parts, `field` and its parts, `control`, `input`, `textarea`,
  `select`, `breadcrumb`, `image`, `menu` and its label, list and items, the parts inside a `modal`
  but its close button, `pagination` and its list, links and ellipses, `panel` and its
  heading, tabs and blocks, `tabs`, `icon`, `icon-text`, `file` inside a `field`, `delete`, `progress`, `skeleton-block`, `footer` and
  `table` become their bestax components, with their modifier classes as props (`is-primary` →
  `color="primary"`, `is-half` → `size="half"`). A component whose `as` takes the element's tag
  converts on it, so `<main className="hero">` becomes `<Hero as="main">` and
  `<section className="panel">` becomes `<Panel as="section">`.
- **Helper classes** become helper props on those components (`mt-4` → `mt="4"`,
  `has-text-centered` → `textAlign="centered"`, `is-position-sticky` → `pos="sticky"`), and on
  the plain tags bestax wraps: `<p>` becomes `Paragraph`, `<span>` becomes `Span`, and so on. A
  color shade becomes its color and its shade (`has-text-primary-on-scheme` →
  `textColor="primary" colorShade="on-scheme"`). Bulma 0.9's `is-marginless` and
  `is-paddingless` style nothing under v1, so they become `m="0"` and `p="0"`, which render v1's
  `m-0` and `p-0`.
- **Wrappers a component renders itself** fold into it: a `.table-container` around a table
  becomes `<Table isResponsive>`, and a `.fixed-grid` around a grid becomes
  `<Grid isFixed fixedCols={3}>`, as long as the wrapper holds nothing else and carries nothing
  of its own.
- **An element a component renders inside itself** converts with it: a `.select` and its
  `<select>` become one `SelectBase` with the `<select>`'s attributes, a `.breadcrumb` and its
  `<ul>` become one `Breadcrumb` around the same `<li>`s, and an `.image` and its `<img>` become
  one `<Image size="64x64" src="…" alt="…" />`. An `.image` around anything else converts too, with
  its children kept as they are.
- **Children a component renders itself** go: a `.skeleton-lines` holding bare, empty `<div>`s
  becomes `<Skeleton variant="lines" lines={5} />`, which renders those `<div>`s from the count.
- **Classes added under a condition** in a `clsx` or `classnames` call: a flag becomes its prop,
  set to the condition (`clsx('button', busy && 'is-loading')` → `<Button isLoading={busy}>`), and
  whatever else the call adds stays in it.
- **Your own classes** stay in `className`, which every bestax component passes through.

The full tables, class by class, are in the migrate skill's
[component map](https://github.com/allxsmith/bestax/blob/main/skills/bestax-migrate/references/bulma-classes/component-map.md)
and
[prop map](https://github.com/allxsmith/bestax/blob/main/skills/bestax-migrate/references/bulma-classes/prop-map.md).

A couple of results look odd until you see why:

- `<h2 className="title is-4">` becomes `<Title as="h2" className="is-4">`, not
  `<Title size="4">`. bestax picks the heading tag from `size`, so `size="4"` would render an
  `<h4>`.
- `<div className="is-flex mt-4">` doesn't change at all. bestax has no plain `<div>` component,
  and the classes are valid Bulma, so there is nothing to do and nothing to flag.
- A `.card` converts when an element written directly inside it is, or becomes, one of its
  parts. `Card` puts anything else inside a `.card-content` of its own, so a card whose text
  sits straight inside it stays markup (`children:Card`). Bulma's own example card converts
  whole, its `<p>` title and `<a>` footer links through `as`.
- A `.navbar` converts when it carries Bulma's `role="navigation"` and an `aria-label`, which
  `Navbar` writes too. Its burger and its dropdown's `.navbar-link` stay markup
  (`family:navbar-burger`, `family:navbar-link`), and a `.has-dropdown` item becomes a
  `Navbar.Item` that keeps the class. Switching those to `Navbar.Burger` and `Navbar.Dropdown`
  is how the navbar gets bestax's toggle and keyboard handling, and it's a change you make by
  hand.
- A `.menu` converts with its labels and lists, and with the items in a list: a `<li>` holding
  an `<a>`, and at most a bare nested `<ul>`, becomes a `Menu.Item`, found by where it sits.
  `Menu.Item` renders the `<li>` and the `<a>` together and splits its props between them, so an
  item whose attributes sit anywhere else stays as written. An `is-active` link converts only
  beside an `aria-current` of its own, since `active` writes `aria-current="page"` otherwise. Add
  `aria-current="page"` to the link that marks the page you're on and re-run, and that item
  converts too (`attr:aria-current`).
- A `.icon` around a bare Font Awesome or Material Design Icons `<i>` becomes
  `<Icon library="fa" name="home" />`, the `<i>`'s style and other classes read as `variant` and
  `features`. `Icon` hides a decorative icon with `aria-hidden="true"` on the `.icon` itself, so
  Font Awesome's own `aria-hidden` on the `<i>` moves up there, unless the `.icon` carries
  something assistive tech reads, such as a `title`, a `role` or a `tabIndex`. An icon hidden
  nowhere stays markup (`defaults:Icon`), and the TODO says what to do: add the attribute to an
  icon whose link or button is named by its label, or name an icon-only link first, then re-run.
- A form converts piece by piece into `Field`, `Control`, `InputBase`, `TextAreaBase` and
  `SelectBase`, not into `Input`, `TextArea` or `Select`: those render a `.field` and a
  `.control` of their own, and the markup already has them. The `.label` and `.help` stay as
  written, and so does an input's or a select's color class (`is-danger`), since bestax's
  `color` also sets the text color.

## What it leaves for you

Anything that would change the markup stays as written:

- **Other computed classNames.** A ternary between two classes, a template with expressions, a
  variable or another function is flagged with the component the element would become
  (`dynamic-class:<Target>`). Converting it means turning each condition into a prop, which is
  quick by hand and risky to guess at.
- **Components that render parts of their own.** `Modal` adds dialog attributes, `Dropdown` renders
  its own trigger and menu, and so on. These families are flagged once each (`family:<class>`) and
  converted by hand.
- **Form markup around bestax already.** `Field` and `Control` tell bestax's form controls
  inside them to skip their own wrappers, so a `.field` or `.control` that already holds one
  (from an earlier migration by hand) stays as it is (`context:<Target>`).
- **Elements bestax would render differently**: a `ref` on a component that doesn't forward one,
  a spread, a tag the component can't render (`<div className="section">`), an attribute the
  component reads as a prop, or an element that is the only child of another component, which
  may clone it (`<Link><a className="button">`).
- **Next.js App Router projects.** A file without `'use client'` is left alone (`rsc`),
  because bestax's components are client components, and in an App Router project any module
  can render as a server component, not only those under `app/`. Files under `pages/` convert.
- **Files React doesn't render the usual way**: a component styled with `<style jsx>`, whose
  scoped styles would miss a converted element (`styled-jsx`), JSX that renders through Preact
  or another runtime (`jsx-runtime`), and CommonJS files (`imports`).

## The TODO report

Every TODO sits on the statement around the element, and the run ends with a report grouped by
rule. The ones you'll see most:

| What                     | What to do                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `dynamic-class:<Target>` | Convert by hand, turning each condition into its prop                                                  |
| `family:<class>`         | Rebuild that block from the component's docs page, parts and all                                       |
| `tag:<Target>`           | Change the tag if you want the component, or keep the markup                                           |
| `defaults:Delete`        | Add `type="button"` and a real `aria-label` to the `.delete` button, then re-run                       |
| `defaults:Icon`          | Put `aria-hidden="true"` on a decorative `.icon`, naming an icon-only link first, then re-run          |
| `ref:<Target>`           | Keep the element; the component won't pass the ref through                                             |
| `rsc`                    | Add `'use client'` if the file can be a client component, then re-run                                  |
| `legacy:tile`            | Rebuild tiles with [Grid and Cell](/docs/api/grid); see the [Bulma 0.9 → 1 guide](./bulma-0-9-to-1.md) |

Every rule, with a recipe, is in the skill's
[unmappables reference](https://github.com/allxsmith/bestax/blob/main/skills/bestax-migrate/references/bulma-classes/unmappables.md).
It is safe to re-run the codemod after fixing some of them: converted elements are components
now, and a TODO it already wrote is never written twice.

:::tip Let an agent do the follow-up
The `bestax-migrate` Agent Skill runs the codemod and works through the TODOs from the same
references:

```bash
npx skills add https://github.com/allxsmith/bestax --skill bestax-migrate
```

:::

## Finish the migration

1. **Install**: the codemod rewrote `package.json`; apply it with `npm install` (or
   pnpm/yarn). bestax-bulma needs React 18 or 19, and the report says so if you're older.
2. **Stylesheet**: under the default there's nothing to do. If you ran with `--css bestax`
   from Bulma 0.9, read the [Bulma 0.9 → 1 guide](./bulma-0-9-to-1.md) for the styling changes
   that aren't code. One deliberate difference in `bestax.css`: its `$primary` is bestax blue
   rather than Bulma's turquoise. Keep the stock look with `--css bulma`, or set your own with
   the `--bulma-primary-*` CSS variables, `--bulma-primary-invert-l` among them: bestax's build
   fixes the text on a primary surface for its dark blue, so a light primary needs it set too.
3. **PurgeCSS**: if your build runs it, the report says so. A converted element's classes now
   come from bestax's code, some of them built from props at runtime, so PurgeCSS has to scan
   bestax and safelist those patterns; [Optimizing CSS](../optimizing-css.md) has the config.
4. **Snapshot tests**: converted elements list their classes in a different order (bestax's
   own first), so snapshots that compare class strings will change while the page doesn't.
   Review the diff and update them.
5. **Verify**: typecheck, build, and look at the app.
6. **Keep it that way**: the [ESLint plugin](../eslint-plugin.md)'s opt-in
   `no-bulma-component-class` rule reports a plain element styled with a Bulma class bestax
   has a component for, which keeps raw Bulma markup from creeping back in.

## From an HTML page

A lot of Bulma lives in plain HTML: a template, a static site you're moving into React, a
page someone mocked up. The same source converts those pages too:

```bash
# One page
pnpm dlx bestax-migrate bulma-classes src/pages/login/index.html --dry

# Every page in a folder
pnpm dlx bestax-migrate bulma-classes -e html src/pages/
```

A page you name always converts. A folder walk takes a page only when `-e` lists its extension
(`-e html`, or `-e html,htm` for `.htm` pages too), because most
`.html` files in a React project aren't pages to convert (Vite's `index.html`, `public/`), and
a walk without it lists the Bulma pages it skipped (`html-file:not-included`) so the run doesn't
look like it did nothing.

### What it writes

Each page becomes a React module beside it: `login/index.html` writes `login/index.tsx`, or
`.jsx` when the package has no `tsconfig.json` and doesn't depend on TypeScript. The module's
default export is a component named after the file, or after its folder for an `index.html`,
with `Page` on the end so `hero.html` can't shadow bestax's `Hero`. The `index.html` in the folder
the run starts from, with other pages beside it, is the site's home page, so it becomes
`HomePage`, unless a page beside it would be `HomePage` too (`home.html`), when it keeps its
folder's name. One in a folder below keeps its folder's name, so `docs/index.html` is `DocsPage`.
This page:

```html
<section class="hero is-fullheight">
  <div class="hero-body">
    <div class="container">
      <div class="columns is-centered">
        <div class="column is-4">
          <div class="box">
            <h1 class="title has-text-centered">Please log in</h1>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

becomes:

```tsx
import {
  Box,
  Column,
  Columns,
  Container,
  Hero,
  Title,
} from '@allxsmith/bestax-bulma';

export default function LoginPage() {
  return (
    <Hero size="fullheight">
      <Hero.Body>
        <Container>
          <Columns isCentered>
            <Column size="4">
              <Box>
                <Title textAlign="centered">Please log in</Title>
              </Box>
            </Column>
          </Columns>
        </Container>
      </Hero.Body>
    </Hero>
  );
}
```

The page's `<body>` is read the way a browser builds it, written as JSX (`class` as
`className`, `for` as `htmlFor`, a `style` string as an object, comments as JSX comments), and
then converted exactly as the same markup written by hand would be, with every rule above. The
page itself is never changed, and an existing module is never overwritten
(`html-file:exists`), so running it again changes nothing. A page with no Bulma component class
writes nothing, and a server template (`{{`, `{%`, `<?php`, `<%`) is refused
(`html-file:template-syntax`) rather than read as HTML. `--dry` says what it would write, and
`--print` prints the module.

### What a component can't carry

A component renders into the app's own document, so the page's `<head>` doesn't come with it,
and neither do its scripts. Each of those becomes a `TODO(bestax-migrate)` line, the ones about
the whole page above the component and the rest above its `return`, and every report entry
names the `.html` file and the line it came from:

| Rule                                      | What it covers                                                                                                                                     | What to do                                                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `html-head:<tag>`                         | `<title>`, `<meta>` (a Content Security Policy apart, as `html-head:csp`), `<link>`, `<style>`, `<base>`                                           | App-wide ones go in the app's `index.html`, a page's own where the app sets each page's head; write the app's own policy           |
| `html-asset:<kind>`                       | each stylesheet and script the page loads: Bulma's own, Font Awesome, a Bulma extension, jQuery, a web font, and any other                         | `--css bestax` and `--css bulma` import Bulma's in the module; load the rest once for the app, or use the component the TODO names |
| `html-script:<pattern>`                   | inline scripts and the page's own script files: a burger, a modal, a dismiss button, a carousel, a theme toggle, JSON-LD, the rest                 | Port the code into the component; the TODO names the bestax component for the usual patterns                                       |
| `html-document:<name>`                    | classes and attributes on `<html>` and `<body>`, such as `has-navbar-fixed-top`, `data-theme` and `lang`                                           | Put them on the app's own `<html>`, where the first paint has the scheme; `Theme colorMode` drives a light/dark toggle             |
| `html-event:<attribute>`                  | `onclick="…"` and its kind, which React can't take as a string                                                                                     | Port the code into the handler the TODO names (`onClick`)                                                                          |
| `html-element:<kind>`, `html-attr:<kind>` | custom and obsolete elements, attributes JSX can't write, React has no prop for or the element ignores, stray characters, styles React can't apply | Replace them with current markup, or declare a custom element for TypeScript                                                       |
| `html-url:<kind>`                         | `javascript:` URLs, relative URLs, which resolve against the address a component renders at, and ones whose target isn't beside the page           | Move the code into a handler; copy a file into `public/` and point at it from the site root, or import it; fix or drop a dead link |
| `html-parse:<code>`                       | markup the browser repaired, once per kind of error                                                                                                | Check that part of the page renders as meant                                                                                       |

The page's `.html` stays as it was, so a dropped script's code is still there to port, and the
TODO gives its lines. Every rule, with a recipe, is in the skill's
[unmappables reference](https://github.com/allxsmith/bestax/blob/main/skills/bestax-migrate/references/bulma-classes/unmappables.md).

### Whitespace

JSX keeps a space only where it's written, so the converter decides which whitespace in the page
renders and writes `{" "}` where it does. Whitespace beside a block, flex or grid box renders
nothing and is dropped, which is also what lets a wrapper fold into the component inside it. A
box's display comes from its tag, its inline `style`, and the display Bulma's own classes give it.
The limit is the page's own CSS: a class of yours that turns a block into an inline box (or the
reverse) is something the converter can't see, so check a spot where words now run together or
gain a space.

## Coming from a library instead?

If the app imports `react-bulma-components`, `rbx` or `bloomer`, use that source instead:
[react-bulma-components](./react-bulma-components.md), [rbx](./rbx.md),
[bloomer](./bloomer.md). An app can run more than one: migrate the library first, then run
`bulma-classes` over what's left.
