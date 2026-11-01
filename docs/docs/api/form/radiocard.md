---
title: RadioCard
sidebar_label: RadioCard
description: The `RadioCard` component is a radio button drawn as a card, with a title and a description, picked wherever you click it.
---

# RadioCard

## Overview

<!-- bestax:generated overview -->

The `RadioCard` component is a radio button drawn as a card, with a title and a description, picked wherever you click it.

<!-- /bestax:generated overview -->

Reach for it where each option wants a line or two of its own and the whole box should be the
thing you click: a plan, a shipping method, an answer in a setup step. For choices you can take
any of, use [`CheckboxCard`](./checkboxcard.md).

It's a real radio button inside a `<label>`, so it sends its `value` with a form, and the cards
that share a `name` are one choice: Tab lands on the picked one and the arrow keys move between
them. A screen reader hears the title as its name and the description after it. Inside
[`Radios`](./radios.md) it takes the group's `name` and selection, as [`Radio`](./radio.md) does.

:::info
Bulma has no selectable card, so `RadioCard` brings its own styles, in `bestax.css` and its
variants, or in `extras.css` next to your own Bulma. The surface is Bulma's `.card`, so a site's
Card theming applies to it.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { RadioCard } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Put the cards in `Radios` with a `name`, and give each a `value`, a `title` and a `description`.
Click anywhere on a card to pick it, or Tab to the group and use the arrow keys.

```tsx live
<Radios label="Plan" name="plan" defaultValue="pro">
  <RadioCard
    value="starter"
    title="Starter"
    description="One site, community support."
  />
  <RadioCard value="pro" title="Pro" description="Ten sites, email support." />
  <RadioCard
    value="team"
    title="Team"
    description="Unlimited sites, a support plan."
  />
</Radios>
```

The cards share the row and wrap once they'd get narrower than `--bulma-radio-card-min-width`.

### Controlled

The group holds the selection, here in state.

```tsx live
function example() {
  const [shipping, setShipping] = useState('standard');
  return (
    <>
      <Radios
        label="Shipping"
        name="shipping"
        value={shipping}
        onChange={setShipping}
      >
        <RadioCard
          value="standard"
          title="Standard"
          description="Arrives in 4 to 6 days."
        />
        <RadioCard
          value="express"
          title="Express"
          description="Arrives tomorrow."
        />
        <RadioCard value="pickup" title="Pickup" description="From the shop." />
      </Radios>
      <Paragraph mt="3">Shipping: {shipping}</Paragraph>
    </>
  );
}
```

### Without the Indicator

With `hasIndicator={false}` the card drops its radio, and the edge alone shows which is picked:
it's thicker as well as colored, so the selection never rests on color.

```tsx live
<Radios label="Delivery time" name="time" defaultValue="morning">
  <RadioCard
    value="morning"
    hasIndicator={false}
    title="Morning"
    description="8 to 12"
  />
  <RadioCard
    value="afternoon"
    hasIndicator={false}
    title="Afternoon"
    description="12 to 5"
  />
  <RadioCard
    value="evening"
    hasIndicator={false}
    title="Evening"
    description="5 to 9"
  />
</Radios>
```

### More in the Card

Anything you pass as children follows the description, such as a price. A link works, and
following it doesn't pick the card. A `<label>` holds phrasing content only, so use spans, images
and links: a button or another input can't go inside one at all, and a `<div>`, a heading or a
`<p>` isn't valid there either.

```tsx live
<Radios label="Plan" name="priced-plan" defaultValue="monthly">
  <RadioCard value="monthly" title="Monthly" description="Cancel anytime.">
    <Span display="block" mt="2" textWeight="semibold">
      $12 a month
    </Span>
  </RadioCard>
  <RadioCard value="yearly" title="Yearly" description="Two months free.">
    <Span display="block" mt="2" textWeight="semibold">
      $120 a year
    </Span>
    <a href="#yearly-terms">How billing works</a>
  </RadioCard>
</Radios>
```

What's in the children isn't read when the radio takes focus, so put what a screen reader should
hear in `title` and `description`.

### Columns

A Bulma [`Grid`](../grid/grid.md) inside the group lines the cards up in columns. Give it
`flexGrow="1"` so it fills the group's row.

```tsx live
<Radios label="Time" name="slot" defaultValue="10">
  <Grid minCol={10} flexGrow="1">
    {['9', '10', '11', '12', '13', '14'].map(hour => (
      <RadioCard
        key={hour}
        value={hour}
        hasIndicator={false}
        title={`${hour}:00`}
        description="Open"
      />
    ))}
  </Grid>
</Radios>
```

### Colors

`color` paints the radio and the edge of the picked card. It takes the values
[`radioColors`](./radio.md#valid-colors-and-sizes) holds.

```tsx live
<Radios name="accent" defaultValue="success">
  {radioColors.map(color => (
    <RadioCard key={color} value={color} color={color} title={color} />
  ))}
</Radios>
```

### Disabled

A disabled card dims, takes no clicks, and the arrow keys skip it.

```tsx live
<Radios label="Size" name="size" defaultValue="m">
  <RadioCard value="s" title="Small" description="In stock." />
  <RadioCard value="m" title="Medium" description="In stock." />
  <RadioCard value="l" disabled title="Large" description="Sold out." />
</Radios>
```

### Form Submission

The picked card sends its `name` and `value`, like any radio, and `required` on the cards stops a
form going without one.

```tsx live
function example() {
  const [sent, setSent] = useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        setSent(String(new FormData(e.currentTarget).get('ship')));
      }}
    >
      <Radios label="Shipping" name="ship">
        <RadioCard
          value="standard"
          required
          title="Standard"
          description="4 to 6 days."
        />
        <RadioCard
          value="express"
          required
          title="Express"
          description="Tomorrow."
        />
      </Radios>
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
[CSS & Sass Variables](#css--sass-variables), style the edge, the radio and the text. Set either
on a class you pass through `className`, which lands on the `.radio-card` label that declares
them, and write the selector with both classes (`.radio-card.compact-card`,
`.bestax-radio-card.compact-card` under the prefixed flavor) so it wins whatever order the
stylesheets load in.

Here the padding is tighter and the cards wrap sooner:

```css
.radio-card.compact-card {
  --bulma-card-content-padding: 1rem;
  --bulma-radio-card-min-width: 16rem;
}
```

```tsx
<Radios name="plan">
  <RadioCard className="compact-card" value="starter" title="Starter" />
  <RadioCard className="compact-card" value="pro" title="Pro" />
</Radios>
```

---

## Accessibility

- The card is a `<label>` around a native `<input type="radio">`, so a click anywhere on it picks
  the radio and it sends its value with a form.
- Cards that share a `name` are one group to the browser: Tab lands on the picked card, or the
  first, and the arrow keys move and pick, skipping disabled cards. Give `Radios` a `name`, or
  each card the same one; without it each card is a group of its own.
- The radio is named by the title, through `aria-labelledby`, and described by the description,
  through `aria-describedby`. An `aria-label` or `aria-labelledby` you pass wins. Without a title,
  the card's own text names it, as a label's text does.
- The children aren't read when the radio takes focus. Put what matters in `title` and
  `description`.
- A link inside the card is its own Tab stop, and following it doesn't pick the card. A button or
  another input can't go inside a `<label>`.
- Keyboard focus draws an outline around the whole card, in Bulma's focus color, whatever the
  card's color.
- The selection never rests on color: the radio shows it, and the picked card's edge is twice as
  thick, with or without the radio.
- Contrast: against the card, a picked edge in `primary` or `link` clears WCAG 1.4.11's 3:1 on a
  light page, and in every color on a dark one. `info`, `success`, `warning` and `danger` fall
  short on a light page, where the edge's width and the radio still show the selection.
- In forced colors (Windows contrast themes), Bulma's card loses its shadow, so the edge is a
  real border there: the system's text color, `Highlight` and still thicker when picked, and gray
  when disabled. The radio takes system colors as `Radio`'s does, and the focus outline is
  `Highlight`.
- The edge and the radio change without a transition under `prefers-reduced-motion: reduce`.

---

## Related Components

- [`CheckboxCard`](./checkboxcard.md): The same card for choices you can take any of.
- [`Radios`](./radios.md): The group that names a set of cards and holds the selection.
- [`Radio`](./radio.md): A plain radio with a label beside it.
- [`SegmentedControl`](../components/segmentedcontrol.md): A short row of options that sends no
  form value.
- [`Card`](../components/card.md): Bulma's card, whose variables style this one's surface.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: RadioCard Stories](https://bestax.io/storybook/?path=/story/form-radiocard--default)
- [WAI-ARIA APG: Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
- [HTML: the label element](https://html.spec.whatwg.org/multipage/forms.html#the-label-element)

---

## Props

<!-- bestax:generated props -->

| Prop           | Type                                                                            | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`        | `React.ReactNode`                                                               | —       | What the option is, such as "Express". It names the radio, so a screen reader says it with the state and its place in the group. Without it, the card's whole text names the radio, as a label's text does.                                                                                                                                                                                                                                                                                                                                           |
| `description`  | `React.ReactNode`                                                               | —       | A line or two about the option, read after the name and the state. It's the radio's description when `title`, `aria-label` or `aria-labelledby` names it. Without one of those it's part of the name already, so it isn't read twice.                                                                                                                                                                                                                                                                                                                 |
| `children`     | `React.ReactNode`                                                               | —       | Anything else in the card, after the description, such as a price. A label holds phrasing content only, so spans, images and links: a link works and doesn't pick the card, but a button or another input can't go inside a label at all. It isn't read when the radio takes focus, so put what a screen reader should hear in `title` and `description`.                                                                                                                                                                                             |
| `hasIndicator` | `boolean`                                                                       | `true`  | Shows the radio at the start of the card. Without it, the card's edge alone shows the selection, and it's thicker when picked, so the selection never rests on color.                                                                                                                                                                                                                                                                                                                                                                                 |
| `color`        | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | The color of the radio and of a picked card's edge.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `textColor`    | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color helper, on the card. The title and the children take it, and the description keeps its own color.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `disabled`     | `boolean`                                                                       | `false` | Whether the card is disabled. A disabled card dims, takes no clicks, and the arrow keys skip it.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `className`    | `string`                                                                        | —       | Additional CSS classes, on the outer `<label>`, the card. That's the element that declares the `--bulma-radio-card-*` variables, and Bulma's `--bulma-card-*` ones, so a class is how to set one: `style` and the other input attributes go to the `<input>`. Name `.radio-card` beside your class in the selector, so it beats the card's own declaration whatever order the stylesheets load in. A `color` prop declares the active color again on `.radio-card.is-<color>`, which ties that selector, so leave `color` unset when a class sets it. |
| `ref`          | `React.Ref<HTMLInputElement>`                                                   | —       | Forwarded to the underlying element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `name`         | `string`                                                                        | —       | The form field name, which the cards of one choice share, so the arrow keys move between them. Inside `Radios`, the group's `name` when this is unset.                                                                                                                                                                                                                                                                                                                                                                                                |
| `value`        | `string`                                                                        | —       | What a form sends when this card is the one picked. Inside a `Radios` group that takes `value`, `defaultValue` or `onChange`, the card is checked while the group's value is this. A group given only `onChange` starts from the card with `defaultChecked`.                                                                                                                                                                                                                                                                                          |
| `...`          | All standard `<input>` attributes and Bulma helper props                        | —       | Helper props go on the outer `<label>`, the `.card`, with `className`. The other attributes go on the `<input>`. See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                    |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`RadioCard` registers these variables on its own `.radio-card` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                | Sass Variable                        | Default                                                                 |
| ------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| `--bulma-radio-card-border-width`           | `$radio-card-border-width`           | `1px`                                                                   |
| `--bulma-radio-card-border-color`           | `$radio-card-border-color`           | `var(--bulma-border)`                                                   |
| `--bulma-radio-card-hover-border-color`     | `$radio-card-hover-border-color`     | `var(--bulma-border-hover)`                                             |
| `--bulma-radio-card-checked-border-width`   | `$radio-card-checked-border-width`   | `2px`                                                                   |
| `--bulma-radio-card-active-color`           | `$radio-card-active-color`           | `var(--bulma-primary)`                                                  |
| `--bulma-radio-card-focus-color`            | `$radio-card-focus-color`            | `hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l))` |
| `--bulma-radio-card-focus-width`            | `$radio-card-focus-width`            | `var(--bulma-focus-width)`                                              |
| `--bulma-radio-card-focus-offset`           | `$radio-card-focus-offset`           | `2px`                                                                   |
| `--bulma-radio-card-gap`                    | `$radio-card-gap`                    | `0.75em`                                                                |
| `--bulma-radio-card-min-width`              | `$radio-card-min-width`              | `12rem`                                                                 |
| `--bulma-radio-card-title-weight`           | `$radio-card-title-weight`           | `var(--bulma-weight-semibold)`                                          |
| `--bulma-radio-card-description-color`      | `$radio-card-description-color`      | `var(--bulma-text-weak)`                                                |
| `--bulma-radio-card-indicator-size`         | `$radio-card-indicator-size`         | `1.25em`                                                                |
| `--bulma-radio-card-indicator-border-width` | `$radio-card-indicator-border-width` | `2px`                                                                   |
| `--bulma-radio-card-indicator-border-color` | `$radio-card-indicator-border-color` | `var(--bulma-text-weak)`                                                |
| `--bulma-radio-card-disabled-opacity`       | `$radio-card-disabled-opacity`       | `0.5`                                                                   |
| `--bulma-radio-card-transition-duration`    | `$radio-card-transition-duration`    | `var(--bulma-duration)`                                                 |

<!-- /bestax:generated cssvars -->
