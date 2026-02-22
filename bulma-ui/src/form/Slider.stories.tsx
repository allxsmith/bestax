import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Slider } from './Slider';
import { Field } from './Field';

const meta: Meta<typeof Slider> = {
  title: 'Form/Slider',
  component: Slider,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A range slider input for selecting a value from a range. Supports different sizes, colors, and optional value display.',
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
      description: 'Minimum value',
    },
    max: {
      control: 'number',
      description: 'Maximum value',
    },
    step: {
      control: 'number',
      description: 'Step increment',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of the slider',
    },
    color: {
      control: 'select',
      options: ['primary', 'link', 'info', 'success', 'warning', 'danger'],
      description: 'Color variant',
    },
    isRounded: {
      control: 'boolean',
      description: 'Use rounded track ends',
    },
    isCircle: {
      control: 'boolean',
      description: 'Use larger circular thumb',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the slider is disabled',
    },
    showOutput: {
      control: 'boolean',
      description: 'Show current value tooltip',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

/**
 * Basic slider with default settings.
 */
export const Default: Story = {
  args: {
    defaultValue: 50,
  },
};

/**
 * Slider with value tooltip on hover.
 */
export const WithOutput: Story = {
  render: function SliderWithOutput() {
    const [value, setValue] = useState(50);

    return (
      <div style={{ paddingTop: '2rem' }}>
        <Slider value={value} onChange={setValue} showOutput color="primary" />
        <p className="mt-4">
          Value: <strong>{value}</strong>
        </p>
      </div>
    );
  },
};

/**
 * Slider with different colors.
 */
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {(
        ['primary', 'link', 'info', 'success', 'warning', 'danger'] as const
      ).map(color => (
        <div key={color}>
          <p className="mb-2" style={{ textTransform: 'capitalize' }}>
            {color}
          </p>
          <Slider defaultValue={60} color={color} />
        </div>
      ))}
    </div>
  ),
};

/**
 * Slider with different sizes.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <p className="mb-2">Small</p>
        <Slider defaultValue={50} size="small" color="primary" />
      </div>
      <div>
        <p className="mb-2">Default</p>
        <Slider defaultValue={50} color="primary" />
      </div>
      <div>
        <p className="mb-2">Medium</p>
        <Slider defaultValue={50} size="medium" color="primary" />
      </div>
      <div>
        <p className="mb-2">Large</p>
        <Slider defaultValue={50} size="large" color="primary" />
      </div>
    </div>
  ),
};

/**
 * Slider with rounded track.
 */
export const Rounded: Story = {
  args: {
    defaultValue: 50,
    isRounded: true,
    color: 'success',
  },
};

/**
 * Slider with larger circular thumb.
 */
export const Circle: Story = {
  args: {
    defaultValue: 50,
    isCircle: true,
    color: 'info',
  },
};

/**
 * Disabled slider.
 */
export const Disabled: Story = {
  args: {
    defaultValue: 30,
    disabled: true,
  },
};

/**
 * Custom range slider.
 */
export const CustomRange: Story = {
  render: function CustomRangeSlider() {
    const [value, setValue] = useState(500);

    return (
      <div style={{ paddingTop: '2rem' }}>
        <Slider
          value={value}
          onChange={setValue}
          min={0}
          max={1000}
          step={50}
          showOutput
          color="warning"
        />
        <p className="mt-4">
          Value: <strong>{value}</strong> (range: 0-1000, step: 50)
        </p>
      </div>
    );
  },
};

/**
 * Slider with formatted output.
 */
export const FormattedOutput: Story = {
  render: function FormattedSlider() {
    const [value, setValue] = useState(50);

    return (
      <div style={{ paddingTop: '2rem' }}>
        <Slider
          value={value}
          onChange={setValue}
          showOutput
          formatOutput={v => `${v}%`}
          color="primary"
        />
        <p className="mt-4">
          Progress: <strong>{value}%</strong>
        </p>
      </div>
    );
  },
};

/**
 * Price range slider example.
 */
export const PriceRange: Story = {
  render: function PriceRangeSlider() {
    const [price, setPrice] = useState(100);

    return (
      <div style={{ maxWidth: '400px', paddingTop: '2rem' }}>
        <label className="label">Price Range</label>
        <Slider
          value={price}
          onChange={setPrice}
          min={0}
          max={500}
          step={10}
          showOutput
          formatOutput={v => `$${v}`}
          color="success"
        />
        <div className="is-flex is-justify-content-space-between mt-2">
          <span>$0</span>
          <span>$500</span>
        </div>
      </div>
    );
  },
};

/**
 * Volume control example.
 */
export const VolumeControl: Story = {
  render: function VolumeSlider() {
    const [volume, setVolume] = useState(70);

    return (
      <div style={{ maxWidth: '300px', paddingTop: '2rem' }}>
        <div className="is-flex is-align-items-center">
          <span className="icon mr-2">
            <i className="fas fa-volume-up" />
          </span>
          <Slider
            value={volume}
            onChange={setVolume}
            showOutput
            formatOutput={v => `${v}%`}
            color="info"
            size="small"
          />
        </div>
      </div>
    );
  },
};

/**
 * Within a form field.
 */
export const InField: Story = {
  render: function SliderInField() {
    const [value, setValue] = useState(50);

    return (
      <Field>
        <label className="label">Brightness</label>
        <div style={{ paddingTop: '1rem' }}>
          <Slider
            value={value}
            onChange={setValue}
            showOutput
            formatOutput={v => `${v}%`}
            color="primary"
          />
        </div>
        <p className="help">Adjust the brightness level</p>
      </Field>
    );
  },
};

/**
 * Controlled slider.
 */
export const Controlled: Story = {
  render: function ControlledSlider() {
    const [value, setValue] = useState(25);

    return (
      <div>
        <Slider value={value} onChange={setValue} color="primary" />
        <div className="buttons mt-4">
          <button className="button" onClick={() => setValue(0)}>
            0
          </button>
          <button className="button" onClick={() => setValue(25)}>
            25
          </button>
          <button className="button" onClick={() => setValue(50)}>
            50
          </button>
          <button className="button" onClick={() => setValue(75)}>
            75
          </button>
          <button className="button" onClick={() => setValue(100)}>
            100
          </button>
        </div>
        <p className="mt-2">
          Current value: <strong>{value}</strong>
        </p>
      </div>
    );
  },
};
