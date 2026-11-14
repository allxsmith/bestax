---
title: Calendar
sidebar_label: Calendar
description: The `Calendar` component shows months on the page, not behind an input, where a click picks a day or a range and each day can show what's on it.
keywords:
  - calendar
  - inline calendar
  - date calendar
  - booking calendar
  - price calendar
  - renderDay
---

# Calendar

## Overview

<!-- bestax:generated overview -->

The `Calendar` component shows months on the page, not behind an input, where a click picks a day or a range and each day can show what's on it.

<!-- /bestax:generated overview -->

It's the grid the date pickers draw, on the page, with the parts a calendar needs and an input doesn't: content in each day, the month on show in your hands so you can load each month's data as it comes up, and several months side by side. It has no `Field`, label or hidden input. A form that posts a date uses [`DateInput inline`](./dateinput.md#inline) or [`DateRangeInput inline`](./daterangeinput.md#inline), which draw the same grid.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Calendar } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Calendar

A click, `Enter` or `Space` picks a day. Name the Calendar with `aria-label` or `aria-labelledby`, which makes it a group.

```tsx live
function example() {
  return <Calendar aria-label="Pick a day" />;
}
```

---

### Holding the Value

`value` and `onChange` hold the picked day, typed as on `DateInput`, so one handler fits both. With no value nothing shows as picked and the days still take focus, so a calendar that shows a day's agenda is just `value` and `onChange`.

```tsx live
function Agenda() {
  const [day, setDay] = React.useState<Date | null>(null);
  return (
    <Columns>
      <Column isNarrow>
        <Calendar aria-label="Show a day" value={day} onChange={setDay} />
      </Column>
      <Column>
        <Title as="h3" size="6">
          {day ? day.toDateString() : 'Pick a day'}
        </Title>
        <Paragraph>
          {day && day.getDay() % 6 !== 0
            ? 'Stand-up at 9:30, design review at 14:00.'
            : 'Nothing on.'}
        </Paragraph>
      </Column>
    </Columns>
  );
}
```

---

### Picking a Range

`selectionMode="range"` picks a start and then an end, and `onChange` gets both in one call, start first. The value is a `[start, end]` pair, as on `DateRangeInput`. While the end is pending the grid previews the range to the day under the pointer or the focus, and `Escape` drops the start. `monthsToShow={2}` shows a stay that crosses a month's end.

```tsx live
import type { DateRangeValue } from '@allxsmith/bestax-bulma';

function Stay() {
  const [stay, setStay] = React.useState<DateRangeValue>([null, null]);
  const [start, end] = stay;
  return (
    <Block>
      <Calendar
        aria-label="Your stay"
        selectionMode="range"
        monthsToShow={2}
        min={new Date()}
        value={stay}
        onChange={setStay}
      />
      <Paragraph mt="3">
        {start && end
          ? `${start.toDateString()} to ${end.toDateString()}`
          : 'Pick a check-in day, then a check-out day.'}
      </Paragraph>
    </Block>
  );
}
```

---

### Content in a Day

`dayTemplate` draws under a day's number, inside its button: a dot, a count, a price. Keep it to a short line of text or an icon, with nothing in it to click, since a day is a button. A line too long for a compact day is cut short, and `isFullwidth` makes room.

A day's name is its full date, so a screen reader doesn't read what `dayTemplate` draws. Say the same thing in `getDayLabel`, which gets the full date as its second argument. A dot or a color with no words behind it fails [WCAG 1.1.1](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) and [1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).

```tsx live
function Fares() {
  const fare = (date: Date) => 60 + ((date.getDate() * 7) % 50);
  return (
    <Calendar
      aria-label="Pick a departure day"
      dayTemplate={date => `$${fare(date)}`}
      getDayLabel={(date, label) => `${label}, $${fare(date)}`}
    />
  );
}
```

`dayTemplate` also gets the day's state, `isToday`, `isSelected`, `isDisabled` and `isOutsideMonth`, so it can draw a picked day's content to suit the fill behind it.

---

### Loading Each Month

`month` and `onMonthChange` hold the month on show. `onMonthChange` gets the first day of the new month from the header's buttons, `PageUp` and `PageDown`, an arrow key that crosses a month's edge, and a pick in the year list, which is where an app loads that month's data. `loading` marks the grids `aria-busy` and dims the day content while it arrives, and leaves the days, their focus and the keys working.

```tsx live
function Slots() {
  const [month, setMonth] = React.useState(() => new Date());
  const [day, setDay] = React.useState<Date | null>(null);
  const [loading, setLoading] = React.useState(false);
  // Stands in for a fetch of the month's free slots.
  React.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [month]);
  const slotsLeft = (date: Date) =>
    date.getDay() % 6 === 0 ? 0 : (date.getDate() % 5) + 1;
  return (
    <Calendar
      aria-label="Book a slot"
      month={month}
      onMonthChange={setMonth}
      loading={loading}
      value={day}
      onChange={setDay}
      shouldDisableDate={date => slotsLeft(date) === 0}
      dayTemplate={date => slotsLeft(date) > 0 && `${slotsLeft(date)} left`}
      getDayLabel={(date, label) => `${label}, ${slotsLeft(date)} slots left`}
    />
  );
}
```

`defaultMonth` sets the first month when the Calendar holds it. With neither, it opens on the month of `value`, or else today's, moved inside `min` and `max`.

---

### A Calendar You Only Read

`readOnly` keeps focus and the keys moving through the days, so their content can be read, and picks nothing. The grids are `aria-readonly`.

```tsx live
function Holidays() {
  const holidays: Record<string, string> = {
    '12-25': 'Christmas Day',
    '12-31': "New Year's Eve",
  };
  const holiday = (date: Date) =>
    holidays[`${date.getMonth() + 1}-${date.getDate()}`];
  return (
    <>
      <Title as="h2" size="5" id="holidays-heading">
        Team holidays
      </Title>
      <Calendar
        aria-labelledby="holidays-heading"
        readOnly
        defaultMonth={new Date(new Date().getFullYear(), 11, 1)}
        dayTemplate={date => holiday(date) && <Icon name="star" size="small" />}
        getDayLabel={(date, label) =>
          holiday(date) ? `${label}, ${holiday(date)}` : label
        }
      />
    </>
  );
}
```

`disabled` stops both: nothing can be focused or picked, and the month can't change. A `<Fieldset disabled>` around the Calendar does the same.

---

### Several Months

`monthsToShow` sets months side by side. They wrap to a column where the width runs out, with CSS alone, so a server renders them right. The previous button sits on the first month and the next button on the last, and both move every month by `monthsToShow`. The arrow keys cross from one month's grid into the next, and the Calendar keeps one tab stop. A key that takes focus past the months on show brings that month in: as the first month moving forward, and as the last moving back.

```tsx live
<Calendar aria-label="Pick a day" monthsToShow={3} />
```

A nearby month's days fill each month's first and last weeks, dimmed, except where that month is on show beside it, so no day shows twice. `nearbyMonthDays={false}` hides them all.

---

### Months and Years

`granularity="month"` shows a year's months and `"year"` the year list, and a pick is the first day of that month or year, as on `DateInput`. Only a Calendar that picks one day takes it. At `"month"`, `month` is read as its year, the one the grid shows, and `onMonthChange` gets 1 January of each new year on show. At `"year"`, `month` is the year the list opens on, and `onMonthChange` isn't called, since the list shows every year. `monthsToShow` changes only the day grid.

```tsx live
function MonthAndYear() {
  return (
    <Columns>
      <Column isNarrow>
        <Calendar aria-label="Pick a month" granularity="month" />
      </Column>
      <Column isNarrow>
        <Calendar aria-label="Pick a year" granularity="year" />
      </Column>
    </Columns>
  );
}
```

---

### Min, Max and Disabled Days

`min`, `max`, `shouldDisableDate` and `unselectableDates` work as on `DateInput`. The days they rule out show disabled, and the header stops at `min` and `max`.

```tsx live
function Weekdays() {
  const today = new Date();
  const inSixWeeks = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 42
  );
  return (
    <Calendar
      aria-label="Pick a weekday"
      min={today}
      max={inSixWeeks}
      shouldDisableDate={date => date.getDay() % 6 === 0}
    />
  );
}
```

---

### Full Width

`isFullwidth` stretches the months to the width of their container, and each day to its column, which leaves room for longer content.

```tsx live
function WideFares() {
  const fare = (date: Date) => 60 + ((date.getDate() * 7) % 50);
  return (
    <Calendar
      aria-label="Pick a departure day"
      isFullwidth
      monthsToShow={2}
      dayTemplate={date => `from $${fare(date)}`}
      getDayLabel={(date, label) => `${label}, from $${fare(date)}`}
    />
  );
}
```

---

### Sizes and Colors

`color` colors the picked days, with today and the focus ring in its `-on-scheme` variant, and `size` sizes the days, as on the date pickers.

```tsx live
<Columns isMultiline>
  <Column isNarrow>
    <Calendar aria-label="Small" size="small" color="info" />
  </Column>
  <Column isNarrow>
    <Calendar aria-label="Large" size="large" color="success" />
  </Column>
</Columns>
```

---

### Locale

`locale` names the days and months, and the days' accessible names, in its language. Inside a [`LocaleProvider`](../../helpers/localeprovider.md) the Calendar takes the provider's locale and its first day of the week, as the pickers do. `labels` takes the header buttons' names in your app's language.

```tsx live
<Calendar
  aria-label="Choisir un jour"
  locale="fr-FR"
  firstDayOfWeek={1}
  labels={{ prevMonth: 'Mois précédent', nextMonth: 'Mois suivant' }}
/>
```

---

### Server Rendering

The server and the browser render the same markup when the Calendar has a `month`, a `defaultMonth` or a picked `value`. With none of them, the first month comes from the clock, which can read a different month on the server, so give one of them on a server-rendered page. Today is marked once the page hydrates, by the reader's clock. The days' full-date names arrive then too, since a server and a browser can spell them differently, and until then a day is named by its number and the text `dayTemplate` draws.

---

## Keyboard Navigation

The day grid's keys are the date pickers'. With several months, they cross from one month into the next.

| Key                   | Action                                                              |
| --------------------- | ------------------------------------------------------------------- |
| `Enter` / `Space`     | Pick the focused day; in a range, the start and then the end        |
| `Escape`              | Drop a range's start that has no end yet                            |
| `←` / `→`             | Move focus by ±1 day                                                |
| `↑` / `↓`             | Move focus by ±1 week                                               |
| `PageUp` / `PageDown` | Move focus by ±1 month                                              |
| `Shift+PageUp/Down`   | Move focus by ±1 year                                               |
| `Home` / `End`        | Jump to the start / end of the week                                 |
| `Tab`                 | Move between the header's buttons and the focused day, one tab stop |

The month grid and the year list take the keys of [`DateInput`'s](./dateinput.md#on-the-month-grid-granularitymonth), with no popover to close.

---

## Accessibility

- The root is a `<div>`. An `aria-label` or `aria-labelledby` on it names the Calendar and makes it a `role="group"`, and so does a labeled `Field` around it, whose label names it when you give it no name of your own.
- Each month is a `role="grid"` named by its month and year, its weeks `role="row"`s and its days `button`s with `role="gridcell"`. Picked days are `aria-selected`, and today has `aria-current="date"`.
- Each day is named by its full date in the Calendar's locale, such as "Friday, November 20, 2026", which `getDayLabel` extends. The weekday row is hidden from assistive technology, since every day's name carries its weekday, so moving down a week reads the whole date rather than "27". On a server-rendered page the full names arrive once the page hydrates.
- What `dayTemplate` draws isn't read, since a day's name is its date: pair it with `getDayLabel`.
- A range's ends are described as "Start date" and "End date", the day a pending range would end on as "Choose as end date", and a polite live region states the range in words as it's picked, as on `DateRangeInput`.
- `readOnly` puts `aria-readonly="true"` on the grids and keeps the tab stop and the keys. `disabled` puts `aria-disabled="true"` on them and disables every button.
- `loading` puts `aria-busy="true"` on the grids and keeps the grid and its focus where they were.
- A roving `tabindex` keeps one day focusable in the whole Calendar, whatever `monthsToShow` is. When the focused day is disabled, the tab stop moves to the nearest enabled day of the months on show.
- Closing the year list, with a pick or `Escape`, puts focus back on the grid's tab stop.
- On a right-to-left page the previous-month chevron points right.

---

## Related Components

- [DateInput](./dateinput.md) - A date, month or year in a form, in a popover or `inline`.
- [DateRangeInput](./daterangeinput.md) - A start and end date in a form.
- [Fieldset](../fieldset.md) - Disables a Calendar with the rest of a form section.

---

## Additional Resources

- [Storybook: Calendar Stories](https://bestax.io/storybook/?path=/story/form-calendar)

---

## Props

<!-- bestax:generated props -->

| Prop                | Type                                                                            | Default    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selectionMode`     | `'single'` \| `'range'`                                                         | `'single'` | How a click, Enter or Space picks: `'single'` picks one day, and `'range'` a range's start and then its end. The value's type follows it.                                                                                                                                                                                                                                                                                                                                 |
| `value`             | `Date` \| `null` \| `DateRangeValue`                                            | —          | The picked day when you hold the state, or `null` for none: a `Date`, or with `selectionMode="range"` a `[start, end]` pair, start first, where `[null, null]` is empty. Picking then only calls `onChange`, and nothing changes until you pass the new value. With neither this nor `defaultValue`, nothing shows as picked. A new value from outside doesn't turn the month on show: hold `month` to show it.                                                           |
| `defaultValue`      | `Date` \| `null` \| `DateRangeValue`                                            | —          | The value to begin with, when the Calendar holds its own state.                                                                                                                                                                                                                                                                                                                                                                                                           |
| `onChange`          | `(value: Date \| null) => void` \| `(value: DateRangeValue) => void`            | —          | Called with what was picked: the day, typed as `DateInput`'s so one handler fits both, or with `selectionMode="range"` both ends in one call, start first, once the second is picked.                                                                                                                                                                                                                                                                                     |
| `granularity`       | `'day'` \| `'month'` \| `'year'`                                                | `'day'`    | `'month'` shows a year's months and `'year'` the year list, and a pick is the first day of that month or year, as on `DateInput`. Only a Calendar that picks one day takes it.                                                                                                                                                                                                                                                                                            |
| `month`             | `Date`                                                                          | —          | The month on show when you hold the state: any day in it, read as the month. With `monthsToShow`, the first of the months. Changing it from inside only calls `onMonthChange`, and nothing moves until you pass the new month. At `granularity="month"` it's read as its year, the year the month grid shows, and at `"year"` it's the year the list opens on.                                                                                                            |
| `defaultMonth`      | `Date`                                                                          | —          | The month on show to begin with, when the Calendar holds its own state. Unset, it's the month of `value` (a range's start), or else today's, moved inside `min` and `max`. On a server render today is the server's, so give this, `month` or a picked `value` there.                                                                                                                                                                                                     |
| `onMonthChange`     | `(month: Date) => void`                                                         | —          | Called with the first day of the new month on show, whenever a move takes focus past the months on show: the header's buttons, a key (an arrow, PageUp or PageDown, Home or End) crossing a month's edge, a click on a nearby month's day, or a pick in the year list. Load that month's data from here. At `granularity="month"` it's called as the year on show changes, with 1 January of that year, and at `"year"` it isn't called, since the list shows every year. |
| `monthsToShow`      | `number`                                                                        | `1`        | How many months show side by side, over the day grid. They wrap to a column where the width runs out, one previous and next pair moves them all by this many, and the arrow keys cross from one month into the next. The month grid and the year list show one panel whatever it is.                                                                                                                                                                                      |
| `dayTemplate`       | `(date: Date, state: CalendarDayState) => React.ReactNode`                      | —          | Draws content inside a day's button, under its number: a dot, a count, a price. Phrasing content only, with nothing in it to click or focus. Say the same thing in `getDayLabel`: a day's name is its date, so a screen reader doesn't read what this draws.                                                                                                                                                                                                              |
| `getDayLabel`       | `(date: Date, label: string) => string`                                         | —          | Returns a day's accessible name. `label` is the default, the full date in the Calendar's locale ("Tuesday, October 20, 2026"), so append to it: `` (date, label) => `${label}, 3 slots left` ``. On a server-rendered page the full-date names arrive once the page hydrates, as the pickers' full weekday names do, and until then a day is named by its number and the text `dayTemplate` draws.                                                                        |
| `loading`           | `boolean`                                                                       | `false`    | The month's data is on its way. The grids are `aria-busy` and the day content dims, while the days, their focus and the keys keep working.                                                                                                                                                                                                                                                                                                                                |
| `readOnly`          | `boolean`                                                                       | `false`    | Days can be focused and read but not picked, and the grids are `aria-readonly`. For a calendar that only shows things.                                                                                                                                                                                                                                                                                                                                                    |
| `disabled`          | `boolean`                                                                       | `false`    | Nothing can be focused or picked, and the month can't change. A `<Fieldset disabled>` around it does the same.                                                                                                                                                                                                                                                                                                                                                            |
| `isFullwidth`       | `boolean`                                                                       | `false`    | Stretches the grid to the width of its container (Bulma's `is-fullwidth`).                                                                                                                                                                                                                                                                                                                                                                                                |
| `min`               | `Date`                                                                          | —          | Earliest day that can be picked. Days before it show disabled. One before year 1, or none, counts as the start of year 1.                                                                                                                                                                                                                                                                                                                                                 |
| `max`               | `Date`                                                                          | —          | Latest day that can be picked. Days after it show disabled.                                                                                                                                                                                                                                                                                                                                                                                                               |
| `shouldDisableDate` | `(date: Date) => boolean`                                                       | —          | Rules days out, such as weekends. They show disabled and can't be picked.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `unselectableDates` | `Date[]`                                                                        | —          | Days that can't be picked, matched by calendar day. Merged with `shouldDisableDate`.                                                                                                                                                                                                                                                                                                                                                                                      |
| `locale`            | `string`                                                                        | —          | BCP-47 locale for the day and month names and the days' accessible names. Unset, it's a `LocaleProvider`'s, and with neither, the runtime's.                                                                                                                                                                                                                                                                                                                              |
| `firstDayOfWeek`    | `0` \| `1` \| `2` \| `3` \| `4` \| `5` \| `6`                                   | `0`        | Day the week starts on (0 = Sunday). Unset inside a `LocaleProvider`, it's the first day of the week in the Calendar's locale, and elsewhere, or with seven `dayNames` of your own, Sunday.                                                                                                                                                                                                                                                                               |
| `dayNames`          | `string[]`                                                                      | —          | The seven day names, shown exactly as given from the first column, so they start on the day the week does, as on `DateInput`.                                                                                                                                                                                                                                                                                                                                             |
| `monthNames`        | `string[]`                                                                      | —          | The twelve month names.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `nearbyMonthDays`   | `boolean`                                                                       | `true`     | Shows the dimmed days of the months before and after, to fill each week.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `color`             | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —          | Bulma color for the picked days. Today and the focus ring take its `-on-scheme` variant. Unset, the `--bulma-dateinput-*` variables decide, and they follow `primary`.                                                                                                                                                                                                                                                                                                    |
| `size`              | `'small'` \| `'medium'` \| `'large'`                                            | —          | Size of the cells and their text.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `labels`            | `PickerLabels`                                                                  | —          | The visible and accessible strings, in your app's language, as on the date pickers.                                                                                                                                                                                                                                                                                                                                                                                       |
| `textColor`         | [Bulma color](../../helpers/valid-values.md) \| `'inherit'` \| `'current'`      | —          | Text color helper.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `bgColor`           | [Bulma color](../../helpers/valid-values.md) \| `'inherit'` \| `'current'`      | —          | Background color helper.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `className`         | `string`                                                                        | —          | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `ref`               | `React.Ref<HTMLDivElement>`                                                     | —          | Forwarded to the root `<div>`.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `aria-label`        | `string`                                                                        | —          | Names the Calendar, which makes its root a `role="group"`. Each month's grid keeps its own name, its month and year.                                                                                                                                                                                                                                                                                                                                                      |
| `aria-labelledby`   | `string`                                                                        | —          | The ids of what names the Calendar, such as a heading above it, which makes its root a `role="group"`.                                                                                                                                                                                                                                                                                                                                                                    |
| `...`               | All standard `<div>` attributes and Bulma helper props                          | —          | See [Helper Props](../../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                      |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

Each month on show is the date pickers' calendar, `.dateinput`, so the `--bulma-dateinput-*` variables on [`DateInput`'s page](./dateinput.md#css--sass-variables) theme its days, a theme written for the pickers themes the Calendar too, and the three `--bulma-dateinput-cell-content-*` ones style what `dayTemplate` draws. The variables below are the Calendar's own: its frame and the gap between its months.

<!-- bestax:generated cssvars -->

`Calendar` registers these variables on its own `.calendar` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../../helpers/theme.md).

| CSS Variable                        | Sass Variable                | Default                      |
| ----------------------------------- | ---------------------------- | ---------------------------- |
| `--bulma-calendar-months-gap`       | `$calendar-months-gap`       | `var(--bulma-block-spacing)` |
| `--bulma-calendar-padding`          | `$calendar-padding`          | `0.75rem`                    |
| `--bulma-calendar-background-color` | `$calendar-background-color` | `var(--bulma-scheme-main)`   |
| `--bulma-calendar-border-color`     | `$calendar-border-color`     | `var(--bulma-border)`        |
| `--bulma-calendar-radius`           | `$calendar-radius`           | `var(--bulma-radius)`        |

<!-- /bestax:generated cssvars -->
