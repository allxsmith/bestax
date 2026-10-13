import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ToggleButton, type ToggleButtonColor } from './ToggleButton';
import { Buttons } from './Buttons';
import { Icon } from './Icon';
import { Paragraph } from './Paragraph';

const COLORS: ToggleButtonColor[] = [
  'link',
  'primary',
  'info',
  'success',
  'warning',
  'danger',
];

const meta: Meta<typeof ToggleButton> = {
  title: 'Elements/ToggleButton',
  component: ToggleButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A button that stays pressed until it is pressed again, such as Bold in an editor toolbar or Mute in a player. It reports its state through aria-pressed, fills with its color while pressed and is a plain button while not. It is always type="button", so it never submits a form.',
      },
    },
  },
  argTypes: {
    children: {
      control: 'text',
      description:
        'The label, which stays the same in both states; a screen reader announces whether it is pressed',
    },
    pressed: {
      control: 'boolean',
      description:
        'Whether it is pressed, when you hold the state; a click then only calls onPressedChange',
    },
    defaultPressed: {
      control: 'boolean',
      description: 'Whether it starts pressed, when it holds its own state',
    },
    onPressedChange: {
      control: false,
      description:
        'Called with the new state each time it is toggled, whether or not pressed is set',
    },
    color: {
      control: 'select',
      options: COLORS,
      description:
        'The fill while pressed (default link); not pressed, it is a plain button',
    },
    size: {
      control: 'select',
      options: ['small', 'normal', 'medium', 'large'],
      description: 'Size of the button, in both states',
    },
    isRounded: {
      control: 'boolean',
      description: 'Rounds the button, in both states',
    },
    isFullwidth: {
      control: 'boolean',
      description: 'Makes the button full-width, in both states',
    },
    isLoading: {
      control: 'boolean',
      description:
        'Shows Bulma’s spinner in place of the label and holds the toggle: no clicks, no keys and no onPressedChange until it is cleared',
    },
    isDisabled: {
      control: 'boolean',
      description:
        'Disables the button: no clicks, no keys and no onPressedChange',
    },
    onClick: {
      control: false,
      description:
        'Runs before the toggle, unless the button is loading; calling preventDefault() in it stops the toggle',
    },
  },
  args: {
    children: 'Mute',
    color: 'link',
  },
};

export default meta;
type Story = StoryObj<typeof ToggleButton>;

/** Holding its own state. Click it, or Tab to it and press Enter or Space. */
export const Default: Story = {};

/** Starting pressed, to compare with Default in each theme. */
export const Pressed: Story = {
  args: { defaultPressed: true },
};

/** The state held by the caller, and shown next to the button. */
export const Controlled: Story = {
  render: function ControlledExample(args) {
    const [muted, setMuted] = useState(false);
    return (
      <>
        <ToggleButton {...args} pressed={muted} onPressedChange={setMuted}>
          Mute
        </ToggleButton>
        <Paragraph mt="3">
          The player is {muted ? 'muted' : 'playing'}.
        </Paragraph>
      </>
    );
  },
};

/**
 * Each fill, not pressed and pressed. `white`, `light`, `dark` and `black`
 * aren't offered, since each fills about as light or dark as a plain button
 * already is in one theme or the other.
 */
export const Colors: Story = {
  render: function ColorsExample() {
    return (
      <>
        {COLORS.map(color => (
          <Buttons key={color}>
            <ToggleButton color={color}>{color}</ToggleButton>
            <ToggleButton color={color} defaultPressed>
              {color}
            </ToggleButton>
          </Buttons>
        ))}
      </>
    );
  },
};

/** The sizes and shapes apply in both states. */
export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <>
        {(['small', 'normal', 'medium', 'large'] as const).map(size => (
          <Buttons key={size}>
            <ToggleButton size={size}>Pin</ToggleButton>
            <ToggleButton size={size} defaultPressed>
              Pin
            </ToggleButton>
            <ToggleButton size={size} isRounded defaultPressed>
              Pin
            </ToggleButton>
          </Buttons>
        ))}
      </>
    );
  },
};

/** An icon on its own needs an `aria-label`, which stays the same when it's pressed. */
export const IconOnly: Story = {
  render: function IconOnlyExample() {
    return (
      <Buttons>
        <ToggleButton aria-label="Mute">
          <Icon name="volume-xmark" />
        </ToggleButton>
        <ToggleButton aria-label="Pin" defaultPressed>
          <Icon name="thumbtack" />
        </ToggleButton>
        <ToggleButton aria-label="Favorite" color="danger" defaultPressed>
          <Icon name="heart" />
        </ToggleButton>
      </Buttons>
    );
  },
};

/** Disabled, not pressed and pressed. A pressed one keeps its fill. */
export const Disabled: Story = {
  render: function DisabledExample() {
    return (
      <Buttons>
        <ToggleButton isDisabled>Show archived</ToggleButton>
        <ToggleButton isDisabled defaultPressed>
          Show archived
        </ToggleButton>
      </Buttons>
    );
  },
};

/**
 * Toggles that each turn on and off on their own, joined with
 * `Buttons hasAddons` and named as a group. Bulma's `is-selected` lifts each
 * pressed one above its neighbours, so their borders don't cut into its fill.
 */
export const InAGroup: Story = {
  render: function InAGroupExample() {
    return (
      <Buttons hasAddons role="group" aria-label="Text style">
        <ToggleButton aria-label="Bold" defaultPressed>
          <Icon name="bold" />
        </ToggleButton>
        <ToggleButton aria-label="Italic">
          <Icon name="italic" />
        </ToggleButton>
        <ToggleButton aria-label="Underline" defaultPressed>
          <Icon name="underline" />
        </ToggleButton>
      </Buttons>
    );
  },
};
