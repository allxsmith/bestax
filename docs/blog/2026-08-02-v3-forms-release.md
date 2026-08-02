---
slug: v3-forms-release
title: 'bestax-bulma v3.0.0: The Forms Mega-Release'
authors: [asmith]
tags: [release, v3, forms, bulma]
---

Back in January, our [Extra Components post](/blog/extra-components) ended with a promise: DateInput, TimeInput, and Colorpicker were coming. In June, v3.0.0 delivered the date and time pickers (plus a DateTimeInput we never promised) inside a release that added about 30 new components in one shot. Two out of three ain't bad.

<!-- truncate -->

Some honesty up front: this is a recap, not breaking news. v3.0.0 was tagged on June 17, 2026, the library sits at 5.8.0 today, and the blog fell behind the code. This post starts a series that catches things up, one release at a time. (And no, Colorpicker hasn't shipped yet. We're not going to pretend otherwise.)

## What Shipped in v3

v3 was the forms release. The 2.x form story covered the basics (Input, Select, TextArea, File, Checkbox, Radio), and 3.0 filled in just about everything else:

| Component                                       | What you get                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| **DateInput**                                   | Popover calendar with segmented keyboard entry right in the field |
| **TimeInput**                                   | Popover wheel spinner for time of day, 12-hour or 24-hour         |
| **DateTimeInput**                               | Calendar and time wheels combined in a single popover             |
| **Switch**                                      | Bulma switch toggle                                               |
| **Slider**                                      | Range slider with dual-thumb mode and ticks                       |
| **Numberinput**                                 | Number input with +/- steppers                                    |
| **Rate**                                        | Star rating with half-star precision                              |
| **Autocomplete**                                | Filterable suggest input                                          |
| **Taginput**                                    | Multi-tag input with autocomplete                                 |
| **Checkbox** and **Radio**                      | Themed styling with color and size variants                       |
| **Checkboxes** and **Radios**                   | Optional group-state containers                                   |
| **InputBase**, **SelectBase**, **TextAreaBase** | The bare 2.x-style elements, when you want them                   |

The same release also brought a wave of UI components (Tooltip, Dialog, Toast, Steps, Sidebar, Carousel, and more) and a set of text elements, but this post sticks to the forms story. The [2.x to 3.x migration guide](/docs/guides/getting-started/migration/bulma-ui-2-to-3) has the complete list.

## Native Date & Time Pickers

The standout of the release. The pickers run on native `Date` and `Intl` alone: no date library in your bundle, no peer dependency to version-match, and no locale data to ship. If you've ever shipped an entire date library just so a user could pick a Tuesday, you know exactly why that matters.

What that buys you:

- A popover calendar for dates and a wheel spinner for times
- Segmented keyboard entry directly in the field, so typing a date never requires the popover
- Min/max bounds, disabled-date predicates, custom formats, locales, and an inline mode
- A focus trap while the popover is open, and a native fallback on touch devices so phones get the platform picker
- On TimeInput, 12-hour or 24-hour formats, optional seconds, and custom minute increments for slot-style pickers

Here's a controlled DateInput clamped to the current month:

```tsx live
function DateDemo() {
  const [date, setDate] = React.useState(null);
  const today = new Date();
  const min = new Date(today.getFullYear(), today.getMonth(), 1);
  const max = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return (
    <Block>
      <DateInput
        label="Pick a day this month"
        placeholder="YYYY-MM-DD"
        min={min}
        max={max}
        value={date}
        onChange={setDate}
      />
      <Paragraph mt="2">
        Selected: {date ? date.toDateString() : 'nothing yet'}
      </Paragraph>
    </Block>
  );
}
```

And a controlled TimeInput on the 12-hour clock:

```tsx live
function TimeDemo() {
  const [time, setTime] = React.useState(null);
  return (
    <Block>
      <TimeInput
        label="Departure"
        placeholder="HH:MM AM"
        hourFormat="12"
        value={time}
        onChange={setTime}
      />
      <Paragraph mt="2">
        Selected: {time ? time.toLocaleTimeString() : 'nothing yet'}
      </Paragraph>
    </Block>
  );
}
```

Note the `onChange`: it hands you a `Date` (or `null`), not an event, so a state setter drops straight in. When you need both halves at once, `DateTimeInput` combines the calendar and the wheels in a single popover with an iOS-style footer; click the time and the spinner floats over the calendar, which is a pretty cool trick.

## Field/Control Auto-Wrap

The one breaking change in v3, told straight. In 2.x, `<Input>` rendered a bare `<input class="input">`. In 3.x, `Input`, `Select`, `TextArea`, and `File` detect whether they're already inside a `<Field>` and `<Control>`, and wrap themselves when they're not:

```jsx
<Input value="hi" />
// 2.x → <input class="input" value="hi" />
// 3.x → <div class="field"><div class="control"><input class="input" value="hi" /></div></div>
```

Why make wrapping the default? Because `<Field><Control><Input /></Control></Field>` is the single most common pattern in Bulma forms, and once the wrapper is guaranteed, props like `label`, `message`, and `iconLeftName` can exist at all:

```jsx
<Input
  label="Email"
  type="email"
  iconLeftName="envelope"
  message="We'll never share your email."
/>
```

Code that already wrapped its inputs keeps working (context detection skips the re-wrap), and CSS that targets `.input` still matches. If a snapshot test asserted the root element, or a layout dropped `<Input>` straight into a flex or grid container, the [migration guide](/docs/guides/getting-started/migration/bulma-ui-2-to-3) has the watch-for list. And if you want the bare element back, `InputBase`, `SelectBase`, and `TextAreaBase` render exactly what 2.x did.

## Themed Checkbox & Radio

`Checkbox` and `Radio` got the themed treatment: a visually hidden native input plus a custom indicator span, which unlocks color and size variants like `<Radio color="primary" size="large">`. The catch is that the indicator needs the new extras stylesheet. Upgrade without it and your radios become invisible click targets.

The easy path is swapping your `bulma.css` import for `bestax.css`, a drop-in superset that bundles Bulma plus every bestax extra in one file:

```jsx
import '@allxsmith/bestax-bulma/dist/bestax.css';
```

```tsx live
<Checkboxes>
  <Checkbox defaultChecked>I agree to the terms</Checkbox>
  <Checkbox color="primary">Subscribe to newsletter</Checkbox>
  <Checkbox disabled>Disabled option</Checkbox>
</Checkboxes>
```

`Checkboxes` and `Radios` also grew optional group state: pass `value` and `onChange` to the container and skip wiring each control. Existing JSX keeps working, since the new props are all optional.

## Documentation

- [Upgrading bestax-bulma 2.x to 3.x](/docs/guides/getting-started/migration/bulma-ui-2-to-3): the complete change list and every watch-for
- [Form components guide](/docs/guides/library/form): live examples of every input
- API references: [DateInput](/docs/api/form/datetime/dateinput), [TimeInput](/docs/api/form/datetime/timeinput), and [DateTimeInput](/docs/api/form/datetime/datetimeinput)

## What's Next

v3 was the first of three majors that landed in under two weeks this June, so the recaps continue: v4.0.0 (React 18 becomes the floor), then v5.0.0 (one CSS story, any prefix). After that, the series digs into bestax-migrate, building forms without a form library, and the AI loop that helps maintain this project. The full plan lives in the [blog revival tracker](https://github.com/allxsmith/bestax/issues/384).

Last time we said "coming soon" it took five months, so no dates this time. Yeah, we learned.
