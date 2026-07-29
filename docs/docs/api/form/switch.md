---
title: Switch
sidebar_label: Switch
description: The `Switch` component provides a toggle switch for boolean on/off states.
---

# Switch

## Overview

<!-- bestax:generated overview -->

The `Switch` component provides a toggle switch for boolean on/off states.

<!-- /bestax:generated overview -->

It's built on top of a checkbox input and supports multiple colors, sizes, and style variants. Perfect for settings pages, feature toggles, and preference selections.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Switch } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Switch

A simple switch with a label.

```tsx live
function example() {
  return <Switch>Enable notifications</Switch>;
}
```

---

### Colors

Switch with different color variants.

```tsx live
function example() {
  return (
    <Block display="flex" flexDirection="column" gap="4">
      <Switch color="primary" defaultChecked>
        Primary
      </Switch>
      <Switch color="link" defaultChecked>
        Link
      </Switch>
      <Switch color="info" defaultChecked>
        Info
      </Switch>
      <Switch color="success" defaultChecked>
        Success
      </Switch>
      <Switch color="warning" defaultChecked>
        Warning
      </Switch>
      <Switch color="danger" defaultChecked>
        Danger
      </Switch>
    </Block>
  );
}
```

---

### Sizes

Switch with different size variants.

```tsx live
function example() {
  return (
    <Block display="flex" flexDirection="column" gap="4">
      <Switch size="small" defaultChecked>
        Small
      </Switch>
      <Switch size="normal" defaultChecked>
        Normal
      </Switch>
      <Switch size="medium" defaultChecked>
        Medium
      </Switch>
      <Switch size="large" defaultChecked>
        Large
      </Switch>
    </Block>
  );
}
```

---

### Rounded Style

Switch with rounded (pill) style.

```tsx live
function example() {
  return (
    <Switch isRounded color="success" defaultChecked>
      Rounded switch
    </Switch>
  );
}
```

---

### Thin Style

Switch with thin track style.

```tsx live
function example() {
  return (
    <Switch isThin color="info" defaultChecked>
      Thin switch
    </Switch>
  );
}
```

---

### Outlined Style

Switch with outlined style.

```tsx live
function example() {
  return (
    <Block display="flex" flexDirection="column" gap="4">
      <Switch isOutlined color="primary" defaultChecked>
        Primary outlined
      </Switch>
      <Switch isOutlined color="success" defaultChecked>
        Success outlined
      </Switch>
    </Block>
  );
}
```

---

### RTL Layout

Switch with label on the left side.

```tsx live
function example() {
  return (
    <Switch isRtl color="primary" defaultChecked>
      Label on left
    </Switch>
  );
}
```

---

### Disabled State

Disabled switches.

```tsx live
function example() {
  return (
    <Block display="flex" flexDirection="column" gap="4">
      <Switch disabled>Disabled unchecked</Switch>
      <Switch disabled defaultChecked color="success">
        Disabled checked
      </Switch>
    </Block>
  );
}
```

---

### Controlled Usage

Switch with controlled state.

```tsx live
function example() {
  const [isEnabled, setIsEnabled] = useState(false);

  return (
    <Block>
      <Switch
        color="primary"
        checked={isEnabled}
        onChange={e => setIsEnabled(e.target.checked)}
      >
        Feature is {isEnabled ? 'enabled' : 'disabled'}
      </Switch>
      <Paragraph mt="2">
        State: <Strong>{isEnabled ? 'ON' : 'OFF'}</Strong>
      </Paragraph>
    </Block>
  );
}
```

---

### Settings Panel Example

Multiple switches for a settings panel.

```tsx live
function example() {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoSave: true,
  });

  const updateSetting = key => e => {
    setSettings(prev => ({ ...prev, [key]: e.target.checked }));
  };

  return (
    <Block style={{ maxWidth: '300px' }}>
      <Title size="5">Settings</Title>
      <Block display="flex" flexDirection="column" gap="4">
        <Switch
          color="primary"
          checked={settings.notifications}
          onChange={updateSetting('notifications')}
        >
          Push notifications
        </Switch>
        <Switch
          color="info"
          checked={settings.darkMode}
          onChange={updateSetting('darkMode')}
        >
          Dark mode
        </Switch>
        <Switch
          color="success"
          checked={settings.autoSave}
          onChange={updateSetting('autoSave')}
        >
          Auto-save
        </Switch>
      </Block>
    </Block>
  );
}
```

---

## Related

- [Checkbox](./checkbox.md) - Standard checkbox input
- [Field](./field.md) - Form field wrapper

---

## Accessibility

- The Switch is built on a native checkbox input for proper keyboard navigation
- Use the `children` prop to provide a visible label
- For icon-only switches, provide an `aria-label` prop
- The switch can be focused and toggled with keyboard (Space/Enter)

---

## Props

<!-- bestax:generated props -->

| Prop             | Type                                                                            | Default | Description                                                                                  |
| ---------------- | ------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| `color`          | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Color variant for the switch.                                                                |
| `size`           | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | —       | Size of the switch.                                                                          |
| `isRounded`      | `boolean`                                                                       | `false` | Use rounded switch style.                                                                    |
| `isThin`         | `boolean`                                                                       | `false` | Use thin switch style.                                                                       |
| `isOutlined`     | `boolean`                                                                       | `false` | Use outlined switch style.                                                                   |
| `isRtl`          | `boolean`                                                                       | `false` | Right-to-left layout (label on left).                                                        |
| `passiveType`    | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Color when the switch is in the off/passive state. Color for the unchecked (inactive) state. |
| `textColor`      | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color helper.                                                                           |
| `children`       | `React.ReactNode`                                                               | —       | Label content for the switch.                                                                |
| `checked`        | `boolean`                                                                       | —       | Controlled checked state. Whether the switch is checked.                                     |
| `defaultChecked` | `boolean`                                                                       | `false` | Default checked state for uncontrolled usage.                                                |
| `disabled`       | `boolean`                                                                       | `false` | Whether the switch is disabled.                                                              |
| `className`      | `string`                                                                        | —       | Additional CSS classes.                                                                      |
| `onChange`       | `(event: React.ChangeEvent<HTMLInputElement>) => void`                          | —       | Callback when switch state changes. Change handler.                                          |
| `ref`            | `React.Ref<HTMLInputElement>`                                                   | —       | Ref forwarded to the input element.                                                          |
| `...`            | All standard `<input>` attributes and Bulma helper props                        | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                            |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Switch` registers these variables on its own `.switch` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                         | Sass Variable                 | Default                            |
| ------------------------------------ | ----------------------------- | ---------------------------------- |
| `--bulma-switch-width`               | `$switch-width`               | `2.75em`                           |
| `--bulma-switch-height`              | `$switch-height`              | `1.5em`                            |
| `--bulma-switch-padding`             | `$switch-padding`             | `0.1875em`                         |
| `--bulma-switch-border-width`        | `$switch-border-width`        | `1px`                              |
| `--bulma-switch-background`          | `$switch-background`          | `var(--bulma-grey-light)`          |
| `--bulma-switch-circle-color`        | `$switch-circle-color`        | `var(--bulma-scheme-main)`         |
| `--bulma-switch-active-color`        | `$switch-active-color`        | `var(--bulma-primary)`             |
| `--bulma-switch-radius`              | `$switch-radius`              | `var(--bulma-radius-rounded)`      |
| `--bulma-switch-label-gap`           | `$switch-label-gap`           | `0.5em`                            |
| `--bulma-switch-transition-duration` | `$switch-transition-duration` | `var(--bulma-duration)`            |
| `--bulma-switch-circle-shadow`       | `$switch-circle-shadow`       | `0 2px 3px rgba(10, 10, 10, 0.1)`  |
| `--bulma-switch-focus-shadow`        | `$switch-focus-shadow`        | `0 0 0 0.125em rgba(0, 0, 0, 0.1)` |
| `--bulma-switch-thin-height`         | `$switch-thin-height`         | `0.75em`                           |
| `--bulma-switch-thin-circle-size`    | `$switch-thin-circle-size`    | `1.25em`                           |

<!-- /bestax:generated cssvars -->
