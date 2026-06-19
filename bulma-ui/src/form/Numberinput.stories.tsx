import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Numberinput } from './Numberinput';
import { Field } from './Field';
import { Control } from './Control';
import { Button } from '../elements/Button';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';

const meta: Meta<typeof Numberinput> = {
  title: 'Form/Numberinput',
  component: Numberinput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A number input with increment/decrement buttons. Supports spaced (is-grouped) and compact (has-addons) layouts, a MUI-inspired stepper variant, min/max constraints, step values, and different button positions.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <Columns>
        <Column
          sizeMobile="full"
          sizeTablet="three-quarters"
          sizeDesktop="half"
          sizeWidescreen="one-third"
          sizeFullhd="one-quarter"
        >
          <Story />
        </Column>
      </Columns>
    ),
  ],
  argTypes: {
    value: {
      control: 'number',
      description: 'Controlled value',
    },
    defaultValue: {
      control: 'number',
      description: 'Default value for uncontrolled usage',
    },
    min: {
      control: 'number',
      description: 'Minimum allowed value',
    },
    max: {
      control: 'number',
      description: 'Maximum allowed value',
    },
    step: {
      control: 'number',
      description: 'Step increment',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of the input',
    },
    color: {
      control: 'select',
      options: [
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'light',
        'dark',
      ],
      description: 'Color variant for buttons',
    },
    inputColor: {
      control: 'select',
      options: ['primary', 'link', 'info', 'success', 'warning', 'danger'],
      description: 'Color variant for the input border (e.g. validation)',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show a loading spinner on the input',
    },
    exponential: {
      control: 'boolean',
      description:
        'Step size grows with value magnitude (step * max(1, floor(abs(value))))',
    },
    controlsPosition: {
      control: 'select',
      options: ['left', 'right', 'both'],
      description: 'Position of +/- buttons',
    },
    controlsRounded: {
      control: 'boolean',
      description: 'Use rounded buttons',
    },
    compact: {
      control: 'boolean',
      description: 'Compact (glued) layout using has-addons',
    },
    variant: {
      control: 'select',
      options: ['plusminus', 'stepper'],
      description: 'Control variant',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    editable: {
      control: 'boolean',
      description: 'Whether the input can be typed in',
    },
    bare: {
      control: 'boolean',
      description:
        'Bare mode — no outer field wrapper, for composing inside a parent Field',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Numberinput>;

/**
 * Default spaced layout with +/- buttons on both sides.
 * Uses Bulma's `field is-grouped` for a gapped flex layout.
 */
export const Default: Story = {
  args: {
    defaultValue: 5,
  },
};

/**
 * Spaced layout with rounded (circular) buttons.
 */
export const Rounded: Story = {
  args: {
    defaultValue: 5,
    controlsRounded: true,
    color: 'primary',
  },
};

/**
 * Compact (glued) layout using Bulma's `field has-addons`.
 * Buttons and input are connected with no gap.
 */
export const Compact: Story = {
  args: {
    defaultValue: 5,
    compact: true,
    color: 'primary',
  },
};

/**
 * Compact layout with rounded outer edges.
 */
export const CompactRounded: Story = {
  args: {
    defaultValue: 5,
    compact: true,
    controlsRounded: true,
    color: 'primary',
  },
};

/**
 * Compact layout with both controls on the right side, rounded.
 */
export const CompactRoundedRight: Story = {
  args: {
    defaultValue: 5,
    compact: true,
    controlsRounded: true,
    controlsPosition: 'right',
    color: 'primary',
  },
};

/**
 * Both controls on the left side (spaced).
 */
export const ControlsLeft: Story = {
  args: {
    defaultValue: 5,
    controlsPosition: 'left',
    color: 'primary',
  },
};

/**
 * Both controls on the right side (spaced).
 */
export const ControlsRight: Story = {
  args: {
    defaultValue: 5,
    controlsPosition: 'right',
    color: 'primary',
  },
};

/**
 * MUI-inspired stepper variant with up/down chevrons stacked vertically.
 * Always compact, always right-aligned.
 */
export const Stepper: Story = {
  args: {
    defaultValue: 5,
    variant: 'stepper',
  },
};

/**
 * Stepper variant at all sizes.
 */
export const StepperSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <p className="mb-2">Small</p>
        <Numberinput defaultValue={5} variant="stepper" size="small" />
      </div>
      <div>
        <p className="mb-2">Default</p>
        <Numberinput defaultValue={5} variant="stepper" />
      </div>
      <div>
        <p className="mb-2">Medium</p>
        <Numberinput defaultValue={5} variant="stepper" size="medium" />
      </div>
      <div>
        <p className="mb-2">Large</p>
        <Numberinput defaultValue={5} variant="stepper" size="large" />
      </div>
    </div>
  ),
};

/**
 * Controlled example with min/max constraints.
 */
export const WithMinMax: Story = {
  render: function MinMaxExample() {
    const [value, setValue] = useState(5);

    return (
      <div>
        <Numberinput
          value={value}
          onChange={setValue}
          min={0}
          max={10}
          color="primary"
        />
        <p className="help mt-2">Value: {value} (min: 0, max: 10)</p>
      </div>
    );
  },
};

/**
 * All sizes side by side.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <p className="mb-2">Small</p>
        <Numberinput defaultValue={5} size="small" color="primary" />
      </div>
      <div>
        <p className="mb-2">Default</p>
        <Numberinput defaultValue={5} color="primary" />
      </div>
      <div>
        <p className="mb-2">Medium</p>
        <Numberinput defaultValue={5} size="medium" color="primary" />
      </div>
      <div>
        <p className="mb-2">Large</p>
        <Numberinput defaultValue={5} size="large" color="primary" />
      </div>
    </div>
  ),
};

/**
 * All color variants.
 */
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {(
        [
          'primary',
          'link',
          'info',
          'success',
          'warning',
          'danger',
          'light',
          'dark',
        ] as const
      ).map(color => (
        <div key={color}>
          <p className="mb-2" style={{ textTransform: 'capitalize' }}>
            {color}
          </p>
          <Numberinput defaultValue={5} color={color} />
        </div>
      ))}
    </div>
  ),
};

/**
 * Disabled state.
 */
export const Disabled: Story = {
  args: {
    defaultValue: 5,
    disabled: true,
  },
};

/**
 * Non-editable (buttons only, no typing).
 */
export const NonEditable: Story = {
  args: {
    defaultValue: 5,
    editable: false,
    color: 'info',
  },
};

/**
 * Practical quantity selector example.
 */
export const QuantitySelector: Story = {
  render: function QuantityExample() {
    const [quantity, setQuantity] = useState(1);

    return (
      <Field>
        <label className="label">Quantity</label>
        <Numberinput
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={99}
          color="primary"
          compact
        />
        <p className="help">Select quantity (1-99)</p>
      </Field>
    );
  },
};

/**
 * Loading state — Bulma renders a spinner via `::after` on `.control.is-loading`.
 */
export const Loading: Story = {
  args: {
    defaultValue: 42,
    isLoading: true,
    color: 'primary',
  },
};

/**
 * Validation error state with red input border and help text.
 */
export const QuantityWithError: Story = {
  render: function QuantityWithErrorExample() {
    const [value, setValue] = useState(0);

    return (
      <Field>
        <label className="label">Quantity</label>
        <Numberinput
          value={value}
          onChange={setValue}
          min={0}
          max={99}
          inputColor="danger"
          color="danger"
          compact
        />
        <p className="help is-danger">Quantity must be greater than 0</p>
      </Field>
    );
  },
};

/**
 * Validation success state with green input border and help text.
 */
export const RateWithSuccess: Story = {
  render: function RateWithSuccessExample() {
    const [value, setValue] = useState(4.5);

    return (
      <Field>
        <label className="label">Rate</label>
        <Numberinput
          value={value}
          onChange={setValue}
          step={0.5}
          min={0}
          max={10}
          inputColor="success"
          color="success"
          compact
        />
        <p className="help is-success">Rate is valid</p>
      </Field>
    );
  },
};

/**
 * Decimal step of 0.1 — controlled to display precise value.
 */
export const DecimalStep: Story = {
  render: function DecimalStepExample() {
    const [value, setValue] = useState(1.0);

    return (
      <div>
        <Numberinput
          value={value}
          onChange={setValue}
          step={0.1}
          color="info"
        />
        <p className="help mt-2">Value: {value.toFixed(1)}</p>
      </div>
    );
  },
};

/**
 * Minimum step of 0.01 — useful for currency inputs.
 */
export const MinimumStep: Story = {
  render: function MinimumStepExample() {
    const [value, setValue] = useState(9.99);

    return (
      <div>
        <Numberinput
          value={value}
          onChange={setValue}
          step={0.01}
          min={0}
          color="success"
        />
        {/* eslint-disable-next-line @eslint-react/jsx-no-leaked-dollar -- intentional currency prefix */}
        <p className="help mt-2">Value: ${value.toFixed(2)}</p>
      </div>
    );
  },
};

/**
 * Exponential step — step size grows with value magnitude.
 * At value 1 step=1, at value 10 step=10, at value 100 step=100, etc.
 */
export const Exponential: Story = {
  render: function ExponentialExample() {
    const [value, setValue] = useState(1);

    return (
      <div>
        <Numberinput
          value={value}
          onChange={setValue}
          exponential
          color="warning"
        />
        <p className="help mt-2">
          Value: {value} — effective step:{' '}
          {1 * Math.max(1, Math.floor(Math.abs(value)))}
        </p>
      </div>
    );
  },
};

/**
 * Compact layout with controls on the right — Buefy's "With Addons Expanded" pattern.
 */
export const CompactExpanded: Story = {
  args: {
    defaultValue: 5,
    compact: true,
    controlsPosition: 'right',
    color: 'primary',
  },
};

/**
 * Bare mode inside a parent `Field hasAddons` — compose an external Button
 * alongside the Numberinput controls in a single glued addon group.
 */
export const WithAddons: Story = {
  render: function WithAddonsExample() {
    const [value, setValue] = useState(5);
    return (
      <Field hasAddons>
        <Control>
          <Button>Button</Button>
        </Control>
        <Numberinput bare value={value} onChange={setValue} color="primary" />
      </Field>
    );
  },
};

/**
 * Bare mode with a placeholder on the input.
 */
export const WithAddonsPlaceholder: Story = {
  render: function WithAddonsPlaceholderExample() {
    return (
      <Field hasAddons>
        <Control>
          <Button>Button</Button>
        </Control>
        <Numberinput bare placeholder="Enter a number" color="primary" />
      </Field>
    );
  },
};

/**
 * Bare mode with the external Button on the right side.
 */
export const WithAddonsRight: Story = {
  render: function WithAddonsRightExample() {
    const [value, setValue] = useState(5);
    return (
      <Field hasAddons>
        <Numberinput bare value={value} onChange={setValue} color="primary" />
        <Control>
          <Button>Button</Button>
        </Control>
      </Field>
    );
  },
};

/**
 * Bare mode at all sizes inside a parent `Field hasAddons`.
 */
export const WithAddonsSizes: Story = {
  render: function WithAddonsSizesExample() {
    const [small, setSmall] = useState(5);
    const [normal, setNormal] = useState(5);
    const [medium, setMedium] = useState(5);
    const [large, setLarge] = useState(5);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <p className="mb-2">Small</p>
          <Field hasAddons>
            <Control>
              <Button size="small">Button</Button>
            </Control>
            <Numberinput
              bare
              size="small"
              value={small}
              onChange={setSmall}
              color="primary"
            />
          </Field>
        </div>
        <div>
          <p className="mb-2">Default</p>
          <Field hasAddons>
            <Control>
              <Button>Button</Button>
            </Control>
            <Numberinput
              bare
              value={normal}
              onChange={setNormal}
              color="primary"
            />
          </Field>
        </div>
        <div>
          <p className="mb-2">Medium</p>
          <Field hasAddons>
            <Control>
              <Button size="medium">Button</Button>
            </Control>
            <Numberinput
              bare
              size="medium"
              value={medium}
              onChange={setMedium}
              color="primary"
            />
          </Field>
        </div>
        <div>
          <p className="mb-2">Large</p>
          <Field hasAddons>
            <Control>
              <Button size="large">Button</Button>
            </Control>
            <Numberinput
              bare
              size="large"
              value={large}
              onChange={setLarge}
              color="primary"
            />
          </Field>
        </div>
      </div>
    );
  },
};

/**
 * Demonstrates composing different button colors, rounded edges, and sizes together.
 */
export const ButtonCustomization: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <p className="mb-2">Primary + Rounded</p>
        <Numberinput defaultValue={5} color="primary" controlsRounded compact />
      </div>
      <div>
        <p className="mb-2">Danger + Large</p>
        <Numberinput defaultValue={5} color="danger" size="large" compact />
      </div>
      <div>
        <p className="mb-2">Dark + Small + Rounded</p>
        <Numberinput
          defaultValue={5}
          color="dark"
          size="small"
          controlsRounded
          compact
        />
      </div>
      <div>
        <p className="mb-2">Light + Medium</p>
        <Numberinput defaultValue={5} color="light" size="medium" compact />
      </div>
    </div>
  ),
};

// ============================================================
// Context-aware Field/Control stories
// ============================================================

/**
 * Standalone with label — Numberinput renders its own Field+Control wrapper automatically.
 */
export const WithLabel: Story = {
  render: () => <Numberinput label="Quantity" />,
};

/**
 * Inside Field — the outer Field turns off Numberinput's auto Field rendering via context.
 * Demonstrates horizontal layout composition.
 */
export const WithFieldWrapper: Story = {
  render: () => (
    <Field horizontal label="Quantity">
      <Field.Body>
        <Numberinput />
      </Field.Body>
    </Field>
  ),
};

/**
 * Full manual composition — Field+Control provided externally.
 * Numberinput manages its own control internally, so the outer Control
 * simply provides context signaling.
 */
export const WithFieldControlWrapper: Story = {
  render: () => (
    <Field horizontal label="Quantity">
      <Field.Body>
        <Field>
          <Control>
            <Numberinput />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};
