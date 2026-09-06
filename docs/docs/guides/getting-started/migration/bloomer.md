---
title: Migrating from bloomer
sidebar_label: From bloomer
sidebar_position: 7
---

# Migrating from bloomer

[`bloomer`](https://github.com/AlgusDark/bloomer) was the first typed React wrapper for Bulma —
its last commit was **October 2018** and the repository is archived. `@allxsmith/bestax-bulma` is
actively maintained, targets **Bulma v1** (CSS variables, dark mode, Grid), and covers the same
component surface.

bloomer users are frozen on two axes at once:

- **Bulma 0.6.** bloomer never depended on Bulma itself; its README told you to install one, and
  the one you installed is from 2017. Its class vocabulary predates the v1 rewrite entirely, so
  there is no incremental path forward.
- **React 16.** bloomer peer-depends on React `^16.2` and is built on `create-react-class`, so it
  cannot follow you to React 19.

Migrating clears both. The codemod removes **bloomer**, bumps the Bulma your app declared to v1,
and moves you to `@allxsmith/bestax-bulma`.

:::tip See how they compare
For a capability-by-capability comparison of bestax against the other major React libraries, see
the latest edition of [**The State of React**](/blog/tags/state-of-react).
:::

## Run the codemod

```bash
# Preview the changes and the TODO report without writing anything
pnpm dlx bestax-migrate bloomer src/ --dry

# Apply it
pnpm dlx bestax-migrate bloomer src/
```

(`npx bestax-migrate …` works the same.) Useful flags: `--print` echoes transformed files to
stdout; `--extensions` controls which files are considered (default
`js,jsx,ts,tsx,scss,sass`); `--css bestax|bulma|keep` picks the stylesheet target
(default `bestax`); `--no-deps` skips the package.json update.

The codemod uses [jscodeshift](https://github.com/facebook/jscodeshift) to rewrite your source
in place:

- **Imports** — `bloomer` → `@allxsmith/bestax-bulma`, including namespace imports. A default
  import (bloomer never had one) or a deep `bloomer/lib/…` import is flagged.
- **Components** — every one of bloomer's 108 exports is mapped. bloomer's names are flat and
  bestax's are compound, so most rename onto a dotted target: `CardHeaderTitle` →
  `Card.Header.Title`, `ModalCardFooter` → `Modal.Card.Foot`, `NavbarBurger` → `Navbar.Burger`,
  `HeroFooter` → `Hero.Foot`, `MenuLink` → `Menu.Item`, `Tab` → `Tabs.Item`, `PageLink` →
  `Pagination.Link`, `Subtitle` → `SubTitle`. `PageControl` becomes `Pagination.Previous` or
  `Pagination.Next` from its `isNext`; `NavbarItem hasDropdown` becomes the `Navbar.Dropdown`
  container and `NavbarDropdown` its `Navbar.DropdownMenu`.
- **Props** — most of bloomer's `is*` booleans are already bestax's (`isLoading`,
  `isOutlined`, `isBordered`, …) and pass through; `isActive` becomes `active` where bestax
  names it that way, and `isFullWidth` survives only where bestax declares it. The value props
  are renamed per component:
  `isColor` → `color`, `isSize` → `size` (numbers stay numbers on `Title`/`Subtitle`), `isAlign`
  → `alignment` / `align` / `right`, `hasTextAlign` → `textAlign`, `hasTextColor` →
  `textColor`, `isPulled` → `float`, `isMarginless` → `m="0"`, `tag` → `as` where bestax
  declares one, `Button isLink` → `color="link"`, `Field isGrouped` → `grouped`,
  `Control hasIcons` → `hasIconsLeft`/`hasIconsRight`. `Input`, `Select` and `TextArea` become
  the bare `InputBase`/`SelectBase`/`TextAreaBase`, because bestax's `Input` wraps itself in a
  `Field` and `Control` and bloomer's never did.
- **Helpers** — `isDisplay` and `isHidden`, in all three of their shapes, flatten onto bestax's
  per-viewport props: `isDisplay="flex-tablet"` → `displayTablet="flex"`,
  `isDisplay={{ flex: ['default', 'tablet'] }}` → `display="flex" displayTablet="flex"`,
  `isHidden="touch"` → `visibilityTouch="hidden"`. Every Bulma viewport has a bestax prop,
  `touch` and the `-only` ones included. `Column isSize="1/2"` → `size="half"`, and its
  per-breakpoint object → `sizeMobile`/`sizeTablet`/…
- **Structure** — wrappers bestax renders itself fold away: `Page` onto its `PageLink`, the
  literal `<li>` bloomer's docs put around a `MenuLink`, the literal `<ul>` inside a `Breadcrumb`,
  `TabLink` into a plain `<a>` inside `Tabs.Item`. `Help`, `Label`, `Heading`, `BreadcrumbItem`,
  `PanelTab` and `HeroVideo` become the plain Bulma markup bloomer rendered, and so does a
  `PanelBlock` without `href` (bestax's is always an `<a>`). Icon-font classes the codemod can
  read (Font Awesome 5/6, MDI) become `<Icon name="…" library="…" />`, modifiers included as
  `features`. Where bloomer rendered a `<div>` and bestax defaults to an `<a>` (`NavbarItem`,
  `DropdownItem`), the codemod adds `as="div"`.
- **Stylesheets** — your `bulma/css/bulma.css` import becomes the bestax bundle, and a Sass
  `@import "~bulma/bulma"` with its `$variable` overrides becomes `@use "bulma/sass" with (…)`.
- **package.json** — `bloomer` is removed, `@allxsmith/bestax-bulma` added, your pre-1 `bulma`
  bumped to `^1.0.4`, and the dead `node-sass` swapped for dart `sass`. bloomer's own
  `create-react-class`/`prop-types` are left alone if you declared them.

## The TODO report

Anything the codemod cannot convert safely is left in place with a
`// TODO(bestax-migrate): …` comment on the enclosing statement, and summarised in a report at
the end of the run. Nothing is ever silently dropped or best-guessed.

The ones you are most likely to see, in the order they show up when the codemod is run over
bloomer's own documentation:

| What                 | Why                                                                                                                         | What to do                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `component:Icon`     | bloomer's icons are Font Awesome 4 class names on the `Icon`'s own `className`; bestax's optional Font Awesome peer is 6.7+ | The classes are kept on an `<i>` child; keep FA4 loaded, or switch to `<Icon name="home" library="fa" variant="solid" />` |
| `component:Nav`      | `Nav`, `NavLeft`, `NavRight`, `NavItem`, `NavToggle` are Bulma 0.4's `.nav`, removed in 0.5                                 | Rebuild on [`Navbar`](/docs/api/components/navbar)                                                                        |
| `component:Tile`     | Bulma v1 removed Tiles                                                                                                      | Use [Grid and Cell](/docs/api/grid); see the [Bulma 0.9 → 1 guide](./bulma-0-9-to-1.md)                                   |
| `component:Modal`    | bloomer's Modal was an inert shell; bestax's closes on Escape and locks scroll by default                                   | Pass `onClose`, or `closeOnEscape={false} lockScroll={false}` to keep the old behaviour                                   |
| `component:Dropdown` | bestax's `Dropdown` takes a `label` and renders its own trigger and menu                                                    | Move the `DropdownTrigger` content into `label`; drop the `DropdownMenu`/`DropdownContent` wrappers                       |
| `prop:tag`           | bloomer's `tag` is on every component; bestax declares `as` on a smaller set, several narrowed to specific tags             | Render the tag directly, or restructure                                                                                   |
| `prop:render`        | bloomer's render prop handed the computed props to your own renderer; bestax has no render-prop escape hatch                | Render the markup directly, or use `as` for a custom link component                                                       |

`Tile`, the `Nav` family, the three `Dropdown` wrappers and `withHelpersModifiers` have no
bestax counterpart, so their imports are kept (trimmed and TODO-annotated) — your app still runs
while you migrate them by hand.

:::tip Let an agent do the follow-up
The `bestax-migrate` Agent Skill packages this whole workflow — running the codemod, then
resolving every TODO from the per-source references:

```bash
npx skills add https://github.com/allxsmith/bestax --skill bestax-migrate
```

:::

## Finish the migration

1. **Install** — the codemod already rewrote `package.json`; apply it with `npm install` (or
   pnpm/yarn). Expect a `peer-deps` report entry: bloomer peer-depended on React `^16.2` and
   bestax-bulma needs **React 18 or 19**, so upgrade `react`/`react-dom` first.
2. **Icons** — bloomer's era was Font Awesome 4, usually loaded from a CDN `<link>` no manifest
   pass can see. bestax's optional Font Awesome peer is **6.7+**, where many v4 names changed
   and brand icons moved to `variant="brands"`. Decide once whether to keep FA4 loaded or
   convert every flagged `Icon` to the `name`/`library`/`variant` form.
3. **Styling follow-ups** — pick a different [CSS flavor](../installation.md) if you need
   prefixed/no-helpers/light-only builds, and read the
   [Bulma 0.9 → 1 guide](./bulma-0-9-to-1.md) for the styling changes that aren't code-level.
   Because your app was on Bulma **0.6**, you are crossing two Bulma majors — expect more visual
   drift than the guide's 0.9 → 1 baseline describes. One deliberate change: `bestax.css` ships
   `$primary` as bestax blue (`#1e6b99`) rather than Bulma's stock turquoise — keep the stock
   look with `--css bulma`, or set your own brand color via the `--bulma-primary-*` CSS variables.
4. **Verify** — typecheck, build, and compare the rendered app against the pre-migration UI.

## Version support

The codemod maps the bloomer **0.6** API (0.6.5 is the final release; every 0.6.x shares the
same export surface). The mapping table is checked against bloomer's own export surface in both
directions, so a component it does not know about is reported as `unknown-component` rather than
being silently skipped.

## Coming from a different library?

Already supported: [**react-bulma-components**](./react-bulma-components.md)
(`bestax-migrate react-bulma-components src/`) and [**rbx**](./rbx.md)
(`bestax-migrate rbx src/`).

If you're using a specific React Bulma package that isn't supported by the migration tool yet,
[open a feature request](https://github.com/allxsmith/bestax/issues/new?template=feature-request.md)
naming the package and the components you use — the codemod platform is built to grow new
source libraries.
