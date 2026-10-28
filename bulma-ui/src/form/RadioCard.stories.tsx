import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { RadioCard } from './RadioCard';
import { Radios } from './Radios';
import { radioColors } from './Radio';
import { Grid } from '../grid/Grid';
import { Paragraph } from '../elements/Paragraph';
import { validColors } from '../helpers/useBulmaClasses';

const meta: Meta<typeof RadioCard> = {
  title: 'Form/RadioCard',
  component: RadioCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A radio button drawn as a card, with a title and a description, picked wherever you click it. It is a label around a real radio, named by the title and described by the description, and it joins a Radios group as Radio does, so the arrow keys move between the cards.',
      },
    },
  },
  args: {
    name: 'shipping',
    value: 'express',
    title: 'Express',
    description: 'Arrives tomorrow.',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'What the option is; names the radio',
    },
    description: {
      control: 'text',
      description: 'A line or two about the option; describes the radio',
    },
    children: {
      control: 'text',
      description:
        'Anything else in the card, such as a price; phrasing content only, and not read on focus',
    },
    hasIndicator: {
      control: 'boolean',
      description:
        'Shows the radio; without it the edge alone shows the selection, thicker when picked',
    },
    color: {
      control: 'select',
      options: [undefined, ...radioColors],
      description: 'The color of the radio and of a picked edge',
    },
    disabled: {
      control: 'boolean',
      description: 'Dims the card, and the arrow keys skip it',
    },
    name: {
      control: 'text',
      description: 'The form field name the cards of one choice share',
    },
    value: {
      control: 'text',
      description: 'What a form sends when this card is picked',
    },
    textColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Text color helper',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes, on the card',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RadioCard>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Arrives tomorrow.'));
    await expect(
      canvas.getByRole('radio', {
        name: 'Express',
        description: 'Arrives tomorrow.',
      })
    ).toBeChecked();
  },
};

/** Plans in a `Radios` group, which holds the selection. The arrow keys move between them. */
export const InAGroup: Story = {
  render: function InAGroupExample() {
    const [plan, setPlan] = useState('pro');
    return (
      <>
        <Radios label="Plan" name="plan" value={plan} onChange={setPlan}>
          <RadioCard
            value="starter"
            title="Starter"
            description="One site, community support."
          />
          <RadioCard
            value="pro"
            title="Pro"
            description="Ten sites, email support."
          />
          <RadioCard
            value="team"
            title="Team"
            description="Unlimited sites, a support plan."
          />
        </Radios>
        <Paragraph mt="3">Plan: {plan}</Paragraph>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Unlimited sites, a support plan.'));
    await expect(canvas.getByRole('radio', { name: 'Team' })).toBeChecked();
    await expect(canvas.getByText('Plan: team')).toBeInTheDocument();
  },
};

/** Without the radio, the edge shows the selection, and thickens when picked. */
export const WithoutIndicator: Story = {
  render: () => (
    <Radios label="Shipping" name="ship" defaultValue="standard">
      <RadioCard
        value="standard"
        hasIndicator={false}
        title="Standard"
        description="4 to 6 days."
      />
      <RadioCard
        value="express"
        hasIndicator={false}
        title="Express"
        description="Tomorrow."
      />
      <RadioCard
        value="pickup"
        hasIndicator={false}
        title="Pickup"
        description="From the shop."
      />
    </Radios>
  ),
};

/** `color` paints the radio and the picked edge. */
export const Colors: Story = {
  render: () => (
    <>
      {radioColors.map(color => (
        <RadioCard
          key={color}
          name={`color-${color}`}
          color={color}
          defaultChecked
          title={color}
          description="Picked."
        />
      ))}
    </>
  ),
};

/** A disabled card dims, and the arrow keys skip it. */
export const Disabled: Story = {
  render: () => (
    <Radios label="Size" name="size" defaultValue="m">
      <RadioCard value="s" title="Small" description="In stock." />
      <RadioCard value="m" title="Medium" description="In stock." />
      <RadioCard value="l" disabled title="Large" description="Sold out." />
      <RadioCard value="xl" title="Extra large" description="In stock." />
    </Radios>
  ),
};

/** A Bulma `Grid` inside the group lines the cards up in columns. */
export const InAGrid: Story = {
  render: () => (
    <Radios label="Time" name="time" defaultValue="10">
      <Grid minCol={10} flexGrow="1">
        {['9', '10', '11', '12', '13', '14'].map(hour => (
          <RadioCard
            key={hour}
            value={hour}
            hasIndicator={false}
            title={`${hour}:00`}
            description="Open"
          />
        ))}
      </Grid>
    </Radios>
  ),
};
