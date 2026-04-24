import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextArea } from './TextArea';
import { Field } from './Field';
import { Control } from './Control';

const meta: Meta<typeof TextArea> = {
  title: 'Form/TextArea',
  component: TextArea,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A convenience component that composes Field, Control, and TextArea. Use for typical form fields without needing to nest three components.',
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
      description: 'Bulma color for the textarea',
    },
    size: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'Size of the textarea',
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
      description: 'Whether the textarea is disabled',
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the textarea is read-only',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading indicator',
    },
    horizontal: {
      control: 'boolean',
      description: 'Horizontal field layout',
    },
    rows: {
      control: 'number',
      description: 'Number of visible text lines',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextArea>;

/**
 * A standard multi-line text input. The `placeholder` prop provides hint text.
 */
export const Default: Story = {
  args: {
    label: 'Default',
    placeholder: 'e.g. Hello world',
  },
};

/**
 * Set the `rows` prop to control the visible number of text lines.
 */
export const RowCount: Story = {
  args: {
    label: 'Rows',
    rows: 10,
    placeholder: '10 rows',
  },
};

/**
 * The `color` prop applies Bulma color modifiers.
 */
export const Colors: Story = {
  render: () => (
    <>
      <TextArea
        label="Primary"
        color="primary"
        placeholder="Primary textarea"
      />
      <TextArea label="Link" color="link" placeholder="Link textarea" />
      <TextArea label="Info" color="info" placeholder="Info textarea" />
      <TextArea
        label="Success"
        color="success"
        placeholder="Success textarea"
      />
      <TextArea
        label="Warning"
        color="warning"
        placeholder="Warning textarea"
      />
      <TextArea label="Danger" color="danger" placeholder="Danger textarea" />
    </>
  ),
};

/**
 * The `size` prop controls the overall size of the textarea.
 */
export const Sizes: Story = {
  render: () => (
    <>
      <TextArea label="Small" size="small" placeholder="Small textarea" />
      <TextArea label="Normal" placeholder="Normal textarea" />
      <TextArea label="Medium" size="medium" placeholder="Medium textarea" />
      <TextArea label="Large" size="large" placeholder="Large textarea" />
    </>
  ),
};

/**
 * `isHovered`, `isFocused`, and `isLoading` force the corresponding state.
 */
export const States: Story = {
  render: () => (
    <>
      <TextArea label="Normal" placeholder="Normal textarea" />
      <TextArea label="Hover" isHovered placeholder="Hovered textarea" />
      <TextArea label="Focus" isFocused placeholder="Focused textarea" />
      <TextArea label="Loading" isLoading placeholder="Loading textarea" />
    </>
  ),
};

/**
 * Loading indicator at every textarea size. Use `controlSize` on `<TextArea>`
 * to scale the spinner to match.
 */
export const LoadingSizes: Story = {
  render: () => (
    <>
      <TextArea
        label="Loading Small"
        size="small"
        controlSize="small"
        isLoading
        placeholder="Small loading textarea"
      />
      <TextArea
        label="Loading Normal"
        isLoading
        placeholder="Normal loading textarea"
      />
      <TextArea
        label="Loading Medium"
        size="medium"
        controlSize="medium"
        isLoading
        placeholder="Medium loading textarea"
      />
      <TextArea
        label="Loading Large"
        size="large"
        controlSize="large"
        isLoading
        placeholder="Large loading textarea"
      />
    </>
  ),
};

/**
 * Disabled textareas cannot be interacted with; read-only textareas can be
 * focused but not edited.
 */
export const DisabledAndReadOnly: Story = {
  render: () => (
    <>
      <TextArea label="Disabled" disabled placeholder="Disabled textarea" />
      <TextArea label="Read Only" readOnly value="This content is readonly" />
    </>
  ),
};

/**
 * Set `hasFixedSize` to prevent the textarea from being user-resized.
 */
export const FixedSize: Story = {
  args: {
    label: 'Fixed Size',
    hasFixedSize: true,
    rows: 3,
    placeholder: 'Fixed size textarea',
  },
};

/**
 * Use `horizontal` to render the label to the left of the textarea.
 */
export const Horizontal: Story = {
  args: {
    horizontal: true,
    label: 'Question',
    placeholder: 'Explain how we can help you',
    rows: 4,
  },
};

// ============================================================
// Context-Aware Rendering — TextArea adjusts to its surrounding wrappers
// ============================================================

/**
 * Default (with label) — TextArea renders its own Field+Control wrappers automatically.
 */
export const WithLabel: Story = {
  render: () => <TextArea label="Message" placeholder="Enter your message" />,
};

/**
 * Inside Field — the outer Field turns off TextArea's auto Field rendering via context.
 */
export const WithFieldWrapper: Story = {
  render: () => (
    <Field horizontal label="Message">
      <Field.Body>
        <Field>
          <TextArea placeholder="Enter your message" />
        </Field>
      </Field.Body>
    </Field>
  ),
};

/**
 * Inside Field and Control — TextArea renders just its raw element.
 */
export const WithFieldControlWrapper: Story = {
  render: () => (
    <Field horizontal label="Message">
      <Field.Body>
        <Field>
          <Control iconLeftName="comment">
            <TextArea placeholder="Enter your message" />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};
