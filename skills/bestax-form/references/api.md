# Reference: form component props

All components import from `@allxsmith/bestax-bulma`. Source lives in `bulma-ui/src/form/`.
Every component also accepts the full Bulma helper props (`m`, `p`, `textColor`, `display`, …)
via `useBulmaClasses`.

## Field — `form/Field.tsx`

Container and layout. Compound parts: `Field.Label`, `Field.Body`.

| Prop                    | Type                                              | Notes                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `horizontal`            | `boolean`                                         | Label + control side by side. Auto-wraps children in `Field.Body`.                                                                                                                                 |
| `grouped`               | `boolean \| 'centered' \| 'right' \| 'multiline'` | Controls in a row.                                                                                                                                                                                 |
| `hasAddons`             | `boolean \| 'centered' \| 'right'`                | Attached controls.                                                                                                                                                                                 |
| `narrow`                | `boolean`                                         | Constrain to content width (inside horizontal bodies).                                                                                                                                             |
| `label`                 | `ReactNode`                                       | Names the one control it holds: a composed base or convenience input through its id, a group through `aria-labelledby` (skipped for `grouped`/`hasAddons`; a nested `Field` starts its own scope). |
| `labelSize`             | `'small' \| 'normal' \| 'medium' \| 'large'`      | Label size.                                                                                                                                                                                        |
| `labelProps`            | label attributes                                  | Props for the `<label>`. An explicit `htmlFor` (even `undefined`) takes over the association; otherwise it is set automatically. For its `id`, see below.                                          |
| `textColor` / `bgColor` | Bulma color                                       | Helper colors for the field.                                                                                                                                                                       |

An `id` in `labelProps` is what a group's, a range `Slider`'s and an `Autocomplete` suggestion list's `aria-labelledby` points at. A label wired by hand with `htmlFor` gets no generated id, so give it one, `labelProps={{ htmlFor, id }}`, for a range `Slider` or an `Autocomplete`. No group points at a label wired by hand.

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
(`fieldClassName`, `controlClassName`). Inside your own `Control` it renders no `Control` of its
own, so the Control-level props and `controlClassName` do nothing there and warn in development;
set them on that `Control` instead.

`InputBase` props:

| Prop                                  | Type                                                                  | Notes                                              |
| ------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| `color`                               | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'` | Visual state.                                      |
| `size`                                | `'small' \| 'medium' \| 'large'`                                      | Size.                                              |
| `isRounded`                           | `boolean`                                                             | Pill shape.                                        |
| `isStatic`                            | `boolean`                                                             | Static-text styling; add `readOnly` to stop edits. |
| `isLoading`                           | `boolean`                                                             | No spinner here; set `isLoading` on the `Control`. |
| `value` / `defaultValue` / `onChange` | —                                                                     | Standard React input.                              |
| `disabled` / `readOnly`               | `boolean`                                                             | Native states.                                     |

`messageColor` accepts `'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'`.

## Select / SelectBase, TextArea / TextAreaBase

Same convenience/raw split as Input. `Select` supports `isLoading` (a spinner in place of the
chevron), `color`, `size`, `isRounded`, `isFullwidth`, `multiple` + `multipleSize`, plus the
Field/Control/message props. `TextArea` adds `rows` and `hasFixedSize`.

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

| Component      | Key props                                                                                                                                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Autocomplete` | `data` (`string[]` or item objects), `value`, `onInput(value)` for typing, `onSelect(item)` for picks, `clearable` (the clear button hides while `loading`, or a loading `Control` around it, puts a spinner at the same edge), `openOnFocus`, `loading`. |
| `Slider`       | `min`, `max`, `step`, single or dual thumb (`value` number or `[number, number]`), `tooltip` (`'auto' \| 'always' \| 'hidden'`), vertical orientation, `color`, `size`.                                                                                   |
| `Numberinput`  | `value`/`onChange`, `min`, `max`, `step`, increment/decrement buttons, stepper variant, `color`, `size`, `isLoading` (set it here, not on a `Control` around it, whose spinner covers the right-hand button).                                             |
| `Rate`         | `value`/`onChange`, `max`, `precision` (1 / 0.5 / 0.25), `customIcon` or `iconName`, `showScore`/`showText`/`texts`, `disabled`.                                                                                                                          |
| `Taginput`     | `value` (array)/`onChange`, autocomplete suggestions, configurable confirm keys, closable tags, `color`, `size`.                                                                                                                                          |

## Date / time inputs

`DateInput`, `TimeInput`, `DateTimeInput`, `DateRangeInput` (convenience) and their `*Base`
variants. Field/Control composition like the other convenience inputs, with picker UIs (native
with custom fallback). An `inline` picker renders no `Control` anywhere, so leave its
Control-level props out: they do nothing there and warn in development.

Every one of them has a launcher button at the right edge (`triggerIcon`) that gives way to the loading
spinner of the `Control` they sit in, which shares that edge. A convenience input sits in the
`Control` it renders for its own `isLoading`, unless it is inside your own `Control`; a `*Base`
variant only ever sits in yours. Inside your own `Control`, put `isLoading` on that `Control`: the
convenience input renders no `Control` of its own there, so its own `isLoading` draws nothing and
warns in development.
Passing `triggerIcon` explicitly overrides this.

```tsx
<Field label="Date">
  <Control isLoading>
    <DateInput />
  </Control>
</Field>
```

For a value that is a month or a year (card expiry, billing period, graduation year), use
`DateInput` with `granularity="month"` or `granularity="year"` rather than building a select or a
separate picker. The value is still a `Date`: the first day of the month, or 1 January of the
year. The default `format` becomes `'YYYY-MM'` or `'YYYY'`, and `min` / `max` /
`shouldDisableDate` judge whole periods (a month is selectable while any day in it is).

```tsx
<DateInput
  label="Card expiry"
  granularity="month"
  format="MM/YY"
  min={new Date()}
  value={expiry}
  onChange={setExpiry}
/>
```

For a start and an end (a stay, a report period, a leave request), use `DateRangeInput`
rather than two `DateInput`s with hand-wired `min`/`max`. Its value is a `[start, end]` pair
of `Date | null`, kept in order. The calendar picks the start, then the end, and reports
only finished ranges; typing reports each end as it changes, so handle `[start, null]`.
`min`, `max`, `shouldDisableDate` and `unselectableDates` apply to both ends, and a range
can't include a disabled day unless you pass `allowDisabledInRange`. With a `name`, two
hidden inputs submit `name[start]` and `name[end]` as `YYYY-MM-DD` (`startName` / `endName`
rename them). `label` names the whole field as a group; the two inputs are named by
`labels.rangeStart` / `labels.rangeEnd`.

```tsx
const [stay, setStay] = useState<DateRangeValue>([null, null]);

<DateRangeInput
  label="Stay"
  name="stay"
  min={new Date()}
  value={stay}
  onChange={setStay}
  color={stay[0] && !stay[1] ? 'danger' : undefined}
  message={stay[0] && !stay[1] ? 'Pick a check-out date.' : undefined}
/>;
```

## Validation-related props (no library)

There is no validation engine. The props you use to reflect externally-computed validation are:

- `color` — `'danger'` for an error, `'success'` for valid.
- `message` — the help/validation text (rendered as `<p class="help">`).
- `messageColor` — colors that help text to match (`'danger'`, `'success'`, …).
