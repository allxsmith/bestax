# bloomer → bestax-bulma prop map

Most of bloomer's boolean modifiers are already bestax's names — `isLoading`, `isOutlined`,
`isInverted`, `isStatic`, `isHovered`, `isFocused`, `isBordered`, `isStriped`, `isNarrow`,
`isMultiline`, `isVCentered`, `isMobile`, … pass through untouched. The exceptions are in
the tables below: `isActive` becomes `active` on the components whose bestax counterpart
names it that way, `isFullWidth` survives only where bestax declares it, and a few
(`Input isActive`, `NavbarLink isActive`, `PageLink isActive`) have no counterpart and become
the Bulma class in `className` instead (see the end of this page). What else changes is the value-carrying props, the helper props every component
inherited from `withHelpersModifiers`, and the two props bestax spells differently on every
component.

## Universal helper props

bloomer's `withHelpersModifiers` mixed these into every component.

| bloomer                     | bestax-bulma                                                   | note                                                                                                                                                                                                                                                                                                                         |
| --------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hasTextAlign="centered"`   | `textAlign="centered"`                                         | `left` / `right` / `centered` — same union                                                                                                                                                                                                                                                                                   |
| `hasTextColor="grey-light"` | `textColor="grey-light"`, or `className="has-text-grey-light"` | `textColor` is declared per component, not by the helper hook, so it carries over on the ~48 targets that have it and becomes the Bulma class on the rest (`Tag`, `Table`, `Hero`, `Menu`, `Breadcrumb`, `Panel`, `Icon`, `Progress`, the form controls); every Bulma 0.6 colour and shade works but `white-ter`/`white-bis` |
| `isPulled="right"`          | `float="right"`                                                |                                                                                                                                                                                                                                                                                                                              |
| `isClearfix`                | `clearfix`                                                     |                                                                                                                                                                                                                                                                                                                              |
| `isOverlay`                 | `overlay`                                                      |                                                                                                                                                                                                                                                                                                                              |
| `isUnselectable`            | `interaction="unselectable"`                                   |                                                                                                                                                                                                                                                                                                                              |
| `isMarginless`              | `m="0"`                                                        | bestax expresses the `is-*less` helpers as spacing                                                                                                                                                                                                                                                                           |
| `isPaddingless`             | `p="0"`                                                        |                                                                                                                                                                                                                                                                                                                              |
| `isFullWidth`               | `isFullWidth`                                                  | on Button, Select, Table, Tabs; a TODO elsewhere                                                                                                                                                                                                                                                                             |
| `isDisplay`, `isHidden`     | `display*`, `visibility*`                                      | flattened — see below                                                                                                                                                                                                                                                                                                        |
| `tag`                       | `as`                                                           | where bestax declares one — see below                                                                                                                                                                                                                                                                                        |
| `render`                    | —                                                              | always a TODO                                                                                                                                                                                                                                                                                                                |

## `isDisplay` and `isHidden`

Both take three shapes in bloomer; all three flatten onto bestax's per-viewport props. bestax
declares every Bulma viewport, including `touch` and the `-only` ones, so nothing is lost:

| bloomer                                                        | bestax-bulma                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| `isDisplay="flex"`                                             | `display="flex"`                                              |
| `isDisplay="flex-tablet-only"`                                 | `displayTabletOnly="flex"`                                    |
| `isDisplay={['inline-block', 'flex-desktop']}`                 | `display="inline-block" displayDesktop="flex"`                |
| `isDisplay={{ flex: ['default', 'tablet'], block: 'mobile' }}` | `display="flex" displayTablet="flex" displayMobile="block"`   |
| `isHidden`                                                     | `visibility="hidden"`                                         |
| `isHidden="touch"`                                             | `visibilityTouch="hidden"`                                    |
| `isHidden={['mobile', 'widescreen-only']}`                     | `visibilityMobile="hidden" visibilityWidescreenOnly="hidden"` |

Two entries that land on the same prop, a dynamic value, or a viewport bestax does not know get
a TODO; the bloomer prop is always removed, because bestax has no `isDisplay`/`isHidden` and a
leftover would be a type error rather than a no-op.

## Value props

| bloomer                                                                                                      | bestax-bulma                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isColor="primary"`                                                                                          | `color="primary"` (every component that had it)                                                                                                                                                                                                                           |
| `isSize="large"`                                                                                             | `size="large"` — Button, Content, Delete, Icon, Input, Progress, Section, Select, Tag, TextArea, Breadcrumb, Pagination, Tabs, Field.Label, Modal.Close                                                                                                                   |
| `Title isSize={3}`                                                                                           | `size={3}` — bestax accepts the numbers 1–6                                                                                                                                                                                                                               |
| `Subtitle isSize={4}`                                                                                        | `SubTitle size={4} as="h2"` — bloomer's default was an `<h2>`, bestax's is an `<h1>`, so the level is kept                                                                                                                                                                |
| `Image isSize="128x128"`                                                                                     | `size="128x128"`                                                                                                                                                                                                                                                          |
| `Image isRatio="16:9"`                                                                                       | `size="16by9"` (`square`→`square`, `1:1`→`1by1`, `4:3`→`4by3`, `3:2`→`3by2`, `2:1`→`2by1`)                                                                                                                                                                                |
| `Breadcrumb isAlign`                                                                                         | `alignment`                                                                                                                                                                                                                                                               |
| `Breadcrumb hasSeparator`                                                                                    | `separator`                                                                                                                                                                                                                                                               |
| `Tabs isAlign`                                                                                               | `align`; `isBoxed` → `boxed`, `isToggle` → `toggle`                                                                                                                                                                                                                       |
| `Pagination isAlign`                                                                                         | `align` (`"left"` is the default and is dropped)                                                                                                                                                                                                                          |
| `Dropdown isAlign="right"`                                                                                   | `right`; `isHoverable` → `hoverable`                                                                                                                                                                                                                                      |
| `Icon isAlign="left"`                                                                                        | `className="is-left"` (bestax's Icon has no align prop)                                                                                                                                                                                                                   |
| `Icon className="fas fa-spinner fa-spin"`                                                                    | `name="spinner" library="fa" variant="solid" features="fa-spin"` — modifier classes become `features`                                                                                                                                                                     |
| `PanelIcon className="fas fa-book"`                                                                          | `Panel.Icon name="book" library="fa" variant="solid"` — same className API as `Icon`                                                                                                                                                                                      |
| `Button isLink`                                                                                              | `color="link"` (a TODO if `isColor` is also set)                                                                                                                                                                                                                          |
| `Hero isFullHeight`                                                                                          | `size="fullheight"`                                                                                                                                                                                                                                                       |
| `Container isFluid`                                                                                          | `fluid`                                                                                                                                                                                                                                                                   |
| `Navbar isTransparent`                                                                                       | `transparent`                                                                                                                                                                                                                                                             |
| `Field isGrouped`, `isHorizontal`                                                                            | `grouped` (same `boolean \| 'centered' \| 'right'`), `horizontal`                                                                                                                                                                                                         |
| `FieldLabel isNormal`                                                                                        | `size="normal"`                                                                                                                                                                                                                                                           |
| `Control hasIcons`                                                                                           | `hasIconsLeft` / `hasIconsRight` (`true` sets both; an array sets each)                                                                                                                                                                                                   |
| `PageLink isCurrent`                                                                                         | `active`                                                                                                                                                                                                                                                                  |
| `isActive` on Dropdown, DropdownItem, MenuLink, Modal, NavbarBurger, NavbarMenu, NavbarItem, PanelBlock, Tab | `active`                                                                                                                                                                                                                                                                  |
| `Input`, `Select`, `TextArea`                                                                                | `InputBase`, `SelectBase`, `TextAreaBase` — bloomer's were bare elements; bestax's `Input`/`Select`/`TextArea` wrap themselves in `Field` and `Control`, so the bare `*Base` exports are the faithful targets and your existing `Field`/`Control` markup stays as written |

## Column sizes

| bloomer                                                  | bestax-bulma                                                                                                      |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `isSize={4} isOffset={2}`                                | `size={4} offset={2}`                                                                                             |
| `isSize="1/2"`                                           | `size="half"` (`1/3`→`one-third`, `1/4`→`one-quarter`, `2/3`→`two-thirds`, `3/4`→`three-quarters`, `full`→`full`) |
| `isSize="narrow"`                                        | `isNarrow`                                                                                                        |
| `isSize={{ default: 'full', mobile: 8, tablet: '2/3' }}` | `size="full" sizeMobile={8} sizeTablet="two-thirds"`                                                              |
| `isSize={{ touch: 'narrow' }}`                           | `isNarrowTouch` — bestax has `isNarrowTouch` but no `sizeTouch`/`offsetTouch`, which become TODOs                 |

## `tag` → `as`

bloomer put `tag` on nearly every component; bestax declares `as` on a subset, several of them
narrowed to a literal union, so a value outside the union is a type error you can see rather
than a silent rewrite. The components whose `tag` becomes `as`:

`Button`, `Image`, `Title`, `Subtitle`, `Footer`, `Media`, `MediaLeft`, `LevelItem`, `Control`,
`DropdownItem`,
`MenuLink`, `NavbarItem`, `NavbarLink`.

Everywhere else `tag` is left in place with a TODO. On the components that become plain markup
(`Help`, `Label`, `Heading`, `BreadcrumbItem`, `PanelTab`, `TabLink`, `Page`, `HeroVideo`) a
literal `tag` is honoured — `<Help tag="span">` becomes `<span className="help">`.

A literal `tag` outside the union its bestax target narrows `as` to — `<Media tag="section">`,
`<Control tag="span">` — is dropped with a `prop:as` TODO naming the tags that component does
render. bloomer rendered the tag you asked for; bestax does not offer it there, and writing it
through produced output the project could not compile.

## `href` picks the element

bestax gives an element the attributes of the tag `as` names, so `href` exists only where that
tag is an `<a>`. bloomer had no such rule, and the two libraries part company in two ways.

bloomer's `Button` and `Image` never took `tag` at all. Seven bloomer components — `Button`,
`Delete`, `LevelItem`, `DropdownItem`, `NavbarItem`, `PanelBlock`, `CardFooterItem` — rendered
an `<a>` whenever `href` was set, whatever `tag` said, and a `<div>` (or their default tag)
otherwise; the rest (`MenuLink`, `NavbarLink`, `PageControl`, `Dropdown`, …) rendered their
`tag` regardless.

**On the switching components the `href` wins the element**, because that is what bloomer
rendered. `Button` and `LevelItem` gain `as="a"`; on the targets that already render an anchor
(`Navbar.Item`, `Dropdown.Item`, `Panel.Block`) the `tag` is simply dropped. `Dropdown.Item` is
the exception that loses the `href` too: it declares none at any `as`, so the anchor it renders
is not one you can point anywhere — see [unmappables.md](unmappables.md). A `NavbarItem` or
`DropdownItem` with neither `href` nor `tag` gains `as="div"`, because bestax's `Navbar.Item`
and `Dropdown.Item` default to an `<a>`. An empty or false `href` selected nothing in bloomer
and is dropped. bestax's `Panel.Block` is always an `<a>`, so only a `PanelBlock` with `href`
becomes one — the rest stay the plain `<div class="panel-block">` (or the `tag` you gave) that
bloomer rendered.

A dynamic `href={expr}` was a runtime decision bloomer made and bestax's `as` is one element or
the other. It resolves to the anchor, which is the branch the `href` is there for, and the
`prop:href` TODO names the element to render by hand for the empty case:

```jsx
<Button href={p.url} tag="span">x</Button>
// TODO(bestax-migrate): bloomer chose the element at runtime … render <span> by hand where
// the `href` is empty
<Button href={p.url} as="a">x</Button>
```

**Everywhere else the element wins.** `MenuLink` and `NavbarLink` rendered their `tag` whatever
`href` said, so `<MenuLink href="/x" tag="span">` really was a `<span href="/x">` — which
navigates nowhere in any browser. The element stays and the attribute that did nothing goes,
with a `prop:href` TODO. The same happens to a component that becomes plain markup: a
`<TabLink href="#one" tag="span">` becomes a `<span>`, and its `href` is named rather than
written. Where the link was the intent, drop the `tag`.

## Helper props on parts that take none

A few bestax parts extend only React's HTML attributes and take no Bulma helper props at all:
`Pagination.Previous`/`Next`/`Ellipsis`, `Navbar.Dropdown`/`DropdownMenu`/`Divider`,
`Panel.Heading`/`Tabs`/`Block`, `Tabs.List`/`Item`, `Message.Header`/`Body` and the `Modal`
parts. A bloomer helper on one of those becomes the Bulma class in `className` — except on
`Navbar.Divider`, `Pagination.Ellipsis` and `Dropdown.Divider`, which write their own className
last or take no props at all: there the helper is named in a TODO instead, and an element
carrying a spread is left as bloomer's. Otherwise it is the Bulma class in `className` (`is-pulled-right`,
`m-0`, `is-hidden-mobile`, …), since Bulma v1 still ships every one of them; only a dynamic
value is flagged. The same conversion covers the modifiers bestax has no prop for anywhere —
`Hero isBold`, `Media isSize`, `Subtitle isSpaced`, `Input isActive`, `PanelBlock isWrapped`,
`LevelItem isFlexible`, `NavbarDivider isBoxed`, the pagination parts' `isActive`/`isFocused`.

## Refs

bloomer forwarded no refs. bestax forwards a ref from the form controls and from `Button`,
`LinkButton`, `Modal`, `Dropdown`, `Navbar` (plus `Navbar.Burger` and `Navbar.Link`), `Dialog`,
`Sidebar`, `Toast` and `Carousel` — pass `ref` directly on those.
