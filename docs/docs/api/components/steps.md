---
title: Steps
sidebar_label: Steps
description: The `Steps` component provides a multi-step progress indicator for wizard flows, checkout processes, or any multi-step workflow.
---

# Steps

## Overview

<!-- bestax:generated overview -->

The `Steps` component provides a multi-step progress indicator for wizard flows, checkout processes, or any multi-step workflow.

<!-- /bestax:generated overview -->

It supports horizontal and vertical layouts, customizable markers, and clickable navigation.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Steps } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

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
    <Block>
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
      <Paragraph mt="4">Current step: {step + 1}</Paragraph>
    </Block>
  );
}
```

---

### Color Variants

Steps with different color variants.

```tsx live
<Block display="flex" flexDirection="column" gap="5">
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
</Block>
```

---

### Size Variants

Steps with different size variants.

```tsx live
<Block display="flex" flexDirection="column" gap="5">
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
</Block>
```

---

### With Icons

Steps with custom icons in markers.

```tsx live
<Steps
  value={1}
  color="info"
  items={[
    { label: 'Cart', icon: <Icon name="shopping-cart" variant="solid" /> },
    { label: 'Shipping', icon: <Icon name="truck" variant="solid" /> },
    { label: 'Payment', icon: <Icon name="credit-card" variant="solid" /> },
    { label: 'Done', icon: <Icon name="check" variant="solid" /> },
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
    <Block>
      <Steps
        value={step}
        items={steps.map((label, i) => ({ label, clickable: i <= step }))}
        onStepClick={s => s <= step && setStep(s)}
        color="primary"
      />
      <Box mt="4" p="4">
        <Title size="5">{steps[step]}</Title>
        <Paragraph>Content for the {steps[step]} step goes here.</Paragraph>
      </Box>
      <Buttons mt="4">
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
      </Buttons>
    </Block>
  );
}
```

---

### Compound (dot-notation) usage

`Step` is also available as `Steps.Step`, so steps can be declared as children from the single `Steps` import — an alternative to the `items` prop.

```tsx live
<Steps value={1}>
  <Steps.Step label="Account" />
  <Steps.Step label="Profile" />
  <Steps.Step label="Complete" />
</Steps>
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

---

## Props

<!-- bestax:generated props -->

| Prop              | Type                                                                            | Default    | Description                                       |
| ----------------- | ------------------------------------------------------------------------------- | ---------- | ------------------------------------------------- |
| `value`           | `number`                                                                        | `0`        | Current active step (0-indexed).                  |
| `items`           | `StepItemProps[]`                                                               | —          | Array of step items.                              |
| `size`            | `'small'` \| `'medium'` \| `'large'`                                            | —          | Size of the steps.                                |
| `color`           | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —          | Color variant.                                    |
| `hasMarker`       | `boolean`                                                                       | `true`     | Show step markers. Default: true.                 |
| `animated`        | `boolean`                                                                       | `true`     | Enable animations. Default: true.                 |
| `rounded`         | `boolean`                                                                       | `true`     | Use rounded markers. Default: true.               |
| `vertical`        | `boolean`                                                                       | `false`    | Vertical layout.                                  |
| `labelPosition`   | `'bottom'` \| `'right'` \| `'left'`                                             | `'bottom'` | Position of labels.                               |
| `mobileMode`      | `'minimal'` \| `'compact'` \| `'right'`                                         | —          | Mobile display mode.                              |
| `showStepNumbers` | `boolean`                                                                       | `true`     | Displays step numbers in the markers.             |
| `hasNavigation`   | `boolean`                                                                       | `false`    | Shows previous/next navigation buttons.           |
| `prevLabel`       | `string`                                                                        | —          | Label for the previous button.                    |
| `nextLabel`       | `string`                                                                        | —          | Label for the next button.                        |
| `onPrev`          | `() => void`                                                                    | —          | Callback when previous button is clicked.         |
| `onNext`          | `() => void`                                                                    | —          | Callback when next button is clicked.             |
| `onStepClick`     | `(step: number) => void`                                                        | —          | Callback when a step is clicked.                  |
| `children`        | `React.ReactNode`                                                               | —          | Step children (alternative to items).             |
| `className`       | `string`                                                                        | —          | Additional CSS classes.                           |
| `...`             | All standard `<div>` attributes and Bulma helper props                          | —          | See [Helper Props](../helpers/usebulmaclasses.md) |

**Subcomponents:**

- `Steps.Step`: Individual Step component for use inside Steps.

### Steps.Step

| Prop            | Type                                                  | Default | Description                                       |
| --------------- | ----------------------------------------------------- | ------- | ------------------------------------------------- |
| `isActive`      | `boolean`                                             | `false` | Whether this step is active                       |
| `isCompleted`   | `boolean`                                             | `false` | Whether this step is completed                    |
| `label`         | `React.ReactNode`                                     | —       | Step label/title                                  |
| `icon`          | `React.ReactNode`                                     | —       | Icon for the step marker                          |
| `clickable`     | `boolean`                                             | `false` | Whether this step is clickable                    |
| `onClick`       | `() => void`                                          | —       | Click handler                                     |
| `stepNumber`    | `number`                                              | —       | Step number to display in marker (1-indexed)      |
| `completedIcon` | `React.ReactNode`                                     | `'✓'`   | Icon shown when the step is completed.            |
| `className`     | `string`                                              | —       | Additional CSS classes.                           |
| `children`      | `React.ReactNode`                                     | —       | Content rendered inside the component.            |
| `...`           | All standard `<li>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->

### StepItemProps

| Prop            | Type              | Default | Description                            |
| --------------- | ----------------- | ------- | -------------------------------------- |
| `label`         | `React.ReactNode` | —       | Step label/title.                      |
| `icon`          | `React.ReactNode` | —       | Icon for the step marker.              |
| `clickable`     | `boolean`         | `false` | Whether this step is clickable.        |
| `completedIcon` | `React.ReactNode` | `'✓'`   | Icon shown when the step is completed. |
| `className`     | `string`          | —       | Additional class for this step.        |

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Steps` registers these variables on its own `.steps` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                 | Sass Variable                         | Default                        |
| -------------------------------------------- | ------------------------------------- | ------------------------------ |
| `--bulma-steps-marker-size`                  | `$steps-marker-size`                  | `2rem`                         |
| `--bulma-steps-marker-size-small`            | `$steps-marker-size-small`            | `1.5rem`                       |
| `--bulma-steps-marker-size-medium`           | `$steps-marker-size-medium`           | `2.5rem`                       |
| `--bulma-steps-marker-size-large`            | `$steps-marker-size-large`            | `3rem`                         |
| `--bulma-steps-divider-height`               | `$steps-divider-height`               | `0.2em`                        |
| `--bulma-steps-default-color`                | `$steps-default-color`                | `var(--bulma-grey-light)`      |
| `--bulma-steps-marker-background`            | `$steps-marker-background`            | `var(--bulma-scheme-main)`     |
| `--bulma-steps-marker-font-size`             | `$steps-marker-font-size`             | `var(--bulma-size-small)`      |
| `--bulma-steps-marker-font-weight`           | `$steps-marker-font-weight`           | `var(--bulma-weight-bold)`     |
| `--bulma-steps-title-size`                   | `$steps-title-size`                   | `var(--bulma-size-small)`      |
| `--bulma-steps-title-weight`                 | `$steps-title-weight`                 | `var(--bulma-weight-medium)`   |
| `--bulma-steps-title-color`                  | `$steps-title-color`                  | `var(--bulma-text-weak)`       |
| `--bulma-steps-title-active-color`           | `$steps-title-active-color`           | `var(--bulma-text-strong)`     |
| `--bulma-steps-title-active-weight`          | `$steps-title-active-weight`          | `var(--bulma-weight-semibold)` |
| `--bulma-steps-content-margin-top`           | `$steps-content-margin-top`           | `0.5rem`                       |
| `--bulma-steps-vertical-padding`             | `$steps-vertical-padding`             | `1.5rem`                       |
| `--bulma-steps-vertical-content-margin-left` | `$steps-vertical-content-margin-left` | `1rem`                         |
| `--bulma-steps-animation-duration`           | `$steps-animation-duration`           | `0.3s`                         |
| `--bulma-steps-navigation-margin-top`        | `$steps-navigation-margin-top`        | `1rem`                         |

<!-- /bestax:generated cssvars -->
