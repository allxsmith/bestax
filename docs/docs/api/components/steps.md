---
title: Steps
sidebar_label: Steps
---

# Steps

## Overview

The `Steps` component provides a multi-step progress indicator for wizard flows, checkout processes, or any multi-step workflow. It supports horizontal and vertical layouts, customizable markers, and clickable navigation.

:::info
The Steps component requires importing the extras CSS. See the [Extras Setup Guide](../../guides/getting-started/using-extras.md) for installation instructions.
:::

---

## Import

```tsx
import { Steps } from '@allxsmith/bestax-bulma';

// Also import the extras CSS
import '@allxsmith/bestax-bulma/dist/extras.css';
```

---

## Props

| Prop            | Type                                                                            | Default    | Description                                      |
| --------------- | ------------------------------------------------------------------------------- | ---------- | ------------------------------------------------ |
| `value`         | `number`                                                                        | `0`        | Current active step (0-indexed).                 |
| `items`         | `StepItemProps[]`                                                               | —          | Array of step items.                             |
| `size`          | `'small'` \| `'medium'` \| `'large'`                                            | —          | Size of the steps.                               |
| `color`         | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —          | Color variant.                                   |
| `hasMarker`     | `boolean`                                                                       | `true`     | Show step markers.                               |
| `animated`      | `boolean`                                                                       | `true`     | Enable animations.                               |
| `rounded`       | `boolean`                                                                       | `false`    | Use rounded markers.                             |
| `vertical`      | `boolean`                                                                       | `false`    | Vertical layout.                                 |
| `labelPosition` | `'bottom'` \| `'right'`                                                         | `'bottom'` | Position of labels.                              |
| `mobileMode`    | `'minimal'` \| `'compact'` \| `'right'`                                         | —          | Mobile display mode.                             |
| `onStepClick`   | `(step: number) => void`                                                        | —          | Callback when a step is clicked.                 |
| `children`      | `React.ReactNode`                                                               | —          | Step children (alternative to items).            |
| `className`     | `string`                                                                        | —          | Additional CSS classes.                          |
| ...             | All standard HTML and Bulma helper props                                        |            | (See [Helper Props](../helpers/usebulmaclasses)) |

### StepItemProps

| Prop        | Type              | Default | Description                     |
| ----------- | ----------------- | ------- | ------------------------------- |
| `label`     | `React.ReactNode` | —       | Step label/title.               |
| `icon`      | `React.ReactNode` | —       | Icon for the step marker.       |
| `clickable` | `boolean`         | `false` | Whether this step is clickable. |
| `className` | `string`          | —       | Additional class for this step. |

---

## Usage

### Basic Steps

A simple step indicator showing progress through a flow.

```tsx live
<Steps
  value={1}
  items={[{ label: 'Account' }, { label: 'Profile' }, { label: 'Complete' }]}
/>
```

---

### Clickable Steps

Steps that allow navigation by clicking.

```tsx live
function example() {
  const [step, setStep] = useState(1);
  return (
    <div>
      <Steps
        value={step}
        items={[
          { label: 'Account', clickable: true },
          { label: 'Profile', clickable: true },
          { label: 'Review', clickable: true },
          { label: 'Complete', clickable: true },
        ]}
        onStepClick={setStep}
        color="primary"
      />
      <p className="mt-4">Current step: {step + 1}</p>
    </div>
  );
}
```

---

### Color Variants

Steps with different color variants.

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
  <Steps
    value={1}
    color="primary"
    items={[{ label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' }]}
  />
  <Steps
    value={1}
    color="success"
    items={[{ label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' }]}
  />
  <Steps
    value={1}
    color="info"
    items={[{ label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' }]}
  />
  <Steps
    value={1}
    color="warning"
    items={[{ label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' }]}
  />
  <Steps
    value={1}
    color="danger"
    items={[{ label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' }]}
  />
</div>
```

---

### Size Variants

Steps with different size variants.

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
  <Steps
    value={1}
    size="small"
    items={[{ label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' }]}
  />
  <Steps
    value={1}
    items={[{ label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' }]}
  />
  <Steps
    value={1}
    size="medium"
    items={[{ label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' }]}
  />
  <Steps
    value={1}
    size="large"
    items={[{ label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' }]}
  />
</div>
```

---

### With Icons

Steps with custom icons in markers.

```tsx live
<Steps
  value={1}
  color="info"
  items={[
    { label: 'Cart', icon: <i className="fas fa-shopping-cart" /> },
    { label: 'Shipping', icon: <i className="fas fa-truck" /> },
    { label: 'Payment', icon: <i className="fas fa-credit-card" /> },
    { label: 'Done', icon: <i className="fas fa-check" /> },
  ]}
/>
```

---

### Vertical Layout

Steps in vertical orientation.

```tsx live
<Steps
  value={1}
  vertical
  color="primary"
  items={[
    { label: 'Create Account' },
    { label: 'Set Up Profile' },
    { label: 'Choose Plan' },
    { label: 'Start Using' },
  ]}
/>
```

---

### Rounded Markers

Steps with rounded (circular) markers.

```tsx live
<Steps
  value={2}
  rounded
  color="success"
  items={[
    { label: 'Order Placed' },
    { label: 'Processing' },
    { label: 'Shipped' },
    { label: 'Delivered' },
  ]}
/>
```

---

### Checkout Flow Example

A complete checkout flow with navigation buttons.

```tsx live
function example() {
  const [step, setStep] = useState(0);
  const steps = ['Cart', 'Shipping', 'Payment', 'Confirm'];

  return (
    <div>
      <Steps
        value={step}
        items={steps.map((label, i) => ({ label, clickable: i <= step }))}
        onStepClick={s => s <= step && setStep(s)}
        color="primary"
      />
      <Box mt="4" p="4">
        <Title size="5">{steps[step]}</Title>
        <p>Content for the {steps[step]} step goes here.</p>
      </Box>
      <div className="buttons mt-4">
        <Button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          Previous
        </Button>
        <Button
          color="primary"
          onClick={() => setStep(Math.min(3, step + 1))}
          disabled={step === 3}
        >
          {step === 2 ? 'Place Order' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
```

---

## Accessibility

- Steps use `aria-current="step"` on the active step
- Clickable steps are keyboard navigable with proper focus indicators
- Use descriptive labels for each step
- The step markers show completion state with checkmarks

---

## Related Components

- [Progress](../elements/progress.md) - For linear progress indication

---

## Additional Resources

- [Storybook: Steps Stories](https://bestax.io/storybook/?path=/story/components-steps)

:::tip Pro Tip
Use the `onStepClick` callback with `clickable: true` on items to allow users to navigate back to previous steps.
:::
