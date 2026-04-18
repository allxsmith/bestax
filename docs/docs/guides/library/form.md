---
title: Form Components Overview
sidebar_label: Form
sidebar_position: 4
---

# Form Components

This page provides a summary of all Bulma-styled form components in Bestax, with a brief description, usage example, and links to full documentation for each. Use these components to build accessible, flexible, and visually consistent forms.

:::info Extras CSS Required
The following components require additional CSS: **Autocomplete**, **Switch**, **Numberinput**, **Slider**, **Rate**, **Taginput**. Import `@allxsmith/bestax-bulma/dist/extras.css` in your application. See the [Using Extras guide](/docs/guides/getting-started/using-extras) for setup instructions.
:::

---

## Text Inputs

### Input

A Bulma-styled text input supporting color, size, rounded, static/read-only, and loading states. Suitable for all standard text input types.

```tsx live
<Input placeholder="Your name" />
```

[View full documentation.](../../api/form/input)

---

### TextArea

A Bulma-styled multi-line text input. Supports color, size, rounded, static/read-only, and fixed size.

```tsx live
<TextArea placeholder="Your message" rows={4} />
```

[View full documentation.](../../api/form/textarea)

---

### Autocomplete

Input with dropdown suggestions. Filters options based on user input with keyboard navigation.

```tsx live
function AutocompleteExample() {
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
    <div>
      <Autocomplete
        data={fruits}
        placeholder="Search fruit..."
        onSelect={setSelected}
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

### Select

A Bulma-styled dropdown for single or multiple selections. Supports color, size, rounded, loading, and multiselect.

```tsx live
<Select>
  <option value="">Please select</option>
  <option value="option1">Option 1</option>
</Select>
```

[View full documentation.](../../api/form/select)

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

## Tags

### Taginput

Tag/chip input field for managing multiple tags. Supports autocomplete suggestions and custom styling.

```tsx live
function TaginputExample() {
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

[View full documentation.](../../api/form/control)

:::tip
Wrap inputs, selects, or textareas in `Control` for proper Bulma styling and icon support.
:::

---

## Convenience

These components combine `Field`, `Control`, and an input into a single component, reducing boilerplate for common form patterns. They don't require extras CSS.

### InputField

Combines Field + Control + Input into one component. Supports label, left/right icons, validation messages, and horizontal layout.

```tsx live
<InputField
  label="Email"
  placeholder="you@example.com"
  iconLeftName="envelope"
  message="We'll never share your email"
  messageColor="info"
/>
```

[View Field documentation.](../../api/form/field)

---

### SelectField

Combines Field + Control + Select into one component. Supports label, left icon, and validation messages.

```tsx live
<SelectField label="Country" iconLeftName="globe">
  <option>United States</option>
  <option>Canada</option>
  <option>United Kingdom</option>
</SelectField>
```

[View Field documentation.](../../api/form/field)

---

### TextAreaField

Combines Field + Control + TextArea into one component. Supports label and validation messages.

```tsx live
<TextAreaField
  label="Comments"
  placeholder="Tell us your thoughts..."
  rows={3}
  message="Max 500 characters"
  messageColor="info"
/>
```

[View Field documentation.](../../api/form/field)

---

For more details and advanced usage, see the full documentation for each component linked above.
