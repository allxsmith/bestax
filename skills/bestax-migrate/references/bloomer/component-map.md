# bloomer → bestax-bulma component map

Every bloomer export. bloomer's exports are all _flat_ names, while bestax groups the same
components into dotted compounds — so most rows here rename a flat identifier onto a
`Parent.Child` target, and the codemod imports the parent. `structural` means the codemod
rewrites the element's shape rather than renaming it (see [unmappables.md](unmappables.md) for
what each one produces). A `todo` row has no bestax counterpart — the codemod keeps the bloomer
import, annotated, so the app still runs while you convert it.

This table mirrors `MAPPING` in `bestax-migrate/src/sources/bloomer/mapping.ts`, which a
coverage test holds to bloomer's own export surface (108 exports, vendored from its
`src/index.ts`) in both directions.

| bloomer                | bestax-bulma          | status  |
| ---------------------- | --------------------- | ------- |
| `Box`                  | `Box`                 | mapped  |
| `Breadcrumb`           | `Breadcrumb`          | mapped  |
| `BreadcrumbItem`       | _structural_          | mapped  |
| `Button`               | `Button`              | mapped  |
| `Card`                 | `Card`                | mapped  |
| `CardContent`          | `Card.Content`        | mapped  |
| `CardFooter`           | `Card.Footer`         | mapped  |
| `CardFooterItem`       | `Card.FooterItem`     | mapped  |
| `CardHeader`           | `Card.Header`         | mapped  |
| `CardHeaderIcon`       | `Card.Header.Icon`    | mapped  |
| `CardHeaderTitle`      | `Card.Header.Title`   | mapped  |
| `CardImage`            | `Card.Image`          | mapped  |
| `Checkbox`             | `Checkbox`            | mapped  |
| `Column`               | `Column`              | mapped  |
| `Columns`              | `Columns`             | mapped  |
| `Container`            | `Container`           | mapped  |
| `Content`              | `Content`             | mapped  |
| `Control`              | `Control`             | mapped  |
| `Delete`               | `Delete`              | mapped  |
| `Dropdown`             | `Dropdown`            | partial |
| `DropdownContent`      | — _(see unmappables)_ | todo    |
| `DropdownDivider`      | `Dropdown.Divider`    | mapped  |
| `DropdownItem`         | `Dropdown.Item`       | mapped  |
| `DropdownMenu`         | — _(see unmappables)_ | todo    |
| `DropdownTrigger`      | — _(see unmappables)_ | todo    |
| `Field`                | `Field`               | mapped  |
| `FieldBody`            | `Field.Body`          | mapped  |
| `FieldLabel`           | `Field.Label`         | mapped  |
| `Footer`               | `Footer`              | mapped  |
| `Heading`              | _structural_          | partial |
| `Help`                 | _structural_          | mapped  |
| `Hero`                 | `Hero`                | mapped  |
| `HeroBody`             | `Hero.Body`           | mapped  |
| `HeroFooter`           | `Hero.Foot`           | mapped  |
| `HeroHeader`           | `Hero.Head`           | mapped  |
| `HeroVideo`            | _structural_          | mapped  |
| `Icon`                 | `Icon`                | partial |
| `Image`                | `Image`               | mapped  |
| `Input`                | `Input`               | mapped  |
| `Label`                | _structural_          | mapped  |
| `Level`                | `Level`               | mapped  |
| `LevelItem`            | `Level.Item`          | mapped  |
| `LevelLeft`            | `Level.Left`          | mapped  |
| `LevelRight`           | `Level.Right`         | mapped  |
| `Media`                | `Media`               | mapped  |
| `MediaContent`         | `Media.Content`       | mapped  |
| `MediaLeft`            | `Media.Left`          | mapped  |
| `MediaRight`           | `Media.Right`         | mapped  |
| `Menu`                 | `Menu`                | mapped  |
| `MenuLabel`            | `Menu.Label`          | mapped  |
| `MenuLink`             | `Menu.Item`           | mapped  |
| `MenuList`             | `Menu.List`           | mapped  |
| `Message`              | `Message`             | mapped  |
| `MessageBody`          | `Message.Body`        | mapped  |
| `MessageHeader`        | `Message.Header`      | mapped  |
| `Modal`                | `Modal`               | partial |
| `ModalBackground`      | `Modal.Background`    | mapped  |
| `ModalCard`            | `Modal.Card`          | mapped  |
| `ModalCardBody`        | `Modal.Card.Body`     | mapped  |
| `ModalCardFooter`      | `Modal.Card.Foot`     | mapped  |
| `ModalCardHeader`      | `Modal.Card.Head`     | mapped  |
| `ModalCardTitle`       | `Modal.Card.Title`    | mapped  |
| `ModalClose`           | `Modal.Close`         | mapped  |
| `ModalContent`         | `Modal.Content`       | mapped  |
| `Nav`                  | — _(see unmappables)_ | todo    |
| `NavCenter`            | — _(see unmappables)_ | todo    |
| `NavItem`              | — _(see unmappables)_ | todo    |
| `NavLeft`              | — _(see unmappables)_ | todo    |
| `NavRight`             | — _(see unmappables)_ | todo    |
| `NavToggle`            | — _(see unmappables)_ | todo    |
| `Navbar`               | `Navbar`              | mapped  |
| `NavbarBrand`          | `Navbar.Brand`        | mapped  |
| `NavbarBurger`         | `Navbar.Burger`       | mapped  |
| `NavbarDivider`        | `Navbar.Divider`      | mapped  |
| `NavbarDropdown`       | _structural_          | mapped  |
| `NavbarEnd`            | `Navbar.End`          | mapped  |
| `NavbarItem`           | _structural_          | mapped  |
| `NavbarLink`           | `Navbar.Link`         | mapped  |
| `NavbarMenu`           | `Navbar.Menu`         | mapped  |
| `NavbarStart`          | `Navbar.Start`        | mapped  |
| `Notification`         | `Notification`        | mapped  |
| `Page`                 | _structural_          | mapped  |
| `PageControl`          | _structural_          | mapped  |
| `PageEllipsis`         | `Pagination.Ellipsis` | mapped  |
| `PageLink`             | `Pagination.Link`     | mapped  |
| `PageList`             | `Pagination.List`     | mapped  |
| `Pagination`           | `Pagination`          | mapped  |
| `Panel`                | `Panel`               | mapped  |
| `PanelBlock`           | `Panel.Block`         | mapped  |
| `PanelHeading`         | `Panel.Heading`       | mapped  |
| `PanelIcon`            | `Panel.Icon`          | partial |
| `PanelTab`             | _structural_          | mapped  |
| `PanelTabs`            | `Panel.Tabs`          | mapped  |
| `Progress`             | `Progress`            | mapped  |
| `Radio`                | `Radio`               | mapped  |
| `Section`              | `Section`             | mapped  |
| `Select`               | `Select`              | mapped  |
| `Subtitle`             | `SubTitle`            | mapped  |
| `Tab`                  | `Tabs.Item`           | mapped  |
| `TabLink`              | _structural_          | mapped  |
| `TabList`              | `Tabs.List`           | mapped  |
| `Table`                | `Table`               | mapped  |
| `Tabs`                 | `Tabs`                | mapped  |
| `Tag`                  | `Tag`                 | mapped  |
| `TextArea`             | `TextArea`            | mapped  |
| `Tile`                 | — _(see unmappables)_ | todo    |
| `Title`                | `Title`               | mapped  |
| `withHelpersModifiers` | — _(see unmappables)_ | todo    |

## The renames worth memorising

The flat-to-dotted pattern is regular — `CardHeaderTitle` → `Card.Header.Title`,
`ModalCardBody` → `Modal.Card.Body`, `NavbarBurger` → `Navbar.Burger` — with a handful of names
that change along the way:

| bloomer           | bestax-bulma          | why                                                         |
| ----------------- | --------------------- | ----------------------------------------------------------- |
| `Subtitle`        | `SubTitle`            | bestax's casing                                             |
| `HeroHeader`      | `Hero.Head`           | bestax follows Bulma's `hero-head` / `hero-foot`            |
| `HeroFooter`      | `Hero.Foot`           |                                                             |
| `ModalCardHeader` | `Modal.Card.Head`     | same, for `modal-card-head` / `modal-card-foot`             |
| `ModalCardFooter` | `Modal.Card.Foot`     |                                                             |
| `CardFooterItem`  | `Card.FooterItem`     | one component in bestax, not a child of `Card.Footer`       |
| `MenuLink`        | `Menu.Item`           | bestax's item renders the `<a>`                             |
| `FieldLabel`      | `Field.Label`         | and `FieldBody` → `Field.Body`                              |
| `Tab`             | `Tabs.Item`           | the plain `<li>`; bestax's `Tabs.Tab` is the controlled API |
| `PageLink`        | `Pagination.Link`     | `isCurrent` becomes `active`                                |
| `NavbarDropdown`  | `Navbar.DropdownMenu` | bestax's `Navbar.Dropdown` is the container — see below     |

## Value-chosen targets

Some targets depend on a prop or a child, so the codemod picks them element by element:

| bloomer                                              | becomes                                                            | decided by                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| `PageControl`                                        | `Pagination.Previous` / `Pagination.Next`                          | `isNext` (bloomer's default is previous)         |
| `NavbarItem`                                         | `Navbar.Item` / `Navbar.Dropdown`                                  | `hasDropdown`                                    |
| `Page`                                               | _folded into its child_ / `<li>`                                   | whether the child is a `PageLink`/`PageEllipsis` |
| `PanelBlock`                                         | `Panel.Block` / `<div class="panel-block">`                        | `href` — bestax's block is always an `<a>`       |
| `Icon`, `PanelIcon`                                  | `name`/`library`/`variant` / an `<i>` child                        | whether the icon classes are FA5/6 or MDI        |
| `Help`, `Label`, `Heading`                           | `<p class="help">`, `<label class="label">`, `<p class="heading">` | always plain markup                              |
| `BreadcrumbItem`, `PanelTab`, `TabLink`, `HeroVideo` | `<li>`, `<a>`, `<a>`, `<div class="hero-video">`                   | always plain markup                              |
