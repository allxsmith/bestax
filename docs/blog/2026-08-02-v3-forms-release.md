---
slug: v3-forms-release
title: The Forms Mega-Release
authors: [asmith]
tags: [release, v3, forms, bulma]
---

Back in January, our [Extra Components post](/blog/extra-components) ended with a promise: DateInput, TimeInput, and Colorpicker were coming. In June, v3.0.0 delivered the date and time pickers (plus a DateTimeInput we never promised) inside a release that added about 30 new components in one shot. Two out of three ain't bad.

<!-- truncate -->

Some honesty up front: this is a recap, not breaking news. v3.0.0 was tagged on June 17, 2026, the library sits at 5.8.0 today, and the blog fell behind the code. This post starts a series that catches things up, one release at a time. (And no, Colorpicker hasn't shipped yet. We're not going to pretend otherwise.)

## What Shipped in v3

v3 was the forms release. The 2.x form story covered the basics (Input, Select, TextArea, File, Checkbox, Radio), and 3.0 filled in just about everything else:

| Component                                                                           | What you get                                                                                                                |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [**DateInput**](/docs/api/form/datetime/dateinput)                                  | Popover calendar with segmented keyboard entry right in the field                                                           |
| [**TimeInput**](/docs/api/form/datetime/timeinput)                                  | Popover wheel spinner for time of day, 12-hour or 24-hour                                                                   |
| [**DateTimeInput**](/docs/api/form/datetime/datetimeinput)                          | Calendar and time wheels combined in a single popover                                                                       |
| [**Switch**](/docs/api/form/switch)                                                 | Bulma switch toggle                                                                                                         |
| [**Slider**](/docs/api/form/slider)                                                 | Range slider with dual-thumb mode and ticks                                                                                 |
| [**Numberinput**](/docs/api/form/numberinput)                                       | Number input with +/- steppers                                                                                              |
| [**Rate**](/docs/api/form/rate)                                                     | Star rating with half-star precision                                                                                        |
| [**Autocomplete**](/docs/api/form/autocomplete)                                     | Filterable suggest input                                                                                                    |
| [**Taginput**](/docs/api/form/taginput)                                             | Multi-tag input with autocomplete                                                                                           |
| [**Checkbox**](/docs/api/form/checkbox) and [**Radio**](/docs/api/form/radio)       | Themed styling with color and size variants                                                                                 |
| [**Checkboxes**](/docs/api/form/checkboxes) and [**Radios**](/docs/api/form/radios) | Optional group-state containers                                                                                             |
| **InputBase**, **SelectBase**, **TextAreaBase**                                     | The bare 2.x-style elements, when you want them ([migration guide](/docs/guides/getting-started/migration/bulma-ui-2-to-3)) |

The same release also brought a wave of UI components (Tooltip, Dialog, Toast, Steps, Sidebar, Carousel, and more) and a set of text elements, but this post sticks to the forms story. The [2.x to 3.x migration guide](/docs/guides/getting-started/migration/bulma-ui-2-to-3) has the complete list.

## Native Date & Time Pickers

The standout of the release. The pickers run on native `Date` and `Intl` alone: no date library in your bundle, no peer dependency to version-match, and no locale data to ship. If you've ever shipped an entire date library just so a user could pick a Tuesday, you know exactly why that matters.

What that buys you (each link lands on a live example in the API docs):

- A [popover calendar](/docs/api/form/datetime/dateinput#basic-dateinput) for dates and a [wheel spinner](/docs/api/form/datetime/timeinput#basic-timeinput) for times
- [Segmented keyboard entry](/docs/api/form/datetime/dateinput#manual-keyboard-entry) directly in the field, so typing a date never requires the popover
- [Min/max bounds](/docs/api/form/datetime/dateinput#min-and-max), [disabled-date predicates](/docs/api/form/datetime/dateinput#disabled-dates), [custom formats](/docs/api/form/datetime/dateinput#custom-format), [locales](/docs/api/form/datetime/dateinput#locale), and an [inline mode](/docs/api/form/datetime/dateinput#inline)
- A focus trap while the popover is open, with [keyboard navigation](/docs/api/form/datetime/dateinput#keyboard-navigation) fully mapped, and a [native fallback on touch devices](/docs/api/form/datetime/dateinput#mobile-native) so phones get the platform picker
- On TimeInput, [12-hour](/docs/api/form/datetime/timeinput#12-hour-format) or [24-hour](/docs/api/form/datetime/timeinput#24-hour-format) formats, [optional seconds](/docs/api/form/datetime/timeinput#with-seconds), and [custom minute increments](/docs/api/form/datetime/timeinput#increment-steps) for slot-style pickers

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

Note the `onChange`: it hands you a `Date` (or `null`), not an event, so a state setter drops straight in. When you need both halves at once, `DateTimeInput` combines the calendar and the wheels in a single popover with an iOS-style footer; click the time and the spinner floats over the calendar, which is a pretty cool trick:

```tsx live
<Block>
  <DateTimeInput label="Appointment" placeholder="YYYY-MM-DD HH:MM" />
</Block>
```

## Field/Control Auto-Wrap

The one breaking change in v3, told straight. In 2.x, `<Input>` rendered a bare `<input class="input">`. In 3.x, [`Input`](/docs/api/form/input), [`Select`](/docs/api/form/select), [`TextArea`](/docs/api/form/textarea), and [`File`](/docs/api/form/file) detect whether they're already inside a `<Field>` and `<Control>`, and wrap themselves when they're not:

```jsx
<Input value="hi" />
// 2.x → <input class="input" value="hi" />
// 3.x → <div class="field"><div class="control"><input class="input" value="hi" /></div></div>
```

That wrapper pattern isn't something we invented, it's Bulma stuff. Bulma's form markup puts every control inside a `<div class="control">` and groups controls under a `<div class="field">` that handles spacing, labels, addons, and icons; [Bulma's own form docs](https://bulma.io/documentation/form/general/) build everything on that skeleton. Our [`Field`](/docs/api/form/field) and [`Control`](/docs/api/form/control) components render exactly that structure, so in 3.x the inputs guarantee the markup Bulma expects.

Why make wrapping the default? Because `<Field><Control><Input /></Control></Field>` is the single most common pattern in Bulma forms, and once the wrapper is guaranteed, props like `label`, `message`, and `iconLeftName` can exist at all:

```tsx live
<Input
  label="Email"
  type="email"
  iconLeftName="envelope"
  message="We'll never share your email."
/>
```

:::tip Inspect and see
That example is live. Right-click the rendered input and hit Inspect: there's a `field` div wrapping a `control` div wrapping the `input`, and you wrote none of them.
:::

Code that already wrapped its inputs keeps working (context detection skips the re-wrap), and CSS that targets `.input` still matches. If a snapshot test asserted the root element, or a layout dropped `<Input>` straight into a flex or grid container, the [migration guide](/docs/guides/getting-started/migration/bulma-ui-2-to-3) has the watch-for list. And if you want the bare element back, `InputBase`, `SelectBase`, and `TextAreaBase` render exactly what 2.x did.

## Themed Checkbox & Radio

`Checkbox` and `Radio` got the themed treatment: a visually hidden native input plus a custom indicator span, which unlocks color and size variants like `<Radio color="primary" size="large">`. The catch is that the indicator needs the new extras stylesheet. Upgrade without it and your radios become invisible click targets.

The easy path is swapping your `bulma.css` import for `bestax.css`, a drop-in superset that bundles Bulma plus every bestax extra in one file:

```jsx
import '@allxsmith/bestax-bulma/dist/bestax.css';
```

Here's what the checkboxes look like once the CSS is loaded:

```tsx live
<Checkboxes>
  <Checkbox defaultChecked>I agree to the terms</Checkbox>
  <Checkbox color="primary">Subscribe to newsletter</Checkbox>
  <Checkbox disabled>Disabled option</Checkbox>
</Checkboxes>
```

And the radios:

```tsx live
<Radios name="answer">
  <Radio defaultChecked>Yes</Radio>
  <Radio>No</Radio>
  <Radio disabled>Maybe</Radio>
</Radios>
```

`Checkboxes` and `Radios` also grew optional group state: pass `value` and `onChange` to the container and skip wiring each control. Existing JSX keeps working, since the new props are all optional.

## The Rest of the Form Suite

The pickers got the spotlight, but the rest of the suite pulls its weight. Every link below lands on a live example in the API docs, and every demo here is poke-able.

### Switch

A styled checkbox that renders as a toggle, made for settings screens.

- [Colors](/docs/api/form/switch#colors), [sizes](/docs/api/form/switch#sizes), and [rounded](/docs/api/form/switch#rounded-style), [thin](/docs/api/form/switch#thin-style), and [outlined](/docs/api/form/switch#outlined-style) styles
- [RTL layout](/docs/api/form/switch#rtl-layout) and a [controlled mode](/docs/api/form/switch#controlled-usage)

```tsx live
function SwitchDemo() {
  const [enabled, setEnabled] = React.useState(false);
  return (
    <Block>
      <Switch
        checked={enabled}
        onChange={e => setEnabled(e.target.checked)}
        color="success"
        isRounded
      >
        Enable notifications
      </Switch>
      <Paragraph mt="2">Status: {enabled ? 'Enabled' : 'Disabled'}</Paragraph>
    </Block>
  );
}
```

### Slider

A range slider for picking values.

- [Output display](/docs/api/form/slider#with-output-display) with a [custom format](/docs/api/form/slider#custom-output-format)
- [Custom ranges](/docs/api/form/slider#custom-range), [colors](/docs/api/form/slider#color-variants), [sizes](/docs/api/form/slider#size-variants), and [rounded or circle](/docs/api/form/slider#rounded-and-circle) thumbs
- [Controlled](/docs/api/form/slider#controlled-mode) and [uncontrolled](/docs/api/form/slider#uncontrolled-mode) modes

```tsx live
function SliderDemo() {
  const [value, setValue] = React.useState(50);
  return (
    <Block>
      <Slider
        value={value}
        onChange={setValue}
        min={0}
        max={100}
        showOutput
        color="primary"
        isRounded
      />
      <Paragraph mt="2">Value: {value}</Paragraph>
    </Block>
  );
}
```

### Numberinput

A number input with +/- stepper buttons.

- [Min/max](/docs/api/form/numberinput#with-min-and-max) and a [custom step](/docs/api/form/numberinput#custom-step)
- [Controls position](/docs/api/form/numberinput#controls-position), [colors](/docs/api/form/numberinput#color-variants), [sizes](/docs/api/form/numberinput#size-variants), and [rounded buttons](/docs/api/form/numberinput#rounded-buttons)

```tsx live
function NumberDemo() {
  const [quantity, setQuantity] = React.useState(1);
  return (
    <Block>
      <Numberinput
        value={quantity}
        onChange={setQuantity}
        min={1}
        max={10}
        color="primary"
      />
      <Paragraph mt="2">Quantity: {quantity}</Paragraph>
    </Block>
  );
}
```

### Rate

Star ratings without hand-rolling the stars.

- [Score display](/docs/api/form/rate#with-score-display) and [text labels](/docs/api/form/rate#with-text-labels) alongside the icons
- [Custom max](/docs/api/form/rate#custom-max-value), [custom icons](/docs/api/form/rate#custom-icons), and [sizes](/docs/api/form/rate#size-variants)

```tsx live
function RateDemo() {
  const [rating, setRating] = React.useState(3);
  return (
    <Block>
      <Rate
        value={rating}
        onChange={setRating}
        showScore
        showText
        texts={['Poor', 'Fair', 'Average', 'Good', 'Excellent']}
      />
    </Block>
  );
}
```

### Autocomplete

An input with filtered dropdown suggestions and keyboard navigation.

- [Open on focus](/docs/api/form/autocomplete#open-on-focus), a [clear button](/docs/api/form/autocomplete#with-clear-button), and [keep-first highlighting](/docs/api/form/autocomplete#keep-first-highlighted)
- [Object data](/docs/api/form/autocomplete#with-object-data), [custom item templates](/docs/api/form/autocomplete#custom-item-template), and [loading](/docs/api/form/autocomplete#loading-state) and [empty](/docs/api/form/autocomplete#with-empty-state) states

```tsx live
function AutocompleteDemo() {
  const [selected, setSelected] = React.useState(null);
  const fruits = [
    'Apple',
    'Banana',
    'Cherry',
    'Date',
    'Elderberry',
    'Fig',
    'Grape',
  ];
  return (
    <Block>
      <Autocomplete
        data={fruits}
        placeholder="Search fruit..."
        onSelect={setSelected}
        openOnFocus
        clearable
      />
      {selected && <Paragraph mt="2">Selected: {selected}</Paragraph>}
    </Block>
  );
}
```

### Taginput

A tag and chip input for managing multiple values.

- [Autocomplete suggestions](/docs/api/form/taginput#with-autocomplete), optionally [restricted to the list](/docs/api/form/taginput#restrict-to-suggestions)
- [Max tags](/docs/api/form/taginput#maximum-tags), [duplicate control](/docs/api/form/taginput#allow-duplicates), and [custom confirm keys](/docs/api/form/taginput#custom-confirm-keys)
- [Tag colors](/docs/api/form/taginput#tag-colors) and [non-closable tags](/docs/api/form/taginput#non-closable-tags)

```tsx live
function TaginputDemo() {
  const [tags, setTags] = React.useState(['React', 'TypeScript']);
  const suggestions = [
    'React',
    'Vue',
    'Angular',
    'Svelte',
    'TypeScript',
    'JavaScript',
  ];
  return (
    <Block>
      <Taginput
        value={tags}
        onChange={setTags}
        data={suggestions}
        placeholder="Add frameworks..."
        tagColor="primary"
      />
      <Paragraph mt="2">Tags: {tags.join(', ')}</Paragraph>
    </Block>
  );
}
```

## Documentation

- [Upgrading bestax-bulma 2.x to 3.x](/docs/guides/getting-started/migration/bulma-ui-2-to-3): the complete change list and every watch-for
- [Form components guide](/docs/guides/library/form): live examples of every input
- API references: [DateInput](/docs/api/form/datetime/dateinput), [TimeInput](/docs/api/form/datetime/timeinput), and [DateTimeInput](/docs/api/form/datetime/datetimeinput)

## What's Next

v3 was the first of three majors that landed in under two weeks this June, so the recaps continue: v4.0.0 (React 18 becomes the floor), then v5.0.0 (one CSS story, any prefix). After that, the series digs into bestax-migrate, building forms without a form library, and the AI loop that helps maintain this project. The full plan lives in the [blog revival tracker](https://github.com/allxsmith/bestax/issues/384).

Last time we said "coming soon" it took five months, so no dates this time. Yeah, we learned.
