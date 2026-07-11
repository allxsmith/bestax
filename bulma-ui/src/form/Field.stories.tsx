import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field } from './Field';
import { Control } from './Control';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from '../elements/Button';

const meta: Meta<typeof Field> = {
  title: 'Form/Field',
  component: Field,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The Bulma field container that wraps a label, one or more controls, and help text, with horizontal, grouped, and addon layouts.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Field label rendered above (or beside) the control',
    },
    labelSize: {
      control: 'select',
      options: [undefined, 'small', 'normal', 'medium', 'large'],
      description: 'Size of the field label',
    },
    horizontal: {
      control: 'boolean',
      description: 'Render the label and control side by side',
    },
    grouped: {
      control: 'select',
      options: [undefined, true, 'centered', 'right', 'multiline'],
      description:
        'Group child controls in a row, optionally centered, right-aligned, or multiline',
    },
    hasAddons: {
      control: 'select',
      options: [undefined, true, 'centered', 'right'],
      description:
        'Attach child controls together as addons, optionally centered or right-aligned',
    },
    narrow: {
      control: 'boolean',
      description:
        "Constrain the field to its content's width (used inside horizontal field bodies)",
    },
    textColor: {
      control: 'text',
      description: 'Bulma text color helper for the field',
    },
    bgColor: {
      control: 'text',
      description: 'Bulma background color helper for the field',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Field>;

/**
 * A labelled field wrapping a single Control + Input.
 */
export const Default: Story = {
  args: {
    label: 'Name',
    children: (
      <Control>
        <Input placeholder="Your name" />
      </Control>
    ),
  },
};

/**
 * Field with label, control, and a help message below the input.
 */
export const WithHelpText: Story = {
  render: () => (
    <Field label="Username">
      <Control>
        <Input placeholder="Pick a username" />
      </Control>
      <p className="help">Must be 4–20 characters long</p>
    </Field>
  ),
};

/**
 * Validation states — pair a colored input with matching help text.
 */
export const ValidationStates: Story = {
  render: () => (
    <>
      <Field label="Username">
        <Control iconLeftName="user" iconRightName="check">
          <Input color="success" value="bulma" onChange={() => {}} />
        </Control>
        <p className="help is-success">This username is available</p>
      </Field>
      <Field label="Email">
        <Control iconLeftName="envelope" iconRightName="exclamation-triangle">
          <Input
            type="email"
            color="danger"
            value="hello@"
            onChange={() => {}}
          />
        </Control>
        <p className="help is-danger">This email is invalid</p>
      </Field>
    </>
  ),
};

/**
 * The `labelSize` prop controls the label's size.
 */
export const LabelSizes: Story = {
  render: () => (
    <>
      <Field label="Small label" labelSize="small">
        <Control>
          <Input size="small" placeholder="Small input" />
        </Control>
      </Field>
      <Field label="Normal label" labelSize="normal">
        <Control>
          <Input placeholder="Normal input" />
        </Control>
      </Field>
      <Field label="Medium label" labelSize="medium">
        <Control>
          <Input size="medium" placeholder="Medium input" />
        </Control>
      </Field>
      <Field label="Large label" labelSize="large">
        <Control>
          <Input size="large" placeholder="Large input" />
        </Control>
      </Field>
    </>
  ),
};

// ============================================================
// Horizontal layouts — label and body side by side
// ============================================================

/**
 * Horizontal field — the `label` renders in a Field.Label column and the
 * children are wrapped in a Field.Body automatically.
 */
export const Horizontal: Story = {
  render: () => (
    <Field horizontal label="Name">
      <Field>
        <Control>
          <Input placeholder="Your name" />
        </Control>
      </Field>
    </Field>
  ),
};

/**
 * Explicit `Field.Body` composition for full control over a horizontal
 * layout — a two-input row, plus an empty `Field.Label` that aligns the
 * submit button with the inputs above it.
 */
export const HorizontalExplicitBody: Story = {
  render: () => (
    <>
      <Field horizontal label="From">
        <Field.Body>
          <Field>
            <Control isExpanded iconLeftName="user">
              <Input placeholder="Name" />
            </Control>
          </Field>
          <Field>
            <Control isExpanded iconLeftName="envelope">
              <Input type="email" placeholder="Email" />
            </Control>
          </Field>
        </Field.Body>
      </Field>
      <Field horizontal>
        <Field.Label />
        <Field.Body>
          <Field>
            <Control>
              <Button color="primary">Send message</Button>
            </Control>
          </Field>
        </Field.Body>
      </Field>
    </>
  ),
};

/**
 * `narrow` on an inner field keeps it at its content's width inside a
 * horizontal field body.
 */
export const HorizontalNarrow: Story = {
  render: () => (
    <Field horizontal label="Department">
      <Field.Body>
        <Field narrow>
          <Control>
            <Select isFullwidth>
              <option>Business development</option>
              <option>Marketing</option>
              <option>Sales</option>
            </Select>
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};

// ============================================================
// Grouped fields — multiple controls in a row
// ============================================================

/**
 * Two grouped controls (submit + cancel).
 */
export const Grouped: Story = {
  render: () => (
    <Field grouped>
      <Control>
        <Button color="link">Submit</Button>
      </Control>
      <Control>
        <Button>Cancel</Button>
      </Control>
    </Field>
  ),
};

/**
 * Grouped controls centered on the row.
 */
export const GroupedCentered: Story = {
  render: () => (
    <Field grouped="centered">
      <Control>
        <Button color="link">Submit</Button>
      </Control>
      <Control>
        <Button>Cancel</Button>
      </Control>
    </Field>
  ),
};

/**
 * Grouped controls right-aligned on the row.
 */
export const GroupedRight: Story = {
  render: () => (
    <Field grouped="right">
      <Control>
        <Button color="link">Submit</Button>
      </Control>
      <Control>
        <Button>Cancel</Button>
      </Control>
    </Field>
  ),
};

/**
 * Search-style grouped row — an expanded input control next to a
 * fixed-width button.
 */
export const GroupedExpanded: Story = {
  render: () => (
    <Field grouped>
      <Control isExpanded>
        <Input placeholder="Find a repository" />
      </Control>
      <Control>
        <Button color="info">Search</Button>
      </Control>
    </Field>
  ),
};

/**
 * Many controls that wrap onto multiple lines via `grouped="multiline"`.
 */
export const GroupedMultiline: Story = {
  render: () => (
    <Field grouped="multiline">
      {[
        'One',
        'Two',
        'Three',
        'Four',
        'Five',
        'Six',
        'Seven',
        'Eight',
        'Nine',
        'Ten',
        'Eleven',
        'Twelve',
        'Thirteen',
      ].map(label => (
        <Control key={label}>
          <Button>{label}</Button>
        </Control>
      ))}
    </Field>
  ),
};

// ============================================================
// Addons — controls attached together
// ============================================================

/**
 * `hasAddons` attaches the controls: an expanded input with a button addon.
 */
export const Addons: Story = {
  render: () => (
    <Field hasAddons>
      <Control isExpanded>
        <Input placeholder="Find a repository" />
      </Control>
      <Control>
        <Button color="info">Search</Button>
      </Control>
    </Field>
  ),
};

/**
 * Select + Input + Button addons — a phone number with a country-code picker.
 */
export const AddonsWithSelect: Story = {
  render: () => (
    <Field hasAddons>
      <Control>
        <Select aria-label="Country code">
          <option>+1</option>
          <option>+44</option>
          <option>+33</option>
        </Select>
      </Control>
      <Control isExpanded>
        <Input type="tel" placeholder="Your phone number" />
      </Control>
      <Control>
        <Button color="primary">Call</Button>
      </Control>
    </Field>
  ),
};

/**
 * Centered addon group via `hasAddons="centered"`.
 */
export const AddonsCentered: Story = {
  render: () => (
    <Field hasAddons="centered">
      <Control>
        <Button>Yes</Button>
      </Control>
      <Control>
        <Button>Maybe</Button>
      </Control>
      <Control>
        <Button>No</Button>
      </Control>
    </Field>
  ),
};

/**
 * Right-aligned addon group via `hasAddons="right"`.
 */
export const AddonsRight: Story = {
  render: () => (
    <Field hasAddons="right">
      <Control>
        <Button>Yes</Button>
      </Control>
      <Control>
        <Button>Maybe</Button>
      </Control>
      <Control>
        <Button>No</Button>
      </Control>
    </Field>
  ),
};
