---
title: Datetimepicker
sidebar_label: Datetimepicker
---

# Datetimepicker

## Overview

The `Datetimepicker` combines a calendar and a time **wheel spinner** in a single popover — an iOS-style layout. The popover opens to the **calendar** with an iOS-style footer: the selected **time** as a tappable value, a **Reset** button (reverts your edits to the value the popover opened with), and a circular **✓** confirm button. **Clicking the time floats the wheel spinner over the calendar** (hours, minutes, and optionally seconds — the same wheels the `Timepicker` uses), so the popover never grows or scrolls; clicking the time again, clicking outside the wheel card, or pressing `Escape` hides it. It supports the full prop surface of both `Datepicker` and `Timepicker`, plus a native `<input type="datetime-local">` fallback for touch devices. A clickable launcher icon on the right opens the popover, and you can type directly in the field with segmented keyboard entry.

---

## Import

```tsx
import { Datetimepicker } from '@allxsmith/bestax-bulma';
```

---

## Props

The Datetimepicker prop set is the union of [Datepicker](./datepicker.md) and [Timepicker](./timepicker.md) props. Notable additions and overrides:

| Prop                | Type                                     | Default              | Description                                                                                                                                                   |
| ------------------- | ---------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`             | `Date \| null`                           | —                    | Controlled selected date-time.                                                                                                                                |
| `defaultValue`      | `Date \| null`                           | —                    | Initial value for uncontrolled usage.                                                                                                                         |
| `onChange`          | `(d: Date \| null) => void`              | —                    | Fired when either the date or time portion changes.                                                                                                           |
| `format`            | `string \| Intl.DateTimeFormatOptions`   | `'YYYY-MM-DD HH:mm'` | Token format string or `Intl.DateTimeFormat` options.                                                                                                         |
| `closeOnSelect`     | `boolean`                                | `false`              | Off by default — users typically tweak both halves before committing.                                                                                         |
| `editable`          | `boolean`                                | `true`               | Allow segmented keyboard typing (type the date-time directly across all segments). `false` makes the field picker-only.                                       |
| `popover`           | `boolean`                                | `true`               | Whether the calendar + time popover exists. `false` makes the field input-only.                                                                               |
| `incrementMinutes`  | `number`                                 | `1`                  | Step between minute-wheel values (`1` = every minute, iOS-style).                                                                                             |
| `incrementSeconds`  | `number`                                 | `1`                  | Step between second-wheel values (only with `enableSeconds`).                                                                                                 |
| `iconLeftName`      | `string`                                 | `'calendar-alt'`     | Decorative left icon glyph for the wrapping `Control` (shown by default). Set `''` to hide.                                                                   |
| `triggerIcon`       | `boolean`                                | `true`               | Show a clickable launcher button on the right that toggles the popover.                                                                                       |
| `triggerIconName`   | `string`                                 | `'chevron-down'`     | Glyph for the right launcher button.                                                                                                                          |
| `mobileNative`      | `boolean \| 'auto'`                      | `'auto'`             | Use `<input type="datetime-local">` on coarse-pointer devices.                                                                                                |
| `min` / `max`       | `Date`                                   | —                    | Bounds enforced across both date and time.                                                                                                                    |
| `shouldDisableDate` | `(d: Date) => boolean`                   | —                    | Disable specific dates.                                                                                                                                       |
| `unselectableTimes` | `(d: Date) => boolean`                   | —                    | Block specific times.                                                                                                                                         |
| `firstDayOfWeek`    | `0..6`                                   | `0`                  | Calendar week start.                                                                                                                                          |
| `hourFormat`        | `'12' \| '24'`                           | `'24'`               | Time format.                                                                                                                                                  |
| `enableSeconds`     | `boolean`                                | `false`              | Show seconds column. Note: iOS Safari's native datetime-local picker UI does not include a seconds wheel; pass `mobileNative={false}` if you need one on iOS. |
| ...                 | All Datepicker + Timepicker props        |                      | See those pages for the full list.                                                                                                                            |
| ...                 | All standard HTML and Bulma helper props |                      | (See [Helper Props](../helpers/usebulmaclasses))                                                                                                              |

When you pass an explicit token `format`, **that format is the source of truth for the time wheels and the footer time pill**: a 12-hour format (`h`/`hh` with `A`/`a`) drives a 12-hour wheel with an AM/PM column, and a 24-hour format (`H`/`HH`) drives a 24-hour wheel — regardless of `hourFormat`. So `hourFormat` only applies when you don't pass a `format`. (If `format` is an `Intl.DateTimeFormat` options object rather than a token string, the cycle can't be read from it and the wheel/pill fall back to `hourFormat`.)

---

## Usage

### Basic Datetimepicker

The popover opens to the calendar with an iOS-style footer — the selected time, a **Reset** button, and a circular **✓** to confirm. Click the time value to float the wheel spinner over the calendar.

```tsx live
<Datetimepicker label="Appointment" placeholder="YYYY-MM-DD HH:MM" />
```

---

### Controlled

```tsx live
function example() {
  const [v, setV] = useState(new Date());
  return (
    <Block>
      <Datetimepicker label="Meeting" value={v} onChange={setV} />
      <Paragraph mt="2">Selected: {v ? v.toString() : '—'}</Paragraph>
    </Block>
  );
}
```

---

### 12-hour Format

```tsx live
<Datetimepicker
  label="12-hour"
  hourFormat="12"
  defaultValue={new Date()}
  mobileNative={false}
/>
```

:::note Forced to the custom popover
The OS-native pickers use the device clock setting, so `hourFormat` is ignored there. This example forces `mobileNative={false}` so the 12-hour format shows on touch devices too.
:::

---

### With Seconds

```tsx live
<Datetimepicker
  label="With seconds"
  enableSeconds
  defaultValue={new Date()}
  mobileNative={false}
/>
```

:::caution iOS Safari has no seconds wheel (Android Chrome shows one with caveats)
This example forces `mobileNative={false}` so the seconds wheel shows on every device.
**Android Chrome** generally renders a seconds component in its native datetime-local picker when `step < 60` (with [some long-standing quirks](https://bugs.chromium.org/p/chromium/issues/detail?id=461718) — exact seconds-spinner behavior varies by Android version). **iOS Safari** has no seconds wheel under any circumstances. If you need a guaranteed seconds wheel, pass `mobileNative={false}` to force the custom wheel popover. See [Mobile Native](#mobile-native) below for the full iOS-vs-Android picker support matrix.
:::

---

### 12-hour with Seconds

Combine `hourFormat="12"` with `enableSeconds` for an `hh:mm:ss A` field — the wheel gains hours, minutes, seconds, and AM/PM columns.

```tsx live
<Datetimepicker
  label="12-hour with seconds"
  hourFormat="12"
  enableSeconds
  defaultValue={new Date()}
  mobileNative={false}
/>
```

:::note Forced to the custom popover
The OS-native pickers honor neither half: `hourFormat` follows the device clock setting, and iOS Safari has no seconds wheel at all. This example forces `mobileNative={false}` so the 12-hour seconds wheel shows on every device.
:::

---

### Formats

The `format` prop takes a token string or `Intl.DateTimeFormatOptions` spanning the whole date-time. Padded token formats keep the field segmented-typeable; `Intl` formats are display-only unless you add a custom `parse`.

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Datetimepicker
    label="YYYY-MM-DD HH:mm (default)"
    defaultValue={new Date(2026, 4, 30, 13, 45)}
    mobileNative={false}
  />
  <Datetimepicker
    label="MM/DD/YYYY hh:mm A"
    format="MM/DD/YYYY hh:mm A"
    defaultValue={new Date(2026, 4, 30, 13, 45)}
    mobileNative={false}
  />
  <Datetimepicker
    label="DD.MM.YYYY HH:mm"
    format="DD.MM.YYYY HH:mm"
    defaultValue={new Date(2026, 4, 30, 13, 45)}
    mobileNative={false}
  />
  <Datetimepicker
    label="Intl — display only"
    format={{ dateStyle: 'medium', timeStyle: 'short' }}
    editable={false}
    defaultValue={new Date(2026, 4, 30, 13, 45)}
    mobileNative={false}
  />
</Block>
```

:::note Forced to the custom popover
`format` is ignored by the OS-native pickers (they use the device locale), so these examples set `mobileNative={false}` to show the formats on touch devices too.
:::

---

### Launcher Icon

A clickable launcher sits on the **right** and toggles the popover — handy for input-mode (`openOnFocus={false}`) where you type the value and click the icon to open the picker. Override its glyph with `triggerIconName`, or hide it with `triggerIcon={false}` (the popover still opens on focus / click). The decorative **left** icon is independent: it shows by default, takes its glyph from `iconLeftName`, and is hidden with `iconLeftName=""`.

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Datetimepicker label="Default (left icon + right launcher)" />
  <Datetimepicker
    label="Custom launcher glyph"
    triggerIconName="calendar-check"
  />
  <Datetimepicker label="No launcher" triggerIcon={false} />
  <Datetimepicker label="Left icon hidden" iconLeftName="" />
</Block>
```

---

### Min and Max

Bounds apply to the combined date-time.

```tsx live
function example() {
  const today = new Date();
  const min = new Date(today);
  min.setHours(9, 0, 0, 0);
  const max = new Date(today);
  max.setHours(17, 0, 0, 0);
  return <Datetimepicker label="Office hours today" min={min} max={max} />;
}
```

:::note iOS native does not enforce `min`/`max` in the picker
On iOS Safari the picker UI lets the user pick any value; `min`/`max` only fire at form-submission validation ([WebKit bug #225639](https://bugs.webkit.org/show_bug.cgi?id=225639), still open). Pass `mobileNative={false}` for iOS-side enforcement. Android Chrome's native picker does honor them.
:::

---

### Disabled Dates

```tsx live
<Datetimepicker
  label="No weekend appointments"
  shouldDisableDate={d => d.getDay() === 0 || d.getDay() === 6}
  mobileNative={false}
/>
```

:::note Forced to the custom popover
HTML has no predicate equivalent, so the OS-native pickers can't block any dates. This example forces `mobileNative={false}` so the rule works on touch devices; in your app keep `mobileNative="auto"` and also validate in `onChange`.
:::

---

### Unselectable Times

```tsx live
<Datetimepicker
  label="Lunch hour blocked"
  unselectableTimes={d => d.getHours() === 12}
  defaultValue={new Date()}
  mobileNative={false}
/>
```

:::note Forced to the custom popover
Same as Disabled Dates — the OS-native pickers can't evaluate predicates. This example forces `mobileNative={false}` so the blocked hour works on touch devices too.
:::

---

### Inline

```tsx live
<Datetimepicker label="Inline" inline defaultValue={new Date()} />
```

---

### First Day of Week

```tsx live
<Datetimepicker
  label="Monday-first"
  firstDayOfWeek={1}
  defaultValue={new Date()}
  mobileNative={false}
/>
```

:::note Forced to the custom popover
The OS-native calendars use the device locale for the week start, so `firstDayOfWeek` is ignored there. This example forces `mobileNative={false}` so the Monday-first grid shows on touch devices too.
:::

---

### Mobile Native

By default `mobileNative='auto'`: on touch devices with a small viewport (`(pointer: coarse)` and `(max-width: 768px)`) the input swaps to a plain `<input type="datetime-local">` so the OS-native picker handles the interaction. Pass `true` or `false` to override.

```tsx live
<Datetimepicker label="Native datetime-local" mobileNative={true} />
```

:::caution Native picker support varies — iOS lags Android
The OS-native fallback is just a `<input type="datetime-local">`, so it inherits each platform's behavior. The custom popover (`mobileNative={false}`) honors every prop on every device.

**Honored on Android Chrome but NOT on iOS Safari:**

- **`min` / `max`** — Android Chrome dims out-of-range values in the picker; iOS lets the user pick any value, only firing the constraint at form-submission validation. ([WebKit bug #225639](https://bugs.webkit.org/show_bug.cgi?id=225639), still open as of 2026.)
- **`incrementMinutes`, `incrementHours`** — Android Chrome respects `step` (e.g. only 0/15/30/45 minutes selectable when `step=900`). iOS shows every value regardless.
- **`enableSeconds`** — Android Chrome shows a seconds component when `step < 60` (with [some long-standing quirks for `datetime-local`](https://bugs.chromium.org/p/chromium/issues/detail?id=461718)). iOS has no seconds wheel under any circumstances.

**Ignored on BOTH iOS Safari and Android Chrome (HTML-spec gaps):**

- **`shouldDisableDate`, `unselectableDates`, `unselectableTimes`** — HTML has no predicate/array equivalent; native pickers can't evaluate functions.
- **`firstDayOfWeek`, `dayNames`, `monthNames`, `nearbyMonthDays`** — both use the device's system locale.
- **`hourFormat`** — both use the device's system clock setting (12h/24h).
- **`format`, `locale`** — both use the device's system locale; per-input overrides are ignored.
- **`placeholder`** — neither renders placeholder text.

If any of these matter, pass `mobileNative={false}` to force the custom popover (works on every device), or duplicate the constraint in `onChange` / server-side validation.
:::

---

### Locale

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Datetimepicker
    label="ja-JP"
    locale="ja-JP"
    defaultValue={new Date()}
    mobileNative={false}
  />
  <Datetimepicker
    label="fr-FR"
    locale="fr-FR"
    defaultValue={new Date()}
    mobileNative={false}
  />
</Block>
```

:::note Forced to the custom popover
The OS-native pickers always use the device's system locale, so these examples set `mobileNative={false}` to show the per-input `locale` on touch devices too.
:::

---

### Sizes

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Datetimepicker label="Small" controlSize="small" size="small" />
  <Datetimepicker label="Default" />
  <Datetimepicker label="Medium" controlSize="medium" size="medium" />
  <Datetimepicker label="Large" controlSize="large" size="large" />
</Block>
```

---

### Colors

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Datetimepicker label="Primary" color="primary" />
  <Datetimepicker label="Info" color="info" />
  <Datetimepicker label="Success" color="success" />
  <Datetimepicker label="Warning" color="warning" />
  <Datetimepicker label="Danger" color="danger" />
</Block>
```

---

### States

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Datetimepicker label="Disabled" disabled />
  <Datetimepicker label="Read only" readOnly defaultValue={new Date()} />
  <Datetimepicker label="Loading" isLoading />
</Block>
```

---

### Context-Aware Rendering

#### Default (with label)

```tsx live
<Datetimepicker label="When" placeholder="YYYY-MM-DD HH:MM" />
```

---

#### With Field Wrapper

```tsx live
function example() {
  return (
    <Field horizontal label="When">
      <Field.Body>
        <Field>
          <Datetimepicker placeholder="YYYY-MM-DD HH:MM" />
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

```tsx live
function example() {
  return (
    <Field horizontal label="When">
      <Field.Body>
        <Field>
          <Control iconLeftName="calendar-alt">
            <Datetimepicker placeholder="YYYY-MM-DD HH:MM" />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

### Manual Keyboard Entry

The single input spans the whole date-time: year → month → day → hours → minutes (plus seconds / AM-PM when enabled). Focus highlights the **year**; `↑` / `↓` adjust a segment, `→` / `←` move between them, digits overwrite with auto-advance, and typing a `-`, space, or `:` jumps across the separators. Segment mode activates whenever `format` is a token string with padded tokens (`YYYY`, `MM`, `DD`, `HH`/`hh`, `mm`, `ss`, `A`); `Intl.DateTimeFormatOptions` formats and single-character tokens fall back to free-form text.

These examples use `openOnFocus={false}` so the popover doesn't cover the input.

:::tip Opening the picker vs. typing
With `openOnFocus={false}` (used here), **clicking the field just lets you type** — the popover does not appear on focus or click. Open the picker by clicking the **launcher icon on the right** (or pressing `↓`). With the default `openOnFocus={true}`, focusing or clicking the field opens the popover immediately (you can still type while it's open).
:::

#### Basic

```tsx live
function example() {
  return (
    <Datetimepicker
      label="Type across date and time"
      defaultValue={new Date(2024, 5, 7, 13, 45)}
      openOnFocus={false}
    />
  );
}
```

---

#### 12-hour with AM/PM

Move to the trailing meridiem segment and press `a` / `p`.

```tsx live
function example() {
  return (
    <Datetimepicker
      label="12-hour entry"
      hourFormat="12"
      defaultValue={new Date(2024, 5, 7, 13, 45)}
      openOnFocus={false}
    />
  );
}
```

---

#### Controlled with live value

```tsx live
function example() {
  const [v, setV] = useState(() => new Date(2024, 5, 7, 13, 45));
  return (
    <Block>
      <Datetimepicker
        label="Arrow or type — value updates live"
        value={v}
        onChange={setV}
        openOnFocus={false}
      />
      <Paragraph mt="2">Selected: {v ? v.toString() : '—'}</Paragraph>
    </Block>
  );
}
```

---

### Picker vs Input Modes

`editable` controls whether segmented typing is allowed; `popover` controls whether the calendar + time panel exists. Both default to `true`.

| `editable` | `popover` | Behavior                                    |
| ---------- | --------- | ------------------------------------------- |
| `true`     | `true`    | Both — segmented typing + popover (default) |
| `false`    | `true`    | Picker-only — typing inert, popover opens   |
| `true`     | `false`   | Input-only — segmented typing, no popover   |
| `false`    | `false`   | Static display                              |

#### Picker only

```tsx live
<Datetimepicker
  label="Picker only"
  editable={false}
  defaultValue={new Date()}
/>
```

#### Input only

```tsx live
<Datetimepicker label="Input only" popover={false} defaultValue={new Date()} />
```

---

## Keyboard Navigation

### On the input (segmented entry)

A single field spans year → month → day → hours → minutes (→ seconds → AM/PM when enabled). Focus highlights the year; segment mode activates whenever `format` is a token string with padded tokens (`YYYY`, `MM`, `DD`, `HH`, `hh`, `mm`, `ss`, `A`); `Intl` formats and single-character tokens fall back to free-form text entry.

| Key                               | Action                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `↑` / `↓`                         | Increment / decrement the active segment (wraps in place)                      |
| `←` / `→`                         | Move to previous / next segment                                                |
| `0`–`9`                           | Overwrite the active segment; auto-advances when no further digit is valid     |
| `a` / `A` / `p` / `P`             | Toggle AM/PM on the meridiem segment (12-hour formats)                         |
| Separator (`-` `/` `:` `.` space) | Skip to the next segment without inserting the character                       |
| `Backspace`                       | Clear the typed-digit buffer; if already cleared, move to the previous segment |
| `Tab`                             | Clear segment selection so focus moves out naturally                           |
| `Escape`                          | Close the popover                                                              |

### On the popover

| Key                   | Action                                          |
| --------------------- | ----------------------------------------------- |
| `↓`                   | Open popover (when closed)                      |
| `Escape`              | Close popover                                   |
| `←` / `→`             | Move focused date by ±1 day                     |
| `↑` / `↓`             | Move focused date by ±7 days                    |
| `PageUp` / `PageDown` | Move focused date by ±1 month                   |
| `Shift+PageUp/Down`   | Move focused date by ±1 year                    |
| `Home` / `End`        | Jump to start / end of week                     |
| `Enter` / `Space`     | Select focused date                             |
| `Tab`                 | Move focus from calendar → time button → footer |

Activate the footer **time** button (`Enter` / `Space`) to float the wheels over the calendar. On a time wheel: `↑` / `↓` change the value, `←` / `→` move between the hours / minutes / (seconds) columns, and `Enter` commits and closes. While the wheels are open, `Escape` collapses them (a second `Escape` closes the popover), and clicking anywhere outside the wheel card dismisses them.

---

## Form Submission

| Prop       | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| `name`     | Form field name.                                             |
| `form`     | Optional id of the form the input belongs to.                |
| `required` | Marks the field as required for native HTML form validation. |

```tsx live
function DatetimepickerFormDemo() {
  const [submitted, setSubmitted] = React.useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
      }}
    >
      <Datetimepicker name="when" label="When" required />
      <div style={{ marginTop: '1rem' }}>
        <button type="submit" className="button is-primary">
          Submit
        </button>
      </div>
      {submitted && <pre style={{ marginTop: '1rem' }}>{submitted}</pre>}
    </form>
  );
}
```

---

## Accessibility

- Trigger uses `role="combobox"` with `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls`.
- Popover panel has `role="dialog"` with an accessible name.
- Calendar uses `role="grid"`; cells expose `aria-selected`, `aria-disabled`, and `aria-current="date"`.
- Each time wheel uses `role="spinbutton"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext`.
- The footer's confirm button exposes an accessible label (`Done`); the Reset button reverts your edits to the value the popover opened with.
- Tab order naturally walks from calendar → time wheels → footer (Reset / ✓).

---

## Related Components

- [Datepicker](./datepicker.md) - Date-only picker.
- [Timepicker](./timepicker.md) - Time-only picker.
- [Input](./input.md) - For basic text input.

---

## Additional Resources

- [Storybook: Datetimepicker Stories](https://bestax.io/storybook/?path=/story/form-datetimepicker)

:::tip Pro Tip
Pair `Datetimepicker` with `closeOnSelect={false}` (the default) so users can tweak both date and time before committing via OK — closing on the first date click would surprise them.
:::
