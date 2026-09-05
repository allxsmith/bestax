# bloomer → bestax-bulma prop map

bloomer's boolean modifiers are already bestax's names — `isActive`, `isLoading`, `isOutlined`,
`isInverted`, `isStatic`, `isHovered`, `isFocused`, `isBordered`, `isStriped`, `isNarrow`,
`isMultiline`, `isVCentered`, `isMobile`, … pass through untouched. What changes is the
value-carrying props, the helper props every component inherited from `withHelpersModifiers`,
and the two props bestax spells differently on every component.

## Universal helper props

bloomer's `withHelpersModifiers` mixed these into every component.

| bloomer                     | bestax-bulma                 | note                                                         |
| --------------------------- | ---------------------------- | ------------------------------------------------------------ |
| `hasTextAlign="centered"`   | `textAlign="centered"`       | `left` / `right` / `centered` — same union                   |
| `hasTextColor="grey-light"` | `textColor="grey-light"`     | every Bulma 0.6 colour and shade but `white-ter`/`white-bis` |
| `isPulled="right"`          | `float="right"`              |                                                              |
| `isClearfix`                | `clearfix`                   |                                                              |
| `isOverlay`                 | `overlay`                    |                                                              |
| `isUnselectable`            | `interaction="unselectable"` |                                                              |
| `isMarginless`              | `m="0"`                      | bestax expresses the `is-*less` helpers as spacing           |
| `isPaddingless`             | `p="0"`                      |                                                              |
| `isFullWidth`               | `isFullWidth`                | on Button, Select, Table, Tabs; a TODO elsewhere             |
| `isDisplay`, `isHidden`     | `display*`, `visibility*`    | flattened — see below                                        |
| `tag`                       | `as`                         | where bestax declares one — see below                        |
| `render`                    | —                            | always a TODO                                                |

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

| bloomer                                                                                                      | bestax-bulma                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isColor="primary"`                                                                                          | `color="primary"` (every component that had it)                                                                                                         |
| `isSize="large"`                                                                                             | `size="large"` — Button, Content, Delete, Icon, Input, Progress, Section, Select, Tag, TextArea, Breadcrumb, Pagination, Tabs, Field.Label, Modal.Close |
| `Title isSize={3}`                                                                                           | `size={3}` — bestax accepts the numbers 1–6                                                                                                             |
| `Subtitle isSize={4}`                                                                                        | `SubTitle size={4}`                                                                                                                                     |
| `Image isSize="128x128"`                                                                                     | `size="128x128"`                                                                                                                                        |
| `Image isRatio="16:9"`                                                                                       | `size="16by9"` (`square`→`square`, `1:1`→`1by1`, `4:3`→`4by3`, `3:2`→`3by2`, `2:1`→`2by1`)                                                              |
| `Breadcrumb isAlign`                                                                                         | `alignment`                                                                                                                                             |
| `Breadcrumb hasSeparator`                                                                                    | `separator`                                                                                                                                             |
| `Tabs isAlign`                                                                                               | `align`; `isBoxed` → `boxed`, `isToggle` → `toggle`                                                                                                     |
| `Pagination isAlign`                                                                                         | `align` (`"left"` is the default and is dropped)                                                                                                        |
| `Dropdown isAlign="right"`                                                                                   | `right`; `isHoverable` → `hoverable`                                                                                                                    |
| `Icon isAlign="left"`                                                                                        | `className="is-left"` (bestax's Icon has no align prop)                                                                                                 |
| `Button isLink`                                                                                              | `color="link"` (a TODO if `isColor` is also set)                                                                                                        |
| `Hero isFullHeight`                                                                                          | `size="fullheight"`                                                                                                                                     |
| `Container isFluid`                                                                                          | `fluid`                                                                                                                                                 |
| `Navbar isTransparent`                                                                                       | `transparent`                                                                                                                                           |
| `Field isGrouped`, `isHorizontal`                                                                            | `grouped` (same `boolean \| 'centered' \| 'right'`), `horizontal`                                                                                       |
| `FieldLabel isNormal`                                                                                        | `size="normal"`                                                                                                                                         |
| `Control hasIcons`                                                                                           | `hasIconsLeft` / `hasIconsRight` (`true` sets both; an array sets each)                                                                                 |
| `PageLink isCurrent`                                                                                         | `active`                                                                                                                                                |
| `isActive` on Dropdown, DropdownItem, MenuLink, Modal, NavbarBurger, NavbarMenu, NavbarItem, PanelBlock, Tab | `active`                                                                                                                                                |

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

`Title`, `Subtitle`, `Footer`, `Media`, `MediaLeft`, `LevelItem`, `Control`, `DropdownItem`,
`MenuLink`, `NavbarItem`, `NavbarLink`.

Everywhere else `tag` is left in place with a TODO. On the components that become plain markup
(`Help`, `Label`, `Heading`, `BreadcrumbItem`, `PanelTab`, `TabLink`, `Page`, `HeroVideo`) a
literal `tag` is honoured — `<Help tag="span">` becomes `<span className="help">`.

bloomer's `Button` and `Image` never took `tag` at all. bloomer rendered an `<a>` whenever `href` was set, whatever `tag` said. The codemod keeps that:
`Button` and `LevelItem` gain `as="a"` beside their `href`, and a `tag` next to an `href` is
dropped on the targets that already render an anchor (`Navbar.Item`, `Menu.Item`,
`Dropdown.Item`, `Panel.Block`).

## Refs

bloomer forwarded no refs. bestax forwards a ref from the form controls and from `Button`,
`LinkButton`, `Modal`, `Dropdown`, `Navbar` (plus `Navbar.Burger` and `Navbar.Link`), `Dialog`,
`Sidebar`, `Toast` and `Carousel` — pass `ref` directly on those.
