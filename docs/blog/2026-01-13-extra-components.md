---
slug: extra-components
title: 'Introducing Extra Components: Advanced UI & Form Controls'
authors: [asmith]
tags: [release, components, forms, bulma]
---

We're excited to announce a major addition to bestax-bulma: **Extra Components**. This release adds 15 new components that extend the core library with advanced UI controls and form inputs.

<!-- truncate -->

## What's New

### UI Components (9)

| Component    | Description                                          |
| ------------ | ---------------------------------------------------- |
| **Loading**  | Full-page or container loading overlay with spinner  |
| **Collapse** | Expandable/collapsible content panels with animation |
| **Tooltip**  | Hover tooltips for displaying helpful information    |
| **Steps**    | Multi-step progress indicator for wizard flows       |
| **Sidebar**  | Slide-out navigation panel from left or right        |
| **Toast**    | Brief notification messages with auto-dismiss        |
| **Snackbar** | Bottom-aligned notifications with action buttons     |
| **Dialog**   | Confirmation and alert dialogs                       |
| **Carousel** | Image/content slider with navigation                 |

### Form Components (6)

| Component        | Description                        |
| ---------------- | ---------------------------------- |
| **Switch**       | Toggle switch for on/off states    |
| **Slider**       | Range slider for value selection   |
| **Numberinput**  | Number input with +/- buttons      |
| **Rate**         | Star/icon-based rating component   |
| **Autocomplete** | Input with dropdown suggestions    |
| **Taginput**     | Tag/chip input for multiple values |

## Quick Start

### Installation

Extra components are included in the main package:

```bash
npm install @allxsmith/bestax-bulma
```

### CSS Setup

Import the extras CSS after Bulma:

```jsx
import 'bulma/css/bulma.min.css';
import '@allxsmith/bestax-bulma/dist/extras.css';
```

### Basic Usage

```jsx
import { Switch, Slider, Toast, Steps } from '@allxsmith/bestax-bulma';
```

## Feature Highlights

### Programmatic Notifications

Toast, Snackbar, and Dialog provide programmatic APIs for triggering notifications from anywhere:

```jsx
import { toast, snackbar, dialog } from '@allxsmith/bestax-bulma';

// Success toast
toast.success('Changes saved!');

// Snackbar with undo action
snackbar.show({
  message: 'Item deleted',
  actionText: 'Undo',
  onAction: () => restoreItem(),
});

// Confirmation dialog
const confirmed = await dialog.confirm({
  title: 'Delete?',
  message: 'This cannot be undone.',
  type: 'danger',
});
```

### Controlled & Uncontrolled Modes

All form components support both patterns:

```jsx
// Controlled
const [value, setValue] = useState(50);
<Slider value={value} onChange={setValue} />

// Uncontrolled
<Slider defaultValue={50} />
```

### Full Accessibility

Every component includes:

- Proper ARIA attributes
- Keyboard navigation
- Screen reader support
- Focus management

### Bulma Helper Props

All components support Bulma's helper props system:

```jsx
<Switch color="success" isRounded>
  Dark Mode
</Switch>

<Steps color="primary" size="medium">
  ...
</Steps>
```

## Interactive Examples

### Switch

```tsx live
function SwitchDemo() {
  const [enabled, setEnabled] = React.useState(false);
  return (
    <Switch
      checked={enabled}
      onChange={e => setEnabled(e.target.checked)}
      color="success"
      isRounded
    >
      Notifications: {enabled ? 'On' : 'Off'}
    </Switch>
  );
}
```

### Slider

```tsx live
function SliderDemo() {
  const [volume, setVolume] = React.useState(50);
  return (
    <div>
      <Slider
        value={volume}
        onChange={setVolume}
        showOutput
        color="primary"
        isRounded
      />
    </div>
  );
}
```

### Steps

```tsx live
function StepsDemo() {
  const [step, setStep] = React.useState(1);
  return (
    <Steps
      value={step}
      items={[
        { label: 'Cart', clickable: true },
        { label: 'Shipping', clickable: true },
        { label: 'Payment', clickable: true },
        { label: 'Complete', clickable: true },
      ]}
      onStepClick={setStep}
      color="success"
    />
  );
}
```

## Documentation

For complete documentation and more examples:

- [Using Extras Guide](/docs/guides/getting-started/using-extras) - Setup instructions
- [Extra UI Components](/docs/guides/library/components/extras) - Toast, Dialog, Steps, etc.
- [Extra Form Components](/docs/guides/library/form/extras) - Switch, Slider, Rate, etc.

## What's Next

We're continuing to expand bestax-bulma with more components and features. Coming soon:

- Datepicker - Calendar date selection
- Timepicker - Time selection dropdown
- Colorpicker - Color selection with presets

Stay tuned for more updates!
