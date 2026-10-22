---
title: Checkbox
sidebar_label: Checkbox
description: The `Checkbox` component provides a Bulma-styled checkbox input.
---

# Checkbox

## Overview

<!-- bestax:generated overview -->

The `Checkbox` component provides a Bulma-styled checkbox input.

<!-- /bestax:generated overview -->

Pass the label as children; you can include plain text, links, or custom JSX. Use it for boolean choices and combine with the `Checkboxes` component for grouped options.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Checkboxes, Checkbox } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Checkbox

This example shows a simple `Checkbox` component for a single boolean choice. The label is provided as the `children` prop, and the checkbox is fully accessible and styled with Bulma.

```tsx live
<Checkbox> Stay Signed In </Checkbox>
```

### Checkbox With Link

This example demonstrates using the `Checkbox` component with a custom label that includes a link. The `children` prop can contain any React nodes, such as anchor tags, to create rich, accessible labels for agreements or terms.

```tsx live
<Checkbox>
  I have read and agree to the
  <a href="#" target="_blank" rel="noopener noreferrer">
    terms and conditions
  </a>
  .
</Checkbox>
```

### Disabled Checkbox

Set the `disabled` prop to render a non-interactive checkbox. This is useful for indicating unavailable options in forms, and the checkbox will appear visually disabled and cannot be toggled by the user.

```tsx live
<Checkbox disabled> Stay Signed In </Checkbox>
```

### Group/List of Checkboxes

This example uses the `Checkboxes` component to render a list of checkboxes. Each `Checkbox` receives its own label via the `children` prop. Use this pattern for lists of boolean options, such as tasks or preferences.

```tsx live
<Checkboxes>
  <Checkbox> Make the bed </Checkbox>
  <Checkbox> Brush teeth </Checkbox>
  <Checkbox> Do homework </Checkbox>
  <Checkbox> Feed the pet </Checkbox>
  <Checkbox> Take out the trash </Checkbox>
  <Checkbox> Clean your room </Checkbox>
  <Checkbox> Set the table </Checkbox>
  <Checkbox> Help with dishes </Checkbox>
  <Checkbox> Water the plants </Checkbox>
  <Checkbox> Put away toys </Checkbox>
</Checkboxes>
```

### Mixed state

Set `indeterminate` to draw the mixed state, the dash a "Select all" box shows when only some of what it covers is checked. It changes the look and what a screen reader announces, nothing else: `checked` is still the value, and a click still toggles it. So work both out from the list, as here, where a `Checkboxes` group holds the picks.

```tsx live
function example() {
  const toppings = ['Cheese', 'Mushrooms', 'Olives'];
  const [picked, setPicked] = useState(['Cheese']);
  const allPicked = picked.length === toppings.length;

  return (
    <Block>
      <Checkbox
        checked={allPicked}
        indeterminate={picked.length > 0 && !allPicked}
        onChange={() => setPicked(allPicked ? [] : toppings)}
      >
        Select all
      </Checkbox>
      <Checkboxes value={picked} onChange={setPicked} ml="5">
        {toppings.map(topping => (
          <Checkbox key={topping} value={topping}>
            {topping}
          </Checkbox>
        ))}
      </Checkboxes>
    </Block>
  );
}
```

There's no HTML attribute for the mixed state, so server-rendered markup shows the box unmixed until the page hydrates.

### Valid Colors and Sizes

The values `color` and `size` accept are exported as readonly tuples, `checkboxColors` and `checkboxSizes`. The prop types are built from them, so they hold the same values as the Props table below. Map over them to build a color or size picker, or check a value that arrives at runtime (from a CMS or a query string, say) before you pass it in: a value outside the tuple adds no modifier class. Import them from the package root. The [valid value constants](../helpers/valid-values.md#form-control-constants) page covers the typing and validation idioms.

```tsx live
import { Checkbox, Checkboxes } from '@allxsmith/bestax-bulma';
import { checkboxColors, checkboxSizes } from '@allxsmith/bestax-bulma';

function example() {
  return (
    <>
      <Checkboxes>
        {checkboxColors.map(color => (
          <Checkbox key={color} color={color} defaultChecked>
            {color}
          </Checkbox>
        ))}
      </Checkboxes>
      <Checkboxes>
        {checkboxSizes.map(size => (
          <Checkbox key={size} size={size} defaultChecked>
            {size}
          </Checkbox>
        ))}
      </Checkboxes>
    </>
  );
}
```

### Theming the Box

The box reads the variables listed under [CSS & Sass Variables](#css--sass-variables). A checked box is filled with `--bulma-checkbox-active-color`, a mixed one with `--bulma-checkbox-indeterminate-color`, and the check mark and the mixed dash on top are both `--bulma-checkbox-check-color`, so a dark fill takes a light check color. Set them on a class you pass through `className`, which lands on the `.styled-checkbox` label that declares them. `style` and the other input attributes go to the `<input>`, so a variable set there reaches nothing.

Here the fill is the scheme's strongest text color and the mark is its page color, so the box reads in light and dark alike:

```css
.ink-checkbox {
  --bulma-checkbox-active-color: var(--bulma-text-strong);
  --bulma-checkbox-indeterminate-color: var(--bulma-text-strong);
  --bulma-checkbox-check-color: var(--bulma-scheme-main);
}
```

```tsx
<Checkbox className="ink-checkbox" defaultChecked>
  Remember me
</Checkbox>
```

A `color` prop declares both fills again on `.styled-checkbox.is-<color>`, which a lone class loses to, so leave `color` unset on a box whose fill a class sets.

---

## Accessibility

- Each `Checkbox` is rendered as a `<label>` wrapping an `<input type="checkbox">` and the label text, for optimal accessibility.
- The clickable area includes both box and label by default.
- Browsers expose a box with `indeterminate` set as mixed, so the component adds no ARIA for it.
- An unchecked box shows only its border, `--bulma-checkbox-border-color`. It defaults to `--bulma-text-weak`, which holds the 3:1 contrast WCAG asks of a control's boundary (non-text contrast) on Bulma's page and card surfaces in light and dark. Hold a replacement border, and a custom check color on its fill, to 3:1 as well.
- In forced colors (Windows contrast themes), the box, the check mark and the mixed dash take system colors, so they stay visible whatever the variables hold.

---

## Related Components

- [`Checkboxes`](./checkboxes.md): For grouped checkboxes.
- [`Field`](./field.md): For labeled/structured forms.
- [Helper Props](../helpers/usebulmaclasses.md): For spacing, color, etc.

---

## Additional Resources

- [Bulma Checkbox Documentation](https://bulma.io/documentation/form/checkbox/)
- [Storybook: Checkbox Stories](https://bestax.io/storybook/?path=/story/form-checkbox--default)

---

## Props

<!-- bestax:generated props -->

| Prop            | Type                                                                            | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `color`         | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Color of the checkbox.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `size`          | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | —       | Size of the checkbox.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `textColor`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color helper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `disabled`      | `boolean`                                                                       | `false` | Whether the checkbox is disabled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `indeterminate` | `boolean`                                                                       | `false` | Shows the mixed state, as in a "Select all" box when some of what it covers is checked. It's a look and an announcement only: `checked` is still the value, and a click still toggles `checked`. A browser clears the mixed state on a click, so the component sets it again from this prop after every click and every render. Left unset, the component doesn't touch it, and once it has set it, going back to unset clears it once and hands it back. It has no HTML attribute, so server-rendered markup can't carry it, and a mixed box renders unmixed until hydration. |
| `className`     | `string`                                                                        | —       | Additional CSS classes, on the outer `<label>`. That's the element that declares the `--bulma-checkbox-*` variables, so a class is how to set one: `style` and the other input attributes go to the `<input>`.                                                                                                                                                                                                                                                                                                                                                                 |
| `children`      | `React.ReactNode`                                                               | —       | The label/content for the checkbox.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `ref`           | `React.Ref<HTMLInputElement>`                                                   | —       | Forwarded to the underlying element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `...`           | All standard `<input>` attributes and Bulma helper props                        | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Checkbox` registers these variables on its own `.styled-checkbox` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                           | Sass Variable                   | Default                      |
| -------------------------------------- | ------------------------------- | ---------------------------- |
| `--bulma-checkbox-size`                | `$checkbox-size`                | `1.25em`                     |
| `--bulma-checkbox-border-width`        | `$checkbox-border-width`        | `2px`                        |
| `--bulma-checkbox-radius`              | `$checkbox-radius`              | `var(--bulma-radius-small)`  |
| `--bulma-checkbox-border-color`        | `$checkbox-border-color`        | `var(--bulma-text-weak)`     |
| `--bulma-checkbox-background`          | `$checkbox-background`          | `transparent`                |
| `--bulma-checkbox-check-color`         | `$checkbox-check-color`         | `var(--bulma-scheme-invert)` |
| `--bulma-checkbox-active-color`        | `$checkbox-active-color`        | `var(--bulma-primary)`       |
| `--bulma-checkbox-label-gap`           | `$checkbox-label-gap`           | `0.5em`                      |
| `--bulma-checkbox-focus-shadow-size`   | `$checkbox-focus-shadow-size`   | `0 0 0 0.125em`              |
| `--bulma-checkbox-transition-duration` | `$checkbox-transition-duration` | `var(--bulma-duration)`      |
| `--bulma-checkbox-indeterminate-color` | `$checkbox-indeterminate-color` | `var(--bulma-primary)`       |

<!-- /bestax:generated cssvars -->
