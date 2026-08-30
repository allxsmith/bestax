# Recipes for every TODO(bestax-migrate) the rbx codemod leaves

Ordered by how often they appear when the codemod runs over rbx's own documentation examples.
Resolve the comment, then delete it. Never silence a TODO without converting the code.

## `component:Icon` — the icon child

bestax's `Icon` takes a **required `name`** instead of an icon child, and rbx's docs teach the
FontAwesome component form, which carries no readable name.

```jsx
<Icon size="small"><FontAwesomeIcon icon={faHome} /></Icon>
<Icon name="home" library="fa" variant="solid" size="small" />
```

`library` is `fa` | `mdi` | `ion` | `material-icons` | `material-symbols`; `variant` is the style
(`solid`, `regular`, `brands`, …). Icon-font children the parser _can_ read
(`<i className="fas fa-home" />`) are converted automatically.

## `component:Tile` — Bulma v1 removed tiles

Use Grid and Cell. `Tile kind="ancestor"` becomes `<Grid>`, `kind="parent"`/`kind="child"`
become `<Cell>`, and `size={n}` becomes a column span.

```jsx
<Tile kind="ancestor"><Tile kind="parent" size={4}><Tile kind="child">x</Tile></Tile></Tile>
<Grid><Cell colSpan={4}>x</Cell></Grid>
```

## `component:File.*` — the file-input parts

bestax's `<File>` renders the whole Bulma structure itself, so `File.Label`, `File.Input`,
`File.CTA`, `File.Icon` and `File.Name` have nothing to become.

```jsx
<File hasName>
  <File.Label>
    <File.Input name="upload" />
    <File.CTA><File.Label>Choose…</File.Label></File.CTA>
    <File.Name>none</File.Name>
  </File.Label>
</File>

<File name="upload" label="Choose…" hasName />
```

## `prop:as` — polymorphism

rbx puts `as` on everything; bestax does not. Either render the tag directly, or restructure.
See the `as` section of [prop-map.md](prop-map.md) for the components that do accept it.

## `component:Generic` — rbx's base element

`Generic` is rbx's untyped passthrough. Render the underlying tag, and move its helper props to
the nearest bestax component (or a `className`).

## `component:Dropdown` and its parts

bestax's `Dropdown` takes a `label` and renders its own trigger and menu, so rbx's four-element
structure collapses to one.

```jsx
<Dropdown>
  <Dropdown.Trigger>Open</Dropdown.Trigger>
  <Dropdown.Menu><Dropdown.Content>
    <Dropdown.Item active>one</Dropdown.Item>
  </Dropdown.Content></Dropdown.Menu>
</Dropdown>

<Dropdown label="Open">
  <Dropdown.Item active>one</Dropdown.Item>
</Dropdown>
```

## `component:List` — the bulma-list extension

Bulma v1 does not ship it. Use `<UnorderedList>`/`<UnorderedList.Item>` for a plain list, or
`<Menu>`/`<Menu.Item>` when the items are navigation.

## `component:Fieldset`, `component:Numeric`, `component:Highlight`

No bestax equivalents, and none needed: render a plain `<fieldset>` (its `disabled` attribute
works natively), use `Intl.NumberFormat` directly, and use `<Pre>` with your own highlighter.

## `responsive` — `touch` and `{ only: true }`

bestax's viewports are `mobile`/`tablet`/`desktop`/`widescreen`/`fullhd`, with no `touch` and no
`-only` variants. Reach for a `className` with the Bulma class, or restyle in CSS.

The codemod always removes the whole `responsive` prop, even when part of it could not be
converted — bestax has its own unrelated `responsive` prop (`'mobile' | 'narrow'`), so leaving a
half-emptied rbx object behind would be a type error rather than a leftover. The TODO names
which breakpoints did not carry.

## Props with no counterpart

| TODO                                               | What to do                                                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `prop:closeOnEsc`, `prop:closeOnBlur` on `Modal`   | bestax's Modal always closes on Escape and on background click; drop them or handle it in `onClose` |
| `prop:selected`, `prop:text` on `Button`           | `className="is-selected"`; for `is-text` use `color="ghost"` or a link                              |
| `prop:size` on `Button.Group` / `Tags` / `Message` | set `size` on each child instead                                                                    |
| `prop:gradient` on `Hero`                          | Bulma v1 removed `is-bold` gradients; use `bgColor` or a custom class                               |
| `prop:color`, `prop:vertical` on `Divider`         | bestax's `Divider` takes only `bgColor` and renders an `<hr>`                                       |
| `prop:direction` on `PageLoader`                   | no directional variant; drop it or add a class                                                      |
| `prop:innerRef`                                    | bestax components take a plain `ref`                                                                |
| `prop:managed`, `prop:document`                    | bestax components are uncontrolled and render into the default document                             |
| `badgeOutlined`, `badgeRounded`, `badgeSize`       | bestax's `Badge` has no outline, pill or size variant                                               |
| `tooltipResponsive`                                | bestax's `Tooltip` has one `position` for all viewports                                             |

## `prop:textColor="white-ter"` / `"white-bis"`

The only two rbx colour names bestax does not carry. Use `white`, or a custom class.

## `value-reference` — a component used as a value

`const X = Card.Header;` and similar. The codemod rewrites what it can prove safe and flags the
rest; convert the usage by hand.

## Dynamic values

Anything the codemod cannot read statically (`state={x}`, `align={side}`,
`subtitle={isSub}`) is left in place with a TODO. Split the branch by hand — the codemod never
guesses at a runtime value.
