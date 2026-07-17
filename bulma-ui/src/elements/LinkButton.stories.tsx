import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import { LinkButton } from './LinkButton';
import { Buttons } from './Buttons';
import { Button } from './Button';
import { Field } from '../form/Field';
import { Input } from '../form/Input';

const meta: Meta<typeof LinkButton> = {
  title: 'Elements/LinkButton',
  component: LinkButton,
  parameters: {
    docs: {
      description: {
        component:
          'A button that visually looks like text or a link, for a11y-friendly replacements of `<div onClick>` anti-patterns. Supports text (no underline), ghost (no link color), and underline (hover underline) variants with optional color overrides.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'ghost', 'underline'],
      description:
        "Display mode: 'text' for minimal, 'ghost' for link-like, 'underline' for hover underline.",
    },
    color: {
      control: 'select',
      options: [
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'white',
        'light',
        'dark',
        'black',
      ],
      description: 'Text color override.',
    },
    size: {
      control: 'select',
      options: ['small', 'normal', 'medium', 'large'],
      description: 'Button size.',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Disables the button.',
    },
    isRounded: {
      control: 'boolean',
      description: 'Makes the button rounded.',
    },
    isLoading: {
      control: 'boolean',
      description: 'Displays a loading spinner.',
    },
    isFullWidth: {
      control: 'boolean',
      description: 'Makes the button full-width.',
    },
    onClick: {
      action: 'clicked',
      description: 'Click event handler.',
    },
    children: {
      control: 'text',
      description: 'Button content.',
    },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof LinkButton>;

// Default text variant
export const Default: Story = {
  args: {
    children: 'Click me',
  },
};

// Ghost variant
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost LinkButton',
  },
};

// Text variant with color
export const TextWithColor: Story = {
  args: {
    variant: 'text',
    color: 'primary',
    children: 'Primary Text',
  },
  name: 'Text with Color',
};

// Ghost variant with color
export const GhostWithColor: Story = {
  args: {
    variant: 'ghost',
    color: 'danger',
    children: 'Danger Ghost',
  },
  name: 'Ghost with Color',
};

// Underline variant
export const Underline: Story = {
  args: {
    variant: 'underline',
    children: 'Hover to underline',
  },
};

// Underline variant with all semantic colors
export const UnderlineWithColors: Story = {
  render: () => (
    <Buttons>
      {(
        ['primary', 'link', 'info', 'success', 'warning', 'danger'] as const
      ).map(color => (
        <LinkButton key={color} variant="underline" color={color}>
          {color.charAt(0).toUpperCase() + color.slice(1)}
        </LinkButton>
      ))}
    </Buttons>
  ),
  name: 'Underline with Colors',
};

// All semantic colors in text variant
export const AllColors: Story = {
  render: () => (
    <Buttons>
      {(
        ['primary', 'link', 'info', 'success', 'warning', 'danger'] as const
      ).map(color => (
        <LinkButton key={color} color={color}>
          {color.charAt(0).toUpperCase() + color.slice(1)}
        </LinkButton>
      ))}
    </Buttons>
  ),
};

// All colors in ghost variant
export const AllColorsGhost: Story = {
  render: () => (
    <Buttons>
      {(
        ['primary', 'link', 'info', 'success', 'warning', 'danger'] as const
      ).map(color => (
        <LinkButton key={color} variant="ghost" color={color}>
          {color.charAt(0).toUpperCase() + color.slice(1)}
        </LinkButton>
      ))}
    </Buttons>
  ),
  name: 'All Colors (Ghost)',
};

// Disabled state
export const Disabled: Story = {
  args: {
    isDisabled: true,
    disabled: true,
    children: 'Disabled LinkButton',
  },
};

// Sizes
export const AllSizes: Story = {
  render: () => (
    <Buttons>
      {(['small', 'normal', 'medium', 'large'] as const).map(size => (
        <LinkButton key={size} size={size}>
          {size.charAt(0).toUpperCase() + size.slice(1)}
        </LinkButton>
      ))}
    </Buttons>
  ),
};

// Click counter showing all variants fire onClick
const LinkButtonStateDemo = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p style={{ marginBottom: '1rem' }}>
        Click count: <strong>{count}</strong>
      </p>
      <Buttons>
        <LinkButton variant="text" onClick={() => setCount(c => c + 1)}>
          Text +1
        </LinkButton>
        <LinkButton variant="ghost" onClick={() => setCount(c => c + 1)}>
          Ghost +1
        </LinkButton>
        <LinkButton variant="underline" onClick={() => setCount(c => c + 1)}>
          Underline +1
        </LinkButton>
        <Button color="light" onClick={() => setCount(0)}>
          Reset
        </Button>
      </Buttons>
    </div>
  );
};

export const ClickCounter: Story = {
  render: () => <LinkButtonStateDemo />,
};

// In-form context
const LinkButtonInFormDemo = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <form onSubmit={e => e.preventDefault()}>
      <Input
        label="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Enter your name"
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <Field>
        <div className="control">
          <Button color="primary" size="medium" type="submit" isFullWidth>
            Create account
          </Button>
        </div>
      </Field>
      <Buttons size="small" className="is-centered">
        <LinkButton
          variant="underline"
          color="link"
          size="small"
          onClick={() => {
            setName('');
            setEmail('');
          }}
        >
          Clear form
        </LinkButton>
        <LinkButton
          variant="underline"
          size="small"
          onClick={() => alert(`Preview: ${name} <${email}>`)}
        >
          Preview
        </LinkButton>
      </Buttons>
    </form>
  );
};

export const InFormContext: Story = {
  render: () => <LinkButtonInFormDemo />,
};

// Polymorphic `as` — render as a custom component (e.g. a router Link)
const RouterLikeLink = ({
  to,
  ...rest
}: { to: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a data-to={to} {...rest} />
);

export const PolymorphicAs: Story = {
  render: () => (
    <LinkButton as={RouterLikeLink} to="/dashboard" variant="underline">
      Go to Dashboard
    </LinkButton>
  ),
  name: 'Polymorphic `as` (Router Link)',
};
