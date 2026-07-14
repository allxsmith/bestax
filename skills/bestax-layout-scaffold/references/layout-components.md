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
  Grid,
  Cell,
  Navbar,
  Menu,
  Card,
} from '@allxsmith/bestax-bulma';
```

Every component also accepts the shared Bulma helper props (`m`/`p` spacing, `textAlign`,
`textColor`, `bgColor`, etc.).

> **Use helper props, never inline `style`, for spacing / alignment / color.** `mt="4"` (= 1rem)
> not `style={{ marginTop: '1rem' }}`; `textAlign="centered"` not `style={{ textAlign: 'center' }}`;
> `textColor="grey"` / `bgColor="light"` not `style={{ color }}`. Spacing scale is `0`–`6` | `auto`
> (`4` = 1rem). Reserve `style`/CSS vars only for values the design system doesn't tokenize.

> **There is no `Tile` component.** For uniform grids (cards, galleries) use `Grid` / `Cell` —
> equal-height cells for free; for proportional or per-breakpoint layouts use
> `Columns` / `Column`.

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

| Prop                                                                             | Type                                                     |
| -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `isMultiline`                                                                    | `boolean` (wrap cells onto new rows)                     |
| `isCentered`                                                                     | `boolean` (center the row)                               |
| `isVCentered`                                                                    | `boolean` (vertical centering — capital V)               |
| `isGapless`                                                                      | `boolean`                                                |
| `isMobile`                                                                       | `boolean` (stay side-by-side on mobile)                  |
| `isDesktop`                                                                      | `boolean`                                                |
| `gap` / `gapMobile` / `gapTablet` / `gapDesktop` / `gapWidescreen` / `gapFullhd` | `0`–`8` (number or string, same scale as `Grid`'s `gap`) |

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

**Equal-height cards inside Columns** — columns are equal height, but a card inside one does
**not** stretch to fill it (and `height: 100%` on the card doesn't help — it resolves against
the column's auto height). Make the `Column` a flex container and let the card grow:

```tsx
<Columns isMultiline>
  {items.map(item => (
    <Column
      key={item.id}
      sizeTablet="half"
      sizeDesktop="one-third"
      display="flex"
      flexDirection="column"
    >
      <Card flexGrow="1">{item.blurb}</Card>
    </Column>
  ))}
</Columns>
```

`display`, `flexDirection`, and `flexGrow` are helper props every component accepts;
`flexGrow` takes a string (`"1"`).

## Grid / Cell

Bulma's CSS Grid. **Preferred for uniform grids** — same-shaped items in a repeating pattern
(card grids, galleries, dashboards): CSS Grid gives **equal-height cells for free** (per row —
each row's cells match its tallest), with no flex recipe needed. Reach for `Columns`/`Column` instead when you need proportional or
per-breakpoint column _sizes_ (a 2/3 + 1/3 split, different counts per breakpoint).

**Grid**

| Prop                                                                                                                   | Type                                                         |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `gap` / `columnGap` / `rowGap`                                                                                         | `0`–`8` (number or string, same scale as Columns' `gap`)     |
| `minCol`                                                                                                               | `1`–`32` (smart grid: min column width step, `is-col-min-X`) |
| `isFixed`                                                                                                              | `boolean` (fixed column count instead of auto-fill)          |
| `fixedCols` (+ `fixedColsMobile` / `fixedColsTablet` / `fixedColsDesktop` / `fixedColsWidescreen` / `fixedColsFullhd`) | `0`–`12` or `'auto'` (fixed grid only)                       |

**Cell**

| Prop                                  | Type                                    |
| ------------------------------------- | --------------------------------------- |
| `colStart` / `colFromEnd` / `colSpan` | `number` (manual column placement/span) |
| `rowStart` / `rowFromEnd` / `rowSpan` | `number` (manual row placement/span)    |

By default the smart grid **auto-fills**: cells flow into as many columns as fit (tune the
minimum width with `minCol`). `isFixed` + `fixedCols*` pins an exact column count per
breakpoint instead.

```tsx
// Uniform card grid — equal heights for free, responsive column count for free.
<Grid
  isFixed
  fixedColsMobile={1}
  fixedColsTablet={2}
  fixedColsDesktop={3}
  gap={4}
>
  {items.map(item => (
    <Cell key={item.id}>
      <Card header={item.name}>{item.blurb}</Card>
    </Cell>
  ))}
</Grid>
```

> To stretch each card to its cell's full (equal) height, the same `display="flex"
flexDirection="column"` + `flexGrow="1"` pattern applies to `Cell` + `Card`.

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
