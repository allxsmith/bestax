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
classes, same attributes, with only the order of the classes free to change. Everything else
stays as you wrote it, with a `TODO(bestax-migrate)` comment when there's a decision to make.

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
  `section`, `hero` and
  its parts, `title`, `subtitle`, `box`, `content`, `block`, `notification`, `tag`, `tags`,
  `level` and its parts, `media` and its parts, `card` and its parts, `navbar` and most of its
  parts, `field` and its parts, `control`, `input`, `textarea`, `delete`, `progress`, `footer`
  and `table` become their bestax components, with their modifier classes as props
  (`is-primary` → `color="primary"`, `is-half` → `size="half"`).
- **Helper classes** become helper props on those components (`mt-4` → `mt="4"`,
  `has-text-centered` → `textAlign="centered"`), and on the plain tags bestax wraps:
  `<p>` becomes `Paragraph`, `<span>` becomes `Span`, and so on.
- **Wrappers a component renders itself** fold into it: a `.table-container` around a table
  becomes `<Table isResponsive>`, and a `.fixed-grid` around a grid becomes
  `<Grid isFixed fixedCols={3}>`, as long as the wrapper holds nothing else and carries nothing
  of its own.
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
  sits straight inside it stays markup (`children:Card`). Bulma's own example card keeps its
  `<p>` title and its `<a>` footer links as markup too, since bestax renders those parts on a
  `<div>` and a `<span>`.
- A `.navbar` converts when it carries Bulma's `role="navigation"` and an `aria-label`, which
  `Navbar` writes too. Its burger and its dropdown's `.navbar-link` stay markup
  (`family:navbar-burger`, `family:navbar-link`), and a `.has-dropdown` item becomes a
  `Navbar.Item` that keeps the class. Switching those to `Navbar.Burger` and `Navbar.Dropdown`
  is how the navbar gets bestax's toggle and keyboard handling, and it's a change you make by
  hand.
- A form converts piece by piece into `Field`, `Control`, `InputBase` and `TextAreaBase`, not
  into `Input` or `TextArea`: those render a `.field` and a `.control` of their own, and the
  markup already has them. The `.label` and `.help` stay as written, and so does an input's
  color class (`is-danger`), since bestax's `color` also sets the text color.

## What it leaves for you

Anything that would change the markup stays as written:

- **Computed classNames.** `clsx(...)`, ternaries and templates with expressions are flagged
  with the component the element would become (`dynamic-class:<Target>`). Converting them
  means turning each condition into a prop, which is quick by hand and risky to guess at.
- **Components that render parts of their own.** `Modal` adds dialog attributes, `Select` and
  `File` render their own wrappers, and so on. These families are flagged once each
  (`family:<class>`) and converted by hand.
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
| `dynamic-class:<Target>` | Convert by hand: each `cond && 'is-x'` becomes the prop (`isX={cond}`)                                 |
| `family:<class>`         | Rebuild that block from the component's docs page, parts and all                                       |
| `tag:<Target>`           | Change the tag if you want the component, or keep the markup                                           |
| `defaults:Delete`        | Add `type="button"` and a real `aria-label` to the `.delete` button, then re-run                       |
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
   the `--bulma-primary-*` CSS variables.
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

## Coming from a library instead?

If the app imports `react-bulma-components`, `rbx` or `bloomer`, use that source instead:
[react-bulma-components](./react-bulma-components.md), [rbx](./rbx.md),
[bloomer](./bloomer.md). An app can run more than one: migrate the library first, then run
`bulma-classes` over what's left.
