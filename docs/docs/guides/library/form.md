---
title: Form Components Overview
sidebar_label: Form
sidebar_position: 4
---

# Form Components

This page provides a summary of all Bulma-styled form components in Bestax, with a brief description, usage example, and links to full documentation for each. Use these components to build accessible, flexible, and visually consistent forms.

---

## Text Inputs

### Input

A Bulma-styled text input supporting color, size, rounded, static, and loading states. Pass `label` (plus `horizontal` for a side-by-side row), `iconLeftName`/`iconRightName`, and `message`/`messageColor` to auto-wrap with a `Field` and `Control`, with no extra boilerplate.

```tsx live
<Input
  label="Email"
  placeholder="you@example.com"
  iconLeftName="envelope"
  message="We'll never share your email"
  messageColor="info"
/>
```

[View full documentation.](../../api/form/input)

:::tip Escape hatch
For complex layouts (grouped fields, addons, multi-control rows), use `InputBase` with an explicit `Field` + `Control` wrapper.
:::

---

### TextArea

A Bulma-styled multi-line text input. Supports color, size, and fixed size. Also accepts `label`, `message`, and `messageColor` for one-stop field usage.

```tsx live
<TextArea
  label="Comments"
  placeholder="Tell us your thoughts..."
  rows={3}
  message="Max 500 characters"
  messageColor="info"
/>
```

[View full documentation.](../../api/form/textarea)

:::tip Escape hatch
For complex layouts, use `TextAreaBase` with an explicit `Field` + `Control` wrapper.
:::

---

### Autocomplete

Input with dropdown suggestions. Filters options based on user input with keyboard navigation.

```tsx live
function AutocompleteExample() {
  const [selected, setSelected] = React.useState<string | null>(null);
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
    <div>
      <Autocomplete
        data={fruits}
        placeholder="Search fruit..."
        onSelect={item => setSelected(typeof item === 'string' ? item : null)}
        openOnFocus
        clearable
      />
      {selected && <p className="mt-2">Selected: {selected}</p>}
    </div>
  );
}
```

[View full documentation.](../../api/form/autocomplete)

---

### PinInput

A one-time code or a PIN, drawn as a row of boxes with a character in each. The code is in one real input under the boxes, so paste, autofill from a text message and screen readers treat it as one field, and `onComplete` gets the code once the last box fills.

```tsx live
function PinInputExample() {
  const [code, setCode] = React.useState('');
  return (
    <div>
      <PinInput
        label="Verification code"
        value={code}
        onChange={setCode}
        onComplete={full => setCode(full)}
      />
      <p className="mt-2">Code: {code || 'none yet'}</p>
    </div>
  );
}
```

[View full documentation.](../../api/form/pininput)

---

## Selection

### Checkbox

A Bulma-styled checkbox input for boolean choices. Pass the label as children; supports custom JSX and links.

```tsx live
<Checkbox> Stay Signed In </Checkbox>
```

[View full documentation.](../../api/form/checkbox)

---

### Checkboxes

Wraps multiple `Checkbox` components in a vertical group for lists of boolean options (e.g., preferences, to-do lists).

```tsx live
<Checkboxes>
  <Checkbox> Option 1 </Checkbox>
  <Checkbox> Option 2 </Checkbox>
</Checkboxes>
```

[View full documentation.](../../api/form/checkboxes)

---

### CheckboxCard

A checkbox drawn as a card, with a title and a description, that toggles wherever you click it. It joins a `Checkboxes` group as `Checkbox` does.

```tsx live
<Checkboxes label="Add-ons" name="extras" defaultValue={['backups']}>
  <CheckboxCard
    value="backups"
    title="Daily backups"
    description="Kept for 30 days."
  />
  <CheckboxCard
    value="domain"
    title="Custom domain"
    description="Bring your own."
  />
</Checkboxes>
```

[View full documentation.](../../api/form/checkboxcard)

---

### Radio

A Bulma-styled radio button for mutually exclusive choices. Use the same `name` prop for grouping.

```tsx live
<Radio name="group"> Option A </Radio>
```

[View full documentation.](../../api/form/radio)

---

### Radios

Groups multiple `Radio` components vertically for single-choice lists (e.g., RSVP, selection lists).

```tsx live
<Radios>
  <Radio name="event"> Attend </Radio>
  <Radio name="event"> Decline </Radio>
</Radios>
```

[View full documentation.](../../api/form/radios)

---

### RadioCard

A radio button drawn as a card, with a title and a description, picked wherever you click it. The cards in a `Radios` group are one choice the arrow keys move through.

```tsx live
<Radios label="Plan" name="plan" defaultValue="pro">
  <RadioCard
    value="starter"
    title="Starter"
    description="One site, community support."
  />
  <RadioCard value="pro" title="Pro" description="Ten sites, email support." />
</Radios>
```

[View full documentation.](../../api/form/radiocard)

---

### Select

A Bulma-styled dropdown for single or multiple selections. Supports color, size, rounded, loading, and multiselect. Accepts `label`, `iconLeftName`, and `message`/`messageColor` to auto-wrap with `Field` and `Control`.

```tsx live
<Select label="Country" iconLeftName="globe">
  <option>United States</option>
  <option>Canada</option>
  <option>United Kingdom</option>
</Select>
```

[View full documentation.](../../api/form/select)

:::tip Escape hatch
For complex layouts, use `SelectBase` with an explicit `Field` + `Control` wrapper.
:::

---

### Combobox

A text field with a list to pick from under it. Given `data`, it filters the list as you type and keeps the value, with the picks as tags when it takes several. Built from parts, it also covers a server search or a "Create" item, with the data in your hands. For free text with suggestions, `Autocomplete` is the simpler choice.

```tsx live
<form onSubmit={e => e.preventDefault()}>
  <Combobox
    label="Fruit"
    placeholder="Pick a fruit"
    data={['Apple', 'Banana', 'Cherry', 'Grape', 'Mango', 'Pear']}
    empty="No fruit matches"
  />
  <Input label="Quantity" type="number" min={1} defaultValue={1} />
  <Input label="Deliver on" type="date" />
  <Button type="submit" color="primary">
    Add to basket
  </Button>
</form>
```

[View full documentation.](../../api/form/combobox)

---

### Switch

Toggle switch for on/off states. A styled checkbox that appears as a toggle, commonly used for settings.

```tsx live
function SwitchExample() {
  const [enabled, setEnabled] = React.useState(false);
  return (
    <div>
      <Switch
        checked={enabled}
        onChange={e => setEnabled(e.target.checked)}
        color="success"
        isRounded
      >
        Enable notifications
      </Switch>
      <p className="mt-2 has-text-grey">
        Status: {enabled ? 'Enabled' : 'Disabled'}
      </p>
    </div>
  );
}
```

[View full documentation.](../../api/form/switch)

---

## Number / Range

### Numberinput

Number input with increment/decrement buttons. Provides +/- buttons for easy value adjustment.

```tsx live
function NumberinputExample() {
  const [quantity, setQuantity] = React.useState(1);
  return (
    <div>
      <Numberinput
        value={quantity}
        onChange={setQuantity}
        min={1}
        max={10}
        color="primary"
      />
      <p className="mt-2">Quantity: {quantity}</p>
    </div>
  );
}
```

[View full documentation.](../../api/form/numberinput)

---

### Slider

Range slider for selecting values. Supports different sizes, colors, and optional value display.

```tsx live
function SliderExample() {
  const [value, setValue] = React.useState(50);
  return (
    <div>
      <Slider
        value={value}
        onChange={setValue}
        min={0}
        max={100}
        showOutput
        color="primary"
        isRounded
      />
      <p className="mt-2">Value: {value}</p>
    </div>
  );
}
```

[View full documentation.](../../api/form/slider)

---

### Rate

Star/icon-based rating component. Supports custom icons, sizes, and text labels.

```tsx live
function RateExample() {
  const [rating, setRating] = React.useState(3);
  return (
    <div>
      <Rate
        value={rating}
        onChange={setRating}
        showScore
        showText
        texts={['Poor', 'Fair', 'Average', 'Good', 'Excellent']}
      />
    </div>
  );
}
```

[View full documentation.](../../api/form/rate)

---

## Date & Time

### DateInput

A date input that opens a popover calendar, with segmented keyboard entry directly in the field. Built on native `Date` and `Intl` only, it supports month and year pickers, min/max bounds, disabled-date predicates, custom formats, locales, an inline mode, and a native fallback on touch devices.

```tsx live
function DateInputExample() {
  const [date, setDate] = React.useState<Date | null>(null);
  return (
    <div>
      <DateInput
        label="Date"
        placeholder="YYYY-MM-DD"
        value={date}
        onChange={setDate}
      />
      <p className="mt-2">Selected: {date ? date.toDateString() : '—'}</p>
    </div>
  );
}
```

[View full documentation.](../../api/form/datetime/dateinput)

---

### DateRangeInput

A start and end date in one field: two segmented inputs and one popover calendar that picks the start and then the end, previewing the range on the way. `min`, `max` and the disabled-date props apply to both ends, and the range submits with a form as two dates.

```tsx live
import type { DateRangeValue } from '@allxsmith/bestax-bulma';

function DateRangeInputExample() {
  const [range, setRange] = React.useState<DateRangeValue>([null, null]);
  const [start, end] = range;
  return (
    <div>
      <DateRangeInput
        label="Stay"
        placeholder="YYYY-MM-DD"
        value={range}
        onChange={setRange}
      />
      <p className="mt-2">
        {start ? start.toDateString() : 'No start'} to{' '}
        {end ? end.toDateString() : 'no end'}
      </p>
    </div>
  );
}
```

[View full documentation.](../../api/form/datetime/daterangeinput)

---

### TimeInput

A time-of-day input that opens a popover wheel spinner, with segmented keyboard entry directly in the field. Supports 12/24-hour formats, optional seconds, custom increments, min/max bounds, and a native fallback on touch devices.

```tsx live
function TimeInputExample() {
  const [time, setTime] = React.useState<Date | null>(null);
  return (
    <div>
      <TimeInput
        label="Time"
        placeholder="HH:MM AM"
        hourFormat="12"
        value={time}
        onChange={setTime}
      />
      <p className="mt-2">Selected: {time ? time.toLocaleTimeString() : '—'}</p>
    </div>
  );
}
```

[View full documentation.](../../api/form/datetime/timeinput)

---

### DateTimeInput

Combines the calendar and time wheels in a single popover with an iOS-style footer — the selected time, a Reset button, and a ✓ confirm button. Click the time to float the wheel spinner over the calendar. Supports the full prop surface of both `DateInput` and `TimeInput`.

```tsx live
<DateTimeInput label="Appointment" placeholder="YYYY-MM-DD HH:MM" />
```

[View full documentation.](../../api/form/datetime/datetimeinput)

---

## Color

### ColorInput

A form field for a color: type it, or open a color picker from its launcher or its swatch. The value is a CSS color string, HSL by default, or empty, and the panel takes `alpha`, `swatches` and an eye dropper.

```tsx live
<ColorInput
  label="Brand color"
  defaultValue="hsl(202, 67%, 36%)"
  swatches="bulma"
/>
```

[View full documentation.](../../api/form/colorinput)

---

### ColorPicker

A panel for choosing a color: drag in the square for saturation and brightness, pick the hue on the slider, or type a value. The value is a CSS color string, HSL by default, and `alpha` and `swatches` add transparency and preset colors.

```tsx live
<ColorPicker
  label="Brand color"
  defaultValue="hsl(202, 67%, 36%)"
  swatches="bulma"
/>
```

[View full documentation.](../../api/form/colorpicker)

---

## Tags

### Taginput

Tag/chip input field for managing multiple tags. Supports autocomplete suggestions and custom styling.

```tsx live
import type { TaginputTag } from '@allxsmith/bestax-bulma';

function TaginputExample() {
  const [tags, setTags] = React.useState<TaginputTag[]>([
    'React',
    'TypeScript',
  ]);
  const suggestions = [
    'React',
    'Vue',
    'Angular',
    'Svelte',
    'TypeScript',
    'JavaScript',
  ];
  return (
    <div>
      <Taginput
        value={tags}
        onChange={setTags}
        data={suggestions}
        placeholder="Add frameworks..."
        tagColor="primary"
      />
      <p className="mt-2 has-text-grey">Tags: {tags.join(', ')}</p>
    </div>
  );
}
```

[View full documentation.](../../api/form/taginput)

---

## File Upload

### File

A Bulma-styled file input with support for color, size, boxed/fullwidth/align styles, icons, and filename display.

```tsx live
<File label="Choose a file..." />
```

[View full documentation.](../../api/form/file)

### Dropzone

An area to drop files on or click to pick them, which checks each one against `accept`, `maxSize` and `maxFiles`, lists the chosen files with a remove button each, and says why it refused any. The input holds the files, so a form submits them under `name`. Use `File` instead for a single pick shown by its name.

```tsx live
<Dropzone
  label="Attachments"
  name="attachments"
  multiple
  maxFiles={5}
  hint="Up to 5 files"
/>
```

[View full documentation.](../../api/form/dropzone)

---

## Layout

### Field

A Bulma-styled form field container for labels, grouped controls, and horizontal layouts. Compose labeled, grouped, or horizontal form layouts.

```tsx live
<Field label="Email">
  <Input placeholder="you@example.com" />
</Field>
```

[View full documentation.](../../api/form/field)

:::tip
Use `Field` to group and label form controls for accessibility and layout.
:::

---

### Control

A Bulma-styled wrapper for form controls, providing consistent spacing, icon placement, and loading indicators.

```tsx live
<Control>
  <Input placeholder="Username" />
</Control>
```

An `Input` inside a `Control` renders no `Control` of its own, and no `Field` either, so it stays the `Control`'s own child. Its Control-level props, such as `isLoading` and the icon props, belong on that `Control`: given to the `Input` there, they do nothing and warn in development. To give it a `label`, `message`, `horizontal` layout or `fieldClassName`, wrap the `Control` in a `Field` and set the `label`, `horizontal` and class name on that `Field`. Without that `Field`, any of those props makes the `Input` render its own `Field` inside the `Control`, and it warns in development.

[View full documentation.](../../api/form/control)

:::tip
Wrap inputs, selects, or textareas in `Control` for proper Bulma styling and icon support.
:::

---

### Fieldset

A section of a form in a native `<fieldset>`, named by its legend, bordered, filled or unstyled, whose `disabled` switches off every control inside.

```tsx live
<Fieldset legend="Shipping address" message="We only ship within the EU.">
  <Input label="Street" name="street" />
  <Input label="City" name="city" />
</Fieldset>
```

[View full documentation.](../../api/form/fieldset)

---

For more details and advanced usage, see the full documentation for each component linked above.
