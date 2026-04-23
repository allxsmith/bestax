import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';
import { Field } from './Field';
import { Control } from './Control';
import { Select } from './Select';
import { Button } from '../elements/Button';

const meta: Meta<typeof Input> = {
  title: 'Form/Input',
  component: Input,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A convenience component that composes Field, Control, and Input. Use for typical form fields without needing to nest three components.',
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
      description: 'Bulma color for the input',
    },
    size: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'Size of the input',
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
      description: 'Whether the input is disabled',
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the input is read-only',
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
type Story = StoryObj<typeof Input>;

/**
 * A standard text input. The `placeholder` prop provides hint text for the user.
 */
export const Default: Story = {
  args: {
    label: 'Default',
    placeholder: 'Default input',
  },
};

/**
 * The `color` prop applies Bulma color modifiers to the input.
 */
export const Colors: Story = {
  render: () => (
    <>
      <Input label="Primary" color="primary" placeholder="Primary input" />
      <Input label="Link" color="link" placeholder="Link input" />
      <Input label="Info" color="info" placeholder="Info input" />
      <Input label="Success" color="success" placeholder="Success input" />
      <Input label="Warning" color="warning" placeholder="Warning input" />
      <Input label="Danger" color="danger" placeholder="Danger input" />
    </>
  ),
};

/**
 * The `size` prop controls the input's size.
 */
export const Sizes: Story = {
  render: () => (
    <>
      <Input label="Small" size="small" placeholder="Small input" />
      <Input label="Normal" placeholder="Normal input" />
      <Input label="Medium" size="medium" placeholder="Medium input" />
      <Input label="Large" size="large" placeholder="Large input" />
    </>
  ),
};

/**
 * The `isRounded` prop gives the input rounded corners.
 */
export const Rounded: Story = {
  args: {
    label: 'Rounded',
    placeholder: 'Rounded input',
    isRounded: true,
  },
};

/**
 * `isHovered`, `isFocused`, and `isLoading` force the corresponding state on the input.
 */
export const States: Story = {
  render: () => (
    <>
      <Input label="Normal" placeholder="Normal state" />
      <Input label="Hover" isHovered placeholder="Hovered state" />
      <Input label="Focus" isFocused placeholder="Focused state" />
      <Input label="Loading" isLoading placeholder="Loading state" />
    </>
  ),
};

/**
 * Loading indicator at every input size. Use `controlSize` on `<Input>` to
 * scale the spinner to match.
 */
export const LoadingSizes: Story = {
  render: () => (
    <>
      <Input
        label="Loading Small"
        size="small"
        controlSize="small"
        isLoading
        placeholder="Loading small"
      />
      <Input label="Loading Normal" isLoading placeholder="Loading normal" />
      <Input
        label="Loading Medium"
        size="medium"
        controlSize="medium"
        isLoading
        placeholder="Loading medium"
      />
      <Input
        label="Loading Large"
        size="large"
        controlSize="large"
        isLoading
        placeholder="Loading large"
      />
    </>
  ),
};

/**
 * Disabled inputs cannot be interacted with; read-only inputs can be focused
 * but not edited.
 */
export const DisabledAndReadOnly: Story = {
  render: () => (
    <>
      <Input label="Disabled" disabled placeholder="Disabled input" />
      <Input label="Read Only" readOnly value="Read only value" />
    </>
  ),
};

/**
 * Static input — non-interactive, used to display read-only values inline
 * with editable fields.
 */
export const Static: Story = {
  render: () => (
    <>
      <Input horizontal label="Username" isStatic value="Static value" />
      <Input horizontal label="Password" placeholder="Editable value" />
    </>
  ),
};

/**
 * Add icons via the `iconLeftName` / `iconRightName` shortcuts on `<Input>`.
 */
export const WithIcons: Story = {
  render: () => (
    <>
      <Input iconLeftName="user" iconRightName="check" placeholder="With icons" />
      <Input
        iconLeftName="envelope"
        iconRightName="exclamation-triangle"
        placeholder="Another input"
      />
    </>
  ),
};

/**
 * Match the input size to the icon size via `size` + `iconLeftSize` / `iconRightSize`.
 */
export const IconsBySize: Story = {
  render: () => (
    <>
      <Input
        size="small"
        iconLeftName="user"
        iconLeftSize="small"
        iconRightName="check"
        iconRightSize="small"
        placeholder="Icons left/right small"
      />
      <Input
        iconLeftName="user"
        iconRightName="check"
        placeholder="Icons left/right normal"
      />
      <Input
        size="medium"
        iconLeftName="user"
        iconLeftSize="medium"
        iconRightName="check"
        iconRightSize="medium"
        placeholder="Icons left/right medium"
      />
      <Input
        size="large"
        iconLeftName="user"
        iconLeftSize="large"
        iconRightName="check"
        iconRightSize="large"
        placeholder="Icons left/right large"
      />
    </>
  ),
};

/**
 * Pair `color` and `messageColor` to produce success and danger validation
 * states with matching help text.
 */
export const HelpTextColors: Story = {
  render: () => (
    <>
      <Input
        label="Username"
        color="success"
        value="bulma"
        message="This username is available"
        messageColor="success"
        iconLeftName="user"
        iconRightName="check"
        onChange={() => {}}
      />
      <Input
        label="Email"
        type="email"
        color="danger"
        value="hello@"
        message="This email is invalid"
        messageColor="danger"
        iconLeftName="envelope"
        iconRightName="exclamation-triangle"
        onChange={() => {}}
      />
    </>
  ),
};

// ============================================================
// Form addons — manual Field + Control composition
// ============================================================

/**
 * Input with a button addon on the right.
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
 * Input with a static button addon — useful for fixed prefixes/suffixes
 * like an email domain.
 */
export const AddonsStatic: Story = {
  render: () => (
    <Field hasAddons>
      <Control isExpanded>
        <Input placeholder="Your email" />
      </Control>
      <Control>
        <Button isStatic>@gmail.com</Button>
      </Control>
    </Field>
  ),
};

/**
 * Select + Input + Button addons. Use `isExpanded` on the Input control
 * so it fills the remaining space.
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

// ============================================================
// Form group — `grouped` Field with multiple Controls
// ============================================================

/**
 * Two grouped buttons (submit + cancel).
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
 * Search-style grouped row: an expanded input next to a fixed-width button.
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
// Horizontal layouts — composition with Field.Body
// ============================================================

/**
 * Horizontal field with a validation error inside the field body.
 */
export const HorizontalWithError: Story = {
  render: () => (
    <Field horizontal label="Email">
      <Field.Body>
        <Field>
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
      </Field.Body>
    </Field>
  ),
};

/**
 * Horizontal field with an addon inside the field body — phone number with
 * a static country-code prefix.
 */
export const HorizontalAddons: Story = {
  render: () => (
    <Field horizontal label="Phone">
      <Field.Body>
        <Field hasAddons>
          <Control>
            <Button isStatic>+44</Button>
          </Control>
          <Control isExpanded>
            <Input type="tel" placeholder="Your phone number" />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};

/**
 * Horizontal submit row — empty field label aligns the button with
 * the inputs above it.
 */
export const HorizontalSubmitRow: Story = {
  render: () => (
    <>
      <Field horizontal label="Name">
        <Field.Body>
          <Field>
            <Control>
              <Input placeholder="Your name" />
            </Control>
          </Field>
        </Field.Body>
      </Field>
      <Field horizontal>
        <Field.Label />
        <Field.Body>
          <Field>
            <Control>
              <Button color="primary">Submit</Button>
            </Control>
          </Field>
        </Field.Body>
      </Field>
    </>
  ),
};

/**
 * A native `<fieldset disabled>` wrapping multiple Inputs disables every
 * field at once.
 */
export const DisabledFieldset: Story = {
  render: () => (
    <fieldset disabled>
      <Input label="Name" placeholder="Your name" />
      <Input label="Email" type="email" placeholder="Your email" />
    </fieldset>
  ),
};

// ============================================================
// Context-Aware Rendering — Input adjusts to its surrounding wrappers
// ============================================================

/**
 * Default (with label) — Input renders its own Field+Control wrappers automatically.
 */
export const WithLabel: Story = {
  render: () => <Input label="Username" placeholder="Enter username" />,
};

/**
 * Inside Field — the outer Field turns off Input's auto Field rendering via context.
 */
export const WithFieldWrapper: Story = {
  render: () => (
    <Field horizontal label="Username">
      <Field.Body>
        <Field>
          <Input placeholder="Enter username" />
        </Field>
      </Field.Body>
    </Field>
  ),
};

/**
 * Inside Field and Control — Input renders just its raw element.
 */
export const WithFieldControlWrapper: Story = {
  render: () => (
    <Field horizontal label="Username">
      <Field.Body>
        <Field>
          <Control iconLeftName="user">
            <Input placeholder="Enter username" />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};
