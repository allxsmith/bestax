# Layout component inventory

Self-contained reference for the `@allxsmith/bestax-bulma` layout components. All values are
source-verified. Import everything from the package root:

```tsx
import {
  Container,
  Section,
  Hero,
  Footer,
  Level,
  Columns,
  Column,
  Navbar,
  Menu,
  Card,
} from '@allxsmith/bestax-bulma';
```

Every component also accepts the shared Bulma helper props (`m`/`p` spacing, `textAlign`,
`textColor`, `bgColor`, etc.).

> **There is no `Tile` component.** Build grids and nested layouts with `Columns` / `Column`.

## Container

`<Container>` centers and constrains page content.

| Prop                              | Type                                    | Notes                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------- |
| `fluid`                           | `boolean`                               | Full width with a small gutter.           |
| `widescreen` / `fullhd`           | `boolean`                               | Only constrain at that breakpoint and up. |
| `breakpoint`                      | `'tablet' \| 'desktop' \| 'widescreen'` | Max-width breakpoint.                     |
| `isMax`                           | `boolean`                               | Use the `is-max-*` width.                 |
| `color` / `textColor` / `bgColor` | Bulma color                             | —                                         |

## Section

`<Section>` adds vertical page rhythm (padding).

| Prop                              | Type                                     |
| --------------------------------- | ---------------------------------------- |
| `size`                            | `'medium' \| 'large'` (omit for default) |
| `color` / `textColor` / `bgColor` | Bulma color                              |

## Hero

`<Hero>` is a full-width banner. Subcomponents: `Hero.Head`, `Hero.Body`, `Hero.Foot`.

| Prop                   | Type                                                                         |
| ---------------------- | ---------------------------------------------------------------------------- |
| `color`                | Bulma color                                                                  |
| `size`                 | `'small' \| 'medium' \| 'large' \| 'fullheight' \| 'fullheight-with-navbar'` |
| `fullheightWithNavbar` | `boolean`                                                                    |

```tsx
<Hero color="primary" size="medium">
  <Hero.Body>…</Hero.Body>
</Hero>
```

## Footer

`<Footer>` is the page footer.

| Prop                              | Type                |
| --------------------------------- | ------------------- |
| `as`                              | `'footer' \| 'div'` |
| `color` / `textColor` / `bgColor` | Bulma color         |

## Level

`<Level>` is a horizontal toolbar (left/right groups). Subcomponents: `Level.Left`, `Level.Right`,
`Level.Item`.

| Prop                         | Type                                  |
| ---------------------------- | ------------------------------------- |
| `Level.isMobile`             | `boolean` (keep horizontal on mobile) |
| `Level.Item.as`              | `'div' \| 'p' \| 'a'`                 |
| `Level.Item.hasTextCentered` | `boolean`                             |

## Columns / Column

The responsive grid. `Columns` is the row; `Column` is a cell.

**Columns**

| Prop                                                                                                     | Type                                       |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `isMultiline`                                                                                            | `boolean` (wrap cells onto new rows)       |
| `isCentered`                                                                                             | `boolean` (center the row)                 |
| `isVCentered`                                                                                            | `boolean` (vertical centering — capital V) |
| `isGapless`                                                                                              | `boolean`                                  |
| `isMobile`                                                                                               | `boolean` (stay side-by-side on mobile)    |
| `isDesktop`                                                                                              | `boolean`                                  |
| `gapSize` / `gapSizeMobile` / `gapSizeTablet` / `gapSizeDesktop` / `gapSizeWidescreen` / `gapSizeFullhd` | `0`–`8` (number or string)                 |

**Column**

| Prop                                                                                                                                               | Type              |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `size` (+ `sizeMobile` / `sizeTablet` / `sizeDesktop` / `sizeWidescreen` / `sizeFullhd`)                                                           | `BulmaColumnSize` |
| `offset` (+ per-breakpoint)                                                                                                                        | `BulmaColumnSize` |
| `isNarrow` (+ per-breakpoint: `isNarrowMobile` / `isNarrowTablet` / `isNarrowTouch` / `isNarrowDesktop` / `isNarrowWidescreen` / `isNarrowFullhd`) | `boolean`         |

```ts
type BulmaColumnSize =
  | number // 1–12
  | 'full'
  | 'half'
  | 'one-third'
  | 'two-thirds'
  | 'one-quarter'
  | 'three-quarters'
  | 'one-fifth'
  | 'two-fifths'
  | 'three-fifths'
  | 'four-fifths';
```

> Columns **stack on mobile** by default and go side-by-side at the tablet breakpoint and up.
> Use the per-breakpoint `size*` props to control how many cells share a row at each width.

## Navbar

`<Navbar>` is the top bar. Subcomponents: `Navbar.Brand`, `Navbar.Item`, `Navbar.Link`,
`Navbar.Burger`, `Navbar.Menu`, `Navbar.Start`, `Navbar.End`, `Navbar.Dropdown`,
`Navbar.DropdownMenu`, `Navbar.Divider`.

| Prop            | Type                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `fixed`         | `'top' \| 'bottom'`                                                                                              |
| `transparent`   | `boolean`                                                                                                        |
| `color`         | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger' \| 'black' \| 'dark' \| 'light' \| 'white'` |
| `Navbar.Item`   | `as?`, `active?`, `href`                                                                                         |
| `Navbar.Burger` | `active?`, `onClick`                                                                                             |
| `Navbar.Menu`   | `active?` (toggled open on mobile)                                                                               |

The burger/menu is controlled state — toggle `Navbar.Burger active`/`onClick` and pass the same
flag to `Navbar.Menu active`. **A `fixed="top"` navbar requires `has-navbar-fixed-top` on `<html>`**
(Bulma offsets the page from it); the library adds no helper, so set it yourself:

```ts
document.documentElement.classList.add('has-navbar-fixed-top');
```

## Menu

`<Menu>` is a vertical sidebar menu. Subcomponents: `Menu.Label`, `Menu.List`, `Menu.Item`.

| Prop        | Type                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `Menu.Item` | `active?`, `href?`, `as?` (custom link component); nest a `Menu.List` inside an item for submenus |

```tsx
<Menu>
  <Menu.Label>General</Menu.Label>
  <Menu.List>
    <Menu.Item active href="#">
      Dashboard
    </Menu.Item>
    <Menu.Item href="#">Customers</Menu.Item>
  </Menu.List>
</Menu>
```

## Card

`<Card>` for catalog/grid items. Use the props form (`header`, `image`, `footer`) or the compound
subcomponents (`Card.Header` + `.Title`/`.Icon`, `Card.Image`, `Card.Content`, `Card.Footer`,
`Card.FooterItem`).

| Prop                            | Type                          |
| ------------------------------- | ----------------------------- |
| `header`                        | `ReactNode`                   |
| `image`                         | `string` (URL) or `ReactNode` |
| `imageAlt`                      | `string`                      |
| `footer`                        | `ReactNode \| ReactNode[]`    |
| `hasShadow`                     | `boolean` (default `true`)    |
| `headerCentered` / `headerIcon` | `boolean` / `ReactNode`       |
