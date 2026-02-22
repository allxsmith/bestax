---
title: Using Extras
sidebar_label: Using Extras
sidebar_position: 5
---

# Using Extra Components

This guide covers how to set up and use the extra UI and form components in bestax-bulma.

:::info What are Extras?
Extra components extend the core library with additional UI controls like Toast, Dialog, Steps, Switch, Slider, Autocomplete, and more. They require additional CSS that is not included in the base Bulma stylesheet.
:::

---

## Installation

Extra components are included in the main bestax-bulma package. No additional installation is required:

```bash
npm install @allxsmith/bestax-bulma
```

---

## CSS Setup

Extra components require additional CSS for styling. Choose one of these import methods:

### Method 1: Pre-built CSS (Recommended)

Import the compiled CSS file in your application entry point:

```jsx title="src/main.jsx or src/index.tsx"
// Core Bulma CSS
import 'bulma/css/bulma.min.css';

// Extra components CSS
import '@allxsmith/bestax-bulma/dist/extras.css';

// Your app
import App from './App';
```

:::tip
This is the simplest approach and works with any build tool without additional configuration.
:::

### Method 2: SCSS Source (For Customization)

If you want to customize the extra components or integrate them into your SCSS build:

```scss title="src/styles/main.scss"
// Your Bulma customizations
@use 'bulma/sass' with (
  $primary: #00d1b2,
  $link: #485fc7
);

// Import extras SCSS
@use '@allxsmith/bestax-bulma/dist/scss/extras';
```

Then import your SCSS file:

```jsx
import './styles/main.scss';
```

---

## CSS Import Order

For proper styling, import CSS files in this order:

```jsx
// 1. Bulma CSS (required)
import 'bulma/css/bulma.min.css';

// 2. Icon library (optional)
import '@fortawesome/fontawesome-free/css/all.min.css';

// 3. Extras CSS (required for extra components)
import '@allxsmith/bestax-bulma/dist/extras.css';

// 4. Your custom styles (optional)
import './App.css';
```

---

## Available Components

### UI Components

| Component                                    | Description                            |
| -------------------------------------------- | -------------------------------------- |
| [Loading](../../api/components/loading.md)   | Full-page or container loading overlay |
| [Collapse](../../api/components/collapse.md) | Expandable/collapsible content panels  |
| [Tooltip](../../api/components/tooltip.md)   | Hover tooltips for helpful information |
| Steps                                        | Multi-step progress indicator          |
| Sidebar                                      | Slide-out navigation panel             |
| Toast                                        | Brief notification messages            |
| Snackbar                                     | Bottom notification with action        |
| Dialog                                       | Confirmation and alert dialogs         |
| Carousel                                     | Image/content slider                   |

### Form Components

| Component                          | Description                     |
| ---------------------------------- | ------------------------------- |
| [Switch](../../api/form/switch.md) | Toggle switch for on/off states |
| Slider                             | Range slider input              |
| Numberinput                        | Number input with +/- buttons   |
| Rate                               | Star/icon rating component      |
| Autocomplete                       | Input with dropdown suggestions |
| Taginput                           | Tag/chip input field            |

---

## Basic Usage

### Importing Components

Import extra components the same way as core components:

```jsx
import {
  // UI Components
  Loading,
  Collapse,
  Tooltip,
  Steps,
  Sidebar,
  Toast,
  Snackbar,
  Dialog,
  Carousel,
  CarouselItem,

  // Form Components
  Switch,
  Slider,
  Numberinput,
  Rate,
  Autocomplete,
  Taginput,
} from '@allxsmith/bestax-bulma';
```

### Example: Using a Switch

```jsx
import { Switch } from '@allxsmith/bestax-bulma';
import { useState } from 'react';

function Settings() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <Switch
      checked={darkMode}
      onChange={e => setDarkMode(e.target.checked)}
      color="primary"
      isRounded
    >
      Dark Mode
    </Switch>
  );
}
```

### Example: Using a Slider

```jsx
import { Slider } from '@allxsmith/bestax-bulma';
import { useState } from 'react';

function VolumeControl() {
  const [volume, setVolume] = useState(50);

  return (
    <Slider
      value={volume}
      onChange={setVolume}
      min={0}
      max={100}
      showOutput
      color="info"
    />
  );
}
```

---

## Programmatic APIs

Toast, Snackbar, and Dialog provide programmatic APIs for triggering notifications from anywhere in your app.

### Setup

Add the container component once at your app root:

```jsx title="src/App.jsx"
import {
  ToastContainer,
  SnackbarContainer,
  DialogContainer,
} from '@allxsmith/bestax-bulma';

function App() {
  return (
    <>
      <YourRoutes />
      <ToastContainer />
      <SnackbarContainer />
      <DialogContainer />
    </>
  );
}
```

### Using the APIs

```jsx
import { toast, snackbar, dialog } from '@allxsmith/bestax-bulma';

// Toast notifications
toast.success('Item saved successfully!');
toast.danger('Something went wrong');
toast.warning('Please review your changes');

// Snackbar with action
snackbar.show({
  message: 'Email archived',
  actionText: 'Undo',
  onAction: () => restoreEmail(),
});

// Confirmation dialog
const confirmed = await dialog.confirm({
  title: 'Delete Item?',
  message: 'This action cannot be undone.',
  type: 'danger',
  confirmText: 'Delete',
});

if (confirmed) {
  deleteItem();
}
```

---

## TypeScript Support

All extra components include TypeScript definitions. Import types as needed:

```tsx
import type {
  SwitchProps,
  SliderProps,
  ToastProps,
  ToastPosition,
  DialogProps,
  DialogType,
  AutocompleteItem,
  TaginputTag,
} from '@allxsmith/bestax-bulma';
```

---

## Troubleshooting

### Components are unstyled

Make sure you've imported the extras CSS:

```jsx
import '@allxsmith/bestax-bulma/dist/extras.css';
```

### Toast/Dialog not appearing

Ensure you've added the container components to your app root:

```jsx
<ToastContainer />
<DialogContainer />
```

### Sidebar not covering the page

The Sidebar uses a portal to render at the document body. Ensure no parent element has `overflow: hidden` that might clip the overlay.

---

## Next Steps

- Explore [Extra UI Components](/docs/guides/library/components/extras)
- Explore [Extra Form Components](/docs/guides/library/form/extras)
- Learn about [Theming](/docs/api/helpers/theme)
- See the [Component Documentation](/docs/category/elements)
