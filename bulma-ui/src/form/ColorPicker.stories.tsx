import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ColorPicker } from './ColorPicker';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Paragraph } from '../elements/Paragraph';
import { Code } from '../elements/Code';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';
import { Theme } from '../helpers/Theme';
import { LocaleProvider } from '../helpers/LocaleProvider';

const meta: Meta<typeof ColorPicker> = {
  title: 'Form/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A panel for choosing a color: a saturation and brightness square, a hue slider, and the value as text, with alpha and swatches when asked for. The square is two native range inputs with one tab stop, read as a 2D slider. The value is a CSS color string, HSL by default. Its parts make custom layouts.',
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
      description: 'The color, controlled: hex, rgb(), hsl() or a name',
    },
    defaultValue: {
      control: 'text',
      description: 'The color to start with, uncontrolled; black without one',
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
      description: 'Preset colors, a list or "bulma" for the page’s theme',
    },
    eyeDropper: {
      control: 'boolean',
      description: 'A button that picks from the screen, where supported',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables every part',
    },
    name: {
      control: 'text',
      description: 'Form field name for a hidden input with the value',
    },
    form: {
      control: 'text',
      description: 'The id of the form the hidden input belongs to',
    },
    labels: {
      control: 'object',
      description: 'The strings it says, each with an English default',
    },
    label: {
      control: 'text',
      description: 'Field label naming the picker',
    },
    message: {
      control: 'text',
      description: 'Help text under the picker',
    },
    children: {
      control: false,
      description: 'Parts for a layout of your own',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('group', { name: 'Brand color' })
    ).toBeInTheDocument();
    const hue = canvas.getByRole('slider', { name: 'Hue' });
    await expect(hue).toHaveAttribute('aria-valuetext', '202 degrees');
    // The range input is visually hidden inside the thumb, so it takes
    // focus from the keyboard rather than a click.
    hue.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(hue).toHaveAttribute('aria-valuetext', '203 degrees');
  },
};

export const Alpha: Story = {
  args: {
    label: 'Highlight',
    alpha: true,
    defaultValue: 'hsla(171, 100%, 41%, 0.6)',
  },
};

export const Formats: Story = {
  render: function FormatsExample() {
    return (
      <Columns>
        {(['hsl', 'hex', 'rgb'] as const).map(format => (
          <Column key={format} isNarrow>
            <ColorPicker label={format} format={format} defaultValue="tomato" />
          </Column>
        ))}
      </Columns>
    );
  },
};

export const Swatches: Story = {
  args: {
    label: 'Label color',
    format: 'hex',
    defaultValue: '#00d1b2',
    swatches: [
      { color: '#1e6b99', label: 'Ocean' },
      { color: '#00d1b2', label: 'Turquoise' },
      { color: '#ff6685', label: 'Pink' },
      { color: '#ffdd57', label: 'Sunflower' },
      { color: '#4a4a4a', label: 'Charcoal' },
    ],
  },
};

export const ThemeSwatches: Story = {
  args: {
    label: 'Accent',
    swatches: 'bulma',
  },
};

export const EyeDropper: Story = {
  args: {
    label: 'Sample a color',
    eyeDropper: true,
  },
};

export const Controlled: Story = {
  render: function ControlledExample() {
    const [color, setColor] = useState('hsl(348, 86%, 61%)');
    const [saved, setSaved] = useState(color);
    return (
      <>
        <ColorPicker
          label="Danger"
          value={color}
          onChange={setColor}
          onChangeEnd={setSaved}
        />
        <Paragraph mt="3">
          Showing <Code>{color}</Code>, saved <Code>{saved}</Code>
        </Paragraph>
      </>
    );
  },
};

export const BrandColor: Story = {
  render: function BrandColorExample() {
    const [brand, setBrand] = useState('hsl(202, 67%, 36%)');
    const [h, s, l] = brand.match(/[\d.]+/g) ?? [];
    return (
      <Columns>
        <Column isNarrow>
          <ColorPicker label="Primary" value={brand} onChange={setBrand} />
        </Column>
        <Column>
          <Theme primaryH={h} primaryS={`${s}%`} primaryL={`${l}%`}>
            <Buttons>
              <Button color="primary">Primary</Button>
              <Button color="primary" isOutlined>
                Outlined
              </Button>
              <Button color="primary" isLight>
                Light
              </Button>
            </Buttons>
          </Theme>
        </Column>
      </Columns>
    );
  },
};

export const CompoundUsage: Story = {
  render: function CompoundUsageExample() {
    return (
      <ColorPicker
        aria-label="Accent"
        format="hex"
        defaultValue="#00d1b2"
        swatches={['#1e6b99', '#00d1b2', '#ff6685', '#ffdd57']}
      >
        <ColorPicker.Swatches />
        <ColorPicker.Area />
        <ColorPicker.HueSlider />
        <ColorPicker.Input />
      </ColorPicker>
    );
  },
};

export const RightToLeft: Story = {
  render: function RightToLeftExample() {
    return (
      <LocaleProvider locale="ar" dir="rtl">
        <ColorPicker
          label="اللون"
          labels={{
            area: 'التشبع والسطوع',
            saturation: 'التشبع',
            brightness: 'السطوع',
            hue: 'تدرج اللون',
            value: 'قيمة اللون',
            swatches: 'العينات',
          }}
          defaultValue="hsl(150, 60%, 40%)"
          swatches={['#1e6b99', '#00d1b2', '#ff6685']}
        />
      </LocaleProvider>
    );
  },
};

export const Disabled: Story = {
  args: {
    label: 'Locked color',
    disabled: true,
    swatches: ['#1e6b99', '#00d1b2'],
  },
};
