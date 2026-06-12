---
title: TimeInput
sidebar_label: TimeInput
---

# TimeInput

## Overview

The `TimeInput` component is a form input that opens a popover spinner for time-of-day selection. A clickable launcher icon on the right opens the popover, and you can type directly in the field with segmented keyboard entry. It supports 12-hour and 24-hour formats, optional seconds, custom hour/minute/second increments, min/max bounds, an unselectable-times predicate, and a native `<input type="time">` fallback for touch devices.

---

## Import

```tsx
import { TimeInput } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop                | Type                                                                     | Default          | Description                                                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`             | `Date \| null`                                                           | —                | Controlled selected time (date portion is preserved).                                                                                                                                                                              |
| `defaultValue`      | `Date \| null`                                                           | —                | Initial value for uncontrolled usage.                                                                                                                                                                                              |
| `onChange`          | `(d: Date \| null) => void`                                              | —                | Fired when the value changes.                                                                                                                                                                                                      |
| `onOpen`            | `() => void`                                                             | —                | Fired when the popover opens.                                                                                                                                                                                                      |
| `onClose`           | `() => void`                                                             | —                | Fired when the popover closes.                                                                                                                                                                                                     |
| `min`               | `Date`                                                                   | —                | Earliest selectable time.                                                                                                                                                                                                          |
| `max`               | `Date`                                                                   | —                | Latest selectable time.                                                                                                                                                                                                            |
| `hourFormat`        | `'12' \| '24'`                                                           | `'24'`           | Hour format. `'12'` shows an AM/PM toggle.                                                                                                                                                                                         |
| `enableSeconds`     | `boolean`                                                                | `false`          | Show a seconds column. Note: iOS Safari's native time picker UI does not include a seconds wheel; pass `mobileNative={false}` if you need one on iOS.                                                                              |
| `incrementHours`    | `number`                                                                 | `1`              | Hour step for the spinner.                                                                                                                                                                                                         |
| `incrementMinutes`  | `number`                                                                 | `1`              | Minute step. Combine with `min`/`max` for slot-style pickers.                                                                                                                                                                      |
| `incrementSeconds`  | `number`                                                                 | `1`              | Second step.                                                                                                                                                                                                                       |
| `unselectableTimes` | `(d: Date) => boolean`                                                   | —                | Predicate returning `true` for times that should be skipped.                                                                                                                                                                       |
| `placeholder`       | `string`                                                                 | —                | Placeholder text for the input.                                                                                                                                                                                                    |
| `format`            | `string \| Intl.DateTimeFormatOptions`                                   | (see below)      | Token format string or `Intl.DateTimeFormat` options.                                                                                                                                                                              |
| `parse`             | `(s: string) => Date \| null`                                            | —                | Custom parser.                                                                                                                                                                                                                     |
| `locale`            | `string`                                                                 | —                | BCP-47 locale tag for Intl formatting.                                                                                                                                                                                             |
| `inline`            | `boolean`                                                                | `false`          | Render the spinner inline (no popover).                                                                                                                                                                                            |
| `mobileNative`      | `boolean \| 'auto'`                                                      | `'auto'`         | Use `<input type="time">` on coarse-pointer + small-viewport devices.                                                                                                                                                              |
| `audioTick`         | `boolean`                                                                | `false`          | Play a short audible click on each wheel-item crossing. Substitute for haptic feedback on iOS Safari (which has no web haptic API as of May 2026); on Android, `navigator.vibrate(5)` fires automatically regardless.              |
| `haptics`           | `boolean`                                                                | `false`          | Auto-route platform-appropriate feedback: vibrate on Android (already happening), audio thunk on iOS (where vibrate is unavailable). One switch instead of platform-sniffing on the consumer side. `audioTick={true}` always wins. |
| `editable`          | `boolean`                                                                | `true`           | Allow segmented keyboard typing in the input (type the time directly, auto-advancing across segments). `false` makes the field picker-only.                                                                                        |
| `popover`           | `boolean`                                                                | `true`           | Whether the spinner popover exists. `false` makes the field input-only (segmented typing, no popover).                                                                                                                             |
| `openOnFocus`       | `boolean`                                                                | `true`           | Open the popover when the input is focused.                                                                                                                                                                                        |
| `closeOnSelect`     | `boolean`                                                                | `false`          | Close the popover after a time is selected (off by default).                                                                                                                                                                       |
| `position`          | `'bottom-left' \| 'bottom-right' \| 'top-left' \| 'top-right' \| 'auto'` | `'bottom-left'`  | Popover anchor position relative to the input.                                                                                                                                                                                     |
| `appendToBody`      | `boolean`                                                                | `false`          | Render the popover into `document.body` via portal.                                                                                                                                                                                |
| `disabled`          | `boolean`                                                                | `false`          | Disable the input.                                                                                                                                                                                                                 |
| `readOnly`          | `boolean`                                                                | `false`          | Make the input read-only.                                                                                                                                                                                                          |
| `color`             | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`    | —                | Bulma color modifier.                                                                                                                                                                                                              |
| `size`              | `'small' \| 'medium' \| 'large'`                                         | —                | Size variant.                                                                                                                                                                                                                      |
| `isRounded`         | `boolean`                                                                | `false`          | Render the input with rounded corners.                                                                                                                                                                                             |
| `iconLeftName`      | `string`                                                                 | `'clock'`        | Decorative left icon glyph for the wrapping `Control` (shown by default). Set `''` to hide.                                                                                                                                        |
| `triggerIcon`       | `boolean`                                                                | `true`           | Show a clickable launcher button on the right that toggles the popover.                                                                                                                                                            |
| `triggerIconName`   | `string`                                                                 | `'chevron-down'` | Glyph for the right launcher button.                                                                                                                                                                                               |
| `name`              | `string`                                                                 | —                | Form field name.                                                                                                                                                                                                                   |
| `form`              | `string`                                                                 | —                | Form id the input belongs to.                                                                                                                                                                                                      |
| `required`          | `boolean`                                                                | `false`          | Marks the input as required.                                                                                                                                                                                                       |
| `label`             | `React.ReactNode`                                                        | —                | Field label.                                                                                                                                                                                                                       |
| `horizontal`        | `boolean`                                                                | `false`          | Render the field with horizontal layout.                                                                                                                                                                                           |
| `message`           | `React.ReactNode`                                                        | —                | Help/validation text below the input.                                                                                                                                                                                              |
| `messageColor`      | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`    | —                | Color modifier for the help message.                                                                                                                                                                                               |
| `className`         | `string`                                                                 | —                | Additional CSS classes for the input.                                                                                                                                                                                              |
| `ref`               | `React.Ref<HTMLInputElement>`                                            | —                | Forwarded to the underlying `<input>`.                                                                                                                                                                                             |
| ...                 | All standard HTML and Bulma helper props                                 |                  | (See [Helper Props](../helpers/usebulmaclasses))                                                                                                                                                                                   |

The default `format` depends on `hourFormat` and `enableSeconds`: `'HH:mm'`, `'HH:mm:ss'`, `'hh:mm A'`, or `'hh:mm:ss A'`.

When you pass an explicit token `format`, **that format is the source of truth for the wheel spinner**: a 12-hour format (`h`/`hh` with `A`/`a`) shows a 12-hour wheel with an AM/PM column, and a 24-hour format (`H`/`HH`) shows a 24-hour wheel — regardless of `hourFormat`. So `hourFormat` only matters when you don't pass a `format`. (If `format` is an `Intl.DateTimeFormat` options object rather than a token string, the cycle can't be read from it and the wheel falls back to `hourFormat`.)

---

## Usage

### Basic TimeInput

```tsx live
<TimeInput label="Time" placeholder="HH:MM" />
```

---

### Controlled

```tsx live
function example() {
  const [v, setV] = useState(() => {
    const d = new Date();
    d.setHours(13, 45, 0, 0);
    return d;
  });
  return (
    <Block>
      <TimeInput label="Departure" value={v} onChange={setV} />
      <Paragraph mt="2">Selected: {v ? v.toLocaleTimeString() : '—'}</Paragraph>
    </Block>
  );
}
```

---

### 12-hour Format

`hourFormat="12"` renders an AM/PM toggle column.

```tsx live
function example() {
  const v = new Date();
  v.setHours(13, 45, 0, 0);
  return (
    <TimeInput
      label="12-hour"
      hourFormat="12"
      defaultValue={v}
      mobileNative={false}
    />
  );
}
```

:::note Forced to the custom wheel
The OS-native pickers use the device's clock setting (12h/24h), so `hourFormat` is ignored there. This example forces `mobileNative={false}` so the 12-hour format shows on touch devices too.
:::

---

### 24-hour Format

The default. Hours run 00–23.

```tsx live
function example() {
  const v = new Date();
  v.setHours(13, 45, 0, 0);
  return (
    <TimeInput
      label="24-hour"
      hourFormat="24"
      defaultValue={v}
      mobileNative={false}
    />
  );
}
```

:::note Forced to the custom wheel
Same as above — the OS-native pickers follow the device clock setting. This example forces `mobileNative={false}` to show 24-hour on touch devices.
:::

---

### With Seconds

Adds a third spinner column.

```tsx live
function example() {
  const v = new Date();
  v.setHours(10, 20, 30, 0);
  return (
    <TimeInput
      label="With seconds"
      enableSeconds
      defaultValue={v}
      mobileNative={false}
    />
  );
}
```

:::caution iOS Safari has no seconds wheel (Android Chrome does)
This example forces `mobileNative={false}` so the seconds wheel shows on every device.
**Android Chrome** renders a seconds spinner in its native time picker when `step < 60` (which our component sets when `enableSeconds` is true). **iOS Safari** has no seconds wheel under any circumstances — Apple's native picker UI is hard-locked to hour/minute spinners regardless of `step`. The input value can carry seconds entered programmatically, but iOS users can't pick them in the wheel. If you need a seconds wheel on iOS, pass `mobileNative={false}` to force the custom wheel popover. See [Mobile Native](#mobile-native) below for the full iOS-vs-Android picker support matrix.
:::

---

### Increment Steps

Pair `incrementMinutes` with min/max for slot-style pickers.

```tsx live
function example() {
  const v = new Date();
  v.setHours(9, 30, 0, 0);
  return (
    <TimeInput
      label="15-minute slots"
      incrementMinutes={15}
      defaultValue={v}
      mobileNative={false}
    />
  );
}
```

:::note Forced to the custom wheel
iOS Safari shows every minute regardless of `step`. This example forces `mobileNative={false}` so the 15-minute stepping is enforced on every device.
:::

---

### Min and Max

Restrict to a time-of-day range.

```tsx live
function example() {
  const today = new Date();
  const min = new Date(today);
  min.setHours(9, 0, 0, 0);
  const max = new Date(today);
  max.setHours(17, 0, 0, 0);
  const dv = new Date(today);
  dv.setHours(12, 0, 0, 0);
  return (
    <TimeInput
      label="Office hours: 09:00 — 17:00"
      min={min}
      max={max}
      defaultValue={dv}
    />
  );
}
```

:::note iOS native does not enforce `min`/`max` in the picker
On iOS Safari the picker UI lets the user spin to any time; `min`/`max` only fire at form-submission validation ([WebKit bug #225639](https://bugs.webkit.org/show_bug.cgi?id=225639), still open). Pass `mobileNative={false}` for iOS-side enforcement. Android Chrome's native picker does honor them.
:::

---

### Unselectable Times

Skip times that match a predicate. Blocked values render dimmed in the wheel so the constraint is visible, the per-item button gets the `disabled` attribute (so clicks no-op), and keyboard / wheel scrolling automatically advances past them via the `nextValid` lookahead. The disabled state is dynamic — it's evaluated against the _other_ columns' current values, so e.g. a predicate that blocks only `12:00–12:59` leaves all minutes enabled once the user moves the hour off 12.

```tsx live
function example() {
  const v = new Date();
  v.setHours(11, 30, 0, 0);
  return (
    <TimeInput
      label="Lunch hour blocked"
      unselectableTimes={d => d.getHours() === 12}
      defaultValue={v}
      mobileNative={false}
    />
  );
}
```

:::note Forced to the custom wheel
HTML has no predicate equivalent, so the OS-native pickers can't block any times. This example forces `mobileNative={false}` so the rule works on touch devices; in your app keep `mobileNative="auto"` and also validate in `onChange`.
:::

---

### Manual Keyboard Entry

Focus the input — the **hours** segment highlights automatically and the keyboard alone can drive the full time entry without ever opening the popover. Segment mode activates whenever the `format` is a token string with padded tokens (`HH`, `hh`, `mm`, `ss`, `A`, `a`); custom `Intl.DateTimeFormatOptions` formats and unpadded tokens (`H`, `h`, `m`, `s`) fall back to free-form text entry.

These examples use `openOnFocus={false}` so the popover doesn't cover the input — set `openOnFocus={true}` (the default) and both UIs coexist. To turn segment typing off entirely, pass `editable={false}` (picker-only); to drop the popover and keep only the field, pass `popover={false}` (input-only).

:::tip Opening the picker vs. typing
With `openOnFocus={false}` (used here), **clicking the field just lets you type** — the popover does not appear on focus or click. Open the picker by clicking the **launcher icon on the right** (or pressing `↓`). With the default `openOnFocus={true}`, focusing or clicking the field opens the popover immediately (you can still type while it's open).
:::

#### Basic

Click into the field, then press `↑` / `↓` to change the hours, `→` to move to minutes, and continue.

```tsx live
function example() {
  const v = new Date();
  v.setHours(13, 45, 0, 0);
  return (
    <TimeInput
      label="Click in, then use arrow keys"
      defaultValue={v}
      openOnFocus={false}
    />
  );
}
```

---

#### With AM/PM

Move to the meridiem segment with `→` (or click it). Press `a` to set AM, `p` to set PM — the segment auto-advances afterward.

```tsx live
function example() {
  const v = new Date();
  v.setHours(13, 45, 0, 0);
  return (
    <TimeInput
      label="Press a / A / p / P on AM-PM"
      hourFormat="12"
      defaultValue={v}
      openOnFocus={false}
    />
  );
}
```

---

#### With Seconds

Three editable segments (hours, minutes, seconds). `→` cycles through them in order.

```tsx live
function example() {
  const v = new Date();
  v.setHours(10, 20, 30, 0);
  return (
    <TimeInput
      label="Tab through hours / minutes / seconds"
      enableSeconds
      defaultValue={v}
      openOnFocus={false}
    />
  );
}
```

---

#### Digit entry and auto-advance

Type digits to overwrite the active segment. The picker auto-advances when no further digit could form a valid value — for 24-hour hours, typing `5` advances immediately (no `50–59` to wait for), but typing `2` waits for an optional second digit (`20`–`23` are still valid). Minutes/seconds advance after any digit `6`–`9`, since `60`+ is out of range.

```tsx live
function example() {
  const v = new Date();
  v.setHours(9, 0, 0, 0);
  return (
    <TimeInput
      label="Type digits — auto-advance after each segment"
      defaultValue={v}
      openOnFocus={false}
    />
  );
}
```

---

#### Controlled with live value

The value updates on every increment, digit, or AM/PM toggle — exactly like the wheel popover. Bind to `useState` to see it.

```tsx live
function example() {
  const [v, setV] = useState(() => {
    const d = new Date();
    d.setHours(13, 45, 0, 0);
    return d;
  });
  return (
    <Block>
      <TimeInput
        label="Arrow or type — value updates live"
        value={v}
        onChange={setV}
        openOnFocus={false}
      />
      <Paragraph mt="2">Selected: {v ? v.toLocaleTimeString() : '—'}</Paragraph>
    </Block>
  );
}
```

---

#### Free-form fallback

When `format` is an `Intl.DateTimeFormatOptions` object (or uses unpadded tokens like `H:m`), segment mode silently disables — focusing the input does not highlight a segment, arrow keys fall through to default behavior, and the input parses on blur instead.

```tsx live
function example() {
  const v = new Date();
  v.setHours(13, 45, 0, 0);
  return (
    <TimeInput
      label="Free-form (Intl format)"
      format={{ hour: '2-digit', minute: '2-digit' }}
      defaultValue={v}
      openOnFocus={false}
    />
  );
}
```

---

### Haptic-feel Feedback (audio tick + band pulse)

The custom-wheel popover fires three kinds of feedback per item crossing to make the picker feel tactile across platforms:

- **Haptic (Android only)** — `navigator.vibrate(5)` fires unconditionally on Android Chrome / Firefox Android / Samsung Internet. iOS Safari does not expose `navigator.vibrate`, and Apple patched the `<input type="checkbox" switch>` workaround in iOS 26.5 — there is no longer any web-only path to the Taptic Engine.
- **Audio thunk (opt-in via `audioTick`)** — a 160 Hz triangle-wave tone sweeping down to 110 Hz over ~30 ms. The low fundamental and downward pitch sweep are tuned to read as a body-felt thump rather than an ear-felt beep, matching the proprioceptive signature of native Taptic UI pops.
- **Visual band pulse (always-on)** — the selection band briefly scales (`1 → 1.04 → 1`) and brightens (`× 1.15`) over 110 ms on every tick. Single-element Web Animations API call with `composite: 'replace'` so rapid fling ticks restart cleanly. Respects `prefers-reduced-motion: reduce`.

```tsx live
function example() {
  const v = new Date();
  v.setHours(9, 30, 0, 0);
  return (
    <TimeInput
      label="Audio thunk + band pulse"
      audioTick
      mobileNative={false}
      defaultValue={v}
    />
  );
}
```

For a single switch that picks the right feedback per platform automatically — vibrate on Android, audio thunk on iOS — use `haptics` instead of `audioTick`:

```tsx live
function example() {
  const v = new Date();
  v.setHours(9, 30, 0, 0);
  return (
    <TimeInput
      label="Auto-routed haptics"
      haptics
      mobileNative={false}
      defaultValue={v}
    />
  );
}
```

`haptics` feature-detects `navigator.vibrate` rather than UA-sniffing. On Android (vibrate present), no audio is layered on top of the real haptic; on iOS (vibrate absent), the audio thunk fills in.

:::note Behaviour details

- `audioTick` is off by default; opt in per-instance.
- Android still fires haptic via `navigator.vibrate` independently — enabling `audioTick` adds the audible thunk on top.
- The visual band pulse is always-on and gated only by `prefers-reduced-motion`; no prop needed.
- The first wheel touch unlocks the `AudioContext` (Web Audio's gesture requirement); subsequent ticks play with no further user action.
- The iPhone silent switch (and Android system volume) suppress the tick audio — matching native UX expectations.
- Native iOS wrappers (Capacitor, React Native + WebView) can bridge to `UIImpactFeedbackGenerator` for real Taptic feedback; the audio thunk + visual pulse together are the closest pure-web equivalent.
  :::

---

### Inline

Render the spinner directly without a popover.

```tsx live
function example() {
  const v = new Date();
  v.setHours(8, 30, 0, 0);
  return <TimeInput label="Inline" inline defaultValue={v} />;
}
```

---

### Mobile Native

By default `mobileNative='auto'`: on touch devices with a small viewport (`(pointer: coarse)` and `(max-width: 768px)`) the input swaps to a plain `<input type="time">` so the OS-native time picker handles the interaction. On desktop the custom wheel popover renders. Pass `true` or `false` to override the auto-detection.

:::caution Native picker support varies — iOS lags Android
The OS-native fallback is just a `<input type="time">`, so it inherits each platform's behavior. The custom wheel popover (`mobileNative={false}`) honors every prop on every device.

**Honored on Android Chrome but NOT on iOS Safari:**

- **`min` / `max`** — Android dims out-of-range times in the wheel; iOS lets the user spin to any value, only firing the constraint at form-submission validation. ([WebKit bug #225639](https://bugs.webkit.org/show_bug.cgi?id=225639), still open as of 2026.)
- **`incrementMinutes`, `incrementHours`, `incrementSeconds`** — Android Chrome respects `step` (e.g. only 0/15/30/45 minutes selectable when `step=900`). iOS shows every value regardless.
- **`enableSeconds`** — Android Chrome shows a seconds spinner when `step < 60`. iOS has no seconds wheel under any circumstances.

**Ignored on BOTH iOS Safari and Android Chrome (HTML-spec gaps):**

- **`unselectableTimes`** — HTML has no predicate equivalent; native pickers can't evaluate functions.
- **`hourFormat`** — both use the device's system clock setting (12h/24h).
- **`format`, `locale`** — both use the device's system locale; per-input overrides are ignored.
- **`placeholder`** — neither renders placeholder text on time inputs.

If any of these matter, pass `mobileNative={false}` to force the custom wheel popover (works on every device), or duplicate the constraint in `onChange` / server-side validation.
:::

#### Force native

```tsx live
<TimeInput label="Always native" mobileNative={true} />
```

#### Force the custom wheel (even on mobile)

Useful when you want the same wheel UI everywhere — for example, if your app already provides a touch-friendly viewport-sized picker.

```tsx live
<TimeInput label="Always custom wheel" mobileNative={false} />
```

---

### Formats

The `format` prop takes a token string or `Intl.DateTimeFormatOptions`. The same time rendered several ways:

```tsx live
function example() {
  const v = new Date();
  v.setHours(13, 45, 30, 0);
  return (
    <Block display="flex" flexDirection="column" gap="4">
      <TimeInput label="HH:mm (24h, default)" defaultValue={v} />
      <TimeInput label="hh:mm A (12h)" format="hh:mm A" defaultValue={v} />
      <TimeInput
        label="hh:mm a (lowercase)"
        format="hh:mm a"
        defaultValue={v}
      />
      <TimeInput label="HH:mm:ss" format="HH:mm:ss" defaultValue={v} />
      <TimeInput label="hh:mm:ss A" format="hh:mm:ss A" defaultValue={v} />
    </Block>
  );
}
```

Padded token formats support segmented typing; the meridiem (`A`/`a`) and seconds (`ss`) segments appear when the format includes them. Token formats render the same regardless of `locale`; pass an `Intl.DateTimeFormatOptions` object for locale-aware output (display-only unless you add a custom `parse`).

```tsx live
function example() {
  const v = new Date();
  v.setHours(13, 45, 0, 0);
  return (
    <TimeInput
      label="Intl, fr-FR (display only)"
      format={{ hour: '2-digit', minute: '2-digit' }}
      locale="fr-FR"
      editable={false}
      defaultValue={v}
      mobileNative={false}
    />
  );
}
```

:::note Forced to the custom wheel
`format` and `locale` are ignored by the OS-native pickers (they use the device locale). This example forces `mobileNative={false}` so the locale-aware display shows on touch devices too.
:::

---

### Launcher Icon

A clickable launcher sits on the **right** and toggles the popover — handy for input-mode (`openOnFocus={false}`) where you type the value and click the icon to open the spinner. Override its glyph with `triggerIconName`, or hide it with `triggerIcon={false}` (the popover still opens on focus / click). The decorative **left** icon is independent: it shows by default, takes its glyph from `iconLeftName`, and is hidden with `iconLeftName=""`.

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <TimeInput label="Default (left icon + right launcher)" />
  <TimeInput label="Custom launcher glyph" triggerIconName="hourglass" />
  <TimeInput label="No launcher" triggerIcon={false} />
  <TimeInput label="Left icon hidden" iconLeftName="" />
</Block>
```

---

### Sizes

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <TimeInput label="Small" controlSize="small" size="small" />
  <TimeInput label="Default" />
  <TimeInput label="Medium" controlSize="medium" size="medium" />
  <TimeInput label="Large" controlSize="large" size="large" />
</Block>
```

---

### Colors

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <TimeInput label="Primary" color="primary" />
  <TimeInput label="Info" color="info" />
  <TimeInput label="Success" color="success" />
  <TimeInput label="Warning" color="warning" />
  <TimeInput label="Danger" color="danger" />
</Block>
```

---

### States

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <TimeInput label="Disabled" disabled />
  <TimeInput label="Read only" readOnly defaultValue={new Date()} />
  <TimeInput label="Loading" isLoading />
</Block>
```

---

### Context-Aware Rendering

The `TimeInput` component is context-aware: it detects whether it is already inside a `Field` and adjusts its rendering accordingly.

#### Default (with label)

```tsx live
<TimeInput label="Time" placeholder="HH:MM" />
```

---

#### With Field Wrapper

```tsx live
function example() {
  return (
    <Field horizontal label="Time">
      <Field.Body>
        <Field>
          <TimeInput placeholder="HH:MM" />
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
    <Field horizontal label="Time">
      <Field.Body>
        <Field>
          <Control iconLeftName="clock">
            <TimeInput placeholder="HH:MM" />
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

Focus the input — the **hours** segment is automatically highlighted. Segment mode activates whenever the `format` is a token string with padded tokens (`HH`, `hh`, `mm`, `ss`, `A`, `a`); Intl-options formats and variable-width tokens (`H`, `h`, `m`, `s`) fall back to free-form text entry.

| Key                   | Action                                                                         |
| --------------------- | ------------------------------------------------------------------------------ |
| `↑` / `↓`             | Increment / decrement the active segment (wraps at boundaries)                 |
| `←` / `→`             | Move to previous / next segment (hour ↔ minute ↔ second ↔ AM/PM)               |
| `0`–`9`               | Overwrite the active segment; auto-advances when no further digit is valid     |
| `a` / `A` / `p` / `P` | Toggle AM/PM on the meridiem segment                                           |
| `Backspace`           | Clear the typed-digit buffer; if already cleared, move to the previous segment |
| `Tab`                 | Clear segment selection so focus moves out naturally                           |
| `Escape`              | Close popover                                                                  |
| `Enter`               | Close popover when `closeOnSelect={true}` (value is already committed live)    |

### On a wheel column (when the popover is open)

| Key                   | Action                               |
| --------------------- | ------------------------------------ |
| `↑` / `↓`             | Increment / decrement focused column |
| `PageUp` / `PageDown` | Increment / decrement by 5×          |
| `Tab`                 | Move focus to next column            |
| `Enter`               | Commit live value, close popover     |

---

## Form Submission

`TimeInput` participates in HTML form submission. Pass a `name` and the value is forwarded as `HH:MM` (or `HH:MM:SS` if `enableSeconds`).

| Prop       | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| `name`     | Form field name.                                             |
| `form`     | Optional id of the form the input belongs to.                |
| `required` | Marks the field as required for native HTML form validation. |

```tsx live
function TimeInputFormDemo() {
  const [submitted, setSubmitted] = React.useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
      }}
    >
      <TimeInput name="appointment" label="Appointment time" required />
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
- Each spinner column has `role="spinbutton"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext`.
- AM/PM toggle exposes `aria-pressed`.
- Honors `prefers-reduced-motion`.

---

## Related Components

- [DateInput](./dateinput.md) - Date-only picker with a calendar popover.
- [DateTimeInput](./datetimeinput.md) - Combined date + time picker.
- [Input](./input.md) - For basic text input.

---

## Additional Resources

- [Storybook: TimeInput Stories](https://bestax.io/storybook/?path=/story/form-timeinput)

:::tip Pro Tip
Combine `incrementMinutes={5}` (or `15`/`30`) with `min` and `max` to build a tight slot picker — the spinner will only land on valid slots.
:::
