import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useRef, useState } from 'react';
import { CopyButton } from './CopyButton';
import { Buttons } from './Buttons';
import { Code } from './Code';
import { Paragraph } from './Paragraph';
import { Tooltip } from '../components/Tooltip';
import { Control } from '../form/Control';
import { Field } from '../form/Field';
import { Input } from '../form/Input';

const COLORS = [
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
  'text',
  'ghost',
] as const;

const SIZES = ['small', 'normal', 'medium', 'large'] as const;

const meta: Meta<typeof CopyButton> = {
  title: 'Elements/CopyButton',
  component: CopyButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A button that copies a piece of text to the clipboard: a share link, an API key, a command. It reads "Copy" with an icon, turns to a check and "Copied" for two seconds after a copy, and a polite status region says so for screen readers. It writes through the Clipboard API, falls back to the copy command where that is missing or refused, and reports a failure rather than pretending. showLabel={false} makes it an icon-only square button named "Copy". It renders through Button, so it takes every Button prop.',
      },
    },
  },
  argTypes: {
    value: {
      control: 'text',
      description:
        'The text it copies; not the button’s form value, which it doesn’t render',
    },
    duration: {
      control: { type: 'number', min: 0, step: 500 },
      description:
        'How long "Copied" stays, in milliseconds (default 2000); another copy restarts it',
    },
    showLabel: {
      control: 'boolean',
      description:
        'Shows the label beside the icon (default); off, it is a square icon-only button named by labels.copy',
    },
    labels: {
      control: 'object',
      description:
        'Translations: copy and copied are the label, copiedStatus and failedStatus are announced',
    },
    onCopiedChange: {
      control: false,
      description:
        'Called with true after each copy that worked, and false when duration runs out or a later copy fails',
    },
    onCopyError: {
      control: false,
      description:
        'Called with an Error when neither the Clipboard API nor the copy command could write',
    },
    onClick: {
      control: false,
      description:
        'Runs before the copy; calling preventDefault() in it stops the copy',
    },
    color: {
      control: 'select',
      options: COLORS,
      description: 'Bulma color, as on Button',
    },
    size: {
      control: 'select',
      options: SIZES,
      description: 'Size of the button, as on Button',
    },
    isRounded: {
      control: 'boolean',
      description: 'Rounds the button; icon-only, it is a circle',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Disables the button, so it copies nothing',
    },
  },
  args: {
    value: 'https://bestax.io',
  },
};

export default meta;
type Story = StoryObj<typeof CopyButton>;

/** Click it, or Tab to it and press Enter or Space, then paste somewhere. */
export const Default: Story = {};

/** Icon-only: square, named "Copy" in both states, and only the glyph swaps. */
export const IconOnly: Story = {
  args: { showLabel: false },
};

/** Words of your own for the label and the announcements. */
export const CustomLabels: Story = {
  args: {
    value: 'BESTAX-2026',
    color: 'primary',
    labels: {
      copy: 'Copy code',
      copied: 'Code copied',
      copiedStatus: 'Invite code copied',
      failedStatus: "Couldn't copy the invite code",
    },
  },
};

/** Every Bulma color, with the label and icon-only. */
export const Colors: Story = {
  render: function ColorsExample() {
    return (
      <>
        {COLORS.map(color => (
          <Buttons key={color}>
            <CopyButton value={color} color={color} />
            <CopyButton value={color} color={color} showLabel={false} />
          </Buttons>
        ))}
      </>
    );
  },
};

/** Every size, with the label and icon-only, square and round. */
export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <>
        {SIZES.map(size => (
          <Buttons key={size}>
            <CopyButton value={size} size={size} />
            <CopyButton value={size} size={size} showLabel={false} />
            <CopyButton value={size} size={size} showLabel={false} isRounded />
          </Buttons>
        ))}
      </>
    );
  },
};

/**
 * A copy field: a read-only input and the button in a `Field hasAddons`. If
 * the copy fails, `onCopyError` selects the text so it can be copied by hand,
 * and `labels.failedStatus` says so, once, with a plain line showing it.
 */
export const CopyField: Story = {
  render: function CopyFieldExample() {
    const id = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [failed, setFailed] = useState(false);
    const link = 'https://bestax.io/docs/api/elements/copybutton';
    const failure =
      "Couldn't copy automatically. The link is selected, so copy it from the field.";

    return (
      <Field label="Share link" labelProps={{ htmlFor: id }}>
        <Field hasAddons>
          <Control isExpanded>
            <Input ref={inputRef} id={id} value={link} readOnly />
          </Control>
          <Control>
            <CopyButton
              value={link}
              labels={{ failedStatus: failure }}
              onCopiedChange={() => setFailed(false)}
              onCopyError={() => {
                inputRef.current?.focus();
                inputRef.current?.select();
                setFailed(true);
              }}
            />
          </Control>
        </Field>
        {failed && <p className="help is-danger">{failure}</p>}
      </Field>
    );
  },
};

/** Icon-only beside a command, with a tooltip that describes it. */
export const WithATooltip: Story = {
  render: function WithATooltipExample() {
    return (
      <Paragraph p="6">
        <Code mr="2">pnpm create bestax@latest</Code>
        <Tooltip label="Copies the install command" position="bottom">
          <CopyButton
            value="pnpm create bestax@latest"
            showLabel={false}
            size="small"
            labels={{ copy: 'Copy the command' }}
          />
        </Tooltip>
      </Paragraph>
    );
  },
};

/** What the callbacks report, shown under the button. */
export const Callbacks: Story = {
  render: function CallbacksExample(args) {
    const [log, setLog] = useState<string[]>([]);
    const add = (line: string) => setLog(lines => [line, ...lines].slice(0, 5));
    return (
      <>
        <CopyButton
          {...args}
          onCopiedChange={copied => add(`onCopiedChange(${copied})`)}
          onCopyError={error => add(`onCopyError(${error.message})`)}
        />
        <Paragraph mt="3">{log.join(', ') || 'Nothing yet.'}</Paragraph>
      </>
    );
  },
};

/** Disabled copies nothing. */
export const Disabled: Story = {
  args: { isDisabled: true },
};
