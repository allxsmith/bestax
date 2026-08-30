# rbx → bestax-bulma prop map

rbx and bestax both target Bulma, so most helper _values_ are already identical — the shapes
differ, not the vocabulary. What follows is only what actually changes.

## Universal helper props

rbx mixes these into every component via `HelpersProps`.

| rbx                               | bestax-bulma                 | note                                                       |
| --------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| `backgroundColor`                 | `bgColor`                    | rename only                                                |
| `textColor`                       | `textColor`                  | unchanged                                                  |
| `textAlign`                       | `textAlign`                  | unchanged — both use `centered`/`justified`/`left`/`right` |
| `textWeight`                      | `textWeight`                 | unchanged                                                  |
| `textTransform`                   | `textTransform`              | unchanged                                                  |
| `textSize={4}`                    | `textSize="4"`               | number → string                                            |
| `italic`                          | `textTransform="italic"`     |                                                            |
| `pull="left"`                     | `float="left"`               |                                                            |
| `clearfix`, `overlay`, `relative` | same                         | unchanged booleans                                         |
| `clipped`                         | `overflow="clipped"`         |                                                            |
| `hidden`                          | `visibility="hidden"`        |                                                            |
| `invisible`                       | `visibility="invisible"`     |                                                            |
| `srOnly`                          | `visibility="sr-only"`       |                                                            |
| `marginless`                      | `m="0"`                      | Bulma v1 removed `is-marginless`                           |
| `paddingless`                     | `p="0"`                      | Bulma v1 removed `is-paddingless`                          |
| `radiusless`                      | `radius="radiusless"`        |                                                            |
| `shadowless`                      | `shadow="shadowless"`        |                                                            |
| `unselectable`                    | `interaction="unselectable"` |                                                            |

Two rbx colour names have no bestax equivalent: **`white-ter`** and **`white-bis`**. Everything
else in rbx's `colors` and `shades` unions exists in bestax verbatim.

## Bare boolean modifiers → `is*`

`outlined` → `isOutlined`, `rounded` → `isRounded`, `inverted` → `isInverted`,
`fullwidth` → `isFullwidth`, `static` → `isStatic`, `narrow` → `isNarrow`,
`bordered`/`striped`/`hoverable` on `Table` → `isBordered`/`isStriped`/`isHoverable`,
`delete` on `Tag` → `isDelete`.

## State props → booleans

| rbx                                                 | bestax-bulma                           |
| --------------------------------------------------- | -------------------------------------- |
| `Button state="loading"`                            | `isLoading`                            |
| `Button state="hovered"` / `"focused"` / `"active"` | `isHovered` / `isFocused` / `isActive` |
| `Input state="focused"` / `"hovered"`               | `isFocused` / `isHovered`              |
| `Select.Container state="loading"`                  | `isLoading`                            |

## Form grouping

bestax folds rbx's `kind` + `multiline` + `align` into two value-taking props.

| rbx                                     | bestax-bulma                                                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `Field kind="addons"`                   | `hasAddons`                                                                                                             |
| `Field kind="group"`                    | `grouped`                                                                                                               |
| `Field multiline` (with `kind="group"`) | `grouped="multiline"`                                                                                                   |
| `Field align="centered"`                | ambiguous — TODO; set `grouped`/`hasAddons` to `"centered"` by hand                                                     |
| `Control expanded` / `loading`          | `isExpanded` / `isLoading`                                                                                              |
| `Control iconLeft` / `iconRight`        | `hasIconsLeft` / `hasIconsRight` — note bestax's own `iconLeft` takes an `IconProps` object, which is a different thing |
| `Textarea fixedSize`                    | `hasFixedSize`                                                                                                          |

## Breakpoint objects

rbx has three shapes; all three flatten to bestax's per-viewport props.

```jsx
// 1. the universal `responsive` helper prop
<Box responsive={{ tablet: { display: { value: "flex" }, textSize: { value: 5 } } }} />
<Box displayTablet="flex" textSizeTablet="5" />

// 2. Column sizing
<Column tablet={{ size: 6, narrow: true }} />
<Column sizeTablet={6} isNarrowTablet />

// 3. Column.Group gaps
<Column.Group tablet={{ gapSize: 2 }} />
<Columns gapTablet={2} />
```

`hide: { value: true }` becomes `visibility<Viewport>="hidden"`. The **`touch`** breakpoint and
`{ only: true }` have no bestax props — both are TODOs.

## `as`

rbx's `forwardRefAs` puts `as` on **every** component. bestax declares it on a smaller set, and
several of those narrow it to specific tags (`Footer` is `'footer' | 'div'`, `Control` is
`'div'`). The codemod passes `as` through on the components that accept it —
`Button`, `Title`/`SubTitle`, `Image`, `Footer`, `Media`, `Media.Item`, `Level.Item`, `Control`,
`Menu.Item`, `Dropdown`, `Navbar`, `Navbar.Item` — and TODOs it everywhere else.
