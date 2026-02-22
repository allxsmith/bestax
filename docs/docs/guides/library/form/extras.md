---
title: Extra Form Components
sidebar_label: Extras
sidebar_position: 2
---

# Extra Form Components

The **Extra Form Components** section provides additional form controls that extend the core [Form Components](../form.md). These components add advanced input functionality like sliders, ratings, tag inputs, and more.

:::info
Extra Form Components require additional CSS. Import `@allxsmith/bestax-bulma/dist/extras.css` in your application. See the [Using Extras guide](/docs/guides/getting-started/using-extras) for setup instructions.
:::

---

## Toggle Controls

### Switch

Toggle switch for on/off states. A styled checkbox that appears as a toggle, commonly used for settings. [View full documentation.](../../../api/form/switch.md)

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

---

## Range Controls

### Slider

Range slider for selecting values. Supports different sizes, colors, and optional value display. [View full documentation.](../../../api/form/slider.md)

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

---

### Numberinput

Number input with increment/decrement buttons. Provides +/- buttons for easy value adjustment. [View full documentation.](../../../api/form/numberinput.md)

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

---

## Rating Controls

### Rate

Star/icon-based rating component. Supports custom icons, sizes, and text labels. [View full documentation.](../../../api/form/rate.md)

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

---

## Autocomplete Controls

### Autocomplete

Input with dropdown suggestions. Filters options based on user input with keyboard navigation. [View full documentation.](../../../api/form/autocomplete.md)

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

---

### Taginput

Tag/chip input field for managing multiple tags. Supports autocomplete suggestions and custom styling. [View full documentation.](../../../api/form/taginput.md)

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

---

## Controlled vs Uncontrolled

All Extra Form Components support both controlled and uncontrolled modes:

### Controlled Mode

Use `value` and `onChange` props to manage state externally:

```tsx
const [value, setValue] = useState(50);
<Slider value={value} onChange={setValue} />;
```

### Uncontrolled Mode

Use `defaultValue` for internal state management:

```tsx
<Slider defaultValue={50} />
```

---

:::tip Accessibility
All Extra Form Components include proper ARIA attributes and keyboard navigation support. They work with screen readers and can be navigated using arrow keys.
:::

:::note
For the core form components including Input, Select, and Checkbox, see the [Form Components](../form.md) guide.
:::
