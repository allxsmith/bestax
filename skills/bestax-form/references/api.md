# Reference: form component props

All components import from `@allxsmith/bestax-bulma`. Source lives in `bulma-ui/src/form/`.
Every component also accepts the full Bulma helper props (`m`, `p`, `textColor`, `display`, …)
via `useBulmaClasses`.

## Field — `form/Field.tsx`

Container and layout. Compound parts: `Field.Label`, `Field.Body`.

| Prop                    | Type                                              | Notes                                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `horizontal`            | `boolean`                                         | Label + control side by side. Auto-wraps children in `Field.Body`.                                                                                                                                                                 |
| `grouped`               | `boolean \| 'centered' \| 'right' \| 'multiline'` | Controls in a row.                                                                                                                                                                                                                 |
| `hasAddons`             | `boolean \| 'centered' \| 'right'`                | Attached controls.                                                                                                                                                                                                                 |
| `narrow`                | `boolean`                                         | Constrain to content width (inside horizontal bodies).                                                                                                                                                                             |
| `label`                 | `ReactNode`                                       | Names the one control it holds: a composed base or convenience input with no `id` of its own through a generated id, a group through `aria-labelledby` (skipped for `grouped`/`hasAddons`; a nested `Field` starts its own scope). |
| `labelSize`             | `'small' \| 'normal' \| 'medium' \| 'large'`      | Label size.                                                                                                                                                                                                                        |
| `labelProps`            | label attributes                                  | Props for the `<label>`. An explicit `htmlFor` (even `undefined`) takes over the association; otherwise it is set automatically. For its `id`, see below.                                                                          |
| `textColor` / `bgColor` | Bulma color                                       | Helper colors for the field.                                                                                                                                                                                                       |

An `id` in `labelProps` is what a group's, a range `Slider`'s and an `Autocomplete`'s, a `Combobox`'s or a `Taginput`'s list's `aria-labelledby` points at. A label wired by hand with `htmlFor` gets no generated id, so give it one, `labelProps={{ htmlFor, id }}`, for a range `Slider`, an `Autocomplete`, a `Combobox` or a `Taginput`. No group points at a label wired by hand.

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

## Fieldset — `form/Fieldset.tsx`

A native `<fieldset>` for a section of a form. It starts its own Field scope, so the convenience
inputs inside render their own `Field`s.

| Prop                    | Type                                  | Notes                                                                                                                                |
| ----------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `legend`                | `ReactNode`                           | Names the group. Controls in it stay enabled when the Fieldset is disabled, as the browser leaves them.                              |
| `legendProps`           | legend attributes                     | Props for the `<legend>`.                                                                                                            |
| `variant`               | `'default' \| 'filled' \| 'unstyled'` | Bordered (default), bordered on a tinted background, or no box.                                                                      |
| `disabled`              | `boolean`                             | Disables every control inside, and is the default for each bestax input's own `disabled`. An input's own `disabled`, when set, wins. |
| `message`               | `ReactNode`                           | Help text under the group, in its `aria-describedby`. No `aria-invalid` on the group.                                                |
| `messageColor`          | Bulma color                           | Colors the message.                                                                                                                  |
| `textColor` / `bgColor` | Bulma color                           | Helper colors for the fieldset.                                                                                                      |

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

## PasswordInput / PasswordInputBase — `form/PasswordInput.tsx`, `form/PasswordInputBase.tsx`

`PasswordInput` is `Input` with a button inside the field, at its right edge, that shows the
password. It takes everything `Input` does except `type` and the right-icon props
(`iconRight`, `iconRightName`, `iconRightSize`, `hasIconsRight`), which draw nothing and warn in
development, since the button has that edge. `PasswordInputBase` is the input and its button
without the `Field` and `Control`; helper props, `className` and `ref` go on the `<input>`.

| Prop                                            | Type                                             | Notes                                                                                                                                                                |
| ----------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `visible` / `defaultVisible`                    | `boolean`                                        | Whether the password shows, controlled / to start with. Controlled, apply the `false` it reports when it hides again; keep `visible` true and the field stays shown. |
| `onVisibleChange`                               | `(visible: boolean) => void`                     | Each toggle, and `false` when the form submits or resets or the page is left (on the way into the back-forward cache too), all of which hide it.                     |
| `variant`                                       | `'icon' \| 'text'`                               | `icon` (default): an eye named "Show password" with `aria-pressed`. `text`: the words "Show"/"Hide", named "Show password"/"Hide password", no `aria-pressed`.       |
| `labels`                                        | `{ showPassword?, hidePassword?, show?, hide? }` | Translations. With `text`, each name must contain its word (Label in Name); a development warning says when one doesn't.                                             |
| `autoComplete`                                  | `string`                                         | `"current-password"` by default. Pass `"new-password"` on sign-up and change-password forms. Never `"off"`.                                                          |
| `spellCheck` / `autoCorrect` / `autoCapitalize` | `false` / `"off"` / `"none"` by default          | A caller's value wins for each.                                                                                                                                      |
| `isLoading`                                     | `boolean`                                        | The `Control`'s spinner, which takes the button's place.                                                                                                             |
| `disabled`                                      | `boolean`                                        | Disables the input and its button; a disabled `Fieldset` does too.                                                                                                   |

The button is a `<button type="button">` in the tab order; a pointer press leaves focus and the
caret in the input. Prefer it uncontrolled, read with `FormData`: a controlled field carries its
value in its `value` attribute, as React writes it for any controlled input. There's no strength meter: put the strength
your app or server works out in words in `message`, and use a native `<meter>`, not `Progress`,
for any bar.

## Select / SelectBase, TextArea / TextAreaBase

Same convenience/raw split as Input. `Select` supports `isLoading` (a spinner in place of the
chevron), `color`, `size`, `isRounded`, `isFullwidth`, `multiple` + `multipleSize`, plus the
Field/Control/message props. `TextArea` adds `rows` and `hasFixedSize`.

## Checkbox / Checkboxes, Radio / Radios, CheckboxCard / RadioCard

- `Checkbox` / `Radio` — single controls with `color`, `size`, `checked`/`defaultChecked`,
  `onChange`, `disabled`.
- `Checkbox` also takes `indeterminate`, the mixed state of a "Select all" box over a partly
  checked list. It changes the look and the announcement, not the value: `checked` stays the
  value, so set both from the list.
- `Checkboxes` — group wrapper managing an **array** value.
- `Radios` — group wrapper managing a **single** selected value.
- Both take `as="fieldset"`: their own `Field` renders as a native `<fieldset>` and the `label` as
  its `<legend>`, in the label column when `horizontal`, naming the group with no ids. Inside an
  outer `Field` the group element itself is the `<fieldset>`, named by that `Field`'s label.
  Attributes go on the `<fieldset>`; `className` and helper props stay on the box of choices.
- `CheckboxCard` / `RadioCard`: a checkbox or radio drawn as a card, a `<label>` around the
  real input, so a click anywhere toggles it and it sends its `value` with a form. `title` names
  the input and `description` describes it; children (a price, a link) follow but aren't read on
  focus, and must be phrasing content, never a button or another input. They read the same group
  context as `Checkbox` and `Radio`, so put them straight inside `Checkboxes` or `Radios` (or a
  `Grid` with `flexGrow="1"` inside the group, for columns). `hasIndicator={false}` drops the
  checkbox or radio; the edge, thicker when checked, then shows the selection. Both take `color`
  and `disabled`, and `CheckboxCard` takes `indeterminate`.

## Switch — `form/Switch.tsx`

`color`, `size`, `checked`/`defaultChecked`, `onChange`, `isRounded`, `isThin`, `isOutlined`,
`passiveType`, plus RTL support.

## File — `form/File.tsx`

File input with `label`, `message`, color/size, and icon support.

## Dropzone — `form/Dropzone.tsx`

An area to drop files on or click to pick them. The real `<input type="file">` lies over Bulma's
boxed `.file`, so `name`, `accept`, `multiple`, `required`, `disabled` and `ref` are the input's,
and the input holds the chosen files: a plain form submit, `FormData` and React 19 actions carry
them with no wiring.

- Checks every pick, drop and paste against `accept` (the attribute's syntax: `.pdf`, `image/*`,
  `application/pdf`), `maxSize` (bytes) and, with `multiple`, `maxFiles`. Without `multiple` a
  new file replaces the one chosen; with it, files are added and a repeat is skipped.
- `onFilesChange(files)` gets the whole list on each change; `files` controls it. `onReject`
  gets `{ file, code }` with `code` one of `file-invalid-type`, `file-too-large`,
  `too-many-files`.
- Shows a row per file (name, size, a remove button) and a `help is-danger` line per refusal,
  and announces both. `showFileList={false}` leaves the list to you.
- `buttonLabel` is the zone's text and the input's name: keep it short and put details in
  `hint`, which describes the input. `icon`, `color` and `size` as on `File`.
- Words: `removeLabel`, `rejectionMessage`, `addedMessage`, `removedMessage`. It doesn't upload:
  send the files yourself from the form's submit or from `onFilesChange`.
- To clear it, reset its form, or control it with `files` and set `[]`. A write to the input
  through the `ref` (`value = ''`, or a form library setting `files`) fires no event, so the
  list shows it only from the next change; control it with `files` when the app clears or sets
  files itself.

## Advanced inputs

| Component      | Key props                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Autocomplete` | `data` (`string[]` or item objects), `value`, `onInput(value)` for typing, `onSelect(item)` for picks, `clearable` (the clear button hides while `loading`, or a loading `Control` around it, puts a spinner at the same edge), `openOnFocus`, `loading`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `Combobox`     | Either way: `multiple`, `keepFirst`, `inline`, `size`, `position` (`'auto'` keeps the list in the viewport), `appendToBody` (in a `Modal`, point a `ConfigProvider`'s `portalContainer` inside the modal), `open`/`defaultOpen`/`onOpenChange`, `onSelect(value)` and the Field props. Given `data` (strings or `{ value, label?, disabled?, group? }`): `value`/`defaultValue`/`onChange` (`string \| null`, or `string[]` with `multiple`, shown as tags), `placeholder`, `name`, `empty`, `itemTemplate`, and `disabled`, `required`, `form`, `id`, `aria-label`/`aria-labelledby` for the field; leaving the field empty clears one value. From parts: `.Input` (an `Input`, with `size` and the Field props on the root), `.Menu`, `.List`, `.Item` (`value`, `checked`, `disabled`), `.Group` (`label`), `.Empty`; you filter, keep the value and set the field's text in `onSelect`. |
| `Slider`       | `min`, `max`, `step`, single or dual thumb (`value` number or `[number, number]`), `tooltip` (`'auto' \| 'always' \| 'hidden'`), vertical orientation, `color`, `size`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `Numberinput`  | `value`/`onChange`, `min`, `max`, `step`, increment/decrement buttons, stepper variant, `color`, `size`, `isLoading` (set it here, not on a `Control` around it, whose spinner covers the right-hand button).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `PinInput`     | `length` (6), `value`/`defaultValue`/`onChange` (the code as a string), `onComplete(code)` once a change fills the last box, `type` (`'number'` or `'alphanumeric'`), `isMasked`, `name`, `color`, `size`, `isRounded`, `disabled` and the Field props. One input holds the code (`autoComplete="one-time-code"`); a paste replaces it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `Rate`         | `value`/`onChange`, `max`, `precision` (1 / 0.5 / 0.25), `customIcon` or `iconName`, `showScore`/`showText`/`texts`, `disabled`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `Taginput`     | `value` (array)/`onChange`, autocomplete suggestions, configurable confirm keys, closable tags, `color`, `size`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

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

For an app in another language, wrap it, or the form, in `LocaleProvider` rather than passing the
same `locale` to every picker. The pickers inside take its locale for their day and month names
and any `Intl` `format`, and start the week on that locale's first day (Monday for `"de"`), unless
one sets `locale` or `firstDayOfWeek` itself. Outside a provider the week starts on Sunday, and so
does a picker given its own `dayNames`, which it shows exactly as given: pass `firstDayOfWeek` with
them and list them from that day. With
server rendering, set a locale: without one, an `inline` calendar names its days in the server's
language on the server and the reader's in the browser, and hydration fails to match whenever
the two languages differ.

```tsx
<LocaleProvider locale="de">
  <DateInput label="Liefertermin" />
</LocaleProvider>
```

The same provider makes `Combobox` (with `data`), `Autocomplete` and `Taginput` filter the way its
language compares letters, ignoring accents where it treats them alike ("cafe" finds "Café"), and
writes the numbers `Slider`'s output, `Rate`'s score, `Taginput`'s counter and `File`'s count show
in its digits. Don't fold accents by hand in `data` for those.

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

## Color — `form/ColorPicker.tsx`, `form/ColorInput.tsx`

`ColorPicker` is a panel: a saturation and brightness square, a hue slider, and the value as text
you can type in. `value`/`defaultValue` take any color it reads (hex, `rgb()`, `hsl()`, a CSS
name); `onChange(value)` fires on every drag step and `onChangeEnd(value)` once a change is done
(the place to save). `format` writes `'hsl'` (default, `hsl(171, 100%, 41%)`, the channels
`Theme`'s `primaryH`/`primaryS`/`primaryL` take), `'hex'` or `'rgb'`; `alpha` adds a slider and
writes `hsla()`, `#rrggbbaa` or `rgba()`. `swatches` takes colors (strings or `{ color, label }`)
or `"bulma"` for the page's six theme colors, read from its CSS variables. `eyeDropper` adds a
screen picker where the browser has one. `name` adds a hidden input; it takes the Field props and
a disabled `Fieldset`. Parts for a layout of your own: `ColorPicker.Area`, `.HueSlider`,
`.AlphaSlider`, `.Swatches`, `.Input`, inside a `ColorPicker`. Don't hand-build a picker from
`Slider`s, and don't reach for `<Input type="color">` unless the browser's own well (hex only,
never empty) is enough. `ColorSwatch` (`color`, `label`) shows a color without choosing one.

`ColorInput` is the field: the value as text you can type (committed on Enter or blur, `''`
for none, so `required` works), a swatch, and a launcher that opens the same square, hue,
`alpha`, `swatches` and `eyeDropper` in the pickers' popover. It opens on the launcher, the
swatch or Alt+ArrowDown; `openOnFocus` and `closeOnSwatchClick` are opt-in. It takes the same
`value`/`onChange`/`onChangeEnd`/`format`, the Field props, `isLoading`, and `Input`'s
`color`/`size`/`isRounded`. `ColorInputBase` is the field without Field and Control.

## Validation-related props (no library)

There is no validation engine. The props you use to reflect externally-computed validation are:

- `color` — `'danger'` for an error, `'success'` for valid.
- `message` — the help/validation text (rendered as `<p class="help">`).
- `messageColor` — colors that help text to match (`'danger'`, `'success'`, …).
