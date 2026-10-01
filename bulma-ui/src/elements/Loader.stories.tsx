import type { Meta, StoryObj } from '@storybook/react-vite';
import { Loader } from './Loader';
import { Block } from './Block';
import { Box } from './Box';
import { Span } from './Span';
import { Table } from './Table';
import { Thead } from './Thead';
import { Tbody } from './Tbody';
import { Tr } from './Tr';
import { Th } from './Th';
import { Td } from './Td';
import { validTextSizes } from '../helpers/useBulmaClasses';

const meta: Meta<typeof Loader> = {
  title: 'Elements/Loader',
  component: Loader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Bulma’s `.loader`: a small spinning ring for inline loading states, exposed as an indeterminate progressbar. It is sized by font-size and has no color prop; the ring uses the theme’s border color.',
      },
    },
  },
  argTypes: {
    ariaLabel: {
      control: 'text',
      description:
        'Accessible name of the progress indicator. Default "Loading".',
    },
    textSize: {
      control: 'select',
      options: validTextSizes,
      description: 'Font-size helper; the ring is 1em square, so it scales.',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Loader>;

export const Default: Story = {};

export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <Block display="flex" alignItems="center">
        {(['7', '5', '3', '1'] as const).map(size => (
          <Loader key={size} textSize={size} mr="5" />
        ))}
      </Block>
    );
  },
};

export const NextToALabel: Story = {
  render: function NextToALabelExample() {
    return (
      <Block display="flex" alignItems="center">
        <Loader aria-labelledby="story-save-status" mr="2" />
        <Span id="story-save-status">Saving changes</Span>
      </Block>
    );
  },
};

export const InATableCell: Story = {
  render: function InATableCellExample() {
    return (
      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Ada Lovelace</Td>
            <Td>
              <Loader ariaLabel="Saving Ada Lovelace" />
            </Td>
          </Tr>
          <Tr>
            <Td>Grace Hopper</Td>
            <Td>Saved</Td>
          </Tr>
        </Tbody>
      </Table>
    );
  },
};

export const CenteredInABox: Story = {
  render: function CenteredInABoxExample() {
    return (
      <Box aria-busy="true">
        <Loader textSize="3" mx="auto" ariaLabel="Loading account details" />
      </Box>
    );
  },
};
