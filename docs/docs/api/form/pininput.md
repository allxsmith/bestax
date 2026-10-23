---
title: PinInput
sidebar_label: PinInput
description: The `PinInput` component is a field for a short code, such as a one-time code or a PIN, drawn as a row of boxes with one character in each.
---

# PinInput

## Overview

<!-- bestax:generated overview -->

The `PinInput` component is a field for a short code, such as a one-time code or a PIN, drawn as a row of boxes with one character in each.

<!-- /bestax:generated overview -->

Reach for it on a sign-in step that asks for the code from a text message or an email, a two-factor prompt, or a PIN. The code lives in one real `<input>` that lies over the boxes, the way shadcn/ui's InputOTP does it, rather than in an input per box. So a screen reader hears one field with its label, and paste, autofill from a text message and password managers work on it as they do on any other input.

---

## Import

<!-- bestax:generated import -->

```tsx
import { PinInput } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic PinInput

Six boxes for digits, named by its label. Click it and type, or paste a code.

```tsx live
<PinInput label="Verification code" />
```

---

### Verifying a Code

`onChange` gets the code as a string each time it changes, and `onComplete` gets it once each time a change fills the last box, which is where you check it. Show the result with `color`, `message` and `messageColor`, as on any other bestax input.

```tsx live
function example() {
  const [code, setCode] = useState('');
  const [checked, setChecked] = useState<string>();
  const wrong = checked !== undefined && checked !== '123456';
  return (
    <PinInput
      label="Enter the 6-digit code we sent you"
      value={code}
      onChange={next => {
        setCode(next);
        setChecked(undefined);
      }}
      onComplete={setChecked}
      color={wrong ? 'danger' : checked ? 'success' : undefined}
      message={
        wrong
          ? 'That code isn’t right. Try 123456.'
          : checked
            ? 'Verified.'
            : undefined
      }
      messageColor={wrong ? 'danger' : 'success'}
    />
  );
}
```

`onComplete` doesn't fire on a render, or for a `value` you set yourself. Typing the last character, pasting a code, or autofill does call it, and so does correcting a full code into a different one.

---

### Length

`length` sets how many boxes there are, and it's the input's `maxLength` too, so typing stops at the last box.

```tsx live
<Block>
  <PinInput label="PIN" length={4} />
  <PinInput label="Backup code" length={8} />
</Block>
```

---

### Letters and Digits

By default it takes digits and a phone shows its number pad. `type="alphanumeric"` takes the letters A to Z, in either case, and digits, with the full keyboard. A digit from any script, such as the Arabic-Indic `٣` or the Persian `۳` a phone keypad in those languages types, goes in as its ASCII digit, so the code reaches `onChange`, `onComplete` and the form as `0` to `9`. Anything else you type or paste is dropped, and the caret stays where it was.

```tsx live
<PinInput label="Invite code" type="alphanumeric" length={5} />
```

The input stays a text field either way, never `type="number"`, so a code keeps its leading zeros.

---

### Masked

`isMasked` shows a dot in each filled box in place of its character, and makes the input a password field, so a screen reader doesn't read the code out either.

```tsx live
<PinInput label="PIN" length={4} isMasked defaultValue="12" />
```

---

### Colors, Sizes and Rounded Boxes

Each box is a Bulma input, so it takes the colors and sizes an `Input` does, and `isRounded` makes the boxes round.

```tsx live
<Block>
  <PinInput label="Primary" color="primary" length={4} defaultValue="12" />
  <PinInput label="Small" size="small" length={4} defaultValue="12" />
  <PinInput label="Large" size="large" length={4} defaultValue="12" />
  <PinInput label="Rounded" isRounded length={4} defaultValue="12" />
</Block>
```

---

### Disabled

```tsx live
<PinInput label="Verification code" disabled defaultValue="123" />
```

---

### Controlled vs Uncontrolled

Pass `value` and `onChange` to hold the code in your own state, as in [Verifying a Code](#verifying-a-code). Without `value`, it keeps the code itself, starting from `defaultValue`.

```tsx live
<PinInput label="Code" defaultValue="42" />
```

---

### In a Form

The input holding the code takes `name`, so a form submits the code under it like any other field. `required`, `form` and the rest of an input's attributes go to it too.

```tsx live
function example() {
  const [sent, setSent] = useState<string>();
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        setSent(String(new FormData(e.currentTarget).get('otp')));
      }}
    >
      <PinInput label="Verification code" name="otp" required />
      <Button type="submit" color="primary" mt="3">
        Verify
      </Button>
      {sent !== undefined && (
        <Paragraph mt="2">The form sent otp={sent}</Paragraph>
      )}
    </form>
  );
}
```

---

### Inside a Field

Like the other bestax inputs, it renders its own `Field` and `Control` for its `label`, and inside a `Field` of yours it renders neither and takes that `Field`'s label instead.

```tsx live
<Field horizontal label="Code">
  <PinInput length={4} />
</Field>
```

---

### Right to Left

On a right-to-left page the label and the message follow the page, and the boxes stay left to right, with the first character on the left, since a code is written that way. The arrow keys move the caret the way the boxes run.

```tsx live
<Block dir="rtl">
  <PinInput label="رمز التحقق" defaultValue="12" />
</Block>
```

---

### Forwarded ref

`PinInput` forwards a ref to the input that holds the code, so you can focus it, or read its value.

```tsx live
function example() {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <PinInput ref={ref} label="Verification code" />
      <Button mt="3" onClick={() => ref.current?.focus()}>
        Focus the code
      </Button>
    </>
  );
}
```

---

## Typing, Paste and Autofill

- **Typing** goes into the input at its caret, and stops at `length`. Backspace and Delete remove characters as they do in any field.
- **A click** anywhere on the row focuses the input with the caret after the code, at the next empty box. The arrow keys, Home and End move the caret from there, and Shift with them selects. The box at the caret shows Bulma's focus ring, an empty one draws the caret, and every box in a selection shows the ring.
- **A paste** replaces the whole code with what you paste, kept to what `type` takes and cut to `length`, so a code pasted as `123 456` or `123-456` fills the boxes. A paste with nothing in it the code takes changes nothing. The browser would otherwise cut a paste to `maxLength` before anything else sees it, so a code with a space in it would lose its last character. An `onPaste` of your own runs first, and one that calls `preventDefault()` keeps the paste from happening.
- **Autofill:** the input has `autoComplete="one-time-code"`, so a phone offers a code it received by text message, and a password manager knows the field is a one-time code. Pass your own `autoComplete` for anything else, such as `"off"`.

---

## Accessibility

- **One field:** the code is in one `<input>`, named by the label, so a screen reader announces a single text field with the code as its value. The boxes are drawn with `aria-hidden`, so nothing reads them a second time, or as a run of separate fields.
- **Say how long the code is** in the label or the message, as in "Enter the 6-digit code", since the boxes that show it are hidden from a screen reader.
- **Masked,** the input is a password field, so a screen reader doesn't read the code out.
- **The keyboard a phone shows** is the number pad by default, through `inputMode="numeric"`, and the full keyboard with `type="alphanumeric"`.
- **Focus** shows on the boxes, since the input itself is transparent: the box at the caret, or every selected box, gets Bulma's focus ring, and an empty box at the caret draws a blinking caret. Under `prefers-reduced-motion: reduce` the caret stays drawn and doesn't blink.
- **Forced colors:** in Windows high contrast mode the box at the caret is outlined in the system's highlight color, where Bulma's focus ring, a shadow, is gone, the caret is drawn in the system's text color, and a disabled box takes the system's color for disabled text.

---

## Related Components

- [`Input`](./input.md): A single text field, for anything that isn't a short code.
- [`Numberinput`](./numberinput.md): A number with increment and decrement buttons, for a quantity rather than a code.
- [`Field`](./field.md): The label and help text around the field.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: PinInput Stories](https://bestax.io/storybook/?path=/story/form-pininput--default)
- [MDN: The autocomplete attribute's `one-time-code` value](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)
- [MDN: inputmode](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)
- [Bulma: Input](https://bulma.io/documentation/form/input/)

---

## Props

<!-- bestax:generated props -->

| Prop             | Type                                                                                                                               | Default           | Description                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `label`          | `React.ReactNode`                                                                                                                  | —                 | Field label. Automatically associated with the input that holds the code via `htmlFor`, so a screen reader announces one field under this name. Uses your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`) and you set no `id` here. |
| `labelProps`     | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`                                                        | —                 | Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then).                                                                                                                                                                                                                                                                                       |
| `id`             | `string`                                                                                                                           | —                 | Applied to the input that holds the code (the labellable control), not the row of boxes.                                                                                                                                                                                                                                                                                                                     |
| `length`         | `number`                                                                                                                           | `6`               | How many characters the code has. Each gets a box, and it is the input's `maxLength`.                                                                                                                                                                                                                                                                                                                        |
| `value`          | `string`                                                                                                                           | —                 | The code (controlled).                                                                                                                                                                                                                                                                                                                                                                                       |
| `defaultValue`   | `string`                                                                                                                           | `''`              | The code to start with (uncontrolled).                                                                                                                                                                                                                                                                                                                                                                       |
| `type`           | `'number'` \| `'alphanumeric'`                                                                                                     | `'number'`        | What the code takes. A digit from any script, such as an Arabic-Indic or a Persian one, goes in as its ASCII digit, so the code reaches `onChange`, `onComplete` and the form as `0` to `9`. Anything else typed or pasted is dropped, and the caret stays where it was. The input stays a text field either way, so a code keeps its leading zeros.                                                         |
| `isMasked`       | `boolean`                                                                                                                          | `false`           | Shows a dot in each filled box in place of its character, and makes the input a password field, so a screen reader doesn't read the code out either.                                                                                                                                                                                                                                                         |
| `color`          | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'dark'` \| `'light'` \| `'white'` | —                 | Bulma color for the boxes, the colors an `Input` takes.                                                                                                                                                                                                                                                                                                                                                      |
| `size`           | `'small'` \| `'medium'` \| `'large'`                                                                                               | —                 | Size of the boxes.                                                                                                                                                                                                                                                                                                                                                                                           |
| `isRounded`      | `boolean`                                                                                                                          | `false`           | Round boxes.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `disabled`       | `boolean`                                                                                                                          | `false`           | Whether the input is disabled.                                                                                                                                                                                                                                                                                                                                                                               |
| `onChange`       | `(value: string) => void`                                                                                                          | —                 | Called with the code each time it changes. A paste replaces the whole code with what was pasted, kept to what `type` takes and cut to `length`, and a paste with nothing the code takes changes nothing.                                                                                                                                                                                                     |
| `onComplete`     | `(value: string) => void`                                                                                                          | —                 | Called with the code when a change makes it `length` characters long, such as typing the last character, a paste or autofill. It fires once for each change that fills the last box with a new code, and never on a render. A `value` you set yourself doesn't call it.                                                                                                                                      |
| `labelSize`      | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                 | —                 | Size for the label (used in horizontal layouts).                                                                                                                                                                                                                                                                                                                                                             |
| `horizontal`     | `boolean`                                                                                                                          | `false`           | Horizontal field layout.                                                                                                                                                                                                                                                                                                                                                                                     |
| `message`        | `React.ReactNode`                                                                                                                  | —                 | Help/validation message below the input.                                                                                                                                                                                                                                                                                                                                                                     |
| `messageColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                                                    | —                 | Bulma color for the message.                                                                                                                                                                                                                                                                                                                                                                                 |
| `fieldClassName` | `string`                                                                                                                           | —                 | Additional CSS classes for the Field wrapper.                                                                                                                                                                                                                                                                                                                                                                |
| `name`           | `string`                                                                                                                           | —                 | Form field name, on the input, so a form submits the code under it.                                                                                                                                                                                                                                                                                                                                          |
| `autoComplete`   | `string`                                                                                                                           | `"one-time-code"` | Lets the browser offer a code it received by text message, and tells a password manager this is a one-time code.                                                                                                                                                                                                                                                                                             |
| `inputMode`      | `string`                                                                                                                           | —                 | The keyboard a phone shows: `"numeric"` with `type="number"`, `"text"` with `type="alphanumeric"`.                                                                                                                                                                                                                                                                                                           |
| `className`      | `string`                                                                                                                           | —                 | Additional CSS classes for the row of boxes.                                                                                                                                                                                                                                                                                                                                                                 |
| `ref`            | `React.Ref<HTMLInputElement>`                                                                                                      | —                 | Ref forwarded to the input that holds the code.                                                                                                                                                                                                                                                                                                                                                              |
| `...`            | All standard `<input>` attributes and Bulma helper props                                                                           | —                 | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                            |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`PinInput` registers these variables on its own `.pin-input` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                             | Sass Variable                     | Default                       |
| ---------------------------------------- | --------------------------------- | ----------------------------- |
| `--bulma-pin-input-gap`                  | `$pin-input-gap`                  | `0.5em`                       |
| `--bulma-pin-input-box-width`            | `$pin-input-box-width`            | `var(--bulma-control-height)` |
| `--bulma-pin-input-caret-width`          | `$pin-input-caret-width`          | `max(1px, 0.0625em)`          |
| `--bulma-pin-input-caret-height`         | `$pin-input-caret-height`         | `1.25em`                      |
| `--bulma-pin-input-caret-color`          | `$pin-input-caret-color`          | `currentColor`                |
| `--bulma-pin-input-caret-blink-duration` | `$pin-input-caret-blink-duration` | `1s`                          |

<!-- /bestax:generated cssvars -->

Each box is a Bulma `.input`, so the `--bulma-input-*` variables in [`Input`'s table](./input.md#css--sass-variables) color and size it too, the same way they do an `Input`.
