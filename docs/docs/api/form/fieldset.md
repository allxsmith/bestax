---
title: Fieldset
sidebar_label: Fieldset
description: The `Fieldset` component groups a section of a form in a native `<fieldset>`, named by its `legend`, which a `disabled` switches off as a whole.
---

# Fieldset

## Overview

<!-- bestax:generated overview -->

The `Fieldset` component groups a section of a form in a native `<fieldset>`, named by its `legend`, which a `disabled` switches off as a whole.

<!-- /bestax:generated overview -->

Reach for it where several fields belong together: an address, a payment method, a set of
notification settings. The legend names the group, so a screen reader hears "Shipping address"
as it moves into the street and city, and `disabled` turns the whole section off at once, the
native controls and bestax's own widgets alike.

It comes bordered, filled or unstyled. An unstyled Fieldset draws no box, which suits one that's
there to name a group or to disable a form while it saves.

:::info
Bulma styles a disabled fieldset's controls but has no fieldset look of its own, so `Fieldset`
brings its own styles, in `bestax.css` and its variants, or in `extras.css` next to your own Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Fieldset } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it a `legend` and put the fields inside. The convenience inputs render their own `Field`s in
it, as they would at the top of a form.

```tsx live
<Fieldset legend="Shipping address">
  <Input label="Street" name="street" />
  <Input label="City" name="city" />
</Fieldset>
```

### Variants

`default` draws a border with the legend on it, `filled` adds a tinted background, and `unstyled`
draws no box, with the legend above the content like a label.

```tsx live
<Columns>
  <Column>
    <Fieldset legend="Default">
      <Input label="Street" name="street-default" />
    </Fieldset>
  </Column>
  <Column>
    <Fieldset variant="filled" legend="Filled">
      <Input label="Street" name="street-filled" />
    </Fieldset>
  </Column>
  <Column>
    <Fieldset variant="unstyled" legend="Unstyled">
      <Input label="Street" name="street-unstyled" />
    </Fieldset>
  </Column>
</Columns>
```

### With a Message

`message` puts a help line under the group, colored by `messageColor`, and the fieldset's
`aria-describedby` points at it, so it's read as the group's description. It says something about
the group as a whole; each input keeps its own `message` for its own errors.

```tsx live
<Fieldset
  legend="Contact"
  message="Fill in the phone number or the email."
  messageColor="info"
>
  <Input label="Phone" name="phone" type="tel" />
  <Input label="Email" name="email" type="email" />
</Fieldset>
```

### Horizontal Fields

Horizontal fields go inside it as they would anywhere else.

```tsx live
<Fieldset legend="Contact details">
  <Input horizontal label="Phone" name="phone" type="tel" />
  <Input horizontal label="Email" name="email" type="email" />
  <Field horizontal label="Subject">
    <Control>
      <Select name="subject">
        <option>Business</option>
        <option>Support</option>
      </Select>
    </Control>
  </Field>
</Fieldset>
```

### Disabled

`disabled` disables every control inside. The browser disables the native ones, so they can't be
focused or clicked and their values aren't submitted, and each bestax input takes it as the
default for its own `disabled`, so widgets the browser doesn't reach, such as `Rate`'s stars,
stop too and show their disabled look.

```tsx live
<Fieldset legend="Preferences" disabled>
  <Input label="Display name" name="display-name" defaultValue="Ada" />
  <Rate label="Rating" name="rating" defaultValue={3} />
  <Slider label="Volume" name="volume" defaultValue={40} />
  <Checkboxes label="Notifications" name="notifications">
    <Checkbox value="email">Email</Checkbox>
    <Checkbox value="sms">SMS</Checkbox>
  </Checkboxes>
</Fieldset>
```

### Turned On From the Legend

The browser leaves the controls in a fieldset's legend enabled, so a `Checkbox` there can turn the
rest of the section on. The checkbox's text then names the group too.

```tsx live
function ShippingAddress() {
  const [different, setDifferent] = React.useState(false);
  return (
    <Fieldset
      disabled={!different}
      legend={
        <Checkbox
          checked={different}
          onChange={event => setDifferent(event.target.checked)}
        >
          Ship to a different address
        </Checkbox>
      }
    >
      <Input label="Street" name="street" />
      <Input label="City" name="city" />
    </Fieldset>
  );
}
```

### Disabling a Form While It Saves

An unstyled Fieldset around the whole form switches it off while it's busy, the submit button
included.

```tsx live
function SavingForm() {
  const [saving, setSaving] = React.useState(false);
  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        setSaving(true);
        setTimeout(() => setSaving(false), 2000);
      }}
    >
      <Fieldset variant="unstyled" disabled={saving}>
        <Input label="Name" name="name" />
        <Rate label="Rating" name="rating" defaultValue={4} />
        <Button type="submit" color="primary" isLoading={saving}>
          Save
        </Button>
      </Fieldset>
    </form>
  );
}
```

---

## Accessibility

- **Name:** the legend names the group natively, so a screen reader announces it as a group
  called "Shipping address" with no ids to wire. A Fieldset with no legend is an unnamed group,
  which is fine for one that's only there to disable a form. Screen readers differ in how often
  they repeat a legend, so keep it short and the labels inside complete on their own.
- **Description:** the `message` is the group's description through `aria-describedby`, added to
  any ids you pass there.
- **Errors:** nothing marks the group invalid, since ARIA deprecates `aria-invalid` on a group.
  Put each input's error on that input with its own `color` and `message`.
- **Disabled:** native controls are disabled and left out of the form's data, and bestax's own
  widgets, such as `Rate` and the time wheels, leave the tab order and ignore input. An input's
  own `disabled`, when you set it, wins over the Fieldset's, though the browser keeps its native
  parts disabled. Controls in the legend stay enabled, and a Fieldset inside a disabled one is
  disabled too.
- **Not disabled:** links, `LinkButton`s and anything else that isn't a form control stay
  operable, as in plain HTML, so disable or hide those yourself.
- **Forced colors:** the border takes the system's text color, since the backgrounds are
  replaced there.

---

## Related Components

- [`Field`](./field.md): One labeled control, or a row of them.
- [`Checkboxes`](./checkboxes.md) and [`Radios`](./radios.md): A group of choices named by one
  label.
- [`Box`](../elements/box.md): A plain surface for content that isn't a form section.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Fieldset Stories](https://bestax.io/storybook/?path=/story/form-fieldset--default)
- [HTML: the fieldset element](https://html.spec.whatwg.org/multipage/form-elements.html#the-fieldset-element)
- [W3C WAI: Grouping controls](https://www.w3.org/WAI/tutorials/forms/grouping/)
- [Bulma: Form controls](https://bulma.io/documentation/form/general/)

---

## Props

<!-- bestax:generated props -->

| Prop               | Type                                                                            | Default     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `legend`           | `React.ReactNode`                                                               | —           | The group's name, shown in a `<legend>`, which names the fieldset with no ids to wire. The `default` and `filled` variants draw it on the border, and `unstyled` above the content. Controls you put in it, such as a `Checkbox` that turns the section on, stay enabled when the Fieldset is disabled, as the browser leaves them.                                                                                                                                                                                 |
| `legendProps`      | `React.HTMLAttributes<HTMLLegendElement>`                                       | —           | Props for the `<legend>`, such as an `id` or a `className`.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `variant`          | `'default'` \| `'filled'` \| `'unstyled'`                                       | `'default'` | The look: `default` draws a border round the group, `filled` adds a tinted background, and `unstyled` draws no box at all, which suits a Fieldset that's there to name or disable a group.                                                                                                                                                                                                                                                                                                                          |
| `disabled`         | `boolean`                                                                       | `false`     | Disables every control inside. The browser disables the native ones and leaves them out of the form's data, and each bestax input with a `disabled` prop takes this as that prop's default, which also stops widgets the browser doesn't reach, such as `Rate`'s stars and the time wheels, and gives them their disabled look. An input's own `disabled` still wins when you set it, though the browser keeps its native parts disabled whatever it says. Links and `LinkButton`s stay operable, as in plain HTML. |
| `message`          | `React.ReactNode`                                                               | —           | Help text under the group. It describes the fieldset through `aria-describedby`, alongside any ids you pass there. Nothing passes it to the inputs, so each still shows its own errors.                                                                                                                                                                                                                                                                                                                             |
| `messageColor`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —           | Bulma color for the message.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `textColor`        | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —           | Text color helper, for the text in the group. The legend keeps its own color.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `bgColor`          | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —           | Background color helper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `className`        | `string`                                                                        | —           | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `children`         | `React.ReactNode`                                                               | —           | The group's content, such as `Field`s and inputs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `ref`              | `React.Ref<HTMLFieldSetElement>`                                                | —           | Ref forwarded to the `<fieldset>`, whose `elements` lists the controls inside.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `aria-describedby` | `string`                                                                        | —           | Ids of more text that describes the group. The `message`'s id is added after them.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `name`             | `string`                                                                        | —           | The fieldset's name in its form's `elements`. Nothing is submitted under it.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `...`              | All standard HTML attributes and Bulma helper props                             | —           | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Fieldset` registers these variables on its own `.fieldset` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                         | Sass Variable                 | Default                      |
| ------------------------------------ | ----------------------------- | ---------------------------- |
| `--bulma-fieldset-background`        | `$fieldset-background`        | `var(--bulma-scheme-main)`   |
| `--bulma-fieldset-filled-background` | `$fieldset-filled-background` | `var(--bulma-background)`    |
| `--bulma-fieldset-border-color`      | `$fieldset-border-color`      | `var(--bulma-border)`        |
| `--bulma-fieldset-border-width`      | `$fieldset-border-width`      | `1px`                        |
| `--bulma-fieldset-radius`            | `$fieldset-radius`            | `var(--bulma-radius-large)`  |
| `--bulma-fieldset-padding`           | `$fieldset-padding`           | `1.25rem`                    |
| `--bulma-fieldset-padding-top`       | `$fieldset-padding-top`       | `0.75rem`                    |
| `--bulma-fieldset-spacing`           | `$fieldset-spacing`           | `var(--bulma-block-spacing)` |
| `--bulma-fieldset-legend-color`      | `$fieldset-legend-color`      | `var(--bulma-label-color)`   |
| `--bulma-fieldset-legend-size`       | `$fieldset-legend-size`       | `var(--bulma-size-normal)`   |
| `--bulma-fieldset-legend-weight`     | `$fieldset-legend-weight`     | `var(--bulma-label-weight)`  |
| `--bulma-fieldset-legend-padding`    | `$fieldset-legend-padding`    | `0.5em`                      |
| `--bulma-fieldset-legend-spacing`    | `$fieldset-legend-spacing`    | `var(--bulma-label-spacing)` |

<!-- /bestax:generated cssvars -->
