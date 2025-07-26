---
title: Form Components Overview
sidebar_label: Form
sidebar_position: 4
---

# Form Components

This page provides a summary of all Bulma-styled form components in Bestax, with a brief description, usage example, and links to full documentation for each. Use these components to build accessible, flexible, and visually consistent forms.

---

## Checkbox

A Bulma-styled checkbox input for boolean choices. Pass the label as children; supports custom JSX and links.

```tsx live
<Checkbox> Stay Signed In </Checkbox>
```

[View full documentation.](../api/form/checkbox)

---

## Checkboxes

Wraps multiple `Checkbox` components in a vertical group for lists of boolean options (e.g., preferences, to-do lists).

```tsx live
<Checkboxes>
  <Checkbox> Option 1 </Checkbox>
  <Checkbox> Option 2 </Checkbox>
</Checkboxes>
```

[View full documentation.](../api/form/checkboxes)

---

## Radio

A Bulma-styled radio button for mutually exclusive choices. Use the same `name` prop for grouping.

```tsx live
<>
  <Radio name="group"> Option A </Radio>
  <Radio name="group"> Option B </Radio>
</>
```

[View full documentation.](../api/form/radio)

---

## Radios

Groups multiple `Radio` components vertically for single-choice lists (e.g., RSVP, selection lists).

```tsx live
<Radios>
  <Radio name="event"> Attend </Radio>
  <Radio name="event"> Decline </Radio>
</Radios>
```

[View full documentation.](../api/form/radios)

---

## Input

A Bulma-styled text input supporting color, size, rounded, static/read-only, and loading states. Suitable for all standard text input types.

```tsx live
<Input placeholder="Your name" />
```

[View full documentation.](../api/form/input)

---

## TextArea

A Bulma-styled multi-line text input. Supports color, size, rounded, static/read-only, and fixed size.

```tsx live
<TextArea placeholder="Your message" rows={4} />
```

[View full documentation.](../api/form/textarea)

---

## Select

A Bulma-styled dropdown for single or multiple selections. Supports color, size, rounded, loading, and multiselect.

```tsx live
<Select>
  <option value="">Please select</option>
  <option value="option1">Option 1</option>
</Select>
```

[View full documentation.](../api/form/select)

---

## File

A Bulma-styled file input with support for color, size, boxed/fullwidth/align styles, icons, and filename display.

```tsx live
<File label="Choose a file..." />
```

[View full documentation.](../api/form/file)

---

## Field

A Bulma-styled form field container for labels, grouped controls, and horizontal layouts. Compose labeled, grouped, or horizontal form layouts.

```tsx live
<Field label="Email">
  <Input placeholder="you@example.com" />
</Field>
```

[View full documentation.](../api/form/field)

:::tip
Use `Field` to group and label form controls for accessibility and layout.
:::

---

## Control

A Bulma-styled wrapper for form controls, providing consistent spacing, icon placement, and loading indicators.

```tsx live
<Control>
  <Input placeholder="Username" />
</Control>
```

[View full documentation.](../api/form/control)

:::tip
Wrap inputs, selects, or textareas in `Control` for proper Bulma styling and icon support.
:::

---

For more details and advanced usage, see the full documentation for each component linked above.
