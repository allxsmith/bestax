---
title: PasswordInput
sidebar_label: PasswordInput
description: The `PasswordInput` component is a password field with a button inside it that shows what was typed.
---

# PasswordInput

## Overview

<!-- bestax:generated overview -->

The `PasswordInput` component is a password field with a button inside it that shows what was typed.

<!-- /bestax:generated overview -->

Reach for it on a sign-in form, a sign-up or change-password form, or a field for an API secret, a Wi-Fi key or anything else people type blind. Seeing what you typed helps anyone who has trouble typing accurately, and WCAG's [Accessible Authentication](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) and NIST's [SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html) both point to it.

The button sits inside the field at its right edge, where the date pickers' launcher sits. By default it's an eye named "Show password" that reports whether it's on; `variant="text"` makes it the words "Show" and "Hide". The field also asks the browser for the right things: `autocomplete="current-password"`, no spellcheck, no autocorrect and no automatic capitals, and it hides the password again when its form submits.

:::info
Bulma's control icons take no clicks, so `PasswordInput` brings a few lines of its own styles, in `bestax.css` and its variants, or in `extras.css` next to your own Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { PasswordInput } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it a `label`. Type, then press the eye: the password shows, and focus and the caret stay in the field, so you can carry on typing where you were.

```tsx live
<PasswordInput label="Password" />
```

### In a Form

Leave it uncontrolled, with a `name`, and read it with `FormData` when the form submits. An uncontrolled field never writes what's typed into its `value` attribute; a controlled one carries its value there, as React writes it for any controlled input, where a stylesheet on the page could read it. When the form submits, the field goes back to a password field before your submit handler runs, so the browser doesn't keep the password among the text it suggests for other fields.

```tsx live
function SignIn() {
  const [sent, setSent] = useState('');

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSent(String(data.get('password')));
      }}
    >
      <Input label="Email" type="email" name="email" autoComplete="email" />
      <PasswordInput label="Password" name="password" />
      <Button type="submit" color="primary">
        Sign in
      </Button>
      {sent && (
        <Paragraph mt="3">
          Sent a password {sent.length} characters long.
        </Paragraph>
      )}
    </form>
  );
}
```

### New Passwords

On a sign-up or change-password form, pass `autoComplete="new-password"`, which tells a password manager to offer one it makes up rather than one it saved. Say what you ask of the password in the `message`.

```tsx live
<PasswordInput
  label="New password"
  autoComplete="new-password"
  message="At least 15 characters."
/>
```

### Show and Hide as Words

`variant="text"` draws the button as the word "Show", and "Hide" while the password shows, for anyone who doesn't read the eye. Its name follows the word, "Show password" then "Hide password", so a voice control user can say what they see.

```tsx live
<PasswordInput label="Password" variant="text" />
```

### Translating

`labels` holds the button's names and words. With the `icon` variant only `showPassword` is used. With `text`, each name has to contain its word, and a development warning says so when one doesn't. A longer word than "Show" or "Hide" may want more room, through `--bulma-passwordinput-toggle-text-width`.

```tsx live
<PasswordInput
  label="Contraseña"
  variant="text"
  labels={{
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    show: 'Mostrar',
    hide: 'Ocultar',
  }}
/>
```

### Showing Two Fields Together

`visible`, with `onVisibleChange`, holds the state yourself. One button then shows the current and the new password together.

```tsx live
function ChangePassword() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <PasswordInput
        label="Current password"
        visible={visible}
        onVisibleChange={setVisible}
      />
      <PasswordInput
        label="New password"
        autoComplete="new-password"
        visible={visible}
        onVisibleChange={setVisible}
      />
    </>
  );
}
```

`onVisibleChange` is called with `false` when the form submits or resets, or the page is left, which it also is on the way into the browser's back-forward cache, so held state follows those too. Apply that `false` and the field is a password field by the time the form reads it, since React renders the change at once, your own state update included. Keep `visible` true and the field stays shown.

### Sizes, Colors and a Left Icon

`size`, `color` and `isRounded` style the input as they do on [`Input`](./input.md), and the button grows with the size. A left icon works as it does on `Input`; the right edge is the button's, so there's no right icon.

```tsx live
<>
  <PasswordInput label="Small" size="small" />
  <PasswordInput label="Medium, as words" size="medium" variant="text" />
  <PasswordInput
    label="With an icon"
    iconLeftName="lock"
    isRounded
    color="danger"
    message="That password isn't right."
    messageColor="danger"
  />
</>
```

### Disabled and Loading

Disabled, by its own `disabled` or a disabled [`Fieldset`](./fieldset.md), the button is disabled with the field. While `isLoading` draws the spinner, it takes the button's place.

```tsx live
<>
  <PasswordInput label="Disabled" disabled defaultValue="hunter2" />
  <PasswordInput label="Checking" isLoading />
</>
```

### Strength Recipe

`PasswordInput` doesn't score passwords. Scoring belongs to your app or your server, which can check a password against lists of breached and common ones, as NIST asks; character-class rules ("one number, one symbol") are what it asks you not to require. The example reads the field in `onChange` and passes it no `value`, so it stays uncontrolled. Once you have a score, say it in words in the `message`, so it doesn't rest on color, and point the input's `aria-describedby` at those words so a screen reader reads them with the field. A bar beside the words is a meter, a level in a range, so it's a native `<meter>`; [`Progress`](../elements/progress.md) is a `<progress>`, which reports how far along a task is.

```tsx live
function StrengthRecipe() {
  const [password, setPassword] = useState('');
  const id = React.useId();
  // Your app or server scores the password; this demo counts its length.
  const score = Math.min(4, Math.floor(password.length / 4));
  const words = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['danger', 'danger', 'warning', 'info', 'success'] as const;

  return (
    <PasswordInput
      label="New password"
      autoComplete="new-password"
      onChange={event => setPassword(event.target.value)}
      aria-describedby={id}
      messageColor={password ? colors[score] : undefined}
      message={
        <>
          <meter
            min={0}
            max={4}
            low={2}
            high={3}
            optimum={4}
            value={score}
            aria-label="Password strength"
          />{' '}
          <span id={id}>Strength: {password ? words[score] : 'none yet'}</span>
        </>
      }
    />
  );
}
```

### Right to Left

The button stays at the right edge in a right-to-left page, as the date pickers' launcher and Bulma's right icon do, so there it sits where the text starts. Moving all of them to the end of the line is a separate change.

```tsx live
<div dir="rtl">
  <PasswordInput label="كلمة المرور" />
</div>
```

### Without the Field

`PasswordInputBase` is the input and its button with no `Field` or `Control` around it, for composing your own. Inside a labeled `Field` it's named by the label as `InputBase` is.

```tsx live
<Field label="API secret">
  <Control>
    <PasswordInputBase />
  </Control>
</Field>
```

---

## Accessibility

- **The input** is a password field named by its `label`, and a text field while the password shows. Switching keeps its value and the selection.
- **The icon button** is a toggle button: it's named "Show password" in both states, and `aria-pressed` says whether the password shows, so a screen reader hears "Show password, toggle button, pressed". The eye takes a line through it while the password shows, and the glyphs are hidden from assistive tech.
- **The text button** changes its words, so its name changes with them, "Show password" then "Hide password", and it has no `aria-pressed`, as the [APG button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) asks of a toggle whose label changes. Each name contains the word on the button ([Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)).
- **Keyboard:** the button is a native `<button type="button">` in the tab order, right after the input, and Enter or Space toggles it and leaves focus on it. It never submits the form.
- **Pointer:** a press on the button leaves focus, and the caret, in the input.
- **No announcement of its own:** the button's state or its name says whether the password shows, so there's no live region repeating it.
- **Password managers and paste** work as on any password field, and `autocomplete` tells them what the field is for ([Identify Input Purpose](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html)). `spellcheck="false"` keeps a browser's spellcheck from reading the password once it shows.
- **The `value` attribute:** a controlled field carries its value in its `value` attribute, as React writes it for any controlled input, where a CSS attribute selector can read it. An uncontrolled one, read with `FormData`, never puts what's typed there.
- **Edge's own reveal button** is hidden on this input, so there's one eye, not two.
- **Focus** shows as an outline around the button. **Forced colors:** the glyph and the words take the system's button text color, and a disabled button its gray.
- **Strings** come from `labels`, with English defaults.

---

## Related Components

- [`Input`](./input.md): A text field of any other kind, which `PasswordInput` builds on.
- [`PinInput`](./pininput.md): A short one-time code or PIN, with `isMasked` to hide it.
- [`Fieldset`](./fieldset.md): A disabled section of a form, which disables the field and its button.
- [`Field`](./field.md): The label and help text around the field.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: PasswordInput Stories](https://bestax.io/storybook/?path=/story/form-passwordinput--default)
- [WAI-ARIA Authoring Practices: Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- [MDN: The autocomplete attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)
- [GOV.UK Design System: Password input](https://design-system.service.gov.uk/components/password-input/)
- [Bulma: Input](https://bulma.io/documentation/form/input/)

---

## Props

<!-- bestax:generated props -->

| Prop               | Type                                                                                                                               | Default              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`            | `React.ReactNode`                                                                                                                  | —                    | Field label. Automatically associated with the input via `htmlFor`, using your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`) and you set no `id` here.                                                                                                                           |
| `labelSize`        | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                 | —                    | Size for the label.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `labelProps`       | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`                                                        | —                    | Props for the label element when the component renders its own `Field`; dropped inside an outer `Field` (use that `Field`'s `labelProps` instead). An explicit `htmlFor` key, even `undefined`, overrides the automatic association and no id is generated.                                                                                                                                                                                                 |
| `horizontal`       | `boolean`                                                                                                                          | `false`              | Horizontal field layout.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `iconLeft`         | `IconProps` \| `React.ReactNode`                                                                                                   | —                    | Icon props for the left icon. Bulma gives control icons `pointer-events: none`, so a clickable node here never receives a click.                                                                                                                                                                                                                                                                                                                            |
| `iconLeftName`     | `string`                                                                                                                           | —                    | Shortcut for the left icon's name.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `iconLeftSize`     | `'small'` \| `'medium'` \| `'large'`                                                                                               | —                    | Shortcut for the left icon's size.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `hasIconsLeft`     | `boolean`                                                                                                                          | `false`              | Force the left icon container.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `isLoading`        | `boolean`                                                                                                                          | `false`              | Shows a loading spinner on the `Control` it renders, at the edge the toggle uses, so the toggle isn't drawn meanwhile. Inside your own `Control` it renders none, so this draws nothing and warns in development; set `isLoading` on that `Control`, which hides the toggle too.                                                                                                                                                                            |
| `isExpanded`       | `boolean`                                                                                                                          | `false`              | Expand the control.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `controlSize`      | `'small'` \| `'medium'` \| `'large'`                                                                                               | —                    | Control size.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `message`          | `React.ReactNode`                                                                                                                  | —                    | Help/validation message below the input.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `messageColor`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                                                    | —                    | Bulma color for the message.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `fieldClassName`   | `string`                                                                                                                           | —                    | Additional CSS classes for the Field.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `controlClassName` | `string`                                                                                                                           | —                    | Additional CSS classes for the Control.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `visible`          | `boolean`                                                                                                                          | —                    | Whether the password shows, when you hold the state. Setting it makes the visibility controlled: the toggle only calls `onVisibleChange`, and so does hiding again on its own. Apply that `false` and the field is a password field by the time the form reads it; keep `visible` true and the field stays shown.                                                                                                                                           |
| `defaultVisible`   | `boolean`                                                                                                                          | `false`              | Whether the password shows at first, when the input holds its own state.                                                                                                                                                                                                                                                                                                                                                                                    |
| `onVisibleChange`  | `(visible: boolean) => void`                                                                                                       | —                    | Called with the new visibility on each toggle, and with `false` when the form submits or resets, or the page is left, which it also is on the way into the back-forward cache. React renders those hides at once, a state update you make here included, so the form reads a password field. One that fires while React is rendering or running layout effects, such as a `requestSubmit()` from a layout effect, can't render there, and lands just after. |
| `variant`          | `'icon'` \| `'text'`                                                                                                               | `'icon'`             | How the toggle draws itself: an eye icon with a fixed name and `aria-pressed`, or the words "Show" and "Hide" with a name that follows them.                                                                                                                                                                                                                                                                                                                |
| `labels`           | `{ showPassword?: string; hidePassword?: string; show?: string; hide?: string }`                                                   | —                    | Translations for the toggle.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'dark'` \| `'light'` \| `'white'` | —                    | Bulma color modifier for the input.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `size`             | `'small'` \| `'medium'` \| `'large'`                                                                                               | —                    | Size modifier for the input.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `isRounded`        | `boolean`                                                                                                                          | `false`              | Rounded input corners.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `isStatic`         | `boolean`                                                                                                                          | `false`              | Styles the input as static text. It stays editable; add `readOnly` to stop edits.                                                                                                                                                                                                                                                                                                                                                                           |
| `isHovered`        | `boolean`                                                                                                                          | `false`              | Applies hovered state.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `isFocused`        | `boolean`                                                                                                                          | `false`              | Applies focused state.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `className`        | `string`                                                                                                                           | —                    | Additional CSS classes to apply.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `disabled`         | `boolean`                                                                                                                          | `false`              | Disabled input.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `readOnly`         | `boolean`                                                                                                                          | `false`              | Read-only input.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `autoComplete`     | `string`                                                                                                                           | `"current-password"` | Tells the browser and password managers this is an existing password. Pass `"new-password"` where the user makes one up, on a sign-up or change-password form.                                                                                                                                                                                                                                                                                              |
| `spellCheck`       | `boolean`                                                                                                                          | `false`              | Off, so a browser's spellcheck never sees the password once it shows.                                                                                                                                                                                                                                                                                                                                                                                       |
| `autoCorrect`      | `string`                                                                                                                           | `"off"`              | Off, so a phone's keyboard doesn't change what's typed.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `autoCapitalize`   | `string`                                                                                                                           | `"none"`             | Off, so a phone's keyboard doesn't capitalize the first letter.                                                                                                                                                                                                                                                                                                                                                                                             |
| `value`            | `string`                                                                                                                           | —                    | The password, controlled. React writes a controlled input's value into its `value` attribute, as it does on any input, so the password sits in the page's markup. Uncontrolled, read with `FormData`, the field never puts what's typed there.                                                                                                                                                                                                              |
| `ref`              | `React.Ref<HTMLInputElement>`                                                                                                      | —                    | Ref forwarded to the `<input>`.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `...`              | All standard `<input>` attributes and Bulma helper props                                                                           | —                    | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                           |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`PasswordInput` registers these variables on its own `.input` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                 | Sass Variable                       | Default                                                                                                                  |
| -------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--bulma-passwordinput-toggle-width` ‡       | `$passwordinput-toggle-width`       | `2.5em`                                                                                                                  |
| `--bulma-passwordinput-toggle-text-width` ‡  | `$passwordinput-toggle-text-width`  | `4.5em`                                                                                                                  |
| `--bulma-passwordinput-toggle-color` ‡       | `$passwordinput-toggle-color`       | `var(--bulma-text)`                                                                                                      |
| `--bulma-passwordinput-toggle-hover-color` ‡ | `$passwordinput-toggle-hover-color` | `var(--bulma-text-strong)`                                                                                               |
| `--bulma-input-h`                            | `$input-h`                          | `var(--bulma-scheme-h)`                                                                                                  |
| `--bulma-input-s`                            | `$input-s`                          | `var(--bulma-scheme-s)`                                                                                                  |
| `--bulma-input-l`                            | `$input-l`                          | `var(--bulma-scheme-main-l)`                                                                                             |
| `--bulma-input-border-style`                 | `$input-border-style`               | `solid`                                                                                                                  |
| `--bulma-input-border-width`                 | `$input-border-width`               | `var(--bulma-control-border-width)`                                                                                      |
| `--bulma-input-border-l`                     | `$input-border-l`                   | `var(--bulma-border-l)`                                                                                                  |
| `--bulma-input-border-l-delta`               | `$input-border-l-delta`             | `0%`                                                                                                                     |
| `--bulma-input-border-color`                 | `$input-border-color`               | `hsl(var(--bulma-input-h), var(--bulma-input-s), calc(var(--bulma-input-border-l) + var(--bulma-input-border-l-delta)))` |
| `--bulma-input-hover-border-l-delta`         | `$input-hover-border-l-delta`       | `var(--bulma-hover-border-l-delta)`                                                                                      |
| `--bulma-input-active-border-l-delta`        | `$input-active-border-l-delta`      | `var(--bulma-active-border-l-delta)`                                                                                     |
| `--bulma-input-focus-h`                      | `$input-focus-h`                    | `var(--bulma-focus-h)`                                                                                                   |
| `--bulma-input-focus-s`                      | `$input-focus-s`                    | `var(--bulma-focus-s)`                                                                                                   |
| `--bulma-input-focus-l`                      | `$input-focus-l`                    | `var(--bulma-focus-l)`                                                                                                   |
| `--bulma-input-focus-shadow-size`            | `$input-focus-shadow-size`          | `var(--bulma-focus-shadow-size)`                                                                                         |
| `--bulma-input-focus-shadow-alpha`           | `$input-focus-shadow-alpha`         | `var(--bulma-focus-shadow-alpha)`                                                                                        |
| `--bulma-input-color-l`                      | `$input-color-l`                    | `var(--bulma-text-strong-l)`                                                                                             |
| `--bulma-input-background-l`                 | `$input-background-l`               | `var(--bulma-scheme-main-l)`                                                                                             |
| `--bulma-input-background-l-delta`           | `$input-background-l-delta`         | `0%`                                                                                                                     |
| `--bulma-input-height`                       | `$input-height`                     | `var(--bulma-control-height)`                                                                                            |
| `--bulma-input-shadow`                       | `$input-shadow`                     | `inset 0 0.0625em 0.125em hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.05)`        |
| `--bulma-input-placeholder-color`            | `$input-placeholder-color`          | `hsla(var(--bulma-text-h), var(--bulma-text-s), var(--bulma-text-strong-l), 0.3)`                                        |
| `--bulma-input-disabled-color`               | `$input-disabled-color`             | `var(--bulma-text-weak)`                                                                                                 |
| `--bulma-input-disabled-background-color`    | `$input-disabled-background-color`  | `var(--bulma-background)`                                                                                                |
| `--bulma-input-disabled-border-color`        | `$input-disabled-border-color`      | `var(--bulma-background)`                                                                                                |
| `--bulma-input-disabled-placeholder-color`   | `$input-disabled-placeholder-color` | `hsla(var(--bulma-text-h), var(--bulma-text-s), var(--bulma-text-weak-l), 0.3)`                                          |
| `--bulma-input-arrow`                        | `$input-arrow`                      | `var(--bulma-link)`                                                                                                      |
| `--bulma-input-icon-color`                   | `$input-icon-color`                 | `var(--bulma-text-light)`                                                                                                |
| `--bulma-input-icon-hover-color`             | `$input-icon-hover-color`           | `var(--bulma-text-weak)`                                                                                                 |
| `--bulma-input-icon-focus-color`             | `$input-icon-focus-color`           | `var(--bulma-link)`                                                                                                      |
| `--bulma-input-radius`                       | `$input-radius`                     | `var(--bulma-radius)`                                                                                                    |

‡ declared on a constituent element: values set via `className`, the `style` prop, or an ancestor are only inherited and lose — target the declaring element in your CSS.

<!-- /bestax:generated cssvars -->
