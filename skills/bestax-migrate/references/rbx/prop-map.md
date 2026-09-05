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
`'div'`). The codemod passes `as` through only where bestax really accepts it, and TODOs it
everywhere else:

| bestax component             | `as` accepts               |
| ---------------------------- | -------------------------- |
| `Button`                     | any element type           |
| `Title`, `SubTitle`          | `h1`–`h6`, `p`             |
| `Image`                      | `'figure' \| 'div' \| 'p'` |
| `Footer`                     | `'footer' \| 'div'`        |
| `Media`                      | `'article' \| 'div'`       |
| `Media.Left`                 | `'figure' \| 'div'`        |
| `Level.Item`                 | `'div' \| 'p' \| 'a'`      |
| `Control`                    | `'div'`                    |
| `Menu.Item`                  | any element type           |
| `Dropdown.Item`              | `'a' \| 'div' \| 'button'` |
| `Navbar.Item`, `Navbar.Link` | any element type           |

Three traps worth naming, because rbx supplies `as` universally and the obvious guesses are
wrong:

- The **`Dropdown` and `Navbar` roots do not take `as`** — only their `.Item` / `.Link`
  sub-components do.
- **`Media.Item` depends on its `align`.** It resolves to `Media.Left`, `Media.Content` or
  `Media.Right`, and only `Media.Left` declares `as`; the codemod drops it with a TODO on the
  other two.
- Several of the accepted props are **narrow literal unions**, so `as={SomeComponent}` still
  fails to typecheck even where `as` is allowed — which is deliberate: a visible type error
  beats a silent rewrite.

## Refs

rbx reaches a component's rendered element with `innerRef`. bestax uses a plain forwarded
`ref` on the roots that support one, so the codemod renames the prop:

| rbx                                                   | bestax-bulma | note                                        |
| ----------------------------------------------------- | ------------ | ------------------------------------------- |
| `innerRef` on `Button`, `Dropdown`, `Modal`, `Navbar` | `ref`        | same node — each root's own element         |
| `innerRef` on `Navbar.Burger`, `Navbar.Link`          | `ref`        | these two sub-components forward one too    |
| `innerRef` on `Navbar.Item` **with `dropdown`**       | `ref`        | that one becomes bestax's `Navbar.Dropdown` |
| `innerRef` on `Modal.Container`                       | `ref`        | that one becomes bestax's `Modal` root      |

The third row is the `Navbar.Dropdown` collision, and it runs both ways. Your rbx
`Navbar.Dropdown` is the menu itself (`div.navbar-dropdown`), so it maps to bestax's
`Navbar.DropdownMenu`, which forwards no ref — `innerRef` there is left alone. bestax reserves
the name `Navbar.Dropdown` for the outer container, which is what `<Navbar.Item dropdown>`
becomes, and that one does forward a ref. A plain `<Navbar.Item>` does not, so the rename is
conditional on the `dropdown` prop.

An existing `ref` is passed through untouched — which is safe only where the bestax target
forwards one. rbx forwards a ref on every component; bestax does so on the form controls plus
`Button`, `LinkButton`, `Modal`, `Dropdown`, `Navbar`, `Navbar.Burger`, `Navbar.Link`,
`Navbar.Dropdown`, `Dialog`, `Sidebar`, `Toast` and `Carousel`. Carry a `ref` onto anything
else — `Card`, `Box`, `Section`, `Message`, `Tabs` and most of the catalogue — and it resolves
to `null` at runtime, with React logging "Function components cannot be given refs" and
continuing.

**The codemod does not flag this**, because neither the universal prop table nor any
per-component table has a `ref` entry, so check every `ref` you carried over against the list
above rather than assuming the silent pass-through means it works. The renames above are for
`innerRef`, and apply only on those eight entries. Anywhere else it leaves `innerRef` alone — move the ref onto a wrapping
element you control.

Note the gap that leaves: other bestax components do forward a ref (the form controls,
`LinkButton`, `Dialog`, `Sidebar`, `Toast`, `Carousel`), but their rbx `innerRef` is not mapped
yet, so it passes through untouched rather than being renamed for you.
