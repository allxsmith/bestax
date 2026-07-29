# Reference: form component props

All components import from `@allxsmith/bestax-bulma`. Source lives in `bulma-ui/src/form/`.
Every component also accepts the full Bulma helper props (`m`, `p`, `textColor`, `display`, …)
via `useBulmaClasses`.

## Field — `form/Field.tsx`

Container and layout. Compound parts: `Field.Label`, `Field.Body`.

| Prop                    | Type                                              | Notes                                                              |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| `horizontal`            | `boolean`                                         | Label + control side by side. Auto-wraps children in `Field.Body`. |
| `grouped`               | `boolean \| 'centered' \| 'right' \| 'multiline'` | Controls in a row.                                                 |
| `hasAddons`             | `boolean \| 'centered' \| 'right'`                | Attached controls.                                                 |
| `narrow`                | `boolean`                                         | Constrain to content width (inside horizontal bodies).             |
| `label`                 | `ReactNode`                                       | Convenience label.                                                 |
| `labelSize`             | `'small' \| 'normal' \| 'medium' \| 'large'`      | Label size.                                                        |
| `labelProps`            | label attributes                                  | Props for the `<label>` — where `htmlFor` goes.                    |
| `textColor` / `bgColor` | Bulma color                                       | Helper colors for the field.                                       |

## Control — `form/Control.tsx`

Wraps a single input; adds icons and loading.

| Prop                             | Type                             | Notes                           |
| -------------------------------- | -------------------------------- | ------------------------------- |
| `hasIconsLeft` / `hasIconsRight` | `boolean`                        | Icon containers.                |
| `iconLeft` / `iconRight`         | `IconProps`                      | Full icon config.               |
| `iconLeftName` / `iconRightName` | `string`                         | Icon name shortcut.             |
| `iconLeftSize` / `iconRightSize` | `'small' \| 'medium' \| 'large'` | Icon size.                      |
| `isLoading`                      | `boolean`                        | Loading spinner on the control. |
| `isExpanded`                     | `boolean`                        | Fill available width.           |
| `size`                           | `'small' \| 'medium' \| 'large'` | Control size.                   |
| `as`                             | `'div' \| 'p'`                   | Root element (default `div`).   |

## Input / InputBase — `form/Input.tsx`, `form/InputBase.tsx`

`Input` composes `Field` + `Control` + `InputBase`. Beyond `InputBase` props it adds Field-level
(`label`, `labelSize`, `labelProps`, `horizontal`), Control-level (`iconLeftName`,
`iconRightName`, `iconLeftSize`, `iconRightSize`, `hasIconsLeft`, `hasIconsRight`, `isLoading`,
`isExpanded`, `controlSize`), message (`message`, `messageColor`), and container class overrides
(`fieldClassName`, `controlClassName`).

`InputBase` props:

| Prop                                  | Type                                                                  | Notes                          |
| ------------------------------------- | --------------------------------------------------------------------- | ------------------------------ |
| `color`                               | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'` | Visual state.                  |
| `size`                                | `'small' \| 'medium' \| 'large'`                                      | Size.                          |
| `isRounded`                           | `boolean`                                                             | Pill shape.                    |
| `isStatic`                            | `boolean`                                                             | Static, read-only-styled text. |
| `isLoading`                           | `boolean`                                                             | Loading state.                 |
| `value` / `defaultValue` / `onChange` | —                                                                     | Standard React input.          |
| `disabled` / `readOnly`               | `boolean`                                                             | Native states.                 |

`messageColor` accepts `'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'`.

## Select / SelectBase, TextArea / TextAreaBase

Same convenience/raw split as Input. `Select` supports `isLoading` (on the control), `color`,
`size`, `isRounded`, `isFullwidth` (lowercase w — Button's is `isFullWidth`), `multiple` +
`multipleSize`, plus the Field/Control/message props. `TextArea` adds `rows` and
`hasFixedSize`.

## Checkbox / Checkboxes, Radio / Radios

- `Checkbox` / `Radio` — single controls with `color`, `size`, `checked`/`defaultChecked`,
  `onChange`, `disabled`.
- `Checkboxes` — group wrapper managing an **array** value.
- `Radios` — group wrapper managing a **single** selected value.

## Switch — `form/Switch.tsx`

`color`, `size`, `checked`/`defaultChecked`, `onChange`, `isRounded`, `isThin`, `isOutlined`,
`passiveType`, plus RTL support.

## File — `form/File.tsx`

File input with `label`, `message`, color/size, and icon support.

## Advanced inputs

| Component      | Key props                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Autocomplete` | `data` (`string[]` or item objects), `value`, `onInput(value)` for typing, `onSelect(item)` for picks, `clearable`, `openOnFocus`, `loading`.                           |
| `Slider`       | `min`, `max`, `step`, single or dual thumb (`value` number or `[number, number]`), `tooltip` (`'auto' \| 'always' \| 'hidden'`), vertical orientation, `color`, `size`. |
| `Numberinput`  | `value`/`onChange`, `min`, `max`, `step`, increment/decrement buttons, stepper variant, `color`, `size`.                                                                |
| `Rate`         | `value`/`onChange`, `max`, `precision` (1 / 0.5 / 0.25), `customIcon` or `iconName`, `showScore`/`showText`/`texts`, `disabled`.                                        |
| `Taginput`     | `value` (array)/`onChange`, autocomplete suggestions, configurable confirm keys, closable tags, `color`, `size`.                                                        |

## Date / time inputs

`DateInput`, `TimeInput`, `DateTimeInput` (convenience) and their `*Base` variants. Field/Control
composition like the other convenience inputs, with picker UIs (native with custom fallback).

## Validation-related props (no library)

There is no validation engine. The props you use to reflect externally-computed validation are:

- `color` — `'danger'` for an error, `'success'` for valid.
- `message` — the help/validation text (rendered as `<p class="help">`).
- `messageColor` — colors that help text to match (`'danger'`, `'success'`, …).
