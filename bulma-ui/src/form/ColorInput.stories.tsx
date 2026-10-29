import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ColorInput } from './ColorInput';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Paragraph } from '../elements/Paragraph';
import { Code } from '../elements/Code';
import { Theme } from '../helpers/Theme';
import { LocaleProvider } from '../helpers/LocaleProvider';

const meta: Meta<typeof ColorInput> = {
  title: 'Form/ColorInput',
  component: ColorInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A form field for a color: type it, or open a color picker from its launcher, its swatch or Alt+ArrowDown. The value is a CSS color string, HSL by default, or empty. The panel is the ColorPicker’s square and hue slider, with alpha, swatches and an eye dropper when asked for.',
      },
    },
  },
  args: {
    label: 'Brand color',
    defaultValue: 'hsl(202, 67%, 36%)',
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'The color, controlled, or an empty string for none',
    },
    defaultValue: {
      control: 'text',
      description: 'The color to start with, uncontrolled; empty without one',
    },
    onChange: {
      action: 'change',
      description: 'Called with the value as it changes, on every drag step',
    },
    onChangeEnd: {
      action: 'changeEnd',
      description: 'Called with the value once a change is done',
    },
    format: {
      control: 'inline-radio',
      options: ['hsl', 'hex', 'rgb'],
      description: 'How the value is written',
    },
    alpha: {
      control: 'boolean',
      description: 'Adds an alpha slider and writes alpha into the value',
    },
    swatches: {
      control: false,
      description: 'Preset colors in the panel, a list or "bulma"',
    },
    eyeDropper: {
      control: 'boolean',
      description: 'A button in the panel that picks from the screen',
    },
    openOnFocus: {
      control: 'boolean',
      description: 'Opens the panel when the field takes focus',
    },
    closeOnSwatchClick: {
      control: 'boolean',
      description: 'Closes the panel once a swatch is chosen',
    },
    position: {
      control: 'select',
      options: ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'auto'],
      description: 'The panel’s place relative to the field',
    },
    appendToBody: {
      control: 'boolean',
      description: 'Renders the panel through a portal',
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
      description: 'Bulma color modifier for the field',
    },
    size: {
      control: 'inline-radio',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'The field’s size',
    },
    isRounded: {
      control: 'boolean',
      description: 'Rounded ends',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the field and its panel',
    },
    readOnly: {
      control: 'boolean',
      description: 'Read-only, with no panel',
    },
    placeholder: {
      control: 'text',
      description: 'Text shown while the field is empty',
    },
    triggerIcon: {
      control: 'boolean',
      description: 'Shows the launcher on the field’s end',
    },
    labels: {
      control: 'object',
      description: 'The strings it says, each with an English default',
    },
    label: {
      control: 'text',
      description: 'Field label, associated with the text field',
    },
    message: {
      control: 'text',
      description: 'Help text under the field',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ColorInput>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Brand color' });
    field.focus();
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await expect(
      within(document.body).getByRole('dialog', { name: 'Choose color' })
    ).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(field).toHaveFocus();
  },
};

export const Empty: Story = {
  args: {
    label: 'Highlight',
    defaultValue: undefined,
    placeholder: 'No color',
  },
};

export const AlphaAndSwatches: Story = {
  args: {
    label: 'Label color',
    alpha: true,
    format: 'hex',
    defaultValue: '#00d1b2cc',
    swatches: [
      { color: '#1e6b99', label: 'Ocean' },
      { color: '#00d1b2', label: 'Turquoise' },
      { color: '#ff6685', label: 'Pink' },
      { color: '#ffdd57', label: 'Sunflower' },
    ],
    closeOnSwatchClick: true,
  },
};

export const ThemeSwatches: Story = {
  args: {
    label: 'Accent',
    swatches: 'bulma',
    eyeDropper: true,
  },
};

export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <>
        {(['small', undefined, 'medium', 'large'] as const).map(size => (
          <ColorInput
            key={size ?? 'normal'}
            label={size ?? 'normal'}
            size={size}
            defaultValue="#ff6685"
          />
        ))}
      </>
    );
  },
};

export const Controlled: Story = {
  render: function ControlledExample() {
    const [color, setColor] = useState('hsl(202, 67%, 36%)');
    const [h, s, l] = color.match(/[\d.]+/g) ?? [];
    return (
      <>
        <ColorInput label="Primary" value={color} onChange={setColor} />
        <Paragraph mb="3">
          Value: <Code>{color || 'none'}</Code>
        </Paragraph>
        <Theme primaryH={h} primaryS={`${s}%`} primaryL={`${l}%`}>
          <Buttons>
            <Button color="primary">Primary</Button>
            <Button color="primary" isOutlined>
              Outlined
            </Button>
          </Buttons>
        </Theme>
      </>
    );
  },
};

export const RightToLeft: Story = {
  render: function RightToLeftExample() {
    return (
      <LocaleProvider locale="ar" dir="rtl">
        <ColorInput
          label="اللون"
          defaultValue="hsl(150, 60%, 40%)"
          labels={{ chooseColor: 'اختر لونًا', hue: 'تدرج اللون' }}
        />
      </LocaleProvider>
    );
  },
};

export const Disabled: Story = {
  args: {
    label: 'Locked color',
    disabled: true,
  },
};
