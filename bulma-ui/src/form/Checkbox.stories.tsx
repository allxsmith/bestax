import { Meta, StoryObj } from '@storybook/react';
import Checkbox from './Checkbox';
import Checkboxes from './Checkboxes';

const meta: Meta<typeof Checkbox> = {
  title: 'Form/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  render: () => <Checkbox> Stay Signed In</Checkbox>,
};

export const CheckboxWithLink: Story = {
  render: () => (
    <Checkbox>
      {' '}
      I have read and agree to the{' '}
      <a href="#" target="_blank" rel="noopener noreferrer">
        terms and conditions
      </a>
      .
    </Checkbox>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Checkbox with an anchor tag in the label.',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => <Checkbox disabled> Stay Signed In </Checkbox>,
};

export const ListOfCheckboxes: Story = {
  render: () => (
    <Checkboxes>
      <Checkbox> Make the bed </Checkbox>
      <Checkbox> Brush teeth </Checkbox>
      <Checkbox> Do homework </Checkbox>
      <Checkbox> Feed the pet </Checkbox>
      <Checkbox> Take out the trash </Checkbox>
      <Checkbox> Clean your room </Checkbox>
      <Checkbox> Set the table </Checkbox>
      <Checkbox> Help with dishes </Checkbox>
      <Checkbox> Water the plants </Checkbox>
      <Checkbox> Put away toys </Checkbox>
    </Checkboxes>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A group of checkboxes for common household chores for a child, wrapped in the Checkboxes component.',
      },
    },
  },
};
