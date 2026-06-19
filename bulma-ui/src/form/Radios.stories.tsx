import { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import Radio from './Radio';
import Radios from './Radios';
import { Field } from './Field';
import { Control } from './Control';

const meta: Meta<typeof Radios> = {
  title: 'Form/Radios',
  component: Radios,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A wrapper component that groups multiple Radio buttons together with proper spacing.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Radios>;

export const Default: Story = {
  render: () => (
    <Radios>
      <Radio name="event">Attend</Radio>
      <Radio name="event">Decline</Radio>
      <Radio name="event">Tentative</Radio>
    </Radios>
  ),
};

export const WithColors: Story = {
  render: () => (
    <Radios>
      <Radio name="color-group" color="primary">
        Primary
      </Radio>
      <Radio name="color-group" color="info">
        Info
      </Radio>
      <Radio name="color-group" color="success">
        Success
      </Radio>
    </Radios>
  ),
};

export const DisabledGroup: Story = {
  render: () => (
    <Radios>
      <Radio name="disabled-group" disabled>
        Attend
      </Radio>
      <Radio name="disabled-group" disabled>
        Decline
      </Radio>
      <Radio name="disabled-group" disabled>
        Tentative
      </Radio>
    </Radios>
  ),
};

// ============================================================
// Context-aware Field/Control stories
// ============================================================

/**
 * Standalone with label — Radios renders its own Field+Control wrapper automatically.
 */
export const WithLabel: Story = {
  render: () => (
    <Radios label="Color">
      <Radio name="color" value="red">
        Red
      </Radio>
      <Radio name="color" value="blue">
        Blue
      </Radio>
    </Radios>
  ),
};

/**
 * Inside Field — the outer Field turns off Radios' auto Field rendering via context.
 * Demonstrates horizontal layout composition.
 */
export const WithFieldWrapper: Story = {
  render: () => (
    <Field horizontal label="Color">
      <Field.Body>
        <Field>
          <Radios>
            <Radio name="color" value="red">
              Red
            </Radio>
            <Radio name="color" value="blue">
              Blue
            </Radio>
          </Radios>
        </Field>
      </Field.Body>
    </Field>
  ),
};

/**
 * Full manual composition — Field+Control provided externally,
 * Radios renders just its raw element.
 */
export const WithFieldControlWrapper: Story = {
  render: () => (
    <Field horizontal label="Color">
      <Field.Body>
        <Field>
          <Control>
            <Radios>
              <Radio name="color" value="red">
                Red
              </Radio>
              <Radio name="color" value="blue">
                Blue
              </Radio>
            </Radios>
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};

/**
 * Form submission — Radios is HTML-form-compatible. Pass a `name` prop on the
 * group and every child Radio inherits it via React context (works at any
 * nesting depth, including custom wrapper components). The selected value
 * submits as `name=value` in FormData.
 */
export const WithName: Story = {
  render: function RadiosForm() {
    const [submitted, setSubmitted] = useState<string>('');
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
        }}
      >
        <Radios name="color">
          <Radio value="red" defaultChecked>
            Red
          </Radio>
          <Radio value="green">Green</Radio>
          <Radio value="blue">Blue</Radio>
        </Radios>
        <div style={{ marginTop: '1rem' }}>
          <button type="submit" className="button is-primary">
            Submit
          </button>
        </div>
        {submitted && <pre style={{ marginTop: '1rem' }}>{submitted}</pre>}
      </form>
    );
  },
};

/**
 * Same `name` propagation works through any wrapper component — the inherited
 * name reaches Radios wrapped in custom layout components, fragments, and
 * conditionals. This is the advantage of using context over child cloning.
 */
export const WithNameThroughWrappers: Story = {
  render: function RadiosWrappedForm() {
    const [submitted, setSubmitted] = useState<string>('');
    // eslint-disable-next-line @eslint-react/no-nested-component-definitions -- demo-only story component
    const RadioCard = ({ value, label }: { value: string; label: string }) => (
      <div
        style={{
          padding: '0.5rem',
          border: '1px solid #ddd',
          borderRadius: 4,
          marginBottom: '0.5rem',
        }}
      >
        <Radio value={value}>{label}</Radio>
      </div>
    );
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
        }}
      >
        <Radios name="plan">
          <RadioCard value="basic" label="Basic — $9/mo" />
          <RadioCard value="pro" label="Pro — $29/mo" />
          <RadioCard value="enterprise" label="Enterprise — Contact us" />
        </Radios>
        <div style={{ marginTop: '1rem' }}>
          <button type="submit" className="button is-primary">
            Submit
          </button>
        </div>
        {submitted && <pre style={{ marginTop: '1rem' }}>{submitted}</pre>}
      </form>
    );
  },
};

/**
 * Controlled group — parent owns the selected value via state. The group's
 * `value` prop sets which Radio is checked, and `onChange` fires when the
 * user picks a different one. This is the same pattern as MUI's RadioGroup,
 * Radix's RadioGroup, and React Aria's RadioGroup.
 */
export const ControlledGroup: Story = {
  render: function ControlledRadiosDemo() {
    const [color, setColor] = useState('red');
    return (
      <div>
        <Radios name="color" value={color} onChange={setColor}>
          <Radio value="red">Red</Radio>
          <Radio value="green">Green</Radio>
          <Radio value="blue">Blue</Radio>
        </Radios>
        <p style={{ marginTop: '1rem' }}>
          Selected: <strong>{color}</strong>
        </p>
      </div>
    );
  },
};

/**
 * Uncontrolled group — the group manages selection state internally. Pass
 * `defaultValue` for the initial selection and `onChange` to be notified of
 * changes. The component's internal state is the source of truth.
 */
export const UncontrolledGroup: Story = {
  render: function UncontrolledRadiosDemo() {
    const [lastChange, setLastChange] = useState<string>('');
    return (
      <div>
        <Radios name="size" defaultValue="md" onChange={setLastChange}>
          <Radio value="sm">Small</Radio>
          <Radio value="md">Medium</Radio>
          <Radio value="lg">Large</Radio>
        </Radios>
        {lastChange && (
          <p style={{ marginTop: '1rem' }}>
            Last selected: <strong>{lastChange}</strong>
          </p>
        )}
      </div>
    );
  },
};
