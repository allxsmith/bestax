import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Slider } from './Slider';
import { Field } from './Field';
import { Control } from './Control';

const meta: Meta<typeof Slider> = {
  title: 'Form/Slider',
  component: Slider,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A range slider input for selecting a value or range. Supports sizes, colors, tooltips, ticks/marks, range mode (dual thumb), vertical orientation, and non-linear scale.',
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
      description: 'Show current value tooltip (maps to tooltip="auto")',
    },
    tooltip: {
      control: 'select',
      options: ['auto', 'always', 'hidden'],
      description: 'Tooltip visibility mode',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Slider orientation',
    },
    ticks: {
      control: 'boolean',
      description: 'Show tick marks at each step',
    },
    range: {
      control: 'boolean',
      description: 'Enable range (dual thumb) mode',
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

// ============================================================
// New stories for enhanced features
// ============================================================

/**
 * Tooltip always visible, even without hover/focus.
 */
export const TooltipAlways: Story = {
  render: function TooltipAlwaysSlider() {
    const [value, setValue] = useState(50);

    return (
      <div style={{ paddingTop: '2.5rem' }}>
        <Slider
          value={value}
          onChange={setValue}
          tooltip="always"
          showOutput
          color="primary"
        />
        <p className="mt-4">
          Value: <strong>{value}</strong>
        </p>
      </div>
    );
  },
};

/**
 * Tooltip hidden — no tooltip even with showOutput.
 */
export const TooltipHidden: Story = {
  render: function TooltipHiddenSlider() {
    const [value, setValue] = useState(50);

    return (
      <div>
        <Slider
          value={value}
          onChange={setValue}
          tooltip="hidden"
          color="info"
        />
        <p className="mt-4">
          Value: <strong>{value}</strong> (tooltip hidden)
        </p>
      </div>
    );
  },
};

/**
 * Custom tooltip label using formatOutput with always-on tooltip.
 */
export const CustomTooltipLabel: Story = {
  render: function CustomTooltipSlider() {
    const [value, setValue] = useState(72);

    return (
      <div style={{ paddingTop: '2.5rem' }}>
        <Slider
          value={value}
          onChange={setValue}
          tooltip="always"
          showOutput
          formatOutput={v => `${v}°F`}
          color="danger"
        />
        <p className="mt-4">
          Temperature: <strong>{value}°F</strong>
        </p>
      </div>
    );
  },
};

/**
 * Rounded thumb (isCircle) with output tooltip.
 */
export const RoundedThumb: Story = {
  render: function RoundedThumbSlider() {
    const [value, setValue] = useState(40);

    return (
      <div style={{ paddingTop: '2.5rem' }}>
        <Slider
          value={value}
          onChange={setValue}
          isCircle
          showOutput
          color="success"
        />
      </div>
    );
  },
};

/**
 * Tick marks at every step.
 */
export const Ticks: Story = {
  render: function TicksSlider() {
    const [value, setValue] = useState(50);

    return (
      <div style={{ paddingTop: '2rem' }}>
        <Slider
          value={value}
          onChange={setValue}
          min={0}
          max={100}
          step={10}
          ticks
          showOutput
          color="primary"
        />
        <p className="mt-4">
          Value: <strong>{value}</strong>
        </p>
      </div>
    );
  },
};

/**
 * Custom tick marks with labels.
 */
export const TicksCustomLabels: Story = {
  render: function TicksCustomLabelsSlider() {
    const [value, setValue] = useState(50);

    const marks = [
      { value: 0, label: '0°C' },
      { value: 25, label: '25°C' },
      { value: 50, label: '50°C' },
      { value: 75, label: '75°C' },
      { value: 100, label: '100°C' },
    ];

    return (
      <div style={{ paddingBottom: '1rem' }}>
        <Slider
          value={value}
          onChange={setValue}
          marks={marks}
          showOutput
          formatOutput={v => `${v}°C`}
          color="danger"
        />
        <p className="mt-5">
          Temperature: <strong>{value}°C</strong>
        </p>
      </div>
    );
  },
};

/**
 * Discrete labeled selection with ticks (fan speed example).
 */
export const TicksFan: Story = {
  render: function TicksFanSlider() {
    const [value, setValue] = useState(2);

    const marks = [
      { value: 0, label: 'Off' },
      { value: 1, label: 'Low' },
      { value: 2, label: 'Med' },
      { value: 3, label: 'High' },
      { value: 4, label: 'Max' },
    ];

    return (
      <div style={{ paddingTop: '2rem', paddingBottom: '1rem' }}>
        <label className="label">Fan Speed</label>
        <Slider
          value={value}
          onChange={setValue}
          min={0}
          max={4}
          step={1}
          marks={marks}
          tooltip="always"
          showOutput
          formatOutput={v => marks.find(m => m.value === v)?.label as string ?? `${v}`}
          color="info"
        />
      </div>
    );
  },
};

/**
 * Range slider with dual thumbs.
 */
export const RangeDefault: Story = {
  render: function RangeDefaultSlider() {
    const [value, setValue] = useState<[number, number]>([20, 80]);

    return (
      <div>
        <Slider
          range
          value={value}
          onChange={setValue}
          color="primary"
        />
        <p className="mt-4">
          Range: <strong>{value[0]}</strong> – <strong>{value[1]}</strong>
        </p>
      </div>
    );
  },
};

/**
 * Range slider with tooltip output.
 */
export const RangeWithOutput: Story = {
  render: function RangeWithOutputSlider() {
    const [value, setValue] = useState<[number, number]>([30, 70]);

    return (
      <div style={{ paddingTop: '2.5rem' }}>
        <Slider
          range
          value={value}
          onChange={setValue}
          showOutput
          color="success"
        />
        <p className="mt-4">
          Range: <strong>{value[0]}</strong> – <strong>{value[1]}</strong>
        </p>
      </div>
    );
  },
};

/**
 * Range slider with minimum distance between thumbs.
 */
export const RangeMinDistance: Story = {
  render: function RangeMinDistanceSlider() {
    const [value, setValue] = useState<[number, number]>([20, 60]);

    return (
      <div style={{ paddingTop: '2.5rem' }}>
        <Slider
          range
          value={value}
          onChange={setValue}
          minDistance={10}
          showOutput
          color="warning"
        />
        <p className="mt-4">
          Range: <strong>{value[0]}</strong> – <strong>{value[1]}</strong> (min distance: 10)
        </p>
      </div>
    );
  },
};

/**
 * Practical price filter with range slider.
 */
export const RangePriceFilter: Story = {
  render: function RangePriceFilterSlider() {
    const [value, setValue] = useState<[number, number]>([100, 400]);

    return (
      <div style={{ maxWidth: '400px', paddingTop: '2.5rem' }}>
        <label className="label">Price Filter</label>
        <Slider
          range
          value={value}
          onChange={setValue}
          min={0}
          max={500}
          step={10}
          showOutput
          tooltip="always"
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
 * Vertical slider.
 */
export const Vertical: Story = {
  render: function VerticalSlider() {
    const [value, setValue] = useState(50);

    return (
      <div style={{ height: '250px', display: 'flex', gap: '2rem' }}>
        <Slider
          value={value}
          onChange={setValue}
          orientation="vertical"
          color="primary"
        />
        <p>
          Value: <strong>{value}</strong>
        </p>
      </div>
    );
  },
};

/**
 * Vertical slider with always-visible output.
 */
export const VerticalWithOutput: Story = {
  render: function VerticalWithOutputSlider() {
    const [value, setValue] = useState(60);

    return (
      <div style={{ height: '250px', display: 'flex', gap: '3rem', paddingLeft: '1rem' }}>
        <Slider
          value={value}
          onChange={setValue}
          orientation="vertical"
          tooltip="always"
          showOutput
          color="info"
        />
        <p>
          Value: <strong>{value}</strong>
        </p>
      </div>
    );
  },
};

/**
 * Non-linear (logarithmic) scale for display.
 */
export const NonLinearScale: Story = {
  render: function NonLinearScaleSlider() {
    const [value, setValue] = useState(5);

    return (
      <div style={{ paddingTop: '2.5rem' }}>
        <label className="label">Exponential Scale</label>
        <Slider
          value={value}
          onChange={setValue}
          min={0}
          max={10}
          step={1}
          scale={x => Math.round(2 ** x)}
          tooltip="always"
          showOutput
          ticks
          color="warning"
        />
        <p className="mt-4">
          Raw value: <strong>{value}</strong>, Displayed: <strong>{Math.round(2 ** value)}</strong>
        </p>
      </div>
    );
  },
};

/**
 * Accessibility demo with aria labels and getAriaValueText.
 */
export const Accessibility: Story = {
  render: function AccessibilitySlider() {
    const [value, setValue] = useState(50);

    return (
      <div style={{ paddingTop: '2.5rem' }}>
        <label className="label" id="temp-label">
          Room Temperature
        </label>
        <Slider
          value={value}
          onChange={setValue}
          min={60}
          max={85}
          step={1}
          tooltip="always"
          showOutput
          formatOutput={v => `${v}°F`}
          getAriaValueText={v => `${v} degrees Fahrenheit`}
          aria-labelledby="temp-label"
          color="danger"
        />
        <p className="mt-4">
          Temperature: <strong>{value}°F</strong>
        </p>
      </div>
    );
  },
};

// ============================================================
// Context-aware Field/Control stories
// ============================================================

/**
 * Standalone with label — Slider renders its own Field+Control wrapper automatically.
 */
export const WithLabel: Story = {
  render: () => <Slider label="Volume" />,
};

/**
 * Inside Field — the outer Field turns off Slider's auto Field rendering via context.
 * Demonstrates horizontal layout composition.
 */
export const WithFieldWrapper: Story = {
  render: () => (
    <Field horizontal label="Volume">
      <Field.Body>
        <Slider />
      </Field.Body>
    </Field>
  ),
};

/**
 * Full manual composition — Field+Control provided externally,
 * Slider renders just its raw element.
 */
export const WithFieldControlWrapper: Story = {
  render: () => (
    <Field horizontal label="Volume">
      <Field.Body>
        <Field>
          <Control>
            <Slider />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};

/**
 * Form submission — Slider is HTML-form-compatible. In single-value mode pass
 * a `name` prop. In range mode use `nameLow` and `nameHigh` so each thumb
 * submits as its own form field.
 */
export const RangeWithNames: Story = {
  render: function SliderForm() {
    const [submitted, setSubmitted] = useState<string>('');
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
        }}
      >
        <Slider
          range
          nameLow="priceMin"
          nameHigh="priceMax"
          defaultValue={[20, 80]}
          showOutput
        />
        <div style={{ marginTop: '1.5rem' }}>
          <button type="submit" className="button is-primary">
            Submit
          </button>
        </div>
        {submitted && (
          <pre style={{ marginTop: '1rem' }}>{submitted}</pre>
        )}
      </form>
    );
  },
};
