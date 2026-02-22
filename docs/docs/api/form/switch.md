---
title: Switch
sidebar_label: Switch
---

# Switch

## Overview

The `Switch` component provides a toggle switch for boolean on/off states. It's built on top of a checkbox input and supports multiple colors, sizes, and style variants. Perfect for settings pages, feature toggles, and preference selections.

:::info
The Switch requires importing the extras CSS. See the [Extras Setup Guide](../../guides/getting-started/using-extras.md) for installation instructions.
:::

---

## Import

```tsx
import { Switch } from '@allxsmith/bestax-bulma';

// Also import the extras CSS
import '@allxsmith/bestax-bulma/extras.css';
```

---

## Props

| Prop             | Type                                                                            | Default    | Description                                      |
| ---------------- | ------------------------------------------------------------------------------- | ---------- | ------------------------------------------------ |
| `color`          | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —          | Color variant for the switch.                    |
| `size`           | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | `'normal'` | Size of the switch.                              |
| `isRounded`      | `boolean`                                                                       | `false`    | Use rounded switch style.                        |
| `isThin`         | `boolean`                                                                       | `false`    | Use thin switch style.                           |
| `isOutlined`     | `boolean`                                                                       | `false`    | Use outlined switch style.                       |
| `isRtl`          | `boolean`                                                                       | `false`    | Right-to-left layout (label on left).            |
| `disabled`       | `boolean`                                                                       | `false`    | Whether the switch is disabled.                  |
| `checked`        | `boolean`                                                                       | —          | Controlled checked state.                        |
| `defaultChecked` | `boolean`                                                                       | `false`    | Default checked state for uncontrolled usage.    |
| `onChange`       | `(e: ChangeEvent<HTMLInputElement>) => void`                                    | —          | Callback when switch state changes.              |
| `children`       | `React.ReactNode`                                                               | —          | Label content for the switch.                    |
| `className`      | `string`                                                                        | —          | Additional CSS classes.                          |
| `ref`            | `React.Ref<HTMLInputElement>`                                                   | —          | Ref forwarded to the input element.              |
| ...              | All standard HTML input props and Bulma helper props                            |            | (See [Helper Props](../helpers/usebulmaclasses)) |

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
    </div>
  );
}
```

---

### Sizes

Switch with different size variants.

```tsx live
function example() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
    </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Switch isOutlined color="primary" defaultChecked>
        Primary outlined
      </Switch>
      <Switch isOutlined color="success" defaultChecked>
        Success outlined
      </Switch>
    </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Switch disabled>Disabled unchecked</Switch>
      <Switch disabled defaultChecked color="success">
        Disabled checked
      </Switch>
    </div>
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
    <div>
      <Switch
        color="primary"
        checked={isEnabled}
        onChange={e => setIsEnabled(e.target.checked)}
      >
        Feature is {isEnabled ? 'enabled' : 'disabled'}
      </Switch>
      <p className="mt-2">
        State: <strong>{isEnabled ? 'ON' : 'OFF'}</strong>
      </p>
    </div>
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
    <div style={{ maxWidth: '300px' }}>
      <h4 className="title is-5">Settings</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
      </div>
    </div>
  );
}
```

---

## Accessibility

- The Switch is built on a native checkbox input for proper keyboard navigation
- Use the `children` prop to provide a visible label
- For icon-only switches, provide an `aria-label` prop
- The switch can be focused and toggled with keyboard (Space/Enter)

---

## Related

- [Checkbox](./checkbox.md) - Standard checkbox input
- [Field](./field.md) - Form field wrapper
