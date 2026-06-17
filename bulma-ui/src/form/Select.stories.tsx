import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';
import { Field } from './Field';
import { Control } from './Control';
import { Input } from './Input';
import { Button } from '../elements/Button';

const meta: Meta<typeof Select> = {
  title: 'Form/Select',
  component: Select,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A convenience component that composes Field, Control, and Select. Use for typical form fields without needing to nest three components.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Field label text',
    },
    color: {
      control: 'select',
      options: [
        undefined,
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
      ],
      description: 'Bulma color for the select',
    },
    size: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'Size of the select',
    },
    messageColor: {
      control: 'select',
      options: [
        undefined,
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
      ],
      description: 'Color for the help message',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the select is disabled',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading indicator',
    },
    horizontal: {
      control: 'boolean',
      description: 'Horizontal field layout',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

/**
 * A standard dropdown. The `children` prop provides the `<option>` elements.
 */
export const Default: Story = {
  args: {
    label: 'Default',
    children: (
      <>
        <option value="">Please select</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </>
    ),
  },
};

/**
 * Set the `multiple` prop to enable multi-selection. The `multipleSize`
 * prop controls how many options are visible at once.
 */
export const MultiSelect: Story = {
  render: () => (
    <Select label="Multi Select" multiple multipleSize={10}>
      <option value="huck">Huckleberry Finn</option>
      <option value="tom">Tom Sawyer</option>
      <option value="becky">Becky Thatcher</option>
      <option value="jim">Jim</option>
      <option value="pap">Pap Finn</option>
      <option value="duke">The Duke</option>
      <option value="king">The King</option>
      <option value="widow">Widow Douglas</option>
      <option value="judge">Judge Thatcher</option>
      <option value="sid">Sid Sawyer</option>
    </Select>
  ),
};

/**
 * The `color` prop applies Bulma color modifiers.
 */
export const Colors: Story = {
  render: () => (
    <>
      <Select label="Primary" color="primary">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
      <Select label="Link" color="link">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
      <Select label="Info" color="info">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
      <Select label="Success" color="success">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
      <Select label="Warning" color="warning">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
      <Select label="Danger" color="danger">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    </>
  ),
};

/**
 * The `isRounded` prop gives the select rounded corners.
 */
export const Rounded: Story = {
  args: {
    label: 'Rounded',
    isRounded: true,
    children: (
      <>
        <option value="">Please select</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </>
    ),
  },
};

/**
 * The `size` prop controls the select's size.
 */
export const Sizes: Story = {
  render: () => (
    <>
      <Select label="Small" size="small">
        <option value="">Please select</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </Select>
      <Select label="Normal">
        <option value="">Please select</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </Select>
      <Select label="Medium" size="medium">
        <option value="">Please select</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </Select>
      <Select label="Large" size="large">
        <option value="">Please select</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </Select>
    </>
  ),
};

/**
 * `isHovered`, `isFocused`, and `isLoading` force the corresponding state.
 */
export const States: Story = {
  render: () => (
    <>
      <Select label="Normal">
        <option value="">Please select</option>
        <option value="option1">Option 1</option>
      </Select>
      <Select label="Hover" isHovered>
        <option value="">Please select</option>
        <option value="option1">Option 1</option>
      </Select>
      <Select label="Focus" isFocused>
        <option value="">Please select</option>
        <option value="option1">Option 1</option>
      </Select>
      <Select label="Loading" isLoading>
        <option value="">Please select</option>
        <option value="option1">Option 1</option>
      </Select>
    </>
  ),
};

/**
 * Loading indicator at every select size.
 */
export const LoadingSizes: Story = {
  render: () => (
    <>
      <Select label="Loading Small" size="small" isLoading>
        <option value="">Please select</option>
      </Select>
      <Select label="Loading Normal" isLoading>
        <option value="">Please select</option>
      </Select>
      <Select label="Loading Medium" size="medium" isLoading>
        <option value="">Please select</option>
      </Select>
      <Select label="Loading Large" size="large" isLoading>
        <option value="">Please select</option>
      </Select>
    </>
  ),
};

/**
 * Native `disabled` attribute.
 */
export const Disabled: Story = {
  args: {
    label: 'Disabled',
    disabled: true,
    children: <option value="">Cannot change</option>,
  },
};

/**
 * Selects support a left icon only — Bulma's chevron occupies the right.
 */
export const WithIcons: Story = {
  args: {
    label: 'With Icons',
    iconLeftName: 'person',
    children: (
      <>
        <option value="huck">Huckleberry Finn</option>
        <option value="tom">Tom Sawyer</option>
        <option value="becky">Becky Thatcher</option>
        <option value="jim">Jim</option>
        <option value="pap">Pap Finn</option>
      </>
    ),
  },
};

/**
 * Match the icon size to the select size.
 */
export const IconsBySize: Story = {
  render: () => (
    <>
      <Select
        label="With Icons Small"
        size="small"
        iconLeftName="person"
        iconLeftSize="small"
      >
        <option value="huck">Huckleberry Finn</option>
        <option value="tom">Tom Sawyer</option>
      </Select>
      <Select label="With Icons Normal" iconLeftName="person">
        <option value="huck">Huckleberry Finn</option>
        <option value="tom">Tom Sawyer</option>
      </Select>
      <Select
        label="With Icons Medium"
        size="medium"
        iconLeftName="person"
        iconLeftSize="medium"
      >
        <option value="huck">Huckleberry Finn</option>
        <option value="tom">Tom Sawyer</option>
      </Select>
      <Select
        label="With Icons Large"
        size="large"
        iconLeftName="person"
        iconLeftSize="large"
      >
        <option value="huck">Huckleberry Finn</option>
        <option value="tom">Tom Sawyer</option>
      </Select>
    </>
  ),
};

// ============================================================
// Form addons — manual Field + Control composition
// ============================================================

/**
 * Currency Select + expanded Input + Button — small select acting as a
 * unit picker.
 */
export const AddonsCurrency: Story = {
  render: () => (
    <Field hasAddons>
      <Control>
        <Select aria-label="Currency">
          <option>$</option>
          <option>£</option>
          <option>€</option>
        </Select>
      </Control>
      <Control isExpanded>
        <Input type="text" placeholder="Amount of money" />
      </Control>
      <Control>
        <Button>Transfer</Button>
      </Control>
    </Field>
  ),
};

/**
 * Fullwidth Select + Button — `isFullwidth` on the Select with `isExpanded`
 * on its Control makes the dropdown grow to fill the row.
 */
export const AddonsFullwidth: Story = {
  render: () => (
    <Field hasAddons>
      <Control isExpanded>
        <Select isFullwidth aria-label="Country">
          <option>United States</option>
          <option>United Kingdom</option>
          <option>Canada</option>
          <option>France</option>
          <option>Germany</option>
        </Select>
      </Control>
      <Control>
        <Button color="primary">Choose</Button>
      </Control>
    </Field>
  ),
};

// ============================================================
// Horizontal — Select in narrow field
// ============================================================

/**
 * Select inside a narrow field in a horizontal layout — `narrow` on the inner
 * Field constrains it; `isFullwidth` on the Select fills that constrained width.
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
// Context-Aware Rendering — Select adjusts to its surrounding wrappers
// ============================================================

/**
 * Default (with label) — Select renders its own Field+Control wrappers automatically.
 */
export const WithLabel: Story = {
  render: () => (
    <Select label="Country">
      <option value="">Please select</option>
      <option value="us">United States</option>
      <option value="uk">United Kingdom</option>
      <option value="ca">Canada</option>
    </Select>
  ),
};

/**
 * Inside Field — the outer Field turns off Select's auto Field rendering via context.
 */
export const WithFieldWrapper: Story = {
  render: () => (
    <Field horizontal label="Country">
      <Field.Body>
        <Field>
          <Select>
            <option value="">Please select</option>
            <option value="us">United States</option>
            <option value="uk">United Kingdom</option>
            <option value="ca">Canada</option>
          </Select>
        </Field>
      </Field.Body>
    </Field>
  ),
};

/**
 * Inside Field and Control — Select renders just its raw element.
 */
export const WithFieldControlWrapper: Story = {
  render: () => (
    <Field horizontal label="Country">
      <Field.Body>
        <Field>
          <Control iconLeftName="globe">
            <Select>
              <option value="">Please select</option>
              <option value="us">United States</option>
              <option value="uk">United Kingdom</option>
              <option value="ca">Canada</option>
            </Select>
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};
