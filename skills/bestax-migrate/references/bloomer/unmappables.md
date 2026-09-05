# Recipes for every TODO(bestax-migrate) the bloomer codemod leaves

Ordered by how often they appear when the codemod runs over bloomer's own documentation.
Resolve the comment, then delete it. Never silence a TODO without converting the code.

## `component:Icon`, `component:PanelIcon` — Font Awesome 4 classes

bloomer's `Icon` put the icon-font classes on its own `className`, and its era was Font Awesome 4. Classes the parser can read — Font Awesome 5/6 (`fas fa-home`, `fa-solid fa-home`) and MDI
(`mdi mdi-account`) — become bestax's props automatically:

```jsx
<Icon className="fas fa-home" isSize="large" />
<Icon name="home" library="fa" variant="solid" size="large" />
```

Modifier classes the library documents (`fa-spin`, `fa-lg`, `mdi-24px`) become bestax's
`features`. Anything else — FA4's `fa fa-home` above all, or an app's own class beside the icon
— is moved onto an `<i>` child, which renders exactly what bloomer rendered, and flagged: bestax's optional Font Awesome peer is **6.7+**, where
many v4 names changed and brand icons moved to `variant="brands"`. Either keep FA4 loaded, or
convert to the prop form:

```jsx
<Icon><i className="fa fa-github" aria-hidden="true" /></Icon>
<Icon name="github" library="fa" variant="brands" />
```

`library` is `fa` | `mdi` | `ion` | `material-icons` | `material-symbols`. `PanelIcon` has the
same `className` API and converts the same way. An `Icon` with no `className` and no children
is flagged too — it gets an empty `<i>` child so it compiles until you set a `name` or a child —
and so is a `className` that is not a string (`prop:className`). An `Icon` written with children
is flagged as well: bloomer never rendered them — beside a `className` they are removed (the
classes win), without one they are kept and bestax will render them.

## `component:Nav` — Bulma 0.4's nav

`Nav`, `NavLeft`, `NavCenter`, `NavRight`, `NavToggle` and `NavItem` (`component:NavLeft`,
`component:NavCenter`, `component:NavRight`, `component:NavToggle`, `component:NavItem`) are
Bulma 0.4's `.nav`, which Bulma removed in 0.5 — bloomer kept the components, but no stylesheet
you can install today styles them. Rebuild on `Navbar`:

```jsx
<Nav><NavLeft><NavItem isActive>Home</NavItem></NavLeft><NavToggle /></Nav>

<Navbar>
  <Navbar.Brand><Navbar.Burger /></Navbar.Brand>
  <Navbar.Menu><Navbar.Start><Navbar.Item active>Home</Navbar.Item></Navbar.Start></Navbar.Menu>
</Navbar>
```

## `component:Tile` — Bulma v1 removed tiles

Use Grid and Cell. `Tile isAncestor` becomes `<Grid>`, `isParent`/`isChild` become `<Cell>`,
and `isSize={n}` becomes a column span:

```jsx
<Tile isAncestor><Tile isParent isSize={4}><Tile isChild>x</Tile></Tile></Tile>
<Grid><Cell colSpan={4}>x</Cell></Grid>
```

## `component:Modal` — what carries over

bloomer's `Modal` was an inert shell: `isActive` toggled the class and nothing else. bestax's
`Modal` closes on Escape (calling `onClose`), locks body scroll, and traps focus **by default**,
and renders inline unless `portal` is set. So every conversion changes behaviour, and every one
is flagged. Pass `onClose` to get the close-on-Escape and background behaviour:

```jsx
<Modal active={open} onClose={() => setOpen(false)}>
```

or keep bloomer's inert behaviour with `closeOnEscape={false} lockScroll={false}`. Add
`portal` if the modal must escape a transformed ancestor.

## `component:Dropdown` and its parts

bestax's `Dropdown` takes a `label` and renders its own trigger and menu, so bloomer's
`DropdownTrigger`, `DropdownMenu` and `DropdownContent` have nothing to become
(`component:DropdownTrigger`, `component:DropdownMenu`, `component:DropdownContent`). Keep the
`<DropdownItem>`s, which become `<Dropdown.Item>`:

```jsx
<Dropdown isActive isAlign="right">
  <DropdownTrigger><Button>Open</Button></DropdownTrigger>
  <DropdownMenu><DropdownContent>
    <DropdownItem href="/a">A</DropdownItem>
  </DropdownContent></DropdownMenu>
</Dropdown>

<Dropdown label="Open" active right>
  <Dropdown.Item onClick={() => navigate('/a')}>A</Dropdown.Item>
</Dropdown>
```

bestax's `Dropdown.Item` declares no `href` (`prop:href` on a `DropdownItem`): navigate in
`onClick`, or put an `<a>` inside the item.
`isHoverable` → `hoverable`, `isActive` → `active` carry over on the `Dropdown` itself.

## `prop:tag` — polymorphism

bestax declares `as` on only some components (the list is in [prop-map.md](prop-map.md)).
Elsewhere, render the element you wanted directly, or move the bestax component inside it:

```jsx
<Box tag="section">…</Box>
<section><Box>…</Box></section>
```

A dynamic `tag` on a component that becomes plain markup is flagged the same way — the plain
element takes bloomer's default tag.

## `prop:render` — the render prop

bloomer's `render` handed the computed props (`className` included) to your own renderer:

```jsx
<Button isColor="info" render={props => <MyButton {...props} />} />
```

bestax has no render-prop escape hatch. Render the bestax component and put your element inside
it, or — if you need the classes on your own element — call `useBulmaClasses` in it:

```jsx
<Button color="info" as={MyButton} />
```

`Button`, `Navbar.Item`, `Navbar.Link` and `Menu.Item` take `as` as a custom component, which
covers the common "render as a router link" case.

## `component:Heading` — Bulma v1 dropped `.heading`

bloomer's `Heading` is Bulma's small-caps label. It becomes the plain `<p className="heading">`
bloomer rendered, but Bulma v1 no longer ships styles for that class, so restyle it:

```jsx
<Heading>Label</Heading>
<Title as="p" size={6} textTransform="uppercase" textWeight="semibold">Label</Title>
```

## `prop:isFullWidth` — not a universal helper in bestax

bloomer accepted `isFullWidth` on everything; Bulma's `is-fullwidth` only means something on a
few elements, and bestax declares `isFullWidth` on exactly those — `Button`, `Select`, `Table`,
`Tabs` — where it passes through. Elsewhere, drop it, or add `className="is-fullwidth"` if your
own CSS styled the class.

## Props with no counterpart

Each of these is left in place with a TODO naming the class to add instead:

| prop                      | on                                                                                 | what to do                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `isBold`                  | `Hero`                                                                             | `className="is-bold"` (Bulma v1 still ships it)                                          |
| `isHalfHeight`            | `Hero`                                                                             | `className="is-halfheight"` — bestax's `size` has no half-height                         |
| `isSize="large"`          | `Media`                                                                            | `className="is-large"`                                                                   |
| `isSpaced`                | `Subtitle`                                                                         | `className="is-spaced"` — only `Title` has `isSpaced`                                    |
| `isActive`                | `Input`                                                                            | `className="is-active"`                                                                  |
| `isActive`, `isFocused`   | `PageLink`, `PageControl`, `PageEllipsis`                                          | `className="is-active"` / `"is-focused"`                                                 |
| `isActive`                | `NavbarLink`                                                                       | `className="is-active"`                                                                  |
| `isHoverable`             | `NavbarItem` without `hasDropdown`                                                 | move to the `Navbar.Dropdown`, or `className="is-hoverable"`                             |
| `isBoxed`                 | `NavbarDropdown`, `NavbarDivider`                                                  | `className="is-boxed"`                                                                   |
| `isWrapped`               | `PanelBlock` with `href`                                                           | `className="is-wrapped"` (a block without `href` stays plain markup and keeps the class) |
| `isFlexible`              | `LevelItem`                                                                        | `className="is-flexible"`                                                                |
| `hasAddons="fullwidth"`   | `Field`                                                                            | `hasAddons` plus `className="has-addons-fullwidth"`                                      |
| `isAlign`                 | `TabList`                                                                          | set `align` on the `<Tabs>` — Bulma aligns the container                                 |
| `isGrid`                  | `Columns`                                                                          | Bulma removed `columns.is-grid` in 0.5; use `isMultiline` with sized columns, or `Grid`  |
| `href`                    | `CardFooterItem`, `CardHeaderIcon`, `Delete`, `DropdownItem`                       | put an `<a>` inside, or handle it in `onClick`                                           |
| `href={expr}` (dynamic)   | `Button`, `LevelItem` and the other components that switched to an `<a>` on `href` | bloomer decided the element at runtime; set `as` conditionally by hand                   |
| `href`                    | `NavbarItem hasDropdown`                                                           | bestax's `Navbar.Dropdown` is the container; put the `href` on the `Navbar.Link` inside  |
| `isRatio` beside `isSize` | `Image`                                                                            | bestax's one `size` took the fixed size; restore the ratio if that was the point         |

## `component:MenuLink`, `component:Breadcrumb`, `component:Page` — lists bestax renders itself

bestax's `Menu.Item` renders its own `<li><a>`, its `Breadcrumb` its own `<ul>`, and its
`Pagination.Link`/`Pagination.Ellipsis` their own `<li>`. bloomer's docs wrote those elements by
hand, so the codemod folds a literal `<li>` around a `MenuLink`, a literal `<ul>` inside a
`Breadcrumb`, and a `Page` around a single link away — carrying their attributes. It flags the
shapes it cannot fold: a `MenuLink` sharing its `<li>` with other content, a `<ul>` carrying
attributes, and a `Page` whose link sits in an expression or beside siblings — remove the wrapper
by hand, or the lists nest.

## Helper props on parts that take none

`Pagination.Previous`/`Next`/`Ellipsis`, `Navbar.Dropdown`/`DropdownMenu`/`Divider`,
`Panel.Heading`/`Tabs`/`Block`, `Tabs.List`/`Item`, `Message.Header`/`Body` and the `Modal`
parts extend only React's HTML attributes. A bloomer helper on one of them (`isPulled`,
`isMarginless`, `isHidden`, `hasTextAlign`, …) is removed with a TODO naming the Bulma class —
add it as `className`; Bulma v1 ships every one of them.

## `prop:isLink` — beside `isColor`

`isLink` is Bulma's `is-link` colour. Alone it becomes `color="link"`; beside an `isColor` there
are two colours for bestax's one `color` prop — pick one.

## `prop:isDisplay`, `prop:isHidden`, `prop:isSize`, `prop:isOffset` — dynamic helper values

The three-shape helpers flatten only from literals. A dynamic value is dropped (bestax has no
prop of that name, so leaving it would be a type error) and flagged; set the matching bestax
prop conditionally:

```jsx
<Box isHidden={collapsed} />
<Box visibility={collapsed ? 'hidden' : undefined} />
```

`Column`'s `isSize`/`isOffset` follow the same rule, and a `touch` key has no `sizeTouch`
counterpart in bestax (only `isNarrowTouch`) — Bulma keeps the `is-*-touch` classes, so use
`className`.

## `prop:hasTextColor="white-ter"` / `"white-bis"`

Two Bulma 0.6 shades bestax has no colour for. Use `white`, or a custom class. Every other colour
and shade of that era exists in bestax verbatim.

## `value-reference` — a component used as a value

`const Wrapped = Box` and `{ Subtitle }` are rewritten to the bestax binding (`Hero.Foot`,
`SubTitle`) when the target is a plain rename, and `export { Subtitle }` becomes
`export { SubTitle as Subtitle }` so the public name survives. A re-export of a component whose
bestax counterpart is a member of a compound (`export { CardHeader }` → `Card.Header`) cannot be
expressed and is flagged; so is a barrel `export { X } from 'bloomer'` (`imports`) and a
namespace import used as a plain value (`const { Box } = B`), through which nothing was
migrated. A retained component (`Tile`, the `Nav` family,
`withHelpersModifiers`) used as a value keeps the bloomer import with this flag: migrate the
usage by hand. `withHelpersModifiers` in particular has nothing to become — every bestax
component already takes the helper props, and a custom component gets them from
`useBulmaClasses`.

## `imports` — a bloomer import the codemod left alone

A default import (`import Bloomer from 'bloomer'`) never worked — bloomer has no default
export — and a deep import (`bloomer/lib/elements/Box`) reaches compiled internals the mapping
does not know. Convert either to a named import from `'bloomer'` and re-run the codemod.

## `plain-element` — helper props on markup that became plain HTML

When a component becomes plain markup (`Help`, `Label`, `PanelTab`, …), bloomer's helper props
on it have no home and are dropped with this flag. Re-apply them as classes
(`className="is-pulled-right"`), or wrap the element in a bestax `Box`/`Block` that takes them.

## Dynamic values

Any prop whose value the codemod cannot read — `isColor={c}`, `isNext={n}`, `hasIcons={sides}`,
`tag={t}`, `isTransparent={t}`, `isFullHeight={f}`, `isNormal={n}` — is either renamed as-is (when the rename is unconditional) or flagged with the
specific prop to set. The comment names it.
