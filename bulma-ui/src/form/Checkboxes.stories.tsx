import { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import Checkbox from './Checkbox';
import Checkboxes from './Checkboxes';
import { Field } from './Field';
import { Control } from './Control';

const meta: Meta<typeof Checkboxes> = {
  title: 'Form/Checkboxes',
  component: Checkboxes,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A wrapper component that groups multiple Checkbox elements together with proper spacing. Optionally manages the selected-values array as a controlled or uncontrolled group, and provides the shared form `name` to children via context.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Checkboxes>;

export const Default: Story = {
  render: () => (
    <Checkboxes>
      <Checkbox>Make the bed</Checkbox>
      <Checkbox>Brush teeth</Checkbox>
      <Checkbox>Do homework</Checkbox>
      <Checkbox>Feed the pet</Checkbox>
    </Checkboxes>
  ),
};

export const WithColors: Story = {
  render: () => (
    <Checkboxes>
      <Checkbox color="primary">Primary</Checkbox>
      <Checkbox color="info">Info</Checkbox>
      <Checkbox color="success">Success</Checkbox>
    </Checkboxes>
  ),
};

export const DisabledGroup: Story = {
  render: () => (
    <Checkboxes>
      <Checkbox disabled>Make the bed</Checkbox>
      <Checkbox disabled>Brush teeth</Checkbox>
      <Checkbox disabled>Do homework</Checkbox>
    </Checkboxes>
  ),
};

// ============================================================
// Context-aware Field/Control stories
// ============================================================

/**
 * Standalone with label — Checkboxes renders its own Field+Control wrapper automatically.
 */
export const WithLabel: Story = {
  render: () => (
    <Checkboxes label="Tags">
      <Checkbox value="react">React</Checkbox>
      <Checkbox value="vue">Vue</Checkbox>
    </Checkboxes>
  ),
};

/**
 * Inside Field — the outer Field turns off Checkboxes' auto Field rendering via context.
 * Demonstrates horizontal layout composition.
 */
export const WithFieldWrapper: Story = {
  render: () => (
    <Field horizontal label="Tags">
      <Field.Body>
        <Field>
          <Checkboxes>
            <Checkbox value="react">React</Checkbox>
            <Checkbox value="vue">Vue</Checkbox>
          </Checkboxes>
        </Field>
      </Field.Body>
    </Field>
  ),
};

/**
 * Full manual composition — Field+Control provided externally,
 * Checkboxes renders just its raw element.
 */
export const WithFieldControlWrapper: Story = {
  render: () => (
    <Field horizontal label="Tags">
      <Field.Body>
        <Field>
          <Control>
            <Checkboxes>
              <Checkbox value="react">React</Checkbox>
              <Checkbox value="vue">Vue</Checkbox>
            </Checkboxes>
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};

/**
 * Form submission — Checkboxes is HTML-form-compatible. Pass a `name` prop on
 * the group and every child Checkbox inherits it via React context (works at
 * any nesting depth). Each checked box submits as `name=value`, producing a
 * standard form-encoded array (e.g., `tags=react&tags=vue`) that server-side
 * parsers handle natively.
 */
export const WithName: Story = {
  render: function CheckboxesForm() {
    const [submitted, setSubmitted] = useState<string>('');
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
        }}
      >
        <Checkboxes name="tags">
          <Checkbox value="react" defaultChecked>
            React
          </Checkbox>
          <Checkbox value="vue" defaultChecked>
            Vue
          </Checkbox>
          <Checkbox value="angular">Angular</Checkbox>
          <Checkbox value="svelte">Svelte</Checkbox>
        </Checkboxes>
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
 * name reaches Checkboxes wrapped in custom layout components, fragments, and
 * conditionals. This is the advantage of using context over child cloning.
 */
export const WithNameThroughWrappers: Story = {
  render: function CheckboxesWrappedForm() {
    const [submitted, setSubmitted] = useState<string>('');
    // eslint-disable-next-line @eslint-react/no-nested-component-definitions -- demo-only story component
    const CheckboxCard = ({
      value,
      label,
    }: {
      value: string;
      label: string;
    }) => (
      <div
        style={{
          padding: '0.5rem',
          border: '1px solid #ddd',
          borderRadius: 4,
          marginBottom: '0.5rem',
        }}
      >
        <Checkbox value={value}>{label}</Checkbox>
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
        <Checkboxes name="features">
          <CheckboxCard value="darkmode" label="Dark mode" />
          <CheckboxCard value="notifications" label="Notifications" />
          <CheckboxCard value="analytics" label="Analytics" />
        </Checkboxes>
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
 * Controlled group — parent owns the selected-values array via state. The
 * group's `value` array determines which boxes are checked; `onChange` fires
 * with the new array when any box is toggled. Same pattern as React Aria's
 * CheckboxGroup.
 */
export const ControlledGroup: Story = {
  render: function ControlledCheckboxesDemo() {
    const [tags, setTags] = useState<string[]>(['react']);
    return (
      <div>
        <Checkboxes name="tags" value={tags} onChange={setTags}>
          <Checkbox value="react">React</Checkbox>
          <Checkbox value="vue">Vue</Checkbox>
          <Checkbox value="angular">Angular</Checkbox>
          <Checkbox value="svelte">Svelte</Checkbox>
        </Checkboxes>
        <p style={{ marginTop: '1rem' }}>
          Selected: <strong>{tags.length ? tags.join(', ') : '(none)'}</strong>
        </p>
      </div>
    );
  },
};

/**
 * Uncontrolled group — the group manages the selected-values array internally.
 * Pass `defaultValue` for the initial array; use `onChange` if you want to be
 * notified of changes.
 */
export const UncontrolledGroup: Story = {
  render: function UncontrolledCheckboxesDemo() {
    const [latest, setLatest] = useState<string[]>([]);
    return (
      <div>
        <Checkboxes
          name="features"
          defaultValue={['darkmode']}
          onChange={setLatest}
        >
          <Checkbox value="darkmode">Dark mode</Checkbox>
          <Checkbox value="notifications">Notifications</Checkbox>
          <Checkbox value="analytics">Analytics</Checkbox>
        </Checkboxes>
        {latest.length > 0 && (
          <p style={{ marginTop: '1rem' }}>
            Latest: <strong>{latest.join(', ')}</strong>
          </p>
        )}
      </div>
    );
  },
};
