import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { PinInput } from './PinInput';
import { Field } from './Field';
import { Block } from '../elements/Block';
import { Button } from '../elements/Button';
import { Paragraph } from '../elements/Paragraph';

const meta: Meta<typeof PinInput> = {
  title: 'Form/PinInput',
  component: PinInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A field for a short code, such as a one-time code or a PIN, drawn as a row of Bulma input boxes. The code lives in one real input that lies over the boxes, so it is one field to a screen reader, and paste, autofill from a text message and password managers work on it as they do on any input. The box at the caret shows the focus look.',
      },
    },
  },
  args: {
    label: 'Verification code',
  },
  argTypes: {
    label: {
      control: 'text',
      description:
        'Field label, associated with the input that holds the code, so a screen reader announces one field under this name',
    },
    length: {
      control: { type: 'number', min: 1, max: 12 },
      description:
        "How many characters the code has: one box each, and the input's maxLength",
    },
    value: {
      control: 'text',
      description: 'The code (controlled)',
    },
    defaultValue: {
      control: 'text',
      description: 'The code to start with (uncontrolled)',
    },
    type: {
      control: 'inline-radio',
      options: ['number', 'alphanumeric'],
      description:
        'What the code takes: digits, or letters and digits. Anything else typed or pasted is dropped',
    },
    isMasked: {
      control: 'boolean',
      description:
        'Shows a dot in each filled box and makes the input a password field',
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
        'black',
        'dark',
        'light',
        'white',
      ],
      description: 'Bulma color for the boxes, the colors an Input takes',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of the boxes',
    },
    isRounded: {
      control: 'boolean',
      description: 'Round boxes',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    message: {
      control: 'text',
      description: 'Help or validation message below the boxes',
    },
    messageColor: {
      control: 'select',
      options: ['primary', 'link', 'info', 'success', 'warning', 'danger'],
      description: 'Bulma color for the message',
    },
    name: {
      control: 'text',
      description: 'Form field name, so a form submits the code under it',
    },
    onChange: {
      action: 'changed',
      description: 'Called with the code each time it changes',
    },
    onComplete: {
      action: 'completed',
      description:
        'Called with the code when a change fills the last box with a new code',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PinInput>;

export const Default: Story = {};

export const Verification: Story = {
  render: function VerificationExample(args) {
    const [code, setCode] = useState('');
    const [checked, setChecked] = useState<string>();
    const wrong = checked !== undefined && checked !== '123456';
    return (
      <>
        <PinInput
          {...args}
          // The check below is for six digits, whatever the controls say,
          // and the label says so, since the message isn't read on focus.
          label="Enter the 6-digit code we sent you"
          length={6}
          value={code}
          onChange={next => {
            setCode(next);
            setChecked(undefined);
          }}
          onComplete={setChecked}
          color={wrong ? 'danger' : checked ? 'success' : undefined}
          message={
            wrong
              ? 'That code is not right. Try 123456.'
              : checked
                ? 'Verified.'
                : undefined
          }
          messageColor={wrong ? 'danger' : checked ? 'success' : undefined}
        />
        <Paragraph mt="2">Code: {code || 'none yet'}</Paragraph>
      </>
    );
  },
};

export const Lengths: Story = {
  render: function LengthsExample(args) {
    return (
      <>
        <PinInput {...args} label="PIN" length={4} />
        <PinInput {...args} label="Backup code" length={8} />
      </>
    );
  },
};

export const LettersAndDigits: Story = {
  args: {
    label: 'Invite code',
    type: 'alphanumeric',
    length: 5,
    defaultValue: 'AB3',
  },
};

export const Masked: Story = {
  args: {
    label: 'PIN',
    length: 4,
    isMasked: true,
    defaultValue: '12',
  },
};

export const Colors: Story = {
  render: function ColorsExample(args) {
    return (
      <>
        {(['primary', 'info', 'success', 'warning', 'danger'] as const).map(
          color => (
            <PinInput
              key={color}
              {...args}
              label={color}
              color={color}
              length={4}
              defaultValue="12"
            />
          )
        )}
      </>
    );
  },
};

export const Sizes: Story = {
  render: function SizesExample(args) {
    return (
      <>
        <PinInput {...args} label="Small" size="small" defaultValue="12" />
        <PinInput {...args} label="Normal" defaultValue="12" />
        <PinInput {...args} label="Medium" size="medium" defaultValue="12" />
        <PinInput {...args} label="Large" size="large" defaultValue="12" />
      </>
    );
  },
};

export const Rounded: Story = {
  args: { isRounded: true, length: 4, defaultValue: '12' },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: '123' },
};

export const HorizontalField: Story = {
  render: function HorizontalFieldExample(args) {
    return (
      <Field horizontal label="Code">
        <PinInput {...args} label={undefined} length={4} />
      </Field>
    );
  },
};

export const InAForm: Story = {
  render: function InAFormExample(args) {
    const [submitted, setSubmitted] = useState<string>();
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          setSubmitted(String(new FormData(e.currentTarget).get('otp')));
        }}
      >
        <PinInput {...args} name="otp" />
        <Block mt="3">
          <Button type="submit" color="primary">
            Verify
          </Button>
        </Block>
        {submitted !== undefined && (
          <Paragraph mt="2">The form sent otp={submitted}</Paragraph>
        )}
      </form>
    );
  },
};

export const RightToLeft: Story = {
  render: function RightToLeftExample(args) {
    return (
      <div dir="rtl">
        <PinInput
          {...args}
          label="رمز التحقق"
          defaultValue="12"
          message="The boxes stay left to right, the way a code is written."
        />
      </div>
    );
  },
};
