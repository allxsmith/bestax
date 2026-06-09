---
title: Datepicker
sidebar_label: Datepicker
---

# Datepicker

## Overview

The `Datepicker` component is a form input that opens a popover calendar for date selection. A clickable launcher icon on the right opens the popover, and you can type directly in the field with segmented keyboard entry. It uses native `Date` and `Intl` only (no extra dependencies), supports min/max bounds, disabled-date predicates, custom token formats or `Intl.DateTimeFormatOptions`, locale-aware day/month names, an inline mode, and a native `<input type="date">` fallback for touch devices.

---

## Import

```tsx
import { Datepicker } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop                | Type                                                                     | Default          | Description                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`             | `Date \| null`                                                           | —                | Controlled selected date.                                                                                                                   |
| `defaultValue`      | `Date \| null`                                                           | —                | Initial date for uncontrolled usage.                                                                                                        |
| `onChange`          | `(d: Date \| null) => void`                                              | —                | Fired when the value changes.                                                                                                               |
| `onOpen`            | `() => void`                                                             | —                | Fired when the popover opens.                                                                                                               |
| `onClose`           | `() => void`                                                             | —                | Fired when the popover closes.                                                                                                              |
| `min`               | `Date`                                                                   | —                | Earliest selectable date.                                                                                                                   |
| `max`               | `Date`                                                                   | —                | Latest selectable date.                                                                                                                     |
| `shouldDisableDate` | `(d: Date) => boolean`                                                   | —                | Predicate to disable specific dates (e.g. weekends).                                                                                        |
| `unselectableDates` | `Date[]`                                                                 | —                | Convenience array of disabled dates; merged with `shouldDisableDate`.                                                                       |
| `firstDayOfWeek`    | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6`                                        | `0`              | Day the week starts on (0 = Sunday).                                                                                                        |
| `dayNames`          | `string[]`                                                               | —                | Override the 7 day-name labels (in calendar order, post-rotation).                                                                          |
| `monthNames`        | `string[]`                                                               | —                | Override the 12 month-name labels.                                                                                                          |
| `nearbyMonthDays`   | `boolean`                                                                | `true`           | Show dimmed dates from adjacent months in the grid.                                                                                         |
| `placeholder`       | `string`                                                                 | —                | Placeholder text for the input.                                                                                                             |
| `format`            | `string \| Intl.DateTimeFormatOptions`                                   | `'YYYY-MM-DD'`   | Token format string or `Intl.DateTimeFormat` options.                                                                                       |
| `parse`             | `(s: string) => Date \| null`                                            | —                | Custom parser (use when `format` is `Intl.DateTimeFormatOptions`).                                                                          |
| `locale`            | `string`                                                                 | —                | BCP-47 locale tag for day/month names and Intl formatting.                                                                                  |
| `inline`            | `boolean`                                                                | `false`          | Render the calendar inline (no popover).                                                                                                    |
| `mobileNative`      | `boolean \| 'auto'`                                                      | `'auto'`         | Use `<input type="date">` on coarse-pointer + small-viewport devices.                                                                       |
| `editable`          | `boolean`                                                                | `true`           | Allow segmented keyboard typing in the input (type the date directly, auto-advancing across segments). `false` makes the field picker-only. |
| `popover`           | `boolean`                                                                | `true`           | Whether the calendar popover exists. `false` makes the field input-only (segmented typing, no popover).                                     |
| `openOnFocus`       | `boolean`                                                                | `true`           | Open the popover when the input is focused.                                                                                                 |
| `closeOnSelect`     | `boolean`                                                                | `true`           | Close the popover after a date is selected.                                                                                                 |
| `position`          | `'bottom-left' \| 'bottom-right' \| 'top-left' \| 'top-right' \| 'auto'` | `'bottom-left'`  | Popover anchor position relative to the input.                                                                                              |
| `appendToBody`      | `boolean`                                                                | `false`          | Render the popover into `document.body` via portal.                                                                                         |
| `disabled`          | `boolean`                                                                | `false`          | Disable the input.                                                                                                                          |
| `readOnly`          | `boolean`                                                                | `false`          | Make the input read-only.                                                                                                                   |
| `color`             | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`    | —                | Bulma color modifier.                                                                                                                       |
| `size`              | `'small' \| 'medium' \| 'large'`                                         | —                | Size variant.                                                                                                                               |
| `isRounded`         | `boolean`                                                                | `false`          | Render the input with rounded corners.                                                                                                      |
| `iconLeftName`      | `string`                                                                 | `'calendar'`     | Decorative left icon glyph for the wrapping `Control` (shown by default). Set `''` to hide.                                                 |
| `triggerIcon`       | `boolean`                                                                | `true`           | Show a clickable launcher button on the right that toggles the popover.                                                                     |
| `triggerIconName`   | `string`                                                                 | `'chevron-down'` | Glyph for the right launcher button.                                                                                                        |
| `name`              | `string`                                                                 | —                | Form field name. Forwarded to a hidden ISO-formatted input.                                                                                 |
| `form`              | `string`                                                                 | —                | Form id the input belongs to.                                                                                                               |
| `required`          | `boolean`                                                                | `false`          | Marks the input as required.                                                                                                                |
| `label`             | `React.ReactNode`                                                        | —                | Field label (component auto-wraps in a `Field` if not already inside).                                                                      |
| `horizontal`        | `boolean`                                                                | `false`          | Render the field with horizontal layout.                                                                                                    |
| `message`           | `React.ReactNode`                                                        | —                | Help/validation text below the input.                                                                                                       |
| `messageColor`      | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`    | —                | Color modifier for the help message.                                                                                                        |
| `className`         | `string`                                                                 | —                | Additional CSS classes for the input.                                                                                                       |
| `ref`               | `React.Ref<HTMLInputElement>`                                            | —                | Forwarded to the underlying `<input>`.                                                                                                      |
| ...                 | All standard HTML and Bulma helper props                                 |                  | (See [Helper Props](../helpers/usebulmaclasses))                                                                                            |

---

## Usage

### Basic Datepicker

A simple date picker with a popover calendar.

```tsx live
function example() {
  return <Datepicker label="Pick a date" placeholder="YYYY-MM-DD" />;
}
```

---

### Controlled

Manage state externally with `value` and `onChange`.

```tsx live
function example() {
  const [value, setValue] = useState(new Date());
  return (
    <Block>
      <Datepicker label="Date" value={value} onChange={setValue} />
      <Paragraph mt="2">
        Selected: {value ? value.toDateString() : '—'}
      </Paragraph>
    </Block>
  );
}
```

---

### Inline

Skip the popover and render the calendar inline.

```tsx live
<Datepicker label="Inline calendar" inline defaultValue={new Date()} />
```

---

### Min and Max

Limit selectable dates to a range.

```tsx live
function example() {
  const today = new Date();
  const min = new Date(today.getFullYear(), today.getMonth(), 1);
  const max = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return (
    <Datepicker
      label="This month only"
      min={min}
      max={max}
      defaultValue={today}
    />
  );
}
```

:::note iOS native does not enforce `min`/`max` in the picker
On iOS Safari the calendar lets the user pick any date; `min`/`max` only fire at form-submission validation ([WebKit bug #225639](https://bugs.webkit.org/show_bug.cgi?id=225639), still open). Pass `mobileNative={false}` for iOS-side enforcement. Android Chrome's native picker does honor them.
:::

---

### Disabled Dates

Disable specific dates with `shouldDisableDate` (predicate) or `unselectableDates` (array).

```tsx live
<Datepicker
  label="No weekends"
  shouldDisableDate={d => d.getDay() === 0 || d.getDay() === 6}
  mobileNative={false}
/>
```

:::note Forced to the custom calendar
HTML has no equivalent to `shouldDisableDate` or `unselectableDates`, so the OS-native pickers can't block any dates. This example forces `mobileNative={false}` so the rule works on touch devices too; in your app, keep the default `mobileNative="auto"` and also validate in `onChange`.
:::

---

### Custom Format

Use an alternative token format. Supported tokens: `YYYY YY MM M DD D HH H hh h mm m ss s A a`.

```tsx live
<Datepicker
  label="Date of birth"
  format="DD/MM/YYYY"
  placeholder="DD/MM/YYYY"
  mobileNative={false}
/>
```

:::note Forced to the custom calendar
The OS-native pickers use the device's locale format and don't render `placeholder` text. This example forces `mobileNative={false}` so the format/placeholder show on touch devices too.
:::

---

### Formats

The `format` prop takes a token string or `Intl.DateTimeFormatOptions`. Padded tokens (`YYYY`, `YY`, `MM`, `DD`) keep the field segmented-typeable; `Intl` formats are display-only unless you also pass a custom `parse`.

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Datepicker
    label="YYYY-MM-DD (default)"
    defaultValue={new Date(2026, 4, 30)}
    openOnFocus={false}
    mobileNative={false}
  />
  <Datepicker
    label="DD/MM/YYYY"
    format="DD/MM/YYYY"
    defaultValue={new Date(2026, 4, 30)}
    openOnFocus={false}
    mobileNative={false}
  />
  <Datepicker
    label="MM-DD-YYYY"
    format="MM-DD-YYYY"
    defaultValue={new Date(2026, 4, 30)}
    openOnFocus={false}
    mobileNative={false}
  />
  <Datepicker
    label="DD.MM.YY"
    format="DD.MM.YY"
    defaultValue={new Date(2026, 4, 30)}
    openOnFocus={false}
    mobileNative={false}
  />
</Block>
```

:::note Forced to the custom calendar
`format` is ignored by the OS-native pickers (they use the device locale), so these examples set `mobileNative={false}` to show the formats on touch devices too.
:::

For an `Intl.DateTimeFormatOptions` format, supply a `parse` so typed text round-trips to a `Date`:

```tsx live
function example() {
  const parse = s => {
    const t = Date.parse(s);
    return isNaN(t) ? null : new Date(t);
  };
  return (
    <Datepicker
      label="Intl long + custom parse"
      format={{ year: 'numeric', month: 'long', day: 'numeric' }}
      parse={parse}
      defaultValue={new Date(2026, 4, 30)}
      mobileNative={false}
    />
  );
}
```

---

### Launcher Icon

A clickable launcher sits on the **right** and toggles the popover — handy for input-mode (`openOnFocus={false}`) where you type the value and click the icon to open the calendar. Override its glyph with `triggerIconName`, or hide it with `triggerIcon={false}` (the popover still opens on focus / click). The decorative **left** icon is independent: it shows by default, takes its glyph from `iconLeftName`, and is hidden with `iconLeftName=""`.

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Datepicker label="Default (left icon + right launcher)" />
  <Datepicker label="Custom launcher glyph" triggerIconName="calendar-day" />
  <Datepicker label="No launcher" triggerIcon={false} />
  <Datepicker label="Left icon hidden" iconLeftName="" />
</Block>
```

---

### Manual Keyboard Entry

Focus the input — the **year** segment highlights automatically and you can drive the whole date with the keyboard, never touching the calendar. Press `↑` / `↓` to change a segment, `→` / `←` to move between year, month, and day, or type digits directly. The caret auto-advances over the `-` separators (and typing a separator jumps too). Segment mode activates whenever `format` is a token string with padded tokens (`YYYY`, `YY`, `MM`, `DD`); `Intl.DateTimeFormatOptions` formats and single-character tokens (`Y`, `M`, `D`) fall back to free-form text entry.

These examples use `openOnFocus={false}` so the popover doesn't cover the input — set `openOnFocus={true}` (the default) and both UIs coexist.

:::tip Opening the picker vs. typing
With `openOnFocus={false}` (used here), **clicking the field just lets you type** — the popover does not appear on focus or click. Open the picker by clicking the **launcher icon on the right** (or pressing `↓`). With the default `openOnFocus={true}`, focusing or clicking the field opens the popover immediately (you can still type while it's open).
:::

#### Basic

```tsx live
function example() {
  return (
    <Datepicker
      label="Click in, then arrow or type"
      defaultValue={new Date(2024, 5, 7)}
      openOnFocus={false}
    />
  );
}
```

---

#### Custom Format

Type day-first with slash separators. Typing `/` jumps to the next segment.

```tsx live
function example() {
  return (
    <Datepicker
      label="DD/MM/YYYY"
      format="DD/MM/YYYY"
      defaultValue={new Date(2024, 5, 7)}
      openOnFocus={false}
    />
  );
}
```

---

#### Digit entry and auto-advance

Type digits to overwrite the active segment. Auto-advance honors each segment's range: the month advances after a first digit ≥ 2 (no month 20+) but waits after `1` (for 10/11/12); the day advances after ≥ 4 but waits after `3` (for 30/31); the year buffers all four digits. Two-digit values clamp (month → 12, day → the month's length).

```tsx live
function example() {
  return (
    <Datepicker
      label="Type digits — auto-advance across segments"
      defaultValue={new Date(2024, 5, 7)}
      openOnFocus={false}
    />
  );
}
```

---

#### Controlled with live value

```tsx live
function example() {
  const [v, setV] = useState(() => new Date(2024, 5, 7));
  return (
    <Block>
      <Datepicker
        label="Arrow or type — value updates live"
        value={v}
        onChange={setV}
        openOnFocus={false}
      />
      <Paragraph mt="2">Selected: {v ? v.toDateString() : '—'}</Paragraph>
    </Block>
  );
}
```

---

#### Free-form fallback

When `format` is an `Intl.DateTimeFormatOptions` object (or uses single-char tokens), segment mode disables — focusing the input does not highlight a segment, and the input parses on blur instead.

```tsx live
function example() {
  return (
    <Datepicker
      label="Free-form (Intl format)"
      format={{ year: 'numeric', month: 'long', day: 'numeric' }}
      defaultValue={new Date(2024, 5, 7)}
      openOnFocus={false}
    />
  );
}
```

---

### Picker vs Input Modes

Two booleans choose how the field behaves. `editable` controls whether segmented typing is allowed; `popover` controls whether the calendar exists. Both default to `true` (type **and** pick). The four combinations:

| `editable` | `popover` | Behavior                                     |
| ---------- | --------- | -------------------------------------------- |
| `true`     | `true`    | Both — segmented typing + calendar (default) |
| `false`    | `true`    | Picker-only — typing inert, calendar opens   |
| `true`     | `false`   | Input-only — segmented typing, no calendar   |
| `false`    | `false`   | Static display                               |

#### Picker only

Typing is disabled; the calendar still opens on click or focus.

```tsx live
<Datepicker label="Picker only" editable={false} defaultValue={new Date()} />
```

#### Input only

Segmented typing with no calendar — handy in dense forms.

```tsx live
<Datepicker label="Input only" popover={false} defaultValue={new Date()} />
```

---

### Locale

Day and month names follow the supplied BCP-47 locale via `Intl.DateTimeFormat`.

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Datepicker
    label="ja-JP"
    locale="ja-JP"
    defaultValue={new Date()}
    mobileNative={false}
  />
  <Datepicker
    label="fr-FR"
    locale="fr-FR"
    defaultValue={new Date()}
    mobileNative={false}
  />
  <Datepicker
    label="de-DE"
    locale="de-DE"
    defaultValue={new Date()}
    mobileNative={false}
  />
</Block>
```

:::note Forced to the custom calendar
The OS-native pickers always use the device's system locale, so these examples set `mobileNative={false}` to show the per-input `locale` on touch devices too.
:::

---

### First Day of Week

Set `firstDayOfWeek` to align the grid to Monday-first locales.

```tsx live
<Datepicker
  label="Week starts Monday"
  firstDayOfWeek={1}
  mobileNative={false}
/>
```

:::note Forced to the custom calendar
The OS-native calendars use the device locale for the week start, so `firstDayOfWeek` (and `dayNames`/`monthNames`/`nearbyMonthDays`) are ignored there. This example forces `mobileNative={false}` so the Monday-first grid shows on touch devices too.
:::

---

### Mobile Native

Force the native `<input type="date">` (auto-detected on coarse-pointer + small-viewport devices by default).

```tsx live
<Datepicker label="Native picker" mobileNative={true} />
```

:::caution Native picker support varies — iOS lags Android
The OS-native fallback is just an `<input type="date">`, so it inherits each platform's behavior. The custom calendar popover (`mobileNative={false}`) honors every prop on every device.

**Honored on Android Chrome but NOT on iOS Safari:**

- **`min` / `max`** — Android Chrome dims out-of-range dates in the calendar; iOS lets the user pick any date, only firing the constraint at form-submission validation. ([WebKit bug #225639](https://bugs.webkit.org/show_bug.cgi?id=225639), still open as of 2026.)

**Ignored on BOTH iOS Safari and Android Chrome (HTML-spec gaps):**

- **`shouldDisableDate`, `unselectableDates`** — HTML has no predicate or array equivalent; native pickers can't evaluate functions.
- **`firstDayOfWeek`, `dayNames`, `monthNames`, `nearbyMonthDays`** — both use the device's system locale and the OS's own calendar layout.
- **`format`, `locale`, `parse`** — both use the device's system locale; per-input overrides are ignored.
- **`placeholder`** — neither renders placeholder text on date inputs.

If any of these matter, pass `mobileNative={false}` to force the custom calendar popover (works on every device), or duplicate the constraint in `onChange` / server-side validation.
:::

---

### Sizes

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Datepicker label="Small" controlSize="small" size="small" />
  <Datepicker label="Default" />
  <Datepicker label="Medium" controlSize="medium" size="medium" />
  <Datepicker label="Large" controlSize="large" size="large" />
</Block>
```

---

### Colors

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Datepicker label="Primary" color="primary" />
  <Datepicker label="Info" color="info" />
  <Datepicker label="Success" color="success" />
  <Datepicker label="Warning" color="warning" />
  <Datepicker label="Danger" color="danger" />
</Block>
```

---

### States

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Datepicker label="Disabled" disabled />
  <Datepicker label="Read only" readOnly defaultValue={new Date()} />
  <Datepicker label="Loading" isLoading />
</Block>
```

---

### Horizontal Field

```tsx live
<Datepicker label="Date of birth" horizontal placeholder="YYYY-MM-DD" />
```

---

### Context-Aware Rendering

The `Datepicker` component is context-aware: it detects whether it is already inside a `Field` and adjusts its rendering accordingly. You can use it standalone with a `label` prop (it wraps itself in a Field), or inside a `Field` / `Control` (it skips rendering its own).

#### Default (with label)

The simplest usage — the component automatically renders its own Field wrapper.

```tsx live
<Datepicker label="Date" placeholder="YYYY-MM-DD" />
```

---

#### With Field Wrapper

Wrap in a `Field` when you need manual layout control. The component detects it and skips rendering its own.

```tsx live
function example() {
  return (
    <Field horizontal label="Date">
      <Field.Body>
        <Field>
          <Datepicker placeholder="YYYY-MM-DD" />
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

For full manual composition (e.g. custom icons), wrap in both `Field` and `Control`.

```tsx live
function example() {
  return (
    <Field horizontal label="Date">
      <Field.Body>
        <Field>
          <Control iconLeftName="calendar-alt">
            <Datepicker placeholder="YYYY-MM-DD" />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

## Keyboard Navigation

### On the input (segmented entry)

Focus the input — the **year** segment highlights automatically and the keyboard alone can drive the full date entry without ever opening the popover. Segment mode activates whenever `format` is a token string with padded tokens (`YYYY`, `YY`, `MM`, `DD`); `Intl.DateTimeFormatOptions` formats and single-character tokens (`Y`, `M`, `D`) fall back to free-form text entry that parses on blur.

| Key                           | Action                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `↑` / `↓`                     | Increment / decrement the active segment (year / month / day, wraps in place)  |
| `←` / `→`                     | Move to previous / next segment                                                |
| `0`–`9`                       | Overwrite the active segment; auto-advances when no further digit is valid     |
| Separator (`-` `/` `.` space) | Skip to the next segment without inserting the character                       |
| `Backspace`                   | Clear the typed-digit buffer; if already cleared, move to the previous segment |
| `Tab`                         | Clear segment selection so focus moves out naturally                           |
| `Escape`                      | Close the popover                                                              |
| `Enter`                       | Close the popover when `closeOnSelect` (the value is already committed live)   |

Digit auto-advance honors each segment's range: the month advances after a first digit ≥ 2 (no month 20+) but waits after `1` (for 10/11/12); the day advances after ≥ 4 but waits after `3` (for 30/31); the year buffers all four digits. Two-digit values clamp (month → 12, day → the month's length).

### On the popover calendar

| Key                   | Action                            |
| --------------------- | --------------------------------- |
| `↓`                   | Open popover (when closed)        |
| `Enter`               | Parse typed text / select focused |
| `Escape`              | Close popover                     |
| `←` / `→`             | Move focused date by ±1 day       |
| `↑` / `↓`             | Move focused date by ±7 days      |
| `PageUp` / `PageDown` | Move focused date by ±1 month     |
| `Shift+PageUp/Down`   | Move focused date by ±1 year      |
| `Home` / `End`        | Jump to start / end of week       |
| `Space`               | Select focused date               |
| `Tab`                 | Move focus to next control        |

---

## Form Submission

`Datepicker` participates in HTML form submission. Pass a `name` and the value is forwarded to a hidden `<input>` formatted as `YYYY-MM-DD`.

| Prop       | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| `name`     | Form field name.                                             |
| `form`     | Optional id of the form the input belongs to.                |
| `required` | Marks the field as required for native HTML form validation. |

```tsx live
function DatepickerFormDemo() {
  const [submitted, setSubmitted] = React.useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
      }}
    >
      <Datepicker
        name="booking"
        label="Booking date"
        defaultValue={new Date()}
        required
      />
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
- Calendar uses `role="grid"` with cells as `role="gridcell"`.
- Cells expose `aria-selected`, `aria-disabled`, and `aria-current="date"` for today.
- Roving `tabindex` keeps a single grid cell focusable at a time.
- Honors `prefers-reduced-motion` (skip popover fade-in).

---

## Related Components

- [Timepicker](./timepicker.md) - Time-of-day picker with a spinner.
- [Datetimepicker](./datetimepicker.md) - Combined date + time picker.
- [Input](./input.md) - For basic text input.

---

## Additional Resources

- [Storybook: Datepicker Stories](https://bestax.io/storybook/?path=/story/form-datepicker)

:::tip Pro Tip
Use `inline` instead of the popover when you have vertical room to spare — booking grids and dashboards feel more direct without the open/close ceremony.
:::
