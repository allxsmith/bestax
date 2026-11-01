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
  Stack,
  Group,
  Center,
  Flex,
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
`textColor`, `bgColor`, etc.). Flex helpers take the standard CSS values spelled in full:
`justifyContent="space-between"`, `alignItems="center"`.

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
| `as`                              | `'div'` (default) or a landmark tag     | Renders that tag in place of the `div`.   |
| `fluid`                           | `boolean`                               | Full width with a small gutter.           |
| `widescreen` / `fullhd`           | `boolean`                               | Only constrain at that breakpoint and up. |
| `breakpoint`                      | `'tablet' \| 'desktop' \| 'widescreen'` | Max-width breakpoint.                     |
| `isMax`                           | `boolean`                               | Use the `is-max-*` width.                 |
| `color` / `textColor` / `bgColor` | Bulma color                             | —                                         |

`as` takes `'main' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'nav'`, so
`<Container as="main">` renders `<main class="container">` with no wrapper.

## Section

`<Section>` adds vertical page rhythm (padding).

| Prop                              | Type                                     |
| --------------------------------- | ---------------------------------------- |
| `size`                            | `'medium' \| 'large'` (omit for default) |
| `color` / `textColor` / `bgColor` | Bulma color                              |

## Hero

`<Hero>` is a full-width banner. Subcomponents: `Hero.Head`, `Hero.Body`, `Hero.Foot`.

| Prop                   | Type                                                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color`                | `primary \| link \| info \| success \| warning \| danger \| black \| white \| light \| dark` (CSS-backed). Also accepted but deprecated, no CSS, dev-warn: every other `validColors` member, plus `inherit` and `current` |
| `size`                 | `'small' \| 'medium' \| 'large' \| 'fullheight' \| 'fullheight-with-navbar'`                                                                                                                                              |
| `fullheightWithNavbar` | `boolean`                                                                                                                                                                                                                 |
| `as`                   | `'section'` (default) \| `'div'` \| `'main'` \| `'header'` \| `'footer'` \| `'article'` \| `'aside'`                                                                                                                      |

```tsx
<Hero color="primary" size="medium">
  <Hero.Body>…</Hero.Body>
</Hero>
```

`Hero.Head` takes `as="header"` or `as="nav"` and `Hero.Foot` `as="footer"` or `as="nav"` (both
`div` by default), so a page that is all hero is `<Hero as="main">` with no wrapper. A `header` or
`footer` is the page's banner or footer landmark only outside a `section`, `article`, `aside`,
`nav` or `main`, so for that render the hero itself `as="div"`.

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

## Stack / Group / Center / Flex

Flex containers for laying out any components, with no `display` prop to add. Each zeroes the
margins Bulma gives its direct children (Box, Notification, Card, Title, Field), the bottom one
in a Stack and the top and bottom in the others, so `gap` is the only space between them: no
`mb="0"` on the children. A `Columns` child keeps its own top and side margins and takes at the
bottom the one Bulma gives the last Columns in a container (the column gap pulled back in, none
when gapless), so its columns line up. None draws a surface; put a `Box` or a `Card` inside or around. A `display` prop that isn't flex turns one
off, as on any component.

- `<Stack>`: a column, children stretched across it, `gap` Bulma's block spacing (1.5rem).
- `<Group>`: a row that wraps, children centered on each other, `gap` half that (0.75rem). A
  toolbar is `<Group justifyContent="space-between">`.
- `<Center>`: centers its content on both axes, no gap. Give it a height (`aspectRatio`, or a
  parent with one) to center vertically.
- `<Flex>`: CSS's own defaults (a row, no wrap, no gap) and every flex container prop.

| Prop                                                       | Type                                                                                                                                      |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `gap`, and on Flex `rowGap` / `columnGap`                  | `'0'`–`'8'` in half steps, or the number; whole step = 0.5rem                                                                             |
| `alignItems`, `justifyContent`, `flexWrap`, `alignContent` | the flex helper values (`'center'`, `'space-between'`, `'wrap'`, …)                                                                       |
| `Flex.flexDirection`                                       | `'row' \| 'row-reverse' \| 'column' \| 'column-reverse'`                                                                                  |
| `Group.isFullwidth`                                        | `boolean` (children share the row equally)                                                                                                |
| `Group.breakpoint`                                         | `'tablet' \| 'desktop' \| 'widescreen'` (a column below it)                                                                               |
| `as`                                                       | `'div'` (default), `'main'`, `'section'`, `'article'`, `'aside'`, `'header'`, `'footer'`, `'nav'`, `'ul'`, `'ol'`, `'form'`, `'fieldset'` |

Stack, Group and Center take no `flexDirection`: they never reorder. A Title and its SubTitle go
in one element of their own inside a Stack, or the gap comes between them. For a grid of
same-shaped items, use `Grid` / `Cell`.

## Columns / Column

The responsive grid. `Columns` is the row; `Column` is a cell (also reachable as
`Columns.Column`).

**Columns**

| Prop                                                                             | Type                                                       |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `isMultiline`                                                                    | `boolean` (wrap cells onto new rows)                       |
| `isCentered`                                                                     | `boolean` (center the row)                                 |
| `isVCentered`                                                                    | `boolean` (vertical centering — capital V)                 |
| `isGapless`                                                                      | `boolean`                                                  |
| `isMobile`                                                                       | `boolean` (stay side-by-side on mobile)                    |
| `isDesktop`                                                                      | `boolean`                                                  |
| `gap` / `gapMobile` / `gapTablet` / `gapDesktop` / `gapWidescreen` / `gapFullhd` | `0`–`8` whole steps (number or string), the columns gutter |

**Column**

| Prop                                                                                                                                               | Type              |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `size` (+ `sizeMobile` / `sizeTablet` / `sizeDesktop` / `sizeWidescreen` / `sizeFullhd`)                                                           | `BulmaColumnSize` |
| `offset` (+ per-breakpoint)                                                                                                                        | `BulmaColumnSize` |
| `isNarrow` (+ per-breakpoint: `isNarrowMobile` / `isNarrowTablet` / `isNarrowTouch` / `isNarrowDesktop` / `isNarrowWidescreen` / `isNarrowFullhd`) | `boolean`         |

```ts
type BulmaColumnSize =
  | number // 1–12
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12' // string form, equivalent
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

Numeric sizes accept a number **or** its string form — `sizeDesktop={7}` and
`sizeDesktop="7"` are equivalent, and the fraction names are strings.

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
`flexGrow` takes a string (`"1"`). `Card.*` sub-parts accept helper props too, so pinning a
footer inside a card is `<Card display="flex" flexDirection="column">` +
`<Card.Content flexGrow="1">` — no `Box` swap needed.

## Grid / Cell

Bulma's CSS Grid (`Cell` is also reachable as `Grid.Cell`). **Preferred for uniform grids** — same-shaped items in a repeating pattern
(card grids, galleries, dashboards): CSS Grid gives **equal-height cells for free** (per row —
each row's cells match its tallest), with no flex recipe needed. Reach for `Columns`/`Column` instead when you need proportional or
per-breakpoint column _sizes_ (a 2/3 + 1/3 split, different counts per breakpoint).

**Grid**

| Prop                                                                                                                   | Type                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `gap` / `columnGap` / `rowGap`                                                                                         | `0`–`8` with half steps such as `1.5` (number or string), the same values as the `gap` helper props |
| `minCol`                                                                                                               | `1`–`32` (smart grid: min column width step, `is-col-min-X`)                                        |
| `isFixed`                                                                                                              | `boolean` (fixed column count instead of auto-fill)                                                 |
| `fixedCols` (+ `fixedColsMobile` / `fixedColsTablet` / `fixedColsDesktop` / `fixedColsWidescreen` / `fixedColsFullhd`) | `0`–`12` or `'auto'` (fixed grid only)                                                              |

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
| `isSpaced`      | `boolean` (Bulma's `is-spaced`, from desktop up)                                                                 |
| `hasShadow`     | `boolean` (default `false`, unlike `Card`'s; Bulma's `has-shadow`)                                               |
| `color`         | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger' \| 'black' \| 'dark' \| 'light' \| 'white'` |
| `Navbar.Item`   | `as?`, `active?`, `href`                                                                                         |
| `Navbar.Burger` | `active?`, `onClick`                                                                                             |
| `Navbar.Menu`   | `active?` (toggled open on mobile)                                                                               |

The burger/menu is controlled state — toggle `Navbar.Burger active`/`onClick` and pass the same
flag to `Navbar.Menu active`. **A `fixed="top"` navbar requires `has-navbar-fixed-top` on `<html>`**
(Bulma offsets the page from it); the library adds no helper. Set it statically —
`<html class="has-navbar-fixed-top">` in `index.html` — reserving a `classList.add` effect for
a navbar that mounts conditionally. **With `isSpaced`, add `has-spaced-navbar-fixed-top` too**
(`<html class="has-navbar-fixed-top has-spaced-navbar-fixed-top">`): from desktop up the spaced
navbar is taller than the plain class pads the page for, and there the spaced class pads it for
the taller navbar, so with the plain class alone the top of the page sits under the navbar. A
`fixed="bottom"` navbar takes `has-navbar-fixed-bottom`, and `has-spaced-navbar-fixed-bottom`
beside it with `isSpaced`.

**Routing:** in a routed app, don't use `href="#"` — render items as the router's link
component. `Menu.Item as={Link} to="/x"` and `Navbar.Item as={Link} to="/x"` both compile
without casts (their props follow `as`, so `to` is checked against the router's own link
type). Drive `active` from `useLocation().pathname`.
Full patterns (including Buttons that navigate and Next.js `href`): the docs guide at
https://bestax.io/docs/guides/features/routing.

## Menu

`<Menu>` is a vertical sidebar menu. Subcomponents: `Menu.Label`, `Menu.List`, `Menu.Item`,
`Menu.Section`.

| Prop           | Type                                                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Menu.Item`    | `active?` (the current page: `is-active` plus `aria-current="page"`, so don't add your own), `href?`, `as?` (custom link component); nest a `Menu.List` inside an item for submenus                                             |
| `Menu.Section` | `label` (the heading, a `ReactNode`), `defaultOpen?`, or `open?` with `onOpenChange?(open)` to hold the state yourself, as `Collapse` does; its child is the group's `Menu.List`, and a closed section's links are out of reach |

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

A sidebar whose groups of links open and close (a docs sidebar, an admin app's sections) puts each
group's `Menu.List` in a `Menu.Section`. Its heading is a real button drawn like `Menu.Label`, with
`aria-expanded` and a chevron, and its links stay ordinary links, each a tab stop. Open the
section that holds the current page. A section goes directly in `Menu`, never inside a `Menu.Item`
(it would render inside the item's link) or a `Menu.List` (it isn't a list item). Don't build this
from `TreeView` (its items aren't links) or from a `Collapse` in a hand-written `<li>` (its trigger
is a `div` with `role="button"`).

```tsx
<nav aria-label="Documentation">
  <Menu>
    <Menu.Section label="Getting started">
      <Menu.List>
        <Menu.Item href="/docs/install">Installation</Menu.Item>
      </Menu.List>
    </Menu.Section>
    <Menu.Section label="Components" defaultOpen>
      <Menu.List>
        <Menu.Item href="/docs/button" active>
          Button
        </Menu.Item>
        <Menu.Item href="/docs/card">Card</Menu.Item>
      </Menu.List>
    </Menu.Section>
  </Menu>
</nav>
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

`Card.Header.Title` and `Card.FooterItem` both take an `as` prop for Bulma's own card markup —
`Card.Header.Title` renders `div` by default (`as="p"` or a heading `h2`-`h4` also work), and
`Card.FooterItem` renders `span` by default (`as="a"` or `as="button"` also work). For a footer
action, prefer `<Card.FooterItem as="a" href="...">Save</Card.FooterItem>` over nesting a link
inside the default `span` — Bulma puts the padding and flex centering on `.card-footer-item`
itself, so nesting a link only makes the text clickable instead of the whole cell.
