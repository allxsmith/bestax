import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { CheckboxCard } from './CheckboxCard';
import { Checkboxes } from './Checkboxes';
import { checkboxColors } from './Checkbox';
import { Grid } from '../grid/Grid';
import { Paragraph } from '../elements/Paragraph';
import { validColors } from '../helpers/useBulmaClasses';

const meta: Meta<typeof CheckboxCard> = {
  title: 'Form/CheckboxCard',
  component: CheckboxCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A checkbox drawn as a card, with a title and a description, that toggles wherever you click it. It is a label around a real checkbox, named by the title and described by the description, and it joins a Checkboxes group as Checkbox does.',
      },
    },
  },
  args: {
    title: 'Daily backups',
    description: 'Kept for 30 days.',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'What the option is; names the checkbox',
    },
    description: {
      control: 'text',
      description: 'A line or two about the option; describes the checkbox',
    },
    children: {
      control: 'text',
      description:
        'Anything else in the card, such as a price; phrasing content only, and not read on focus',
    },
    hasIndicator: {
      control: 'boolean',
      description:
        'Shows the checkbox; without it the edge alone shows the selection, thicker when checked',
    },
    color: {
      control: 'select',
      options: [undefined, ...checkboxColors],
      description: 'The color of the checkbox and of a checked edge',
    },
    disabled: {
      control: 'boolean',
      description: 'Dims the card, and it takes no clicks or focus',
    },
    indeterminate: {
      control: 'boolean',
      description:
        'Shows the mixed state, as in a "Select all" card. `checked` is still the value',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'Starts checked, uncontrolled',
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
type Story = StoryObj<typeof CheckboxCard>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole('checkbox', {
      name: 'Daily backups',
      description: 'Kept for 30 days.',
    });
    await userEvent.click(canvas.getByText('Kept for 30 days.'));
    await expect(box).toBeChecked();
  },
};

/** Add-ons in a `Checkboxes` group, which holds the selection. */
export const InAGroup: Story = {
  render: function InAGroupExample() {
    const [extras, setExtras] = useState(['backups']);
    return (
      <>
        <Checkboxes
          label="Add-ons"
          name="extras"
          value={extras}
          onChange={setExtras}
        >
          <CheckboxCard
            value="backups"
            title="Daily backups"
            description="Kept for 30 days."
          />
          <CheckboxCard
            value="domain"
            title="Custom domain"
            description="Bring your own."
          />
          <CheckboxCard
            value="support"
            title="Priority support"
            description="Answers within the hour."
          />
        </Checkboxes>
        <Paragraph mt="3">Picked: {extras.join(', ') || 'nothing'}</Paragraph>
      </>
    );
  },
};

/** Without the checkbox, the edge shows the selection, and thickens when checked. */
export const WithoutIndicator: Story = {
  render: () => (
    <Checkboxes label="Email me about" name="topics" defaultValue={['news']}>
      <CheckboxCard
        value="news"
        hasIndicator={false}
        title="Newsletter"
        description="Once a month."
      />
      <CheckboxCard
        value="releases"
        hasIndicator={false}
        title="Releases"
        description="When something ships."
      />
      <CheckboxCard
        value="events"
        hasIndicator={false}
        title="Events"
        description="Meetups near you."
      />
    </Checkboxes>
  ),
};

/** A link inside the card works and doesn't toggle it. */
export const WithALink: Story = {
  render: () => (
    <CheckboxCard
      title="I accept the terms"
      description="You can leave anytime."
    >
      {' '}
      <a href="#terms">Read the terms</a>
    </CheckboxCard>
  ),
};

/** `color` paints the checkbox and the checked edge. */
export const Colors: Story = {
  render: () => (
    <Checkboxes name="colors" defaultValue={[...checkboxColors]}>
      {checkboxColors.map(color => (
        <CheckboxCard
          key={color}
          value={color}
          color={color}
          title={color}
          description="Checked."
        />
      ))}
    </Checkboxes>
  ),
};

/** A disabled card dims and takes no clicks; a mixed one shows a dash. */
export const DisabledAndMixed: Story = {
  render: () => (
    <Checkboxes name="states">
      <CheckboxCard
        value="disabled"
        disabled
        title="Disabled"
        description="Not on your plan."
      />
      <CheckboxCard
        value="disabled-checked"
        disabled
        defaultChecked
        title="Disabled and checked"
        description="Included."
      />
      <CheckboxCard
        value="mixed"
        indeterminate
        title="Mixed"
        description="Some of what it covers."
      />
    </Checkboxes>
  ),
};

/** A Bulma `Grid` inside the group lines the cards up in columns. */
export const InAGrid: Story = {
  render: () => (
    <Checkboxes label="Toppings" name="toppings">
      <Grid minCol={12} flexGrow="1">
        {['Cheese', 'Mushrooms', 'Olives', 'Peppers', 'Onions', 'Basil'].map(
          topping => (
            <CheckboxCard
              key={topping}
              value={topping}
              title={topping}
              description="Free"
            />
          )
        )}
      </Grid>
    </Checkboxes>
  ),
};
