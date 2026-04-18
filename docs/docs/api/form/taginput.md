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
| `rounded`         | `boolean`                                                                                                | `false`          | Applies rounded corners to the tags.             |
| `ellipsis`        | `boolean`                                                                                                | `false`          | Truncates long tag text with ellipsis.           |
| `hasCounter`      | `boolean`                                                                                                | `true`           | Shows a counter of the number of tags.           |
| `onPasteSeparators` | `string[]`                                                                                             | `[',']`          | Characters that split pasted text into tags.     |
| `beforeAdding`    | `(tag: string) => boolean`                                                                               | —                | Validation function called before adding a tag.  |
| `createTag`       | `(input: string) => TaginputTag`                                                                         | —                | Custom function for creating tag objects from input. |
| `keepFirst`       | `boolean`                                                                                                | `false`          | Keeps the first autocomplete suggestion highlighted. |
| `keepOpen`        | `boolean`                                                                                                | `true`           | Keeps the autocomplete dropdown open after selection. |
| `loading`         | `boolean`                                                                                                | `false`          | Shows a loading indicator.                       |
| `ariaCloseLabel`  | `string`                                                                                                 | —                | ARIA label for tag close buttons.                |
| `icon`            | `string`                                                                                                 | —                | Icon name for the input.                         |
| `iconLibrary`     | `'fa'` \| `'mdi'` \| `'ion'` \| `'material-icons'` \| `'material-symbols'`                               | —                | Icon library to use.                             |
| `iconVariant`     | `string`                                                                                                 | —                | Icon style variant.                              |
| `iconFeatures`    | `string` \| `string[]`                                                                                   | —                | Additional icon modifiers.                       |
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
    <Block>
      <Taginput value={tags} onChange={setTags} placeholder="Add a tag..." />
      <Paragraph mt="2" textColor="grey">Tags: {tags.join(', ')}</Paragraph>
    </Block>
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
    <Block>
      <Taginput
        value={tags}
        onChange={setTags}
        data={categories}
        allowNew={false}
        placeholder="Select categories..."
        openOnFocus
      />
      <Paragraph mt="2" textColor="grey" textSize="7">
        Only predefined categories can be selected
      </Paragraph>
    </Block>
  );
}
```

---

### Tag Colors

Tags with different color variants.

```tsx live
<Block display="flex" flexDirection="column" gap="4">
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
</Block>
```

---

### Size Variants

Tag inputs in different sizes.

```tsx live
<Block display="flex" flexDirection="column" gap="4">
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
</Block>
```

---

### Maximum Tags

Limit the number of tags allowed.

```tsx live
function example() {
  const [tags, setTags] = useState(['One', 'Two']);

  return (
    <Block>
      <Taginput
        value={tags}
        onChange={setTags}
        maxTags={3}
        tagColor="info"
        placeholder="Max 3 tags..."
      />
      <Paragraph mt="2" textColor="grey" textSize="7">
        {3 - tags.length} tags remaining
      </Paragraph>
    </Block>
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
    <Block>
      <Taginput
        value={tags}
        onChange={setTags}
        confirmKeys={['Enter', 'Tab', ' ']}
        tagColor="success"
        placeholder="Press Enter, Tab, or Space..."
      />
      <Paragraph mt="2" textColor="grey" textSize="7">
        Space also creates a new tag
      </Paragraph>
    </Block>
  );
}
```

---

### Read-only and Disabled

Display modes for tags.

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Block>
    <Paragraph mb="1">Read-only:</Paragraph>
    <Taginput defaultValue={['React', 'TypeScript']} readonly tagColor="info" />
  </Block>
  <Block>
    <Paragraph mb="1">Disabled:</Paragraph>
    <Taginput defaultValue={['React', 'TypeScript']} disabled tagColor="info" />
  </Block>
</Block>
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

### Context-Aware Rendering

The `Taginput` component is context-aware: it detects whether it is already inside a `Field` and adjusts its rendering accordingly. This means you can use it standalone with a `label` prop (it wraps itself in a Field), or inside a `Field` (it skips rendering its own).

:::note
Taginput does not use ControlContext, so the "With Field and Control Wrappers" example below uses Field wrapping only. The Control wrapper is shown for layout consistency but does not change the component's internal rendering.
:::

#### Default (with label)

The simplest usage — the component automatically renders its own Field wrapper.

```tsx live
<Taginput label="Tags" defaultValue={['React', 'TypeScript']} placeholder="Add a tag..." tagColor="primary" />
```

---

#### With Field Wrapper

When you need manual control over the Field layout (e.g., horizontal forms), wrap the component in `Field`. The component detects it's inside a Field and skips rendering its own.

```tsx live
function example() {
  return (
    <Field horizontal label="Tags">
      <Field.Body>
        <Field>
          <Taginput defaultValue={['React', 'TypeScript']} placeholder="Add a tag..." tagColor="primary" />
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

For full manual composition, wrap in both Field and Control. Taginput does not consume ControlContext, but the Field wrapper is still detected and its own Field is skipped.

```tsx live
function example() {
  return (
    <Field horizontal label="Tags">
      <Field.Body>
        <Field>
          <Control iconLeftName="fas fa-tags">
            <Taginput defaultValue={['React', 'TypeScript']} placeholder="Add a tag..." tagColor="primary" />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
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
