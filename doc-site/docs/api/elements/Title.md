## Interfaces

### TitleProps

Props for the Title component.

#### Extends

- `Omit`\<`React.HTMLAttributes`\<`HTMLHeadingElement` \| `HTMLParagraphElement`\>, `"color"`\>.`Omit`\<`BulmaClassesProps`, `"backgroundColor"` \| `"color"`\>

#### Properties

| Property                                      | Type                                                                                                                                                                                                               | Description                                                  | Overrides        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ---------------- |
| <a id="aligncontent"></a> `alignContent?`     | `"flex-start"` \| `"flex-end"` \| `"center"` \| `"space-between"` \| `"space-around"` \| `"space-evenly"` \| `"stretch"`                                                                                           | Align content (e.g., 'center', 'stretch').                   | -                |
| <a id="alignitems"></a> `alignItems?`         | `"flex-start"` \| `"flex-end"` \| `"center"` \| `"start"` \| `"end"` \| `"stretch"` \| `"baseline"`                                                                                                                | Align items (e.g., 'center', 'flex-start').                  | -                |
| <a id="alignself"></a> `alignSelf?`           | `"auto"` \| `"flex-start"` \| `"flex-end"` \| `"center"` \| `"stretch"` \| `"baseline"`                                                                                                                            | Align self (e.g., 'auto', 'center').                         | -                |
| <a id="as"></a> `as?`                         | `"p"` \| `"h1"` \| `"h2"` \| `"h3"` \| `"h4"` \| `"h5"` \| `"h6"`                                                                                                                                                  | HTML element to render as (h1-h6 or p).                      | -                |
| <a id="children"></a> `children?`             | `ReactNode`                                                                                                                                                                                                        | Title content.                                               | `Omit.children`  |
| <a id="classname"></a> `className?`           | `string`                                                                                                                                                                                                           | Additional CSS classes to apply.                             | `Omit.className` |
| <a id="colorshade"></a> `colorShade?`         | `"00"` \| `"05"` \| `"10"` \| `"15"` \| `"20"` \| `"25"` \| `"30"` \| `"35"` \| `"40"` \| `"45"` \| `"50"` \| `"55"` \| `"60"` \| `"65"` \| `"70"` \| `"75"` \| `"80"` \| `"85"` \| `"90"` \| `"95"` \| `"invert"` | Color shade suffix (e.g., '00', 'invert').                   | -                |
| <a id="display"></a> `display?`               | `"block"` \| `"flex"` \| `"inline"` \| `"inline-block"` \| `"inline-flex"`                                                                                                                                         | Display type (e.g., 'block', 'flex').                        | -                |
| <a id="flexdirection"></a> `flexDirection?`   | `"row"` \| `"row-reverse"` \| `"column"` \| `"column-reverse"`                                                                                                                                                     | Flex direction (e.g., 'row', 'column').                      | -                |
| <a id="flexgrow"></a> `flexGrow?`             | `"0"` \| `"1"`                                                                                                                                                                                                     | Flex grow value (e.g., '0', '1').                            | -                |
| <a id="flexshrink"></a> `flexShrink?`         | `"0"` \| `"1"`                                                                                                                                                                                                     | Flex shrink value (e.g., '0', '1').                          | -                |
| <a id="flexwrap"></a> `flexWrap?`             | `"nowrap"` \| `"wrap"` \| `"wrap-reverse"`                                                                                                                                                                         | Flex wrap (e.g., 'wrap', 'nowrap').                          | -                |
| <a id="float"></a> `float?`                   | `"left"` \| `"right"`                                                                                                                                                                                              | Float direction (e.g., 'left', 'right').                     | -                |
| <a id="fontfamily"></a> `fontFamily?`         | `"primary"` \| `"sans-serif"` \| `"monospace"` \| `"secondary"` \| `"code"`                                                                                                                                        | Font family (e.g., 'sans-serif', 'code').                    | -                |
| <a id="interaction"></a> `interaction?`       | `"unselectable"` \| `"clickable"`                                                                                                                                                                                  | Interaction behavior (e.g., 'unselectable', 'clickable').    | -                |
| <a id="isspaced"></a> `isSpaced?`             | `boolean`                                                                                                                                                                                                          | Adds margin below the title.                                 | -                |
| <a id="justifycontent"></a> `justifyContent?` | `"left"` \| `"right"` \| `"flex-start"` \| `"flex-end"` \| `"center"` \| `"space-between"` \| `"space-around"` \| `"space-evenly"` \| `"start"` \| `"end"`                                                         | Justify content (e.g., 'center', 'space-between').           | -                |
| <a id="m"></a> `m?`                           | `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`                                                                                                                                            | Margin (e.g., '0', '1').                                     | -                |
| <a id="mb"></a> `mb?`                         | `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`                                                                                                                                            | Margin bottom.                                               | -                |
| <a id="ml"></a> `ml?`                         | `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`                                                                                                                                            | Margin left.                                                 | -                |
| <a id="mr"></a> `mr?`                         | `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`                                                                                                                                            | Margin right.                                                | -                |
| <a id="mt"></a> `mt?`                         | `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`                                                                                                                                            | Margin top.                                                  | -                |
| <a id="mx"></a> `mx?`                         | `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`                                                                                                                                            | Margin horizontal (left and right).                          | -                |
| <a id="my"></a> `my?`                         | `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`                                                                                                                                            | Margin vertical (top and bottom).                            | -                |
| <a id="overflow"></a> `overflow?`             | `"clipped"`                                                                                                                                                                                                        | Overflow behavior (e.g., 'clipped').                         | -                |
| <a id="overlay"></a> `overlay?`               | `boolean`                                                                                                                                                                                                          | Applies overlay styling if true.                             | -                |
| <a id="p"></a> `p?`                           | `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`                                                                                                                                            | Padding (e.g., '0', '1').                                    | -                |
| <a id="pb"></a> `pb?`                         | `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`                                                                                                                                            | Padding bottom.                                              | -                |
| <a id="pl"></a> `pl?`                         | `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`                                                                                                                                            | Padding left.                                                | -                |
| <a id="pr"></a> `pr?`                         | `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`                                                                                                                                            | Padding right.                                               | -                |
| <a id="pt"></a> `pt?`                         | `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`                                                                                                                                            | Padding top.                                                 | -                |
| <a id="px"></a> `px?`                         | `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`                                                                                                                                            | Padding horizontal (left and right).                         | -                |
| <a id="py"></a> `py?`                         | `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`                                                                                                                                            | Padding vertical (top and bottom).                           | -                |
| <a id="radius"></a> `radius?`                 | `"radiusless"`                                                                                                                                                                                                     | Border radius style (e.g., 'radiusless').                    | -                |
| <a id="responsive"></a> `responsive?`         | `"mobile"` \| `"narrow"`                                                                                                                                                                                           | Responsive behavior (e.g., 'mobile', 'narrow').              | -                |
| <a id="shadow"></a> `shadow?`                 | `"shadowless"`                                                                                                                                                                                                     | Shadow style (e.g., 'shadowless').                           | -                |
| <a id="size"></a> `size?`                     | `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"`                                                                                                                                                                 | Size of the title (1-6).                                     | -                |
| <a id="textalign"></a> `textAlign?`           | `"centered"` \| `"justified"` \| `"left"` \| `"right"`                                                                                                                                                             | Text alignment (e.g., 'centered', 'left').                   | -                |
| <a id="textsize"></a> `textSize?`             | `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"7"`                                                                                                                                                        | Text size (e.g., '1', '2').                                  | -                |
| <a id="texttransform"></a> `textTransform?`   | `"capitalized"` \| `"lowercase"` \| `"uppercase"` \| `"italic"`                                                                                                                                                    | Text transformation (e.g., 'uppercase', 'italic').           | -                |
| <a id="textweight"></a> `textWeight?`         | `"light"` \| `"normal"` \| `"medium"` \| `"semibold"` \| `"bold"`                                                                                                                                                  | Text weight (e.g., 'light', 'bold').                         | -                |
| <a id="viewport"></a> `viewport?`             | `"mobile"` \| `"tablet"` \| `"desktop"` \| `"widescreen"` \| `"fullhd"`                                                                                                                                            | Viewport for responsive classes (e.g., 'mobile', 'desktop'). | -                |
| <a id="visibility"></a> `visibility?`         | `"hidden"` \| `"sr-only"`                                                                                                                                                                                          | Visibility (e.g., 'hidden', 'sr-only').                      | -                |

## Type Aliases

### TitleElement

> **TitleElement** = _typeof_ `validTitleElements`\[`number`\]

Valid HTML elements for the Title component.

---

### TitleSize

> **TitleSize** = _typeof_ `validTitleSizes`\[`number`\]

Valid size values for the Title component (Bulma title sizes).

## Functions

### Title()

> **Title**(`props`, `deprecatedLegacyContext?`): `ReactNode`

Title component for rendering a styled Bulma title.

Supports sizes, spacing, and rendering as different HTML elements.

#### Parameters

##### props

[`TitleProps`](#titleprops)

Props for the Title component.

##### deprecatedLegacyContext?

`any`

**Deprecated**

**See**

[React Docs](https://legacy.reactjs.org/docs/legacy-context.html#referencing-context-in-lifecycle-methods)

#### Returns

`ReactNode`

The rendered title element.
