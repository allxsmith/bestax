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

The box reads the variables listed under [CSS & Sass Variables](#css--sass-variables). A checked box is filled with `--bulma-checkbox-active-color`, a mixed one with `--bulma-checkbox-indeterminate-color`, and the check mark and the mixed dash on top are both `--bulma-checkbox-check-color`, so a dark fill takes a light check color. Set them on a class you pass through `className`, which lands on the `.styled-checkbox` label that declares them, and write the selector with both classes (`.styled-checkbox.ink-checkbox`, `.bestax-styled-checkbox.ink-checkbox` under the prefixed flavor) so it wins whatever order the stylesheets load in. `style` and the other input attributes go to the `<input>`, so a variable set there reaches nothing.

Here the fill is the scheme's strongest text color and the mark is its page color, so the box reads in light and dark alike:

```css
.styled-checkbox.ink-checkbox {
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

A `color` prop declares both fills again on `.styled-checkbox.is-<color>`, which ties with that selector and leaves load order to decide, so leave `color` unset on a box whose fill a class sets.

### Box Size

The box is `--bulma-checkbox-size` across, `1.25em` by default, so it grows with the label's font size and the `size` prop. It doesn't go below 24px, whatever that variable says: the stylesheet gives the box a `min-width` and `min-height` of 24px, the minimum size WCAG 2.2 sets for a target (2.5.8, Target Size (Minimum)), so a box with no label text beside it is still easy to hit. With Bulma's default font sizes, `1.25em` comes out under 24px at the default and `small` sizes, so those two boxes are both 24px.

For a smaller box, lower the floor along with the size, on a class you pass through `className`. Name both classes in each selector, as for the colors above, and use `.bestax-styled-checkbox` and `.bestax-check` under the prefixed flavor:

```css
.styled-checkbox.compact-checkbox {
  --bulma-checkbox-size: 20px;
}

.styled-checkbox.compact-checkbox .check {
  min-width: 0;
  min-height: 0;
}
```

```tsx
<Checkbox className="compact-checkbox">Remember me</Checkbox>
```

Keep the label text inside the `Checkbox` when you shrink the box. The whole label is the click target, so it stays easy to hit when the box alone is small.

---

## Accessibility

- Each `Checkbox` is rendered as a `<label>` wrapping an `<input type="checkbox">` and the label text, for optimal accessibility.
- The clickable area includes both box and label by default.
- Browsers expose a box with `indeterminate` set as mixed, so the component adds no ARIA for it.
- The box is at least 24px square, the minimum size WCAG 2.2 sets for a target (2.5.8), whatever `--bulma-checkbox-size` says. [Box Size](#box-size) shows how to make it smaller, and why to keep the label text inside the `Checkbox` when you do.
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

| Prop            | Type                                                                            | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color`         | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Color of the checkbox.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `size`          | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | —       | Size of the checkbox.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `textColor`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color helper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `disabled`      | `boolean`                                                                       | `false` | Whether the checkbox is disabled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `indeterminate` | `boolean`                                                                       | —       | Shows the mixed state, as in a "Select all" box when some of what it covers is checked. It's a look and an announcement only: `checked` is still the value, and a click still toggles `checked`. Set to `true` or `false`, it's controlled: a browser clears the mixed state on a click, so the component sets it again from this prop after every click and every render. Unset isn't `false`. The component leaves the input's own `indeterminate` property alone, so a ref can set it, and going from set to unset clears it once and hands it back. It has no HTML attribute, so server-rendered markup can't carry it, and a mixed box renders unmixed until hydration. |
| `className`     | `string`                                                                        | —       | Additional CSS classes, on the outer `<label>`. That's the element that declares the `--bulma-checkbox-*` variables, so a class is how to set one: `style` and the other input attributes go to the `<input>`. Name `.styled-checkbox` beside your class in the selector, so it beats the label's own declaration whatever order the stylesheets load in. A `color` prop declares the fills again on `.styled-checkbox.is-<color>`, which ties that selector, so leave `color` unset when a class sets them.                                                                                                                                                                 |
| `children`      | `React.ReactNode`                                                               | —       | The label/content for the checkbox.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `ref`           | `React.Ref<HTMLInputElement>`                                                   | —       | Forwarded to the underlying element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `...`           | All standard `<input>` attributes and Bulma helper props                        | —       | Helper props go on the outer `<label>`, with `className`. The other attributes go on the `<input>`. See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

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

`--bulma-checkbox-size` has a floor: the box doesn't render smaller than 24px, whatever the variable says. [Box Size](#box-size) says why, and how to go below it.
