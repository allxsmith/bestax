---
title: DateInput
sidebar_label: DateInput
description: The `DateInput` component is a form input that opens a popover calendar for date selection.
---

# DateInput

## Overview

<!-- bestax:generated overview -->

The `DateInput` component is a form input that opens a popover calendar for date selection.

<!-- /bestax:generated overview -->

A clickable launcher icon on the right opens the popover, and you can type directly in the field with segmented keyboard entry. It uses native `Date` and `Intl` only (no extra dependencies), supports month and year pickers, min/max bounds, disabled-date predicates, custom token formats or `Intl.DateTimeFormatOptions`, locale-aware day/month names, an inline mode, and a native `<input type="date">` fallback for touch devices.

---

## Import

<!-- bestax:generated import -->

```tsx
import { DateInput } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic DateInput

A simple date picker with a popover calendar.

```tsx live
function example() {
  return <DateInput label="Pick a date" placeholder="YYYY-MM-DD" />;
}
```

**Typing-first** — the same example with `openOnFocus={false}`: focusing or clicking the field lets you type; open the popover with the launcher icon (or press `↓`).

```tsx live
function example() {
  return (
    <DateInput
      label="Type a date"
      placeholder="YYYY-MM-DD"
      openOnFocus={false}
    />
  );
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
      <DateInput label="Date" value={value} onChange={setValue} />
      <Paragraph mt="2">
        Selected: {value ? value.toDateString() : '—'}
      </Paragraph>
    </Block>
  );
}
```

**Typing-first** — identical, but with `openOnFocus={false}` so focusing just lets you type; the calendar waits behind the launcher icon (or `↓`).

```tsx live
function example() {
  const [value, setValue] = useState(new Date());
  return (
    <Block>
      <DateInput
        label="Date"
        value={value}
        onChange={setValue}
        openOnFocus={false}
      />
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
<DateInput label="Inline calendar" inline defaultValue={new Date()} />
```

---

### Month and Year Pickers

Set `granularity` to pick a whole month or year instead of a day, for card expiry dates, billing periods or a graduation year. The value is still a `Date`: the first day of the picked month, or 1 January of the picked year. The default `format` follows the granularity (`YYYY-MM`, `YYYY`), and segmented typing skips the segments the granularity doesn't use.

`min`, `max`, `shouldDisableDate` and `unselectableDates` judge whole periods: a month or year can be picked while any day in it can. Below, `min` is today, so earlier months are disabled while this month stays selectable though part of it has passed, and picking it commits its first day.

```tsx live
function example() {
  const [expiry, setExpiry] = useState<Date | null>(null);
  return (
    <Block>
      <DateInput
        label="Card expiry"
        granularity="month"
        format="MM/YY"
        placeholder="MM/YY"
        min={new Date()}
        value={expiry}
        onChange={setExpiry}
        mobileNative={false}
      />
      <Paragraph mt="2">
        Selected: {expiry ? expiry.toDateString() : 'none'}
      </Paragraph>
    </Block>
  );
}
```

:::note Forced to the custom calendar
On touch devices a month picker falls back to `<input type="month">` where the browser has one, and that input ignores `format`. This example forces `mobileNative={false}` so the `MM/YY` format shows there too.
:::

The year picker makes the year list the selection surface, bounded by `min` and `max`:

```tsx live
<DateInput
  label="Graduation year"
  granularity="year"
  min={new Date(1950, 0, 1)}
  max={new Date(2035, 11, 31)}
/>
```

Rendered `inline`, the month grid shows without a popover. The header steps a year at a time, and clicking the year opens the year list to jump further.

```tsx live
<DateInput
  label="Billing period"
  granularity="month"
  inline
  defaultValue={new Date()}
/>
```

---

### Min and Max

Limit selectable dates to a range. Nothing before year 1 is in range, as HTML's date inputs hold no earlier year: without a `min` the year list stops there, and a `min` before it counts as 1 January of year 1.

```tsx live
function example() {
  const today = new Date();
  const min = new Date(today.getFullYear(), today.getMonth(), 1);
  const max = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return (
    <DateInput
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

**Typing-first** — the same bounds with `openOnFocus={false}`: every keystroke and `↑` / `↓` arrow is clamped to the range (out-of-range candidates are silently rejected), and the launcher icon (or `↓`) opens the calendar.

```tsx live
function example() {
  const now = new Date();
  const min = new Date(now.getFullYear(), now.getMonth(), 1);
  const max = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return (
    <DateInput
      label="Typing is clamped to this month"
      min={min}
      max={max}
      defaultValue={new Date(now.getFullYear(), now.getMonth(), 15)}
      openOnFocus={false}
    />
  );
}
```

---

### Disabled Dates

Disable specific dates with `shouldDisableDate` (predicate) or `unselectableDates` (array). Blocked dates are disabled in the calendar and rejected during manual typing, the same way `min`/`max` are enforced.

```tsx live
<DateInput
  label="No weekends"
  shouldDisableDate={d => d.getDay() === 0 || d.getDay() === 6}
  mobileNative={false}
/>
```

:::note Forced to the custom calendar
HTML has no equivalent to `shouldDisableDate` or `unselectableDates`, so the OS-native pickers can't block any dates. This example forces `mobileNative={false}` so the rule works on touch devices too; in your app, keep the default `mobileNative="auto"` and also validate in `onChange`.
:::

**Typing-first** — with `openOnFocus={false}` the predicate also vetoes manual entry: typing or arrowing to a weekend is rejected, and the calendar stays tucked behind the launcher icon (or `↓`).

```tsx live
function example() {
  return (
    <DateInput
      label="Weekends rejected while typing"
      shouldDisableDate={d => d.getDay() === 0 || d.getDay() === 6}
      defaultValue={new Date(2024, 5, 7)}
      mobileNative={false}
      openOnFocus={false}
    />
  );
}
```

---

### Custom Format

Use an alternative token format. Supported tokens: `YYYY YY MM M DD D HH H hh h mm m ss s A a`.

```tsx live
<DateInput
  label="Date of birth"
  format="DD/MM/YYYY"
  placeholder="DD/MM/YYYY"
  mobileNative={false}
/>
```

:::note Forced to the custom calendar
The OS-native pickers use the device's locale format and don't render `placeholder` text. This example forces `mobileNative={false}` so the format/placeholder show on touch devices too.
:::

**Typing-first** — the same format with `openOnFocus={false}`: type day-first (typing `/` jumps to the next segment) and reach for the launcher icon (or `↓`) when you want the calendar.

```tsx live
function example() {
  return (
    <DateInput
      label="DD/MM/YYYY"
      format="DD/MM/YYYY"
      defaultValue={new Date(2024, 5, 7)}
      mobileNative={false}
      openOnFocus={false}
    />
  );
}
```

---

### Formats

The `format` prop takes a token string or `Intl.DateTimeFormatOptions`. Padded tokens (`YYYY`, `YY`, `MM`, `DD`) keep the field segmented-typeable; `Intl` formats are display-only unless you also pass a custom `parse`.

```tsx live
<Block display="flex" flexDirection="column">
  <DateInput
    label="YYYY-MM-DD (default)"
    defaultValue={new Date(2026, 4, 30)}
    openOnFocus={false}
    mobileNative={false}
  />
  <DateInput
    label="DD/MM/YYYY"
    format="DD/MM/YYYY"
    defaultValue={new Date(2026, 4, 30)}
    openOnFocus={false}
    mobileNative={false}
  />
  <DateInput
    label="MM-DD-YYYY"
    format="MM-DD-YYYY"
    defaultValue={new Date(2026, 4, 30)}
    openOnFocus={false}
    mobileNative={false}
  />
  <DateInput
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
    <DateInput
      label="Intl long + custom parse"
      format={{ year: 'numeric', month: 'long', day: 'numeric' }}
      parse={parse}
      defaultValue={new Date(2026, 4, 30)}
      mobileNative={false}
    />
  );
}
```

**Typing-first** — adding `openOnFocus={false}` here shows free-form entry: Intl formats have no segments, so typed text is committed on Enter or blur, and the calendar opens only via the launcher icon (or `↓`).

```tsx live
function example() {
  const parse = s => {
    const t = Date.parse(s);
    return isNaN(t) ? null : new Date(t);
  };
  return (
    <DateInput
      label="Intl long + custom parse — typing-first"
      format={{ year: 'numeric', month: 'long', day: 'numeric' }}
      parse={parse}
      defaultValue={new Date(2026, 4, 30)}
      mobileNative={false}
      openOnFocus={false}
    />
  );
}
```

---

### Launcher Icon

A clickable launcher sits on the **right** and toggles the popover — handy for input-mode (`openOnFocus={false}`) where you type the value and click the icon to open the calendar. Override its glyph with `triggerIconName`, or hide it with `triggerIcon={false}` (the popover still opens on focus / click). The decorative **left** icon is independent: it shows by default, takes its glyph from `iconLeftName`, and is hidden with `iconLeftName=""`.

```tsx live
<Block display="flex" flexDirection="column">
  <DateInput label="Default (left icon + right launcher)" />
  <DateInput label="Custom launcher glyph" triggerIconName="calendar-day" />
  <DateInput label="No launcher" triggerIcon={false} />
  <DateInput label="Left icon hidden" iconLeftName="" />
</Block>
```

**Typing-first** — the same group with `openOnFocus={false}`, where the launcher icon earns its keep; note that the `triggerIcon={false}` instance has no launcher, so its popover is keyboard-only (`↓`).

```tsx live
<Block display="flex" flexDirection="column">
  <DateInput label="Default (left icon + right launcher)" openOnFocus={false} />
  <DateInput
    label="Custom launcher glyph"
    triggerIconName="calendar-day"
    openOnFocus={false}
  />
  <DateInput
    label="No launcher — popover via ↓ only"
    triggerIcon={false}
    openOnFocus={false}
  />
  <DateInput label="Left icon hidden" iconLeftName="" openOnFocus={false} />
</Block>
```

The launcher gives way to a loading spinner at the same right edge, whether the `DateInput`'s own `isLoading` draws it or a `Control` it sits in does. Inside your own `Control`, set `isLoading` on that `Control`: the `DateInput` renders no `Control` of its own there, so its `isLoading` draws nothing.

```tsx live
<Field label="Date">
  <Control iconLeftName="calendar" isLoading>
    <DateInput placeholder="YYYY-MM-DD" />
  </Control>
</Field>
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
    <DateInput
      label="Click in, then arrow or type"
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
    <DateInput
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
      <DateInput
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

When `format` is an `Intl.DateTimeFormatOptions` object (or uses single-char tokens), segment mode disables: focusing the input does not highlight a segment.

```tsx live
function example() {
  return (
    <DateInput
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
<DateInput label="Picker only" editable={false} defaultValue={new Date()} />
```

#### Input only

Segmented typing with no calendar — handy in dense forms.

```tsx live
<DateInput label="Input only" popover={false} defaultValue={new Date()} />
```

---

### Locale

Day and month names follow the supplied BCP-47 locale via `Intl.DateTimeFormat`.

```tsx live
<Block display="flex" flexDirection="column">
  <DateInput
    label="ja-JP"
    locale="ja-JP"
    defaultValue={new Date()}
    mobileNative={false}
  />
  <DateInput
    label="fr-FR"
    locale="fr-FR"
    defaultValue={new Date()}
    mobileNative={false}
  />
  <DateInput
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

**Typing-first** — the same locales with `openOnFocus={false}` added: type straight into each field, then compare the localized calendars via the launcher icon (or `↓`).

```tsx live
<Block display="flex" flexDirection="column">
  <DateInput
    label="ja-JP"
    locale="ja-JP"
    defaultValue={new Date()}
    mobileNative={false}
    openOnFocus={false}
  />
  <DateInput
    label="fr-FR"
    locale="fr-FR"
    defaultValue={new Date()}
    mobileNative={false}
    openOnFocus={false}
  />
  <DateInput
    label="de-DE"
    locale="de-DE"
    defaultValue={new Date()}
    mobileNative={false}
    openOnFocus={false}
  />
</Block>
```

---

### First Day of Week

Set `firstDayOfWeek` to align the grid to Monday-first locales.

```tsx live
<DateInput label="Week starts Monday" firstDayOfWeek={1} mobileNative={false} />
```

:::note Forced to the custom calendar
The OS-native calendars use the device locale for the week start, so `firstDayOfWeek` (and `dayNames`/`monthNames`/`nearbyMonthDays`) are ignored there. This example forces `mobileNative={false}` so the Monday-first grid shows on touch devices too.
:::

**Typing-first** — the same example with `openOnFocus={false}`: type freely, then open the Monday-first grid with the launcher icon (or `↓`).

```tsx live
<DateInput
  label="Week starts Monday — typing-first"
  firstDayOfWeek={1}
  mobileNative={false}
  openOnFocus={false}
/>
```

---

### Mobile Native

Force the native `<input type="date">` (auto-detected on coarse-pointer + small-viewport devices by default).

```tsx live
<DateInput label="Native picker" mobileNative={true} />
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

`granularity="month"` falls back to `<input type="month">`, with the same gaps, but only where the browser implements it: Chromium browsers, Safari on iOS and Firefox for Android do, and desktop Firefox doesn't, so it gets the custom calendar. Desktop Safari accepts the type without drawing a month control, so `mobileNative={true}` there shows a plain text box. HTML has no year input, so `granularity="year"` always renders the custom calendar.

If any of these matter, pass `mobileNative={false}` to force the custom calendar popover (works on every device), or duplicate the constraint in `onChange` / server-side validation.
:::

---

### Sizes

```tsx live
<Block display="flex" flexDirection="column">
  <DateInput label="Small" controlSize="small" size="small" />
  <DateInput label="Default" />
  <DateInput label="Medium" controlSize="medium" size="medium" />
  <DateInput label="Large" controlSize="large" size="large" />
</Block>
```

**Typing-first** — every size with `openOnFocus={false}` so focusing just lets you type; the launcher icon (or `↓`) opens the popover.

```tsx live
<Block display="flex" flexDirection="column">
  <DateInput
    label="Small"
    controlSize="small"
    size="small"
    openOnFocus={false}
  />
  <DateInput label="Default" openOnFocus={false} />
  <DateInput
    label="Medium"
    controlSize="medium"
    size="medium"
    openOnFocus={false}
  />
  <DateInput
    label="Large"
    controlSize="large"
    size="large"
    openOnFocus={false}
  />
</Block>
```

---

### Colors

```tsx live
<Block display="flex" flexDirection="column">
  <DateInput label="Primary" color="primary" />
  <DateInput label="Info" color="info" />
  <DateInput label="Success" color="success" />
  <DateInput label="Warning" color="warning" />
  <DateInput label="Danger" color="danger" />
</Block>
```

**Typing-first** — the same palette with `openOnFocus={false}`: click in to type, and use the launcher icon (or `↓`) for the calendar.

```tsx live
<Block display="flex" flexDirection="column">
  <DateInput label="Primary" color="primary" openOnFocus={false} />
  <DateInput label="Info" color="info" openOnFocus={false} />
  <DateInput label="Success" color="success" openOnFocus={false} />
  <DateInput label="Warning" color="warning" openOnFocus={false} />
  <DateInput label="Danger" color="danger" openOnFocus={false} />
</Block>
```

**Inline:** the calendar carries the color too, on the selected date, today's date and the keyboard focus ring, and rendered inline it shows without opening a popover.

```tsx live
function example() {
  // The 1st of this month (the 2nd when today is the 1st), so the selected
  // date and today's date both show.
  const picked = new Date();
  picked.setDate(picked.getDate() === 1 ? 2 : 1);
  return (
    <Block display="flex" flexWrap="wrap">
      <Block mr="4" mb="4">
        <DateInput label="Link" color="link" inline defaultValue={picked} />
      </Block>
      <Block mr="4" mb="4">
        <DateInput
          label="Success"
          color="success"
          inline
          defaultValue={picked}
        />
      </Block>
      <Block mr="4" mb="4">
        <DateInput label="Danger" color="danger" inline defaultValue={picked} />
      </Block>
    </Block>
  );
}
```

---

### States

```tsx live
<Block display="flex" flexDirection="column">
  <DateInput label="Disabled" disabled />
  <DateInput label="Read only" readOnly defaultValue={new Date()} />
  <DateInput label="Loading" isLoading />
</Block>
```

---

### Horizontal Field

```tsx live
<DateInput label="Date of birth" horizontal placeholder="YYYY-MM-DD" />
```

**Typing-first** — the horizontal layout with `openOnFocus={false}`: focusing lets you type straight away, and the launcher icon (or `↓`) opens the popover.

```tsx live
<DateInput
  label="Date of birth"
  horizontal
  placeholder="YYYY-MM-DD"
  openOnFocus={false}
/>
```

---

### Context-Aware Rendering

The `DateInput` component is context-aware: it detects whether it is already inside a `Field` and adjusts its rendering accordingly. You can use it standalone with a `label` prop (it wraps itself in a Field), or inside a `Field` / `Control` (it skips rendering its own).

#### Default (with label)

The simplest usage — the component automatically renders its own Field wrapper.

```tsx live
<DateInput label="Date" placeholder="YYYY-MM-DD" />
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
          <DateInput placeholder="YYYY-MM-DD" />
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
            <DateInput placeholder="YYYY-MM-DD" />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

Inside a `Control` with no `Field` around it, `DateInput` renders no `Field` of its own either, unless you give it `label`, `message`, `horizontal` or `fieldClassName`. Those need a `Field`, so with any of them it keeps its own `Field` inside the `Control` and warns in development. Wrap the `Control` in a `Field`, as above, and set the `label`, `horizontal` and class name on that `Field` instead.

---

## Keyboard Navigation

### On the input (segmented entry)

Focus the input — the **year** segment highlights automatically and the keyboard alone can drive the full date entry without ever opening the popover. Segment mode activates whenever `format` is a token string with padded tokens (`YYYY`, `YY`, `MM`, `DD`); `Intl.DateTimeFormatOptions` formats and single-character tokens (`Y`, `M`, `D`) fall back to free-form text entry.

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

The day grid's keys work the same on an `inline` calendar, minus opening and closing.

| Key                   | Action                        |
| --------------------- | ----------------------------- |
| `↓`                   | Open popover (when closed)    |
| `Enter`               | Select focused                |
| `Escape`              | Close popover                 |
| `←` / `→`             | Move focused date by ±1 day   |
| `↑` / `↓`             | Move focused date by ±7 days  |
| `PageUp` / `PageDown` | Move focused date by ±1 month |
| `Shift+PageUp/Down`   | Move focused date by ±1 year  |
| `Home` / `End`        | Jump to start / end of week   |
| `Space`               | Select focused date           |
| `Tab`                 | Move focus to next control    |

### On the month grid (`granularity="month"`)

The month grid follows the day grid, a month per cell in rows of three. Months with no selectable day are skipped.

| Key                   | Action                                  |
| --------------------- | --------------------------------------- |
| `←` / `→`             | Move focus by ±1 month, across years    |
| `↑` / `↓`             | Move focus by ±1 row                    |
| `PageUp` / `PageDown` | Move focus by ±1 year                   |
| `Home` / `End`        | Jump to the first / last month of a row |
| `Enter` / `Space`     | Select the focused month                |
| `Escape`              | Close the popover                       |

### On the year list (`granularity="year"`)

| Key               | Action                                    |
| ----------------- | ----------------------------------------- |
| `←` / `→`         | Move focus by ±1 year                     |
| `↑` / `↓`         | Move focus by ±1 row                      |
| `Home` / `End`    | Jump to the first / last year in the list |
| `Enter` / `Space` | Select the focused year                   |
| `Escape`          | Close the popover                         |

---

## Form Submission

`DateInput` participates in HTML form submission. Pass a `name` and the text field submits the text it displays, in its `format`. The native input on touch devices submits the ISO value (`YYYY-MM-DD`, or `YYYY-MM` at month granularity), and an `inline` calendar, which has no visible input, submits it from a hidden `<input>` (`YYYY-MM-DD`, `YYYY-MM` or `YYYY`).

| Prop       | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| `name`     | Form field name.                                             |
| `form`     | Optional id of the form the input belongs to.                |
| `required` | Marks the field as required for native HTML form validation. |

```tsx live
function DateInputFormDemo() {
  const [submitted, setSubmitted] = React.useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
      }}
    >
      <DateInput
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
- Popover panel has `role="dialog"` with an accessible name. Opening it puts focus on the focused date, month or year.
- Closing the popover with `Escape` or a pick returns focus to the input, whether the input or the launcher opened it. Under `openOnFocus` that returning focus leaves the popover closed; focusing or clicking the input again opens it. Dismissing without a pick commits nothing: an empty field stays empty, and leaving afterwards commits only what you typed.
- Calendar uses `role="grid"` with cells as `role="gridcell"`.
- Cells expose `aria-selected`, `aria-disabled`, and `aria-current="date"` for today.
- Roving `tabindex` keeps a single grid cell focusable at a time, and focus moves with it, inline as in the popover. When the focused date is disabled, that cell is the nearest enabled day of the month.
- The month grid is a `role="grid"` of `role="row"`s, labelled by the year in its header. Each month cell carries the full month name as its accessible name, `aria-current="date"` for this month and `aria-disabled` for a month with no selectable day.
- The year list is a `role="listbox"` named by the `chooseYear` label. As the selection surface its options take `aria-selected` from the value's year rather than from focus, which roves through the list. When the focused year is disabled, the nearest enabled year takes the tab stop, so `Tab` still reaches the list.
- The launcher and popover are named "Choose month" or "Choose year" to match the granularity; override them, and the month grid's "Previous year" / "Next year" buttons, through `labels` (`chooseMonth`, `chooseYear`, `prevYear`, `nextYear`).
- Honors `prefers-reduced-motion` (skip popover fade-in).

---

## Related Components

- [TimeInput](./timeinput.md) - Time-of-day picker with a spinner.
- [DateTimeInput](./datetimeinput.md) - Combined date + time picker.
- [Input](../input.md) - For basic text input.

---

## Additional Resources

- [Storybook: DateInput Stories](https://bestax.io/storybook/?path=/story/form-dateinput)

:::tip Pro Tip
Use `inline` instead of the popover when you have vertical room to spare — booking grids and dashboards feel more direct without the open/close ceremony.
:::

---

## Props

<!-- bestax:generated props -->

| Prop                | Type                                                                             | Default          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`             | `React.ReactNode`                                                                | —                | Field label (component auto-wraps in a `Field` if not already inside). Automatically associated with the input via `htmlFor` — uses your `id` when provided, otherwise a generated one. Not wired in `inline` mode (no visible input to label) and dropped inside an outer `Field`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `labelSize`         | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                               | —                | Size for the label.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `labelProps`        | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`      | —                | Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `horizontal`        | `boolean`                                                                        | `false`          | Render the field with horizontal layout.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `iconLeft`          | `IconProps` \| `React.ReactNode`                                                 | —                | Icon props for the left icon. Bulma gives control icons `pointer-events: none`, so a clickable node here never receives a click. Put a button beside the input in its own addon `Control` instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `iconRight`         | `IconProps` \| `React.ReactNode`                                                 | —                | Icon props for the right icon. Bulma gives control icons `pointer-events: none`, so a clickable node here never receives a click. Put a button beside the input in its own addon `Control` instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `iconRightName`     | `string`                                                                         | —                | Shortcut for the right icon name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `iconLeftSize`      | `'small'` \| `'medium'` \| `'large'`                                             | —                | Shortcut for left icon size.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `iconRightSize`     | `'small'` \| `'medium'` \| `'large'`                                             | —                | Shortcut for right icon size.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `hasIconsLeft`      | `boolean`                                                                        | `false`          | Force the left icon container.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `hasIconsRight`     | `boolean`                                                                        | `false`          | Force the right icon container.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `isLoading`         | `boolean`                                                                        | `false`          | Shows a loading spinner on the `Control` it renders, and hides the launcher (`triggerIcon`) while it does. Inside your own `Control` it renders none, so this draws nothing; set `isLoading` on that `Control`. Under `prefers-reduced-motion: reduce` the spinner stops and stays drawn (with bestax's CSS loaded).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `triggerIcon`       | `boolean`                                                                        | `true`           | Show a clickable launcher button on the right that toggles the popover. Hidden by default while a spinner shows at the same right edge: this component's `isLoading` when it renders its own `Control`, or the enclosing `Control`'s `isLoading` inside one.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `isExpanded`        | `boolean`                                                                        | `false`          | Expand the control to fill its container.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `controlSize`       | `'small'` \| `'medium'` \| `'large'`                                             | —                | Size of the wrapping Control.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `message`           | `React.ReactNode`                                                                | —                | Help/validation text below the input.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `messageColor`      | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`  | —                | Color modifier for the help message.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `fieldClassName`    | `string`                                                                         | —                | Additional CSS classes for the Field wrapper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `controlClassName`  | `string`                                                                         | —                | Additional CSS classes for the Control wrapper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `value`             | `Date` \| `null`                                                                 | —                | Controlled selected date.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `defaultValue`      | `Date` \| `null`                                                                 | —                | Initial date for uncontrolled usage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `onChange`          | `(d: Date \| null) => void`                                                      | —                | Fired when the value changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `onOpen`            | `() => void`                                                                     | —                | Fired when the popover opens.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `onClose`           | `() => void`                                                                     | —                | Fired when the popover closes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `min`               | `Date`                                                                           | —                | Earliest selectable date. A `min` before year 1 is raised to 1 January of year 1, where the range starts without one too: HTML's date and month inputs hold no earlier year, so the calendar and typing stop there.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `max`               | `Date`                                                                           | —                | Latest selectable date.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `disabled`          | `boolean`                                                                        | `false`          | Disable the input.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `readOnly`          | `boolean`                                                                        | `false`          | Make the input read-only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `placeholder`       | `string`                                                                         | —                | Placeholder text for the input.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `granularity`       | `'day'` \| `'month'` \| `'year'`                                                 | `'day'`          | What the calendar shows and what a selection means: `'day'` shows the day grid, `'month'` a grid of the focused year's months whose header steps a year at a time, and `'year'` the year list. A month or year value is the first day of that period at local midnight, so `onChange` gets `new Date(2026, 5, 1)` for June 2026. A `value` elsewhere in the period shows as that period and stays as given until the user picks a period or types a different one. `min`, `max`, `shouldDisableDate` and `unselectableDates` judge whole periods: a month or year can be picked while any day in it can, so a `min` of 15 June still allows June, and June commits as 1 June, earlier than that `min`. The default `format` follows the granularity (`'YYYY-MM'`, `'YYYY'`); a custom `format` with finer tokens still renders them, but typing skips them. `firstDayOfWeek`, `dayNames` and `nearbyMonthDays` only affect the day grid, and an `inline` calendar's hidden form value is `YYYY-MM` or `YYYY`. The `labels` keys `chooseMonth` / `chooseYear` name the launcher and popover, and `prevYear` / `nextYear` the month grid's header buttons. |
| `format`            | `Intl.DateTimeFormatOptions` \| `string`                                         | `'YYYY-MM-DD'`   | Token format string or `Intl.DateTimeFormat` options. Defaults to `'YYYY-MM-DD'`, or to `'YYYY-MM'` / `'YYYY'` when `granularity` is `'month'` / `'year'`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `parse`             | `(s: string) => Date \| null`                                                    | —                | Custom parser (use when `format` is `Intl.DateTimeFormatOptions`). Enter and leaving the field call it only if the user changed the text, so focus passing through commits nothing and the value keeps what the format leaves out, such as the time of day.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `locale`            | `string`                                                                         | —                | BCP-47 locale tag for day/month names and Intl formatting.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `inline`            | `boolean`                                                                        | `false`          | Render the calendar inline (no popover).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `mobileNative`      | `boolean` \| `'auto'`                                                            | `'auto'`         | Use `<input type="date">` on coarse-pointer + small-viewport devices. At `'month'` granularity it uses `<input type="month">` where the browser implements one, as Chromium browsers, Safari on iOS and Firefox for Android do, and the calendar where it doesn't, as in desktop Firefox. Desktop Safari accepts the type but draws no month control, so forcing `true` there shows a plain text box. HTML has no year input, so `'year'` granularity always renders the calendar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `editable`          | `boolean`                                                                        | `true`           | Allow segmented keyboard typing in the input (type the date directly, auto-advancing across segments). `false` makes the field picker-only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `popover`           | `boolean`                                                                        | `true`           | Whether the calendar popover exists. `false` makes the field input-only (segmented typing, no popover).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `openOnFocus`       | `boolean`                                                                        | `true`           | Open the popover when the input is focused. Focus that a closing popover hands back to the input leaves it closed. Dismissing it commits nothing: an empty field stays empty, and leaving afterwards commits only what was typed since.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `closeOnSelect`     | `boolean`                                                                        | `true`           | Close the popover after a date is selected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `position`          | `'bottom-left'` \| `'bottom-right'` \| `'top-left'` \| `'top-right'` \| `'auto'` | `'bottom-left'`  | Popover anchor position relative to the input.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `appendToBody`      | `boolean`                                                                        | `false`          | Render the popover into `document.body` via portal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `color`             | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`  | —                | Bulma color modifier for the input, also carried by the calendar, where it colors the selected date. Today's date and the keyboard focus ring take the color's `-on-scheme` variant, which Bulma adjusts to contrast with the background, so pale colors stay readable; that makes `'primary'` a shade off the unset calendar, which uses plain `primary` for both. Unset, the calendar uses its `--bulma-dateinput-*` variables, which follow `primary` by default.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `size`              | `'small'` \| `'medium'` \| `'large'`                                             | —                | Size variant.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `isRounded`         | `boolean`                                                                        | `false`          | Render the input with rounded corners.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `shouldDisableDate` | `(d: Date) => boolean`                                                           | —                | Predicate to disable specific dates (e.g. weekends). Blocked dates are also rejected during manual typing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `unselectableDates` | `Date[]`                                                                         | —                | Convenience array of disabled dates; merged with `shouldDisableDate`. Matched by calendar day and also rejected during manual typing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `firstDayOfWeek`    | `0` \| `1` \| `2` \| `3` \| `4` \| `5` \| `6`                                    | `0`              | Day the week starts on (0 = Sunday).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `dayNames`          | `string[]`                                                                       | —                | Override the 7 day-name labels (in calendar order, post-rotation).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `monthNames`        | `string[]`                                                                       | —                | Override the 12 month-name labels.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `nearbyMonthDays`   | `boolean`                                                                        | `true`           | Show dimmed dates from adjacent months in the grid.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `iconLeftName`      | `string`                                                                         | `'calendar'`     | Decorative left icon glyph for the wrapping `Control` (shown by default). Set `''` to hide.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `triggerIconName`   | `string`                                                                         | `'chevron-down'` | Glyph for the right launcher button.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `labels`            | `PickerLabels`                                                                   | —                | Optional translatable string overrides (ARIA labels, button text).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `name`              | `string`                                                                         | —                | Form field name. The text field submits the text it displays. The native input on touch devices submits the ISO value (`YYYY-MM-DD`, or `YYYY-MM` at month granularity), and an `inline` calendar, which has no visible input, submits it from a hidden input (`YYYY-MM-DD`, `YYYY-MM` or `YYYY`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `form`              | `string`                                                                         | —                | Form id the input belongs to.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `required`          | `boolean`                                                                        | `false`          | Marks the input as required.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `className`         | `string`                                                                         | —                | Additional CSS classes for the input.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `ref`               | `React.Ref<HTMLInputElement>`                                                    | —                | Forwarded to the underlying `<input>`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `...`               | All standard `<input>` attributes and Bulma helper props                         | —                | See [Helper Props](../../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`DateInput` registers these variables on its own `.input` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../../helpers/theme.md).

| CSS Variable                                  | Sass Variable                        | Default                                                                                                                  |
| --------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `--bulma-dateinput-min-width` ‡               | `$dateinput-min-width`               | `16rem`                                                                                                                  |
| `--bulma-dateinput-cell-size` ‡               | `$dateinput-cell-size`               | `2.25rem`                                                                                                                |
| `--bulma-dateinput-cell-radius` ‡             | `$dateinput-cell-radius`             | `var(--bulma-radius-small)`                                                                                              |
| `--bulma-dateinput-cell-color` ‡              | `$dateinput-cell-color`              | `var(--bulma-text)`                                                                                                      |
| `--bulma-dateinput-cell-hover-bg` ‡           | `$dateinput-cell-hover-bg`           | `hsla(0, 0%, 50%, 0.13)`                                                                                                 |
| `--bulma-dateinput-cell-selected-bg` ‡        | `$dateinput-cell-selected-bg`        | `var(--bulma-primary)`                                                                                                   |
| `--bulma-dateinput-cell-selected-color` ‡     | `$dateinput-cell-selected-color`     | `var(--bulma-primary-invert)`                                                                                            |
| `--bulma-dateinput-cell-today-color` ‡        | `$dateinput-cell-today-color`        | `var(--bulma-primary)`                                                                                                   |
| `--bulma-dateinput-focus-ring-color` ‡        | `$dateinput-focus-ring-color`        | `var(--bulma-primary)`                                                                                                   |
| `--bulma-dateinput-cell-disabled-color` ‡     | `$dateinput-cell-disabled-color`     | `var(--bulma-text-weak)`                                                                                                 |
| `--bulma-dateinput-cell-other-month-color` ‡  | `$dateinput-cell-other-month-color`  | `var(--bulma-text-weak)`                                                                                                 |
| `--bulma-dateinput-header-padding` ‡          | `$dateinput-header-padding`          | `0.5rem 0`                                                                                                               |
| `--bulma-dateinput-day-name-color` ‡          | `$dateinput-day-name-color`          | `var(--bulma-text-weak)`                                                                                                 |
| `--bulma-dateinput-day-name-size` ‡           | `$dateinput-day-name-size`           | `var(--bulma-size-7)`                                                                                                    |
| `--bulma-dateinput-nav-button-size` ‡         | `$dateinput-nav-button-size`         | `1.75rem`                                                                                                                |
| `--bulma-picker-popover-z-index` ‡            | `$picker-popover-z-index`            | `30`                                                                                                                     |
| `--bulma-picker-popover-background` ‡         | `$picker-popover-background`         | `var(--bulma-scheme-main)`                                                                                               |
| `--bulma-picker-popover-radius` ‡             | `$picker-popover-radius`             | `var(--bulma-radius-large)`                                                                                              |
| `--bulma-picker-popover-shadow` ‡             | `$picker-popover-shadow`             | `0 8px 24px hsla(0, 0%, 0%, 0.18)`                                                                                       |
| `--bulma-picker-popover-border-color` ‡       | `$picker-popover-border-color`       | `var(--bulma-border)`                                                                                                    |
| `--bulma-picker-popover-padding` ‡            | `$picker-popover-padding`            | `0.75rem`                                                                                                                |
| `--bulma-picker-popover-offset` ‡             | `$picker-popover-offset`             | `4px`                                                                                                                    |
| `--bulma-picker-popover-animation-duration` ‡ | `$picker-popover-animation-duration` | `0.15s`                                                                                                                  |
| `--bulma-input-h`                             | `$input-h`                           | `var(--bulma-scheme-h)`                                                                                                  |
| `--bulma-input-s`                             | `$input-s`                           | `var(--bulma-scheme-s)`                                                                                                  |
| `--bulma-input-l`                             | `$input-l`                           | `var(--bulma-scheme-main-l)`                                                                                             |
| `--bulma-input-border-style`                  | `$input-border-style`                | `solid`                                                                                                                  |
| `--bulma-input-border-width`                  | `$input-border-width`                | `var(--bulma-control-border-width)`                                                                                      |
| `--bulma-input-border-l`                      | `$input-border-l`                    | `var(--bulma-border-l)`                                                                                                  |
| `--bulma-input-border-l-delta`                | `$input-border-l-delta`              | `0%`                                                                                                                     |
| `--bulma-input-border-color`                  | `$input-border-color`                | `hsl(var(--bulma-input-h), var(--bulma-input-s), calc(var(--bulma-input-border-l) + var(--bulma-input-border-l-delta)))` |
| `--bulma-input-hover-border-l-delta`          | `$input-hover-border-l-delta`        | `var(--bulma-hover-border-l-delta)`                                                                                      |
| `--bulma-input-active-border-l-delta`         | `$input-active-border-l-delta`       | `var(--bulma-active-border-l-delta)`                                                                                     |
| `--bulma-input-focus-h`                       | `$input-focus-h`                     | `var(--bulma-focus-h)`                                                                                                   |
| `--bulma-input-focus-s`                       | `$input-focus-s`                     | `var(--bulma-focus-s)`                                                                                                   |
| `--bulma-input-focus-l`                       | `$input-focus-l`                     | `var(--bulma-focus-l)`                                                                                                   |
| `--bulma-input-focus-shadow-size`             | `$input-focus-shadow-size`           | `var(--bulma-focus-shadow-size)`                                                                                         |
| `--bulma-input-focus-shadow-alpha`            | `$input-focus-shadow-alpha`          | `var(--bulma-focus-shadow-alpha)`                                                                                        |
| `--bulma-input-color-l`                       | `$input-color-l`                     | `var(--bulma-text-strong-l)`                                                                                             |
| `--bulma-input-background-l`                  | `$input-background-l`                | `var(--bulma-scheme-main-l)`                                                                                             |
| `--bulma-input-background-l-delta`            | `$input-background-l-delta`          | `0%`                                                                                                                     |
| `--bulma-input-height`                        | `$input-height`                      | `var(--bulma-control-height)`                                                                                            |
| `--bulma-input-shadow`                        | `$input-shadow`                      | `inset 0 0.0625em 0.125em hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.05)`        |
| `--bulma-input-placeholder-color`             | `$input-placeholder-color`           | `hsla(var(--bulma-text-h), var(--bulma-text-s), var(--bulma-text-strong-l), 0.3)`                                        |
| `--bulma-input-disabled-color`                | `$input-disabled-color`              | `var(--bulma-text-weak)`                                                                                                 |
| `--bulma-input-disabled-background-color`     | `$input-disabled-background-color`   | `var(--bulma-background)`                                                                                                |
| `--bulma-input-disabled-border-color`         | `$input-disabled-border-color`       | `var(--bulma-background)`                                                                                                |
| `--bulma-input-disabled-placeholder-color`    | `$input-disabled-placeholder-color`  | `hsla(var(--bulma-text-h), var(--bulma-text-s), var(--bulma-text-weak-l), 0.3)`                                          |
| `--bulma-input-arrow`                         | `$input-arrow`                       | `var(--bulma-link)`                                                                                                      |
| `--bulma-input-icon-color`                    | `$input-icon-color`                  | `var(--bulma-text-light)`                                                                                                |
| `--bulma-input-icon-hover-color`              | `$input-icon-hover-color`            | `var(--bulma-text-weak)`                                                                                                 |
| `--bulma-input-icon-focus-color`              | `$input-icon-focus-color`            | `var(--bulma-link)`                                                                                                      |
| `--bulma-input-radius`                        | `$input-radius`                      | `var(--bulma-radius)`                                                                                                    |

‡ declared on a constituent element: values set via `className`, the `style` prop, or an ancestor are only inherited and lose — target the declaring element in your CSS.

<!-- /bestax:generated cssvars -->
