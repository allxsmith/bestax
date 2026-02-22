---
title: Taginput
sidebar_label: Taginput
---

# Taginput

## Overview

The `Taginput` component provides a tag/chip input field for managing multiple tags. It supports autocomplete suggestions, custom tag styling, and various input behaviors.

:::info
The Taginput component requires importing the extras CSS. See the [Extras Setup Guide](../../guides/getting-started/using-extras.md) for installation instructions.
:::

---

## Import

```tsx
import { Taginput } from '@allxsmith/bestax-bulma';

// Also import the extras CSS
import '@allxsmith/bestax-bulma/dist/extras.css';
```

---

## Props

| Prop              | Type                                                                                                     | Default          | Description                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------ |
| `value`           | `TaginputTag[]`                                                                                          | —                | The current tags (controlled).                   |
| `defaultValue`    | `TaginputTag[]`                                                                                          | `[]`             | Default tags (uncontrolled).                     |
| `data`            | `string[]`                                                                                               | `[]`             | Autocomplete suggestions.                        |
| `placeholder`     | `string`                                                                                                 | —                | Placeholder text when no tags.                   |
| `field`           | `string`                                                                                                 | `'label'`        | Object property to use as display field.         |
| `allowNew`        | `boolean`                                                                                                | `true`           | Allow creating new tags not in suggestions.      |
| `allowDuplicates` | `boolean`                                                                                                | `false`          | Allow duplicate tags.                            |
| `openOnFocus`     | `boolean`                                                                                                | `false`          | Open autocomplete dropdown on focus.             |
| `removeOnKeys`    | `boolean`                                                                                                | `true`           | Remove tag on backspace.                         |
| `confirmKeys`     | `string[]`                                                                                               | `['Enter', ',']` | Keys to confirm tag creation.                    |
| `closable`        | `boolean`                                                                                                | `true`           | Show close button on tags.                       |
| `attached`        | `boolean`                                                                                                | `false`          | Attach tags visually.                            |
| `maxTags`         | `number`                                                                                                 | —                | Maximum number of tags allowed.                  |
| `maxlength`       | `number`                                                                                                 | —                | Maximum length of input.                         |
| `disabled`        | `boolean`                                                                                                | `false`          | Whether the input is disabled.                   |
| `readonly`        | `boolean`                                                                                                | `false`          | Whether the input is read-only.                  |
| `color`           | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                          | —                | Input color variant.                             |
| `tagColor`        | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'dark'` \| `'light'` | —                | Tag color variant.                               |
| `size`            | `'small'` \| `'medium'` \| `'large'`                                                                     | —                | Size variant.                                    |
| `onChange`        | `(tags: TaginputTag[]) => void`                                                                          | —                | Callback when tags change.                       |
| `onAdd`           | `(tag: TaginputTag) => void`                                                                             | —                | Callback when tag is added.                      |
| `onRemove`        | `(tag: TaginputTag, index: number) => void`                                                              | —                | Callback when tag is removed.                    |
| `onTyping`        | `(value: string) => void`                                                                                | —                | Callback when typing in input.                   |
| `tagTemplate`     | `(tag: TaginputTag) => React.ReactNode`                                                                  | —                | Custom render for tags.                          |
| `className`       | `string`                                                                                                 | —                | Additional CSS classes.                          |
| `ref`             | `React.Ref<HTMLElement>`                                                                                 | —                | Ref forwarded to the input element.              |
| ...               | All standard HTML and Bulma helper props                                                                 |                  | (See [Helper Props](../helpers/usebulmaclasses)) |

### TaginputTag

Can be either a `string` or an object with:

| Prop    | Type     | Description               |
| ------- | -------- | ------------------------- |
| `value` | `string` | The tag value.            |
| `label` | `string` | Display label (optional). |

---

## Usage

### Basic Taginput

Simple tag input without suggestions.

```tsx live
function example() {
  const [tags, setTags] = useState(['React', 'TypeScript']);

  return (
    <div>
      <Taginput value={tags} onChange={setTags} placeholder="Add a tag..." />
      <p className="mt-2 has-text-grey">Tags: {tags.join(', ')}</p>
    </div>
  );
}
```

---

### With Autocomplete

Tag input with suggestion dropdown.

```tsx live
function example() {
  const [tags, setTags] = useState(['React']);
  const suggestions = [
    'React',
    'Vue',
    'Angular',
    'Svelte',
    'TypeScript',
    'JavaScript',
    'Python',
    'Go',
  ];

  return (
    <Taginput
      value={tags}
      onChange={setTags}
      data={suggestions}
      placeholder="Add frameworks..."
      openOnFocus
    />
  );
}
```

---

### Restrict to Suggestions

Only allow tags from the suggestion list.

```tsx live
function example() {
  const [tags, setTags] = useState([]);
  const categories = [
    'Bug',
    'Feature',
    'Documentation',
    'Enhancement',
    'Question',
  ];

  return (
    <div>
      <Taginput
        value={tags}
        onChange={setTags}
        data={categories}
        allowNew={false}
        placeholder="Select categories..."
        openOnFocus
      />
      <p className="mt-2 has-text-grey is-size-7">
        Only predefined categories can be selected
      </p>
    </div>
  );
}
```

---

### Tag Colors

Tags with different color variants.

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <Taginput
    defaultValue={['Primary']}
    tagColor="primary"
    placeholder="Primary tags..."
  />
  <Taginput
    defaultValue={['Success']}
    tagColor="success"
    placeholder="Success tags..."
  />
  <Taginput
    defaultValue={['Info']}
    tagColor="info"
    placeholder="Info tags..."
  />
  <Taginput
    defaultValue={['Warning']}
    tagColor="warning"
    placeholder="Warning tags..."
  />
  <Taginput
    defaultValue={['Danger']}
    tagColor="danger"
    placeholder="Danger tags..."
  />
  <Taginput
    defaultValue={['Dark']}
    tagColor="dark"
    placeholder="Dark tags..."
  />
</div>
```

---

### Size Variants

Tag inputs in different sizes.

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <Taginput
    defaultValue={['Small']}
    size="small"
    tagColor="primary"
    placeholder="Small..."
  />
  <Taginput
    defaultValue={['Normal']}
    tagColor="primary"
    placeholder="Normal..."
  />
  <Taginput
    defaultValue={['Medium']}
    size="medium"
    tagColor="primary"
    placeholder="Medium..."
  />
  <Taginput
    defaultValue={['Large']}
    size="large"
    tagColor="primary"
    placeholder="Large..."
  />
</div>
```

---

### Maximum Tags

Limit the number of tags allowed.

```tsx live
function example() {
  const [tags, setTags] = useState(['One', 'Two']);

  return (
    <div>
      <Taginput
        value={tags}
        onChange={setTags}
        maxTags={3}
        tagColor="info"
        placeholder="Max 3 tags..."
      />
      <p className="mt-2 has-text-grey is-size-7">
        {3 - tags.length} tags remaining
      </p>
    </div>
  );
}
```

---

### Allow Duplicates

Enable duplicate tag values.

```tsx live
function example() {
  const [tags, setTags] = useState(['Tag']);

  return (
    <Taginput
      value={tags}
      onChange={setTags}
      allowDuplicates
      tagColor="warning"
      placeholder="Duplicates allowed..."
    />
  );
}
```

---

### Custom Confirm Keys

Change which keys create a new tag.

```tsx live
function example() {
  const [tags, setTags] = useState([]);

  return (
    <div>
      <Taginput
        value={tags}
        onChange={setTags}
        confirmKeys={['Enter', 'Tab', ' ']}
        tagColor="success"
        placeholder="Press Enter, Tab, or Space..."
      />
      <p className="mt-2 has-text-grey is-size-7">
        Space also creates a new tag
      </p>
    </div>
  );
}
```

---

### Read-only and Disabled

Display modes for tags.

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <div>
    <p className="mb-1">Read-only:</p>
    <Taginput defaultValue={['React', 'TypeScript']} readonly tagColor="info" />
  </div>
  <div>
    <p className="mb-1">Disabled:</p>
    <Taginput defaultValue={['React', 'TypeScript']} disabled tagColor="info" />
  </div>
</div>
```

---

### Non-closable Tags

Tags without the delete button.

```tsx live
<Taginput
  defaultValue={['Fixed', 'Tags']}
  closable={false}
  tagColor="primary"
  placeholder="Cannot remove tags..."
/>
```

---

## Keyboard Navigation

| Key         | Action                             |
| ----------- | ---------------------------------- |
| `Enter`     | Create tag from input              |
| `,`         | Create tag from input (default)    |
| `Backspace` | Remove last tag (when input empty) |
| `↓`         | Open/navigate suggestions          |
| `↑`         | Navigate suggestions up            |
| `Escape`    | Close suggestions dropdown         |

---

## Controlled vs Uncontrolled

### Controlled Mode

Use `value` and `onChange` to manage state externally:

```tsx
const [tags, setTags] = useState(['React']);
<Taginput value={tags} onChange={setTags} />;
```

### Uncontrolled Mode

Use `defaultValue` for internal state management:

```tsx
<Taginput defaultValue={['React', 'TypeScript']} />
```

---

## Accessibility

- Input has `aria-label="Add tag"` for screen readers
- Tags are keyboard navigable
- Delete buttons have proper `aria-label`
- Autocomplete dropdown follows ARIA listbox pattern

---

## Related Components

- [Autocomplete](./autocomplete.md) - For single value autocomplete
- [Input](./input.md) - For basic text input
- [Tag](../elements/tag.md) - For displaying tags

---

## Additional Resources

- [Storybook: Taginput Stories](https://bestax.io/storybook/?path=/story/form-taginput)

:::tip Pro Tip
Set `allowNew={false}` when you need strict control over allowed values, such as selecting from predefined categories or labels.
:::
