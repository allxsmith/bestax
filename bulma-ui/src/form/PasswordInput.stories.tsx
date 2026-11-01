import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { PasswordInput } from './PasswordInput';
import { PasswordInputBase } from './PasswordInputBase';
import { Field } from './Field';
import { Control } from './Control';
import { Fieldset } from './Fieldset';
import { Button } from '../elements/Button';
import { Paragraph } from '../elements/Paragraph';
import { Code } from '../elements/Code';

const meta: Meta<typeof PasswordInput> = {
  title: 'Form/PasswordInput',
  component: PasswordInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A password field with a button inside it that shows what was typed: an eye named “Show password” that reports whether it’s on, or with variant="text" the words “Show” and “Hide”. It asks for autocomplete="current-password" and no spellcheck, and hides the password again when its form submits.',
      },
    },
  },
  args: {
    label: 'Password',
  },
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'Whether the password shows, controlled',
    },
    defaultVisible: {
      control: 'boolean',
      description: 'Whether the password shows at first, uncontrolled',
    },
    onVisibleChange: {
      action: 'visibleChange',
      description:
        'Called with the new visibility on a toggle, and with false when the form submits or resets',
    },
    variant: {
      control: 'inline-radio',
      options: ['icon', 'text'],
      description: 'An eye icon, or the words “Show” and “Hide”',
    },
    labels: {
      control: 'object',
      description: 'The toggle’s names and words, each with an English default',
    },
    autoComplete: {
      control: 'select',
      options: ['current-password', 'new-password'],
      description:
        'current-password to sign in, new-password where the user makes one up',
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
      description: 'Bulma color modifier for the input',
    },
    size: {
      control: 'inline-radio',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'The input’s size, which the toggle follows',
    },
    isRounded: {
      control: 'boolean',
      description: 'Rounded ends',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input and its toggle',
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows the Control’s spinner in the toggle’s place',
    },
    placeholder: {
      control: 'text',
      description: 'Text shown while the field is empty',
    },
    label: {
      control: 'text',
      description: 'Field label, associated with the input',
    },
    message: {
      control: 'text',
      description: 'Help text under the field',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PasswordInput>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Password');
    const toggle = canvas.getByRole('button', { name: 'Show password' });
    await userEvent.click(input);
    await userEvent.keyboard('hunter2');
    await userEvent.click(toggle);
    await expect(input).toHaveAttribute('type', 'text');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    // A pointer press leaves focus in the field.
    await expect(input).toHaveFocus();
  },
};

export const TextToggle: Story = {
  args: {
    label: 'Password',
    variant: 'text',
  },
};

export const NewPassword: Story = {
  args: {
    label: 'New password',
    autoComplete: 'new-password',
    message: 'At least 15 characters.',
  },
};

export const Translated: Story = {
  args: {
    label: 'Contraseña',
    variant: 'text',
    labels: {
      showPassword: 'Mostrar contraseña',
      hidePassword: 'Ocultar contraseña',
      show: 'Mostrar',
      hide: 'Ocultar',
    },
  },
};

export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <>
        {(['small', undefined, 'medium', 'large'] as const).map(size => (
          <PasswordInput
            key={size ?? 'normal'}
            label={size ?? 'normal'}
            size={size}
            variant={size === 'medium' || size === 'large' ? 'text' : 'icon'}
            defaultValue="correct horse battery staple"
          />
        ))}
      </>
    );
  },
};

export const WithLeftIcon: Story = {
  args: {
    label: 'Password',
    iconLeftName: 'lock',
    isRounded: true,
  },
};

export const ShowingTwoTogether: Story = {
  render: function ShowingTwoTogetherExample() {
    const [visible, setVisible] = useState(false);
    return (
      <>
        <PasswordInput
          label="Current password"
          visible={visible}
          onVisibleChange={setVisible}
        />
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          visible={visible}
          onVisibleChange={setVisible}
        />
        <Paragraph>
          Showing: <Code>{String(visible)}</Code>
        </Paragraph>
      </>
    );
  },
};

export const HidesOnSubmit: Story = {
  render: function HidesOnSubmitExample() {
    const [sent, setSent] = useState<string | null>(null);
    return (
      <form
        onSubmit={event => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSent(String(data.get('password')));
        }}
      >
        <PasswordInput label="Password" name="password" defaultVisible />
        <Button type="submit" color="primary" mb="3">
          Sign in
        </Button>
        {sent !== null && (
          <Paragraph>
            Sent <Code>{sent}</Code>, and the field is hidden again.
          </Paragraph>
        )}
      </form>
    );
  },
};

export const Disabled: Story = {
  render: function DisabledExample() {
    return (
      <>
        <PasswordInput label="Disabled" disabled defaultValue="secret" />
        <Fieldset legend="Saving" disabled>
          <PasswordInput label="In a disabled Fieldset" />
        </Fieldset>
      </>
    );
  },
};

export const Loading: Story = {
  args: {
    label: 'Password',
    isLoading: true,
  },
};

export const WithoutTheField: Story = {
  render: function WithoutTheFieldExample() {
    return (
      <Field label="API secret">
        <Control>
          <PasswordInputBase />
        </Control>
      </Field>
    );
  },
};
