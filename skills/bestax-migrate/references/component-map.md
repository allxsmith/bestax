# Component map: react-bulma-components v4 → @allxsmith/bestax-bulma

Every RBC v4 export and compound sub-component, with its bestax target. **Auto** = the
codemod converts it; **Flagged** = it leaves a `TODO(bestax-migrate)` comment (see
[unmappables.md](unmappables.md) for the recipes).

## Top-level components

| RBC            | bestax                                       | Notes                                                                                 |
| -------------- | -------------------------------------------- | ------------------------------------------------------------------------------------- |
| `Block`        | `Block`                                      | Auto                                                                                  |
| `Box`          | `Box`                                        | Auto                                                                                  |
| `Breadcrumb`   | `Breadcrumb`                                 | Auto; `align` → `alignment` (`center`→`centered`)                                     |
| `Button`       | `Button`                                     | Auto; `<Button remove/>` → `<Delete/>`; see prop map                                  |
| `Card`         | `Card`                                       | Auto                                                                                  |
| `Columns`      | `Columns`                                    | Auto; `breakpoint="mobile"`→`isMobile`, `multiline`→`isMultiline`, …                  |
| `Container`    | `Container`                                  | Auto; `breakpoint="fluid"`→`fluid`, `max`→`isMax`                                     |
| `Content`      | `Content`                                    | Auto                                                                                  |
| `Dropdown`     | `Dropdown`                                   | Structure auto; controlled `value`/`onChange` flagged                                 |
| `Element`      | —                                            | Flagged: no generic element; use a semantic component + helper props                  |
| `Footer`       | `Footer`                                     | Auto                                                                                  |
| `Form.*`       | flat imports                                 | See Form table below                                                                  |
| `Heading`      | `Title` / `SubTitle` / `<p class="heading">` | Auto; `subtitle` picks `SubTitle`, `heading` picks the plain element                  |
| `Hero`         | `Hero`                                       | Auto; `hasNavbar`→`fullheightWithNavbar`; `halfheight`/`gradient` flagged             |
| `Icon`         | `Icon`                                       | `<i class="fas fa-x">` children → `name`/`library`/`variant` props; else flagged      |
| `Image`        | `Image`                                      | Auto; numeric `size={128}` → `size="128x128"`, `rounded`→`isRounded`                  |
| `Level`        | `Level`                                      | Auto; `breakpoint="mobile"`→`isMobile`                                                |
| `Loader`       | plain `<div className="loader">`             | Auto (Bulma v1 still ships the class)                                                 |
| `Media`        | `Media`                                      | Auto                                                                                  |
| `Menu`         | `Menu`                                       | Auto                                                                                  |
| `Message`      | `Message`                                    | Auto; `size` flagged                                                                  |
| `Modal`        | `Modal`                                      | `show`→`active`; `closeOnEsc`/`closeOnBlur`/`showClose` flagged (defaults cover them) |
| `Navbar`       | `Navbar`                                     | Auto; see dropdown note below                                                         |
| `Notification` | `Notification`                               | Auto; `light`→`isLight`                                                               |
| `Pagination`   | `Pagination`                                 | `onChange`→`onPageChange`; `delta`/labels/`showFirstLast`/`autoHide` flagged          |
| `Panel`        | `Panel`                                      | Auto                                                                                  |
| `Progress`     | `Progress`                                   | Auto                                                                                  |
| `Section`      | `Section`                                    | Auto                                                                                  |
| `Table`        | `Table`                                      | Auto; `size="fullwidth"`→`isFullwidth`, `striped`→`isStriped`, …                      |
| `Tabs`         | `Tabs`                                       | Auto; children wrapped in `Tabs.List`; `type="toggle-rounded"`→`toggle rounded`       |
| `Tag`          | `Tag`                                        | Auto; `remove`→`isDelete`, `rounded`→`isRounded`                                      |
| `Tile`         | —                                            | Flagged: Bulma v1 replaced tiles with `Grid`/`Cell`                                   |

## Compound sub-components

| RBC                                                         | bestax                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `Breadcrumb.Item`                                           | plain `<li><a href=…>` (`active` → `is-active`)                          |
| `Button.Group`                                              | `Buttons` (`align="right"`→`isRight`)                                    |
| `Card.Header` / `.Title` / `.Icon`                          | `Card.Header` / `.Header.Title` / `.Header.Icon`                         |
| `Card.Image`                                                | `Card.Image` wrapping an inner `<Image>`                                 |
| `Card.Content`                                              | `Card.Content`                                                           |
| `Card.Footer` / `Card.Footer.Item`                          | `Card.Footer` / `Card.FooterItem`                                        |
| `Columns.Column`                                            | `Column` (flat import)                                                   |
| `Dropdown.Item` / `.Divider`                                | `Dropdown.Item` / `Dropdown.Divider`                                     |
| `Hero.Header` / `.Body` / `.Footer`                         | `Hero.Head` / `Hero.Body` / `Hero.Foot`                                  |
| `Icon.Text`                                                 | `IconText`                                                               |
| `Level.Side align` / `Level.Item`                           | `Level.Left` or `Level.Right` / `Level.Item`                             |
| `Media.Item align`                                          | `MediaLeft` / `MediaContent` / `MediaRight` (flat)                       |
| `Menu.List` (+ `title`)                                     | `Menu.List` (+ a `Menu.Label` sibling)                                   |
| `Menu.List.Item`                                            | `Menu.Item`                                                              |
| `Message.Header` / `.Body`                                  | `Message.Header` / `Message.Body`                                        |
| `Modal.Content`                                             | `Modal.Content`                                                          |
| `Modal.Card` `.Header`/`.Body`/`.Footer`/`.Title`           | `Modal.Card` `.Head`/`.Body`/`.Foot`/`.Title`                            |
| `Navbar.Brand`/`.Burger`/`.Menu`/`.Item`/`.Link`/`.Divider` | same names                                                               |
| `Navbar.Container align`                                    | `Navbar.Start` / `Navbar.End`                                            |
| `Navbar.Item` wrapping a dropdown                           | `Navbar.Dropdown` (container)                                            |
| `Navbar.Dropdown` (the menu)                                | `Navbar.DropdownMenu`                                                    |
| `Panel.Header`                                              | `Panel.Heading`                                                          |
| `Panel.Tabs` / `Panel.Tabs.Tab`                             | `Panel.Tabs` / plain `<a>` children                                      |
| `Panel.Block` / `Panel.Icon`                                | `Panel.Block` / `Panel.Icon` (icon child → `name`)                       |
| `Table.Container`                                           | `isResponsive` on the child `Table` (or `<div class="table-container">`) |
| `Tabs.Tab`                                                  | `Tabs.Item` (inside a generated `Tabs.List`)                             |
| `Tag.Group`                                                 | `Tags` (`gapless` → `hasAddons`)                                         |

## Form namespace → flat imports

| RBC                | bestax                                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `Form.Field`       | `Field` (`kind="group"`→`grouped`, `kind="addons"`→`hasAddons`, `align` folds into the value, `multiline`→`grouped="multiline"`) |
| `Form.Field.Label` | `FieldLabel`                                                                                                                     |
| `Form.Field.Body`  | `FieldBody`                                                                                                                      |
| `Form.Control`     | `Control` (`fullwidth`→`isExpanded`, `loading`→`isLoading`)                                                                      |
| `Form.Input`       | `Input` (`rounded`→`isRounded`, `status="focus"`→`isFocused`)                                                                    |
| `Form.Label`       | plain `<label className="label">`                                                                                                |
| `Form.Textarea`    | `TextArea` (`fixedSize`→`hasFixedSize`)                                                                                          |
| `Form.Select`      | `Select` (`loading`→`isLoading`, `fullwidth`→`isFullwidth`)                                                                      |
| `Form.Checkbox`    | `Checkbox`                                                                                                                       |
| `Form.Radio`       | `Radio`                                                                                                                          |
| `Form.Help`        | plain `<p className="help is-…">` (prefer Field `message`/`messageColor`)                                                        |
| `Form.InputFile`   | `File` (`filename`→`fileName`+`hasName`, `boxed`→`isBoxed`, `label`→`buttonLabel`)                                               |
