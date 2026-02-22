import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Numberinput } from './Numberinput';
import { Field } from './Field';

const meta: Meta<typeof Numberinput> = {
  title: 'Form/Numberinput',
  component: Numberinput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A number input with increment/decrement buttons. Supports min/max constraints, step values, and different button positions.',
      },
    },
  },
  tags: ['autodocs'],
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
      options: ['primary', 'link', 'info', 'success', 'warning', 'danger'],
      description: 'Color variant for buttons',
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
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    editable: {
      control: 'boolean',
      description: 'Whether the input can be typed in',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Numberinput>;

/**
 * Basic number input with default settings.
 */
export const Default: Story = {
  args: {
    defaultValue: 5,
  },
};

/**
 * Number input with min/max constraints.
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
 * Number input with custom step.
 */
export const WithStep: Story = {
  render: function StepExample() {
    const [value, setValue] = useState(50);

    return (
      <div>
        <Numberinput
          value={value}
          onChange={setValue}
          min={0}
          max={100}
          step={10}
          color="info"
        />
        <p className="help mt-2">Value: {value} (step: 10)</p>
      </div>
    );
  },
};

/**
 * Different button colors.
 */
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {(
        ['primary', 'link', 'info', 'success', 'warning', 'danger'] as const
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
 * Different sizes.
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
 * Controls on left side only.
 */
export const ControlsLeft: Story = {
  args: {
    defaultValue: 5,
    controlsPosition: 'left',
    color: 'primary',
  },
};

/**
 * Controls on right side only.
 */
export const ControlsRight: Story = {
  args: {
    defaultValue: 5,
    controlsPosition: 'right',
    color: 'primary',
  },
};

/**
 * Controls on both sides (default).
 */
export const ControlsBoth: Story = {
  args: {
    defaultValue: 5,
    controlsPosition: 'both',
    color: 'primary',
  },
};

/**
 * Rounded buttons.
 */
export const Rounded: Story = {
  args: {
    defaultValue: 5,
    controlsRounded: true,
    color: 'success',
  },
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
 * Non-editable (buttons only).
 */
export const NonEditable: Story = {
  args: {
    defaultValue: 5,
    editable: false,
    color: 'info',
  },
};

/**
 * Quantity selector example.
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
        />
        <p className="help">Select quantity (1-99)</p>
      </Field>
    );
  },
};

/**
 * Price adjustment example.
 */
export const PriceAdjustment: Story = {
  render: function PriceExample() {
    const [price, setPrice] = useState(100);

    return (
      <div style={{ maxWidth: '200px' }}>
        <label className="label">Price ($)</label>
        <Numberinput
          value={price}
          onChange={setPrice}
          min={0}
          step={5}
          color="success"
        />
        <p className="help mt-2">Current: ${price}.00</p>
      </div>
    );
  },
};

/**
 * Temperature control example.
 */
export const TemperatureControl: Story = {
  render: function TemperatureExample() {
    const [temp, setTemp] = useState(72);

    return (
      <div style={{ maxWidth: '200px' }}>
        <label className="label">Temperature (°F)</label>
        <Numberinput
          value={temp}
          onChange={setTemp}
          min={60}
          max={85}
          color="warning"
        />
        <p className="help mt-2">Range: 60°F - 85°F</p>
      </div>
    );
  },
};

/**
 * Controlled example with external buttons.
 */
export const Controlled: Story = {
  render: function ControlledExample() {
    const [value, setValue] = useState(0);

    return (
      <div>
        <Numberinput value={value} onChange={setValue} color="primary" />
        <div className="buttons mt-4">
          <button className="button" onClick={() => setValue(0)}>
            Reset
          </button>
          <button className="button" onClick={() => setValue(value + 10)}>
            +10
          </button>
          <button className="button" onClick={() => setValue(value - 10)}>
            -10
          </button>
        </div>
        <p className="mt-2">Value: {value}</p>
      </div>
    );
  },
};

/**
 * Decimal step example.
 */
export const DecimalStep: Story = {
  render: function DecimalExample() {
    const [value, setValue] = useState(0);

    return (
      <div style={{ maxWidth: '200px' }}>
        <label className="label">Rating</label>
        <Numberinput
          value={value}
          onChange={setValue}
          min={0}
          max={5}
          step={0.5}
          color="warning"
        />
        <p className="help mt-2">Rating: {value} / 5</p>
      </div>
    );
  },
};
