# rbx → bestax-bulma component map

Every rbx v2 export and its dot-notation compounds. `structural` means the codemod rewrites the
element's shape rather than renaming it (see [unmappables.md](unmappables.md) for what each one
produces). A `todo` row has no bestax counterpart — the codemod keeps the rbx import, annotated,
so the app still runs while you convert it.

This table mirrors `MAPPING` in `bestax-migrate/src/sources/rbx/mapping.ts`, which a coverage
test holds to rbx's own export surface in both directions.

| rbx                        | bestax-bulma          | status  |
| -------------------------- | --------------------- | ------- |
| `Block`                    | `Block`               | mapped  |
| `Box`                      | `Box`                 | mapped  |
| `Breadcrumb`               | `Breadcrumb`          | mapped  |
| `Breadcrumb.Item`          | _structural_          | mapped  |
| `Button`                   | `Button`              | mapped  |
| `Button.Group`             | `Buttons`             | mapped  |
| `Card`                     | `Card`                | mapped  |
| `Card.Content`             | `Card.Content`        | mapped  |
| `Card.Image`               | `Card.Image`          | mapped  |
| `Card.Header`              | `Card.Header`         | mapped  |
| `Card.Header.Title`        | `Card.Header.Title`   | mapped  |
| `Card.Header.Icon`         | `Card.Header.Icon`    | mapped  |
| `Card.Footer`              | `Card.Footer`         | mapped  |
| `Card.Footer.Item`         | `Card.FooterItem`     | mapped  |
| `Checkbox`                 | `Checkbox`            | mapped  |
| `Column`                   | `Column`              | mapped  |
| `Column.Group`             | `Columns`             | mapped  |
| `Container`                | `Container`           | mapped  |
| `Content`                  | `Content`             | mapped  |
| `Content.OrderedList`      | `OrderedList`         | mapped  |
| `Content.OrderedList.Item` | `OrderedList.Item`    | mapped  |
| `Control`                  | `Control`             | mapped  |
| `Delete`                   | `Delete`              | mapped  |
| `Divider`                  | `Divider`             | partial |
| `Dropdown`                 | `Dropdown`            | partial |
| `Dropdown.Container`       | _structural_          | mapped  |
| `Dropdown.Content`         | _structural_          | mapped  |
| `Dropdown.Menu`            | _structural_          | mapped  |
| `Dropdown.Trigger`         | _structural_          | mapped  |
| `Dropdown.Item`            | `Dropdown.Item`       | mapped  |
| `Dropdown.Divider`         | `Dropdown.Divider`    | mapped  |
| `Dropdown.Context`         | — _(see unmappables)_ | todo    |
| `Field`                    | `Field`               | mapped  |
| `Field.Label`              | `Field.Label`         | mapped  |
| `Field.Body`               | `Field.Body`          | mapped  |
| `Fieldset`                 | — _(see unmappables)_ | todo    |
| `File`                     | `File`                | mapped  |
| `File.CTA`                 | — _(see unmappables)_ | todo    |
| `File.Icon`                | — _(see unmappables)_ | todo    |
| `File.Input`               | — _(see unmappables)_ | todo    |
| `File.Label`               | — _(see unmappables)_ | todo    |
| `File.Name`                | — _(see unmappables)_ | todo    |
| `Footer`                   | `Footer`              | mapped  |
| `Generic`                  | — _(see unmappables)_ | todo    |
| `Heading`                  | _structural_          | mapped  |
| `Help`                     | _structural_          | mapped  |
| `Hero`                     | `Hero`                | mapped  |
| `Hero.Body`                | `Hero.Body`           | mapped  |
| `Hero.Foot`                | `Hero.Foot`           | mapped  |
| `Hero.Head`                | `Hero.Head`           | mapped  |
| `Highlight`                | — _(see unmappables)_ | todo    |
| `Icon`                     | `Icon`                | partial |
| `Image`                    | `Image`               | mapped  |
| `Image.Container`          | _structural_          | mapped  |
| `Input`                    | `Input`               | mapped  |
| `Label`                    | _structural_          | mapped  |
| `Level`                    | `Level`               | mapped  |
| `Level.Item`               | _structural_          | mapped  |
| `List`                     | — _(see unmappables)_ | todo    |
| `List.Item`                | — _(see unmappables)_ | todo    |
| `Loader`                   | _structural_          | mapped  |
| `Media`                    | `Media`               | mapped  |
| `Media.Item`               | _structural_          | mapped  |
| `Menu`                     | `Menu`                | mapped  |
| `Menu.Label`               | `Menu.Label`          | mapped  |
| `Menu.List`                | `Menu.List`           | mapped  |
| `Menu.List.Item`           | `Menu.Item`           | mapped  |
| `Message`                  | `Message`             | mapped  |
| `Message.Body`             | `Message.Body`        | mapped  |
| `Message.Header`           | `Message.Header`      | mapped  |
| `Modal`                    | `Modal`               | partial |
| `Modal.Background`         | `Modal.Background`    | mapped  |
| `Modal.Close`              | `Modal.Close`         | mapped  |
| `Modal.Content`            | `Modal.Content`       | mapped  |
| `Modal.Container`          | _structural_          | mapped  |
| `Modal.Card`               | `Modal.Card`          | mapped  |
| `Modal.Card.Body`          | `Modal.Card.Body`     | mapped  |
| `Modal.Card.Foot`          | `Modal.Card.Foot`     | mapped  |
| `Modal.Card.Head`          | `Modal.Card.Head`     | mapped  |
| `Modal.Card.Title`         | `Modal.Card.Title`    | mapped  |
| `Modal.Context`            | — _(see unmappables)_ | todo    |
| `Modal.Portal`             | — _(see unmappables)_ | todo    |
| `Navbar`                   | `Navbar`              | mapped  |
| `Navbar.Brand`             | `Navbar.Brand`        | mapped  |
| `Navbar.Burger`            | `Navbar.Burger`       | mapped  |
| `Navbar.Divider`           | `Navbar.Divider`      | mapped  |
| `Navbar.Menu`              | `Navbar.Menu`         | mapped  |
| `Navbar.Link`              | `Navbar.Link`         | mapped  |
| `Navbar.Item`              | _structural_          | mapped  |
| `Navbar.Item.Container`    | _structural_          | mapped  |
| `Navbar.Dropdown`          | _structural_          | mapped  |
| `Navbar.Segment`           | _structural_          | mapped  |
| `Navbar.Container`         | _structural_          | mapped  |
| `Navbar.Context`           | — _(see unmappables)_ | todo    |
| `Notification`             | `Notification`        | mapped  |
| `Numeric`                  | — _(see unmappables)_ | todo    |
| `PageLoader`               | `Loading`             | mapped  |
| `Pagination`               | `Pagination`          | mapped  |
| `Pagination.Link`          | `Pagination.Link`     | mapped  |
| `Pagination.List`          | `Pagination.List`     | mapped  |
| `Pagination.Ellipsis`      | `Pagination.Ellipsis` | mapped  |
| `Pagination.Step`          | _structural_          | mapped  |
| `Panel`                    | `Panel`               | mapped  |
| `Panel.Heading`            | `Panel.Heading`       | mapped  |
| `Panel.Block`              | `Panel.Block`         | mapped  |
| `Panel.Icon`               | `Panel.Icon`          | partial |
| `Panel.Tab`                | _structural_          | mapped  |
| `Panel.Tab.Group`          | `Panel.Tabs`          | mapped  |
| `Progress`                 | `Progress`            | mapped  |
| `Radio`                    | `Radio`               | mapped  |
| `Section`                  | `Section`             | mapped  |
| `Select`                   | `Select`              | mapped  |
| `Select.Container`         | _structural_          | mapped  |
| `Select.Option`            | _structural_          | mapped  |
| `Tab`                      | `Tabs.Item`           | mapped  |
| `Tab.Group`                | `Tabs`                | mapped  |
| `Table`                    | `Table`               | mapped  |
| `Table.Body`               | `Table.Tbody`         | mapped  |
| `Table.Cell`               | `Table.Td`            | mapped  |
| `Table.Foot`               | `Table.Tfoot`         | mapped  |
| `Table.Head`               | `Table.Thead`         | mapped  |
| `Table.Heading`            | `Table.Th`            | mapped  |
| `Table.Row`                | `Table.Tr`            | mapped  |
| `Tag`                      | `Tag`                 | mapped  |
| `Tag.Group`                | `Tags`                | mapped  |
| `Textarea`                 | `TextArea`            | mapped  |
| `Tile`                     | — _(see unmappables)_ | todo    |
| `Title`                    | _structural_          | mapped  |
| `forwardRefAs`             | — _(see unmappables)_ | todo    |

## The renames worth memorising

| rbx                                | bestax-bulma                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Tag.Group`                        | `Tags`                                                                                                     |
| `Button.Group`                     | `Buttons`                                                                                                  |
| `Column.Group`                     | `Columns`                                                                                                  |
| `Card.Footer.Item`                 | `Card.FooterItem`                                                                                          |
| `Table.Head` / `.Body` / `.Foot`   | `Table.Thead` / `.Tbody` / `.Tfoot`                                                                        |
| `Table.Row` / `.Cell` / `.Heading` | `Table.Tr` / `.Td` / `.Th`                                                                                 |
| `Textarea`                         | `TextArea`                                                                                                 |
| `PageLoader`                       | `Loading` with `isFullPage`                                                                                |
| `Loader`                           | a plain `<div className="loader">` — bestax's `Loading` is an overlay that renders nothing unless `active` |
| `Menu.List.Item`                   | `Menu.Item`                                                                                                |
| `Tab` / `Tab.Group`                | `Tabs.Item` / `Tabs`                                                                                       |
| `Panel.Tab.Group`                  | `Panel.Tabs`                                                                                               |
| `Title subtitle`                   | `SubTitle`                                                                                                 |

## Value-chosen targets

These pick a bestax component from a literal prop value; a dynamic value gets a TODO instead.

| rbx               | value                                    | bestax-bulma                                   |
| ----------------- | ---------------------------------------- | ---------------------------------------------- |
| `Level.Item`      | `align="left"` / `"right"`               | `Level.Left` / `Level.Right`                   |
| `Media.Item`      | `align="left"` / `"content"` / `"right"` | `Media.Left` / `Media.Content` / `Media.Right` |
| `Navbar.Segment`  | `align="start"` / `"end"`                | `Navbar.Start` / `Navbar.End`                  |
| `Pagination.Step` | `align="previous"` / `"next"`            | `Pagination.Previous` / `Pagination.Next`      |
| `Navbar.Item`     | `dropdown`                               | `Navbar.Dropdown`                              |
