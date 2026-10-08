---
title: DateRangeInput
sidebar_label: DateRangeInput
description: The `DateRangeInput` component is a form input for a start and end date, picked from one popover calendar or typed into two segmented inputs.
---

# DateRangeInput

## Overview

<!-- bestax:generated overview -->

The `DateRangeInput` component is a form input for a start and end date, picked from one popover calendar or typed into two segmented inputs.

<!-- /bestax:generated overview -->

It is built on the same calendar, popover and segmented typing as [`DateInput`](./dateinput.md), so a stay, a report period or a leave request needs no second input and no hand-rolled check that the end isn't before the start. The calendar picks the start and then the end, previewing the range as you move toward the end, and the range stays ordered whichever way it was entered. `min`, `max` and the disabled-date props apply to both ends, a range can't cross a disabled day unless you allow it, and the range submits with a form as two dates.

---

## Import

<!-- bestax:generated import -->

```tsx
import { DateRangeInput } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic DateRangeInput

Click either input to open the calendar, pick the first day, then the last. Hover a day, or move to it with the arrow keys, to preview the range before you pick it.

```tsx live
function example() {
  return <DateRangeInput label="Stay" placeholder="YYYY-MM-DD" />;
}
```

---

### Controlled

The value is a `[start, end]` pair, and either end can be `null`. The calendar reports a range once it has both ends. Typing reports each end as it changes, so a range typed halfway arrives as `[start, null]`.

```tsx live
function ControlledRange() {
  const [range, setRange] = React.useState([null, null]);
  const [start, end] = range;
  return (
    <Block>
      <DateRangeInput label="Report period" value={range} onChange={setRange} />
      <Paragraph>
        {start ? start.toDateString() : 'No start'} to{' '}
        {end ? end.toDateString() : 'no end'}
      </Paragraph>
      <Button size="small" onClick={() => setRange([null, null])}>
        Clear
      </Button>
    </Block>
  );
}
```

---

### Inline

Render the calendar on the page instead of in a popover. There are no inputs, and the form value still submits.

```tsx live
<DateRangeInput label="Stay" inline name="stay" />
```

---

### Min and Max

`min` and `max` bound both ends, in the calendar and as you type.

```tsx live
function NextMonth() {
  const today = new Date();
  const inAMonth = new Date();
  inAMonth.setMonth(inAMonth.getMonth() + 1);
  return (
    <DateRangeInput label="Within the next month" min={today} max={inAMonth} />
  );
}
```

---

### Disabled Dates

`shouldDisableDate` and `unselectableDates` disable days for both ends. By default a range can't include a disabled day either. In the calendar, a pick that can't end the range starts a new one: a day before the start, or one past a disabled day. Typing refuses such an end, and a start typed past the end, or with a disabled day before it, clears the end.

`allowDisabledInRange` lets a range cross disabled days, for cases such as a stay over a night with no check-ins. Its ends still can't be disabled days.

```tsx live
function Weekdays() {
  const weekend = d => d.getDay() === 0 || d.getDay() === 6;
  return (
    <Block>
      <DateRangeInput label="Weekdays only" shouldDisableDate={weekend} />
      <DateRangeInput
        label="Over weekends"
        shouldDisableDate={weekend}
        allowDisabledInRange
      />
    </Block>
  );
}
```

---

### Typing the Dates

Each input has the segmented entry `DateInput` has. With `openOnFocus={false}` the inputs are for typing, `Tab` moves from the start input to the end input, and the launcher or `Alt+↓` opens the calendar; `Alt+↑` closes it. An empty end starts from the start date, so you only type what differs.

```tsx live
<DateRangeInput
  label="Type the dates"
  openOnFocus={false}
  placeholder="YYYY-MM-DD"
/>
```

---

### Format and Locale

`format`, `parse` and `locale` work as they do on `DateInput`, for both inputs. The `labels` keys `rangeStart` and `rangeEnd` name the inputs and the range's ends in the calendar, `rangePreviewEnd` describes the day a pending range would end on, `rangeSeparator` is the text between the inputs, and `chooseDateRange` names the launcher.

```tsx live
<DateRangeInput
  label="Séjour"
  locale="fr-FR"
  firstDayOfWeek={1}
  format="DD/MM/YYYY"
  labels={{
    rangeStart: 'Arrivée',
    rangeEnd: 'Départ',
    rangePreviewEnd: 'Choisir comme départ',
    rangeSeparator: 'au',
    chooseDateRange: 'Choisir les dates',
  }}
/>
```

---

### Mobile Native

With `mobileNative` (`'auto'` by default) a touch device with a small screen gets two native `<input type="date">`s. The end input's `min` follows the start, and a change is held to the same rules as typing. Pass `true` to force them, or `false` to keep the calendar.

```tsx live
<DateRangeInput label="Stay" mobileNative />
```

---

### Sizes and Colors

`size` and `color` style the field, and `color` also fills the range's ends in the calendar and tints the band between them.

```tsx live
<Block>
  <DateRangeInput label="Small" size="small" controlSize="small" />
  <DateRangeInput label="Success" color="success" />
  <DateRangeInput label="Large" size="large" controlSize="large" />
</Block>
```

---

### Context-Aware Rendering

Like the other form inputs, `DateRangeInput` renders its own `Field` and `Control` unless it is already inside one.

```tsx live
<Field label="Leave">
  <Control iconLeftName="calendar-alt">
    <DateRangeInput />
  </Control>
</Field>
```

Inside a `Control`, `DateRangeInput` renders no `Control` of its own, so the props it would hand one, such as `isLoading`, the icon props, `controlSize` and `controlClassName`, do nothing there and warn in development. Set them on that `Control` instead, as `iconLeftName` is above. Its default left icon is left out there too, without a warning, since you did not set it. An `inline` picker renders no `Control` anywhere, so these props do nothing on it inside a `Control` or out, and it warns about them too.

---

## Keyboard Navigation

### On the inputs

Each input takes the keys of [`DateInput`'s segmented entry](./dateinput.md#on-the-input-segmented-entry), so `Alt+↓` opens the popover and `Alt+↑` closes it. Moving between the inputs leaves the popover as it is; arriving in the field opens it under `openOnFocus`, and so does a click on either input.

### On the calendar

Movement is the same as on `DateInput`'s calendar. Picking takes two steps.

| Key                   | Action                                                                       |
| --------------------- | ---------------------------------------------------------------------------- |
| `Enter` / `Space`     | Set the start, then the end. A day that can't end the range starts a new one |
| `Escape`              | Take back a start picked in the calendar; with none, close the popover       |
| `Alt+↑`               | Close the popover                                                            |
| `←` / `→`             | Move focus by ±1 day, moving the preview with it                             |
| `↑` / `↓`             | Move focus by ±1 week                                                        |
| `PageUp` / `PageDown` | Move focus by ±1 month                                                       |
| `Shift+PageUp/Down`   | Move focus by ±1 year                                                        |
| `Home` / `End`        | Jump to the start / end of the week                                          |

A start picked in the calendar stays while you change month or year, so the end can be in another month. When the range has a start and no end, the calendar opens with that start already picked and the next pick sets the end. That start came from the value rather than from a pick, so `Escape` closes the popover.

---

## Form Submission

Give it a `name` and two hidden inputs submit the range as `YYYY-MM-DD`, named `name[start]` and `name[end]`. They are there in every mode: popover, inline and native. Rails, PHP and `qs` read those names as a nested object, and `FormData` has them as two entries. `startName` and `endName` name either one yourself. The visible inputs carry no name, so the displayed text never submits.

| Prop        | Description                                                                  |
| ----------- | ---------------------------------------------------------------------------- |
| `name`      | Names the hidden inputs `name[start]` and `name[end]`.                       |
| `startName` | Name of the hidden input carrying the start, in place of `name[start]`.      |
| `endName`   | Name of the hidden input carrying the end, in place of `name[end]`.          |
| `form`      | Id of the form the hidden inputs belong to.                                  |
| `required`  | Marks both visible inputs required. An inline calendar has no input to mark. |

```tsx live
function RangeFormDemo() {
  const [submitted, setSubmitted] = React.useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setSubmitted(JSON.stringify(Array.from(data.entries()), null, 2));
      }}
    >
      <DateRangeInput label="Stay" name="stay" required />
      <Button type="submit" color="primary">
        Submit
      </Button>
      {submitted && <Pre mt="3">{submitted}</Pre>}
    </form>
  );
}
```

---

## Accessibility

- The root is a `role="group"` named by `label` through `aria-labelledby`, since the label names two inputs rather than one. Inside a labeled `Field`, that `Field`'s label names the group the same way, unless you give it an `aria-label` or `aria-labelledby` of your own.
- Each input is a `role="combobox"` with `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`, and its own name: "Start date" or "End date", from the `labels` keys `rangeStart` and `rangeEnd`. The separator between them is hidden from assistive technology.
- The popover is a `role="dialog"` named "Choose date range" (`labels.chooseDateRange`). Opening it puts focus on the calendar's focused day, and closing it returns focus to the input you were last in, or to the start input.
- The day grid is `aria-multiselectable`, and its days sit in a `role="row"` per week. Every day of the range is `aria-selected`, both ends included. While the end is still being picked, only the start is: the preview is not a selection.
- The start and end days are described as "Start date" and "End date", so moving onto either says which it is. While the end is still being picked, the day the range would end on is described as "Choose as end date" (`labels.rangePreviewEnd`).
- A polite live region in the calendar states the range in words, such as "Start date: June 10, 2024, End date: June 13, 2024", and announces each pick. The grid points at it too, so moving into the grid reads the current range.
- Everything else is the calendar `DateInput` uses: a roving `tabindex`, `aria-disabled` on disabled days and `aria-current="date"` on today.

---

## Related Components

- [DateInput](./dateinput.md) - A single date, month or year.
- [DateTimeInput](./datetimeinput.md) - A date and a time of day.
- [Field](../field.md) - Label, help text and layout for any input.

---

## Additional Resources

- [Storybook: DateRangeInput Stories](https://bestax.io/storybook/?path=/story/form-daterangeinput)

---

## Props

<!-- bestax:generated props -->

| Prop                   | Type                                                                             | Default          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `label`                | `React.ReactNode`                                                                | —                | Field label naming the whole range. Associated through `aria-labelledby` on the `role="group"` root, since it names two inputs rather than one; uses your `labelProps.id` when provided, otherwise a generated one. Each input keeps its own name, "Start date" or "End date" (`labels.rangeStart` / `labels.rangeEnd`). Dropped inside an outer `Field`, whose own label names the group instead through `aria-labelledby` when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`) and you set no `aria-label` or `aria-labelledby` on the group. |
| `labelSize`            | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                               | —                | Size for the label.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `labelProps`           | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`      | —                | Props for the label element. An `htmlFor` here is dropped, since the label names the group rather than one input.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `horizontal`           | `boolean`                                                                        | `false`          | Render the field with horizontal layout.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `iconLeft`             | `IconProps` \| `React.ReactNode`                                                 | —                | Icon props for the left icon. Bulma gives control icons `pointer-events: none`, so a clickable node here never receives a click. Put a button beside the field in its own addon `Control` instead.                                                                                                                                                                                                                                                                                                                                                                                               |
| `iconRight`            | `IconProps` \| `React.ReactNode`                                                 | —                | Icon props for the right icon. Bulma gives control icons `pointer-events: none`, so a clickable node here never receives a click. Put a button beside the field in its own addon `Control` instead.                                                                                                                                                                                                                                                                                                                                                                                              |
| `iconRightName`        | `string`                                                                         | —                | Shortcut for the right icon name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `iconLeftSize`         | `'small'` \| `'medium'` \| `'large'`                                             | —                | Shortcut for left icon size.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `iconRightSize`        | `'small'` \| `'medium'` \| `'large'`                                             | —                | Shortcut for right icon size.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `hasIconsLeft`         | `boolean`                                                                        | `false`          | Force the left icon container.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `hasIconsRight`        | `boolean`                                                                        | `false`          | Force the right icon container.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `isLoading`            | `boolean`                                                                        | `false`          | Shows a loading spinner on the `Control` it renders, and hides the launcher (`triggerIcon`) while it does. Inside your own `Control` it renders none, so this draws nothing and warns in development; set `isLoading` on that `Control`.                                                                                                                                                                                                                                                                                                                                                         |
| `triggerIcon`          | `boolean`                                                                        | `true`           | Show a clickable launcher button on the right that toggles the popover. Hidden by default while a spinner shows at the same right edge: this component's `isLoading` when it renders its own `Control`, or the enclosing `Control`'s `isLoading` inside one.                                                                                                                                                                                                                                                                                                                                     |
| `isExpanded`           | `boolean`                                                                        | `false`          | Expand the control to fill its container.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `controlSize`          | `'small'` \| `'medium'` \| `'large'`                                             | —                | Size of the wrapping Control.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `message`              | `React.ReactNode`                                                                | —                | Help/validation text below the field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `messageColor`         | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`  | —                | Color modifier for the help message.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `fieldClassName`       | `string`                                                                         | —                | Additional CSS classes for the Field wrapper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `controlClassName`     | `string`                                                                         | —                | Additional CSS classes for the Control wrapper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `value`                | `DateRangeValue`                                                                 | —                | Controlled range, start first. Either end may be `null`, and `[null, null]` is empty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `defaultValue`         | `DateRangeValue`                                                                 | —                | Initial range for uncontrolled usage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `onChange`             | `(range: DateRangeValue) => void`                                                | —                | Fired when the range changes, with the start first. Typing commits one end at a time, so a range half typed arrives as `[start, null]`. The calendar commits only a finished range: its first pick marks the start inside the calendar and its second commits both ends in one call. The range stays ordered, so the end is never before the start.                                                                                                                                                                                                                                              |
| `onOpen`               | `() => void`                                                                     | —                | Fired when the popover opens.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `onClose`              | `() => void`                                                                     | —                | Fired when the popover closes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `min`                  | `Date`                                                                           | —                | Earliest selectable date, for either end. A `min` before year 1 is raised to 1 January of year 1, where the range starts without one too.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `max`                  | `Date`                                                                           | —                | Latest selectable date, for either end.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `disabled`             | `boolean`                                                                        | `false`          | Disable both inputs and the launcher.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `readOnly`             | `boolean`                                                                        | `false`          | Make both inputs read-only and keep the popover closed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `placeholder`          | `string`                                                                         | —                | Placeholder text, shown in both inputs while they are empty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `format`               | `Intl.DateTimeFormatOptions` \| `string`                                         | `'YYYY-MM-DD'`   | Token format string or `Intl.DateTimeFormat` options, used by both inputs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `parse`                | `(s: string) => Date \| null`                                                    | —                | Custom parser (use when `format` is `Intl.DateTimeFormatOptions`). Enter and leaving an input call it only if the user changed its text.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `locale`               | `string`                                                                         | —                | BCP-47 locale tag for day/month names and Intl formatting.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `inline`               | `boolean`                                                                        | `false`          | Render the calendar inline, with no inputs and no popover. The hidden form inputs still carry the range.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `mobileNative`         | `boolean` \| `'auto'`                                                            | `'auto'`         | Use two native `<input type="date">`s on coarse-pointer, small-viewport devices (`'auto'`), always (`true`) or never (`false`). The end input's `min` follows the start, and a change goes through the same rules as typing.                                                                                                                                                                                                                                                                                                                                                                     |
| `editable`             | `boolean`                                                                        | `true`           | Allow segmented keyboard typing in both inputs. `false` makes the field picker-only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `popover`              | `boolean`                                                                        | `true`           | Whether the calendar popover exists. `false` makes the field input-only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `openOnFocus`          | `boolean`                                                                        | `true`           | Open the popover when focus arrives in the field. Moving focus between the two inputs, or back from the launcher, leaves it closed, and so does the focus a closing popover hands back. A click on either input opens it. With it off, the launcher or Alt+ArrowDown opens it.                                                                                                                                                                                                                                                                                                                   |
| `closeOnSelect`        | `boolean`                                                                        | `true`           | Close the popover once the range is picked. The first pick, which only marks the start, never closes it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `position`             | `'bottom-left'` \| `'bottom-right'` \| `'top-left'` \| `'top-right'` \| `'auto'` | `'bottom-left'`  | Popover anchor position relative to the field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `appendToBody`         | `boolean`                                                                        | `false`          | Render the popover into `document.body` via portal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `color`                | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`  | —                | Bulma color modifier for the field, also carried by the calendar, where it colors the range's ends and the band between them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `size`                 | `'small'` \| `'medium'` \| `'large'`                                             | —                | Size variant.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `isRounded`            | `boolean`                                                                        | `false`          | Render the field with rounded corners.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `shouldDisableDate`    | `(d: Date) => boolean`                                                           | —                | Predicate to disable specific dates (e.g. weekends). A disabled day can be neither end, typing rejects it, and a range can't include one unless `allowDisabledInRange` is set.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `unselectableDates`    | `Date[]`                                                                         | —                | Convenience array of disabled dates; merged with `shouldDisableDate`. Matched by calendar day.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `allowDisabledInRange` | `boolean`                                                                        | `false`          | Let a range include days that `shouldDisableDate` or `unselectableDates` disable, such as a stay over a night with no check-ins. Its ends still can't be such days. Off, a pick in the calendar past a disabled day starts a new range there, typing refuses an end past one, and a start typed with one before the end clears the end. Finding one walks the days between, so off, a span too long to walk is refused as well.                                                                                                                                                                  |
| `firstDayOfWeek`       | `0` \| `1` \| `2` \| `3` \| `4` \| `5` \| `6`                                    | `0`              | Day the week starts on (0 = Sunday).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `dayNames`             | `string[]`                                                                       | —                | Override the 7 day-name labels (in calendar order, post-rotation).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `monthNames`           | `string[]`                                                                       | —                | Override the 12 month-name labels.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `nearbyMonthDays`      | `boolean`                                                                        | `true`           | Show dimmed dates from adjacent months in the grid.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `iconLeftName`         | `string`                                                                         | `'calendar'`     | Decorative left icon glyph for the wrapping `Control` (shown by default). Set `''` to hide.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `triggerIconName`      | `string`                                                                         | `'chevron-down'` | Glyph for the right launcher button.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `labels`               | `PickerLabels`                                                                   | —                | Optional translatable string overrides. `rangeStart` and `rangeEnd` name the two inputs and the range's ends in the calendar, `rangePreviewEnd` describes the day a pending range would end on, `rangeSeparator` sits between the inputs, and `chooseDateRange` names the launcher and the popover.                                                                                                                                                                                                                                                                                              |
| `name`                 | `string`                                                                         | —                | Form field name. Two hidden inputs submit the range as `YYYY-MM-DD`, named `name[start]` and `name[end]`, in every mode. The visible inputs carry no name.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `startName`            | `string`                                                                         | —                | Name of the hidden input carrying the start, in place of `name[start]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `endName`              | `string`                                                                         | —                | Name of the hidden input carrying the end, in place of `name[end]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `form`                 | `string`                                                                         | —                | Form id the hidden inputs belong to.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `required`             | `boolean`                                                                        | `false`          | Mark both visible inputs required, so a form won't submit with either end empty. An `inline` calendar has no visible input, so it is not checked there.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `id`                   | `string`                                                                         | —                | Id of the start input. The end input takes `${id}-end`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `className`            | `string`                                                                         | —                | Additional CSS classes for the root, the `role="group"` that holds the two inputs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `ref`                  | `React.Ref<HTMLInputElement>`                                                    | —                | Forwarded to the start `<input>`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `...`                  | All standard `<div>` attributes and Bulma helper props                           | —                | See [Helper Props](../../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`DateRangeInput` registers these variables on its own `.daterangeinput` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../../helpers/theme.md).

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
| `--bulma-dateinput-cell-range-bg` ‡           | `$dateinput-cell-range-bg`           | `color-mix(in srgb, var(--bulma-dateinput-cell-selected-bg) 18%, transparent)`                                           |
| `--bulma-dateinput-cell-range-preview-bg` ‡   | `$dateinput-cell-range-preview-bg`   | `color-mix(in srgb, var(--bulma-dateinput-cell-selected-bg) 9%, transparent)`                                            |
| `--bulma-daterangeinput-gap`                  | `$daterangeinput-gap`                | `0.5em`                                                                                                                  |
| `--bulma-daterangeinput-separator-color`      | `$daterangeinput-separator-color`    | `var(--bulma-text-weak)`                                                                                                 |
| `--bulma-picker-popover-z-index` ‡            | `$picker-popover-z-index`            | `30`                                                                                                                     |
| `--bulma-picker-popover-background` ‡         | `$picker-popover-background`         | `var(--bulma-scheme-main)`                                                                                               |
| `--bulma-picker-popover-radius` ‡             | `$picker-popover-radius`             | `var(--bulma-radius-large)`                                                                                              |
| `--bulma-picker-popover-shadow` ‡             | `$picker-popover-shadow`             | `0 8px 24px hsla(0, 0%, 0%, 0.18)`                                                                                       |
| `--bulma-picker-popover-border-color` ‡       | `$picker-popover-border-color`       | `var(--bulma-border)`                                                                                                    |
| `--bulma-picker-popover-padding` ‡            | `$picker-popover-padding`            | `0.75rem`                                                                                                                |
| `--bulma-picker-popover-offset` ‡             | `$picker-popover-offset`             | `4px`                                                                                                                    |
| `--bulma-picker-popover-animation-duration` ‡ | `$picker-popover-animation-duration` | `0.15s`                                                                                                                  |
| `--bulma-input-h` ‡                           | `$input-h`                           | `var(--bulma-scheme-h)`                                                                                                  |
| `--bulma-input-s` ‡                           | `$input-s`                           | `var(--bulma-scheme-s)`                                                                                                  |
| `--bulma-input-l` ‡                           | `$input-l`                           | `var(--bulma-scheme-main-l)`                                                                                             |
| `--bulma-input-border-style` ‡                | `$input-border-style`                | `solid`                                                                                                                  |
| `--bulma-input-border-width` ‡                | `$input-border-width`                | `var(--bulma-control-border-width)`                                                                                      |
| `--bulma-input-border-l` ‡                    | `$input-border-l`                    | `var(--bulma-border-l)`                                                                                                  |
| `--bulma-input-border-l-delta` ‡              | `$input-border-l-delta`              | `0%`                                                                                                                     |
| `--bulma-input-border-color` ‡                | `$input-border-color`                | `hsl(var(--bulma-input-h), var(--bulma-input-s), calc(var(--bulma-input-border-l) + var(--bulma-input-border-l-delta)))` |
| `--bulma-input-hover-border-l-delta` ‡        | `$input-hover-border-l-delta`        | `var(--bulma-hover-border-l-delta)`                                                                                      |
| `--bulma-input-active-border-l-delta` ‡       | `$input-active-border-l-delta`       | `var(--bulma-active-border-l-delta)`                                                                                     |
| `--bulma-input-focus-h` ‡                     | `$input-focus-h`                     | `var(--bulma-focus-h)`                                                                                                   |
| `--bulma-input-focus-s` ‡                     | `$input-focus-s`                     | `var(--bulma-focus-s)`                                                                                                   |
| `--bulma-input-focus-l` ‡                     | `$input-focus-l`                     | `var(--bulma-focus-l)`                                                                                                   |
| `--bulma-input-focus-shadow-size` ‡           | `$input-focus-shadow-size`           | `var(--bulma-focus-shadow-size)`                                                                                         |
| `--bulma-input-focus-shadow-alpha` ‡          | `$input-focus-shadow-alpha`          | `var(--bulma-focus-shadow-alpha)`                                                                                        |
| `--bulma-input-color-l` ‡                     | `$input-color-l`                     | `var(--bulma-text-strong-l)`                                                                                             |
| `--bulma-input-background-l` ‡                | `$input-background-l`                | `var(--bulma-scheme-main-l)`                                                                                             |
| `--bulma-input-background-l-delta` ‡          | `$input-background-l-delta`          | `0%`                                                                                                                     |
| `--bulma-input-height` ‡                      | `$input-height`                      | `var(--bulma-control-height)`                                                                                            |
| `--bulma-input-shadow` ‡                      | `$input-shadow`                      | `inset 0 0.0625em 0.125em hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.05)`        |
| `--bulma-input-placeholder-color` ‡           | `$input-placeholder-color`           | `hsla(var(--bulma-text-h), var(--bulma-text-s), var(--bulma-text-strong-l), 0.3)`                                        |
| `--bulma-input-disabled-color` ‡              | `$input-disabled-color`              | `var(--bulma-text-weak)`                                                                                                 |
| `--bulma-input-disabled-background-color` ‡   | `$input-disabled-background-color`   | `var(--bulma-background)`                                                                                                |
| `--bulma-input-disabled-border-color` ‡       | `$input-disabled-border-color`       | `var(--bulma-background)`                                                                                                |
| `--bulma-input-disabled-placeholder-color` ‡  | `$input-disabled-placeholder-color`  | `hsla(var(--bulma-text-h), var(--bulma-text-s), var(--bulma-text-weak-l), 0.3)`                                          |
| `--bulma-input-arrow` ‡                       | `$input-arrow`                       | `var(--bulma-link)`                                                                                                      |
| `--bulma-input-icon-color` ‡                  | `$input-icon-color`                  | `var(--bulma-text-light)`                                                                                                |
| `--bulma-input-icon-hover-color` ‡            | `$input-icon-hover-color`            | `var(--bulma-text-weak)`                                                                                                 |
| `--bulma-input-icon-focus-color` ‡            | `$input-icon-focus-color`            | `var(--bulma-link)`                                                                                                      |
| `--bulma-input-radius` ‡                      | `$input-radius`                      | `var(--bulma-radius)`                                                                                                    |

‡ declared on a constituent element: values set via `className`, the `style` prop, or an ancestor are only inherited and lose — target the declaring element in your CSS.

<!-- /bestax:generated cssvars -->
