---
title: CheckboxCard
sidebar_label: CheckboxCard
description: The `CheckboxCard` component is a checkbox drawn as a card, with a title and a description, that toggles wherever you click it.
---

# CheckboxCard

## Overview

<!-- bestax:generated overview -->

The `CheckboxCard` component is a checkbox drawn as a card, with a title and a description, that toggles wherever you click it.

<!-- /bestax:generated overview -->

Reach for it where each choice wants a line or two of its own and the whole box should be the
thing you click: add-ons at checkout, the topics a newsletter covers, the features a plan
includes. For a choice of one, use [`RadioCard`](./radiocard.md).

It's a real checkbox inside a `<label>`, so it sends its `value` with a form, Space toggles it,
and a screen reader hears the title as its name and the description after it. Inside
[`Checkboxes`](./checkboxes.md) it takes the group's `name` and selection, as
[`Checkbox`](./checkbox.md) does.

:::info
Bulma has no selectable card, so `CheckboxCard` brings its own styles, in `bestax.css` and its
variants, or in `extras.css` next to your own Bulma. The surface is Bulma's `.card`, so a site's
Card theming applies to it.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { CheckboxCard } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it a `title` and a `description`. Click anywhere on the card to toggle it.

```tsx live
<CheckboxCard title="Daily backups" description="Kept for 30 days." />
```

### In a Group

Inside `Checkboxes`, the cards share the group's `name` and the group holds the selection, here
controlled. They share the row and wrap once they'd get narrower than
`--bulma-checkbox-card-min-width`.

```tsx live
function example() {
  const [extras, setExtras] = useState(['backups']);
  return (
    <>
      <Checkboxes
        label="Add-ons"
        name="extras"
        value={extras}
        onChange={setExtras}
      >
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
        <CheckboxCard
          value="support"
          title="Priority support"
          description="Answers within the hour."
        />
      </Checkboxes>
      <Paragraph mt="3">Picked: {extras.join(', ') || 'nothing'}</Paragraph>
    </>
  );
}
```

### Without the Indicator

With `hasIndicator={false}` the card drops its checkbox, and the edge alone shows which are
checked: it's thicker as well as colored, so the selection never rests on color.

```tsx live
<Checkboxes label="Email me about" name="topics" defaultValue={['news']}>
  <CheckboxCard
    value="news"
    hasIndicator={false}
    title="Newsletter"
    description="Once a month."
  />
  <CheckboxCard
    value="releases"
    hasIndicator={false}
    title="Releases"
    description="When something ships."
  />
  <CheckboxCard
    value="events"
    hasIndicator={false}
    title="Events"
    description="Meetups near you."
  />
</Checkboxes>
```

### More in the Card

Anything you pass as children follows the description, such as a price. A link works, and
following it doesn't toggle the card. A `<label>` holds phrasing content only, so use spans,
images and links: a button or another input can't go inside one at all, and a `<div>`, a heading
or a `<p>` isn't valid there either.

```tsx live
<CheckboxCard title="Priority support" description="Answers within the hour.">
  <Span display="block" mt="2" textWeight="semibold">
    $9 a month
  </Span>
  <a href="#support-terms">What's covered</a>
</CheckboxCard>
```

What's in the children isn't read when the checkbox takes focus, so put what a screen reader
should hear in `title` and `description`.

### Columns

A Bulma [`Grid`](../grid/grid.md) inside the group lines the cards up in columns. Give it
`flexGrow="1"` so it fills the group's row.

```tsx live
<Checkboxes label="Toppings" name="toppings">
  <Grid minCol={12} flexGrow="1">
    {['Cheese', 'Mushrooms', 'Olives', 'Peppers', 'Onions', 'Basil'].map(
      topping => (
        <CheckboxCard
          key={topping}
          value={topping}
          title={topping}
          description="Free"
        />
      )
    )}
  </Grid>
</Checkboxes>
```

### Colors

`color` paints the checkbox and the edge of a checked card. It takes the values
[`checkboxColors`](./checkbox.md#valid-colors-and-sizes) holds.

```tsx live
<Checkboxes name="colors" defaultValue={[...checkboxColors]}>
  {checkboxColors.map(color => (
    <CheckboxCard
      key={color}
      value={color}
      color={color}
      title={color}
      description="Checked."
    />
  ))}
</Checkboxes>
```

### Disabled and Mixed

A disabled card dims, takes no clicks and leaves the Tab order. `indeterminate` shows the mixed
state, with the same contract as [`Checkbox`](./checkbox.md#mixed-state): it's a look and an
announcement, and `checked` is still the value.

```tsx live
<Checkboxes name="states">
  <CheckboxCard
    value="disabled"
    disabled
    title="Disabled"
    description="Not on your plan."
  />
  <CheckboxCard
    value="included"
    disabled
    defaultChecked
    title="Included"
    description="Part of every plan."
  />
  <CheckboxCard
    value="mixed"
    indeterminate
    title="Mixed"
    description="Some of what it covers."
  />
</Checkboxes>
```

### Form Submission

A checked card sends its `name` and `value`, like any checkbox.

```tsx live
function example() {
  const [sent, setSent] = useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setSent(data.getAll('extras').join(', ') || 'nothing');
      }}
    >
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
      <Button type="submit" color="primary">
        Send
      </Button>
      {sent && <Paragraph mt="3">Sent: {sent}</Paragraph>}
    </form>
  );
}
```

### Theming the Card

The card is Bulma's `.card`, so the [Card variables](../components/card.md#css--sass-variables)
style its surface, and its own variables, listed under
[CSS & Sass Variables](#css--sass-variables), style the edge, the checkbox and the text. Set
either on a class you pass through `className`, which lands on the `.checkbox-card` label that
declares them, and write the selector with both classes (`.checkbox-card.compact-card`,
`.bestax-checkbox-card.compact-card` under the prefixed flavor) so it wins whatever order the
stylesheets load in.

Here the padding is tighter and a checked edge is three pixels:

```css
.checkbox-card.compact-card {
  --bulma-card-content-padding: 1rem;
  --bulma-checkbox-card-checked-border-width: 3px;
}
```

```tsx
<CheckboxCard
  className="compact-card"
  title="Daily backups"
  description="Kept for 30 days."
/>
```

---

## Accessibility

- The card is a `<label>` around a native `<input type="checkbox">`, so a click anywhere on it
  toggles the checkbox, Space toggles it from the keyboard, and it sends its value with a form.
- The checkbox is named by the title, through `aria-labelledby`, and described by the
  description, through `aria-describedby`. An `aria-label` or `aria-labelledby` you pass wins.
  Without a title, the card's own text names it, as a label's text does.
- The children aren't read when the checkbox takes focus. Put what matters in `title` and
  `description`.
- A link inside the card is its own Tab stop, and following it doesn't toggle the card. A button
  or another input can't go inside a `<label>`.
- Keyboard focus draws an outline around the whole card, in Bulma's focus color, whatever the
  card's color.
- The selection never rests on color: the checkbox shows it, and a checked card's edge is twice
  as thick, with or without the checkbox.
- Contrast: against the card, a checked edge in `primary` or `link` clears WCAG 1.4.11's 3:1 on a
  light page, and in every color on a dark one. `info`, `success`, `warning` and `danger` fall
  short on a light page, where the edge's width and the checkbox still show the selection.
- In forced colors (Windows contrast themes), Bulma's card loses its shadow, so the edge is a
  real border there: the system's text color, `Highlight` and still thicker when checked, and
  gray when disabled. The checkbox takes system colors as `Checkbox`'s does, and the focus outline
  is `Highlight`.
- The edge and the checkbox change without a transition under `prefers-reduced-motion: reduce`.

---

## Related Components

- [`RadioCard`](./radiocard.md): The same card for a choice of one.
- [`Checkboxes`](./checkboxes.md): The group that names a set of cards and holds the selection.
- [`Checkbox`](./checkbox.md): A plain checkbox with a label beside it.
- [`Card`](../components/card.md): Bulma's card, whose variables style this one's surface.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: CheckboxCard Stories](https://bestax.io/storybook/?path=/story/form-checkboxcard--default)
- [WAI-ARIA APG: Checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/)
- [HTML: the label element](https://html.spec.whatwg.org/multipage/forms.html#the-label-element)

---

## Props

<!-- bestax:generated props -->

| Prop            | Type                                                                            | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`         | `React.ReactNode`                                                               | —       | What the option is, such as "Daily backups". It names the checkbox, so a screen reader says it with the state. Without it, the card's whole text names the checkbox, as a label's text does.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `description`   | `React.ReactNode`                                                               | —       | A line or two about the option, read after the name and the state. It's the checkbox's description when `title`, `aria-label` or `aria-labelledby` names it. Without one of those it's part of the name already, so it isn't read twice.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `children`      | `React.ReactNode`                                                               | —       | Anything else in the card, after the description, such as a price. A label holds phrasing content only, so spans, images and links: a link works and doesn't toggle the card, but a button or another input can't go inside a label at all. It isn't read when the checkbox takes focus, so put what a screen reader should hear in `title` and `description`.                                                                                                                                                                                                                                                                                                                 |
| `hasIndicator`  | `boolean`                                                                       | `true`  | Shows the checkbox at the start of the card. Without it, the card's edge alone shows the selection, and it's thicker when checked, so the selection never rests on color.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `color`         | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | The color of the checkbox and of a checked card's edge.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `textColor`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color helper, on the card. The title and the children take it, and the description keeps its own color.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `disabled`      | `boolean`                                                                       | `false` | Whether the card is disabled. A disabled card dims, takes no clicks, and leaves the Tab order.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `indeterminate` | `boolean`                                                                       | —       | Shows the mixed state, as in a "Select all" card when some of what it covers is checked. It's a look and an announcement only: `checked` is still the value, and a click still toggles `checked`. Set to `true` or `false`, it's controlled: a browser clears the mixed state on a click, so the component sets it again from this prop after every click and every render. Unset isn't `false`. The component leaves the input's own `indeterminate` property alone, so a ref can set it, and going from set to unset clears it once and hands it back. It has no HTML attribute, so server-rendered markup can't carry it, and a mixed card renders unmixed until hydration. |
| `className`     | `string`                                                                        | —       | Additional CSS classes, on the outer `<label>`, the card. That's the element that declares the `--bulma-checkbox-card-*` variables, and Bulma's `--bulma-card-*` ones, so a class is how to set one: `style` and the other input attributes go to the `<input>`. Name `.checkbox-card` beside your class in the selector, so it beats the card's own declaration whatever order the stylesheets load in. A `color` prop declares the active color again on `.checkbox-card.is-<color>`, which ties that selector, so leave `color` unset when a class sets it.                                                                                                                 |
| `ref`           | `React.Ref<HTMLInputElement>`                                                   | —       | Forwarded to the underlying element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `name`          | `string`                                                                        | —       | The form field name. Inside `Checkboxes`, the group's `name` when this is unset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `value`         | `string`                                                                        | —       | What a form sends for the card when it's checked. Inside a `Checkboxes` group that takes `value`, `defaultValue` or `onChange`, the card is checked while the group's value holds it. A group given only `onChange` starts from the cards' own `defaultChecked`.                                                                                                                                                                                                                                                                                                                                                                                                               |
| `...`           | All standard `<input>` attributes and Bulma helper props                        | —       | Helper props go on the outer `<label>`, the `.card`, with `className`. The other attributes go on the `<input>`. See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`CheckboxCard` registers these variables on its own `.checkbox-card` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                   | Sass Variable                           | Default                                                                 |
| ---------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `--bulma-checkbox-card-border-width`           | `$checkbox-card-border-width`           | `1px`                                                                   |
| `--bulma-checkbox-card-border-color`           | `$checkbox-card-border-color`           | `var(--bulma-border)`                                                   |
| `--bulma-checkbox-card-hover-border-color`     | `$checkbox-card-hover-border-color`     | `var(--bulma-border-hover)`                                             |
| `--bulma-checkbox-card-checked-border-width`   | `$checkbox-card-checked-border-width`   | `2px`                                                                   |
| `--bulma-checkbox-card-active-color`           | `$checkbox-card-active-color`           | `var(--bulma-primary)`                                                  |
| `--bulma-checkbox-card-focus-color`            | `$checkbox-card-focus-color`            | `hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l))` |
| `--bulma-checkbox-card-focus-width`            | `$checkbox-card-focus-width`            | `var(--bulma-focus-width)`                                              |
| `--bulma-checkbox-card-focus-offset`           | `$checkbox-card-focus-offset`           | `2px`                                                                   |
| `--bulma-checkbox-card-gap`                    | `$checkbox-card-gap`                    | `0.75em`                                                                |
| `--bulma-checkbox-card-min-width`              | `$checkbox-card-min-width`              | `12rem`                                                                 |
| `--bulma-checkbox-card-title-weight`           | `$checkbox-card-title-weight`           | `var(--bulma-weight-semibold)`                                          |
| `--bulma-checkbox-card-description-color`      | `$checkbox-card-description-color`      | `var(--bulma-text-weak)`                                                |
| `--bulma-checkbox-card-indicator-size`         | `$checkbox-card-indicator-size`         | `1.25em`                                                                |
| `--bulma-checkbox-card-indicator-border-width` | `$checkbox-card-indicator-border-width` | `2px`                                                                   |
| `--bulma-checkbox-card-indicator-border-color` | `$checkbox-card-indicator-border-color` | `var(--bulma-text-weak)`                                                |
| `--bulma-checkbox-card-indicator-radius`       | `$checkbox-card-indicator-radius`       | `var(--bulma-radius-small)`                                             |
| `--bulma-checkbox-card-check-color`            | `$checkbox-card-check-color`            | `var(--bulma-scheme-invert)`                                            |
| `--bulma-checkbox-card-disabled-opacity`       | `$checkbox-card-disabled-opacity`       | `0.5`                                                                   |
| `--bulma-checkbox-card-transition-duration`    | `$checkbox-card-transition-duration`    | `var(--bulma-duration)`                                                 |

<!-- /bestax:generated cssvars -->
