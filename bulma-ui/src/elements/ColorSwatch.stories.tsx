import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { ColorSwatch } from './ColorSwatch';
import { Table } from './Table';
import { Thead } from './Thead';
import { Tbody } from './Tbody';
import { Tr } from './Tr';
import { Th } from './Th';
import { Td } from './Td';
import { Code } from './Code';
import { validColors } from '../helpers/useBulmaClasses';

const meta: Meta<typeof ColorSwatch> = {
  title: 'Elements/ColorSwatch',
  component: ColorSwatch,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A color shown as a small chip, an image named by its label or by the color itself, with a checkerboard behind a see-through color. It keeps its color in forced colors, edged in the system’s text color.',
      },
    },
  },
  args: {
    color: '#1e6b99',
    label: 'Brand blue',
  },
  argTypes: {
    color: {
      control: 'color',
      description: 'Any CSS color, including var(--bulma-primary)',
    },
    label: {
      control: 'text',
      description: 'Names the swatch in place of the color as written',
    },
    size: {
      control: 'inline-radio',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'The swatch’s size',
    },
    isRounded: {
      control: 'boolean',
      description: 'A circle in place of a rounded square',
    },
    children: {
      control: false,
      description: 'Drawn on the swatch, hidden from assistive tech',
    },
    textColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Text color helper, the color of what’s drawn on it',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ColorSwatch>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('img', { name: 'Brand blue' })
    ).toBeInTheDocument();
  },
};

export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <>
        {(['small', undefined, 'medium', 'large'] as const).map(size => (
          <ColorSwatch
            key={size ?? 'normal'}
            color="#00d1b2"
            label={`Turquoise, ${size ?? 'normal'}`}
            size={size}
            mr="3"
          />
        ))}
      </>
    );
  },
};

export const Rounded: Story = {
  args: { isRounded: true, size: 'medium' },
};

export const SeeThrough: Story = {
  args: {
    color: 'rgba(255, 102, 133, 0.4)',
    label: 'Pink at 40%',
    size: 'large',
  },
};

export const ThemeColors: Story = {
  render: function ThemeColorsExample() {
    return (
      <>
        {(
          ['primary', 'link', 'info', 'success', 'warning', 'danger'] as const
        ).map(name => (
          <ColorSwatch
            key={name}
            color={`var(--bulma-${name})`}
            label={name}
            isRounded
            mr="2"
          />
        ))}
      </>
    );
  },
};

export const InATable: Story = {
  render: function InATableExample() {
    const colors = [
      ['Brand', '#1e6b99'],
      ['Accent', '#00d1b2'],
      ['Alert', '#ff6685'],
    ];
    return (
      <Table isNarrow>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Color</Th>
          </Tr>
        </Thead>
        <Tbody>
          {colors.map(([name, color]) => (
            <Tr key={name}>
              <Td>{name}</Td>
              <Td>
                {/* The value is beside it in words, so the swatch is hidden. */}
                <ColorSwatch color={color} size="small" aria-hidden mr="2" />
                <Code>{color}</Code>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    );
  },
};
