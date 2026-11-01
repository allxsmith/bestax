import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton';
import { Button } from './Button';
import { Buttons } from './Buttons';
import { Icon } from './Icon';
import { Badge } from '../components/Badge';
import { Tooltip } from '../components/Tooltip';
import { Field } from '../form/Field';
import { Control } from '../form/Control';
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

/** An inline SVG glyph that draws in the button's text color. */
function ShareGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
      <path d="M18 16a3 3 0 0 0-2.4 1.2L8.9 13.7a3 3 0 0 0 0-3.4l6.7-3.5A3 3 0 1 0 15 5l-6.7 3.5a3 3 0 1 0 0 7L15 19a3 3 0 1 0 3-3Z" />
    </svg>
  );
}

const meta: Meta<typeof IconButton> = {
  title: 'Elements/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A button that shows only an icon, such as Delete in a table row or Settings in a navbar. It renders through Button, so it takes every Button prop, and its types require a name: aria-label, or aria-labelledby in its place. Bulma keeps it square at every size, and isRounded makes it a circle. It has no tooltip of its own; wrap it in Tooltip for a description.',
      },
    },
  },
  argTypes: {
    icon: {
      control: 'text',
      description:
        'The glyph: an Icon name from the library ConfigProvider sets, an <Icon>, or any other node, which goes inside an Icon',
    },
    children: {
      control: false,
      description:
        'The glyph as children, taken the same way as icon; left out, with a warning in development, when icon is given',
    },
    'aria-label': {
      control: 'text',
      description:
        'The name a screen reader announces. Required, or aria-labelledby in its place; name the action, not the picture',
    },
    color: {
      control: 'select',
      options: COLORS,
      description: 'Bulma color, as on Button',
    },
    size: {
      control: 'select',
      options: SIZES,
      description:
        'Size of the button: 30, 40, 50 and 60 pixels square with Bulma’s defaults',
    },
    isRounded: {
      control: 'boolean',
      description: 'Makes it a circle the size of its square',
    },
    isLight: {
      control: 'boolean',
      description: 'The light fill of its color, as on Button',
    },
    isOutlined: {
      control: 'boolean',
      description: 'The outlined fill of its color, as on Button',
    },
    isLoading: {
      control: 'boolean',
      description:
        'Shows Bulma’s spinner with the icon hidden behind it; the button keeps focus',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Disables the button, as on Button',
    },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description:
        'button unless you pass submit or reset, so it never submits a form by accident',
    },
    onClick: {
      control: false,
      description: 'Called when it is pressed',
    },
  },
  args: {
    icon: 'trash',
    'aria-label': 'Delete',
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

/** One icon, named for what it does. */
export const Default: Story = {};

/** Each of Button's colors. */
export const Colors: Story = {
  render: function ColorsExample() {
    return (
      <Buttons>
        {COLORS.map(color => (
          <IconButton
            key={color}
            color={color}
            icon="star"
            aria-label={`Star, ${color}`}
          />
        ))}
      </Buttons>
    );
  },
};

/** Square at each size, and a circle of the same size with isRounded. */
export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <>
        <Buttons>
          {SIZES.map(size => (
            <IconButton
              key={size}
              size={size}
              icon="pen"
              aria-label={`Edit, ${size}`}
            />
          ))}
        </Buttons>
        <Buttons>
          {SIZES.map(size => (
            <IconButton
              key={size}
              size={size}
              isRounded
              color="primary"
              icon="pen"
              aria-label={`Edit, ${size}, rounded`}
            />
          ))}
        </Buttons>
      </>
    );
  },
};

/**
 * A rounded IconButton is a circle. A rounded Button around the same icon is
 * Bulma's pill, a little wider than it is tall.
 */
export const RoundedIsACircle: Story = {
  render: function RoundedExample() {
    return (
      <Buttons>
        <IconButton isRounded icon="plus" aria-label="Add" />
        <Button isRounded aria-label="Add, as a Button">
          <Icon name="plus" />
        </Button>
      </Buttons>
    );
  },
};

/**
 * The ways to give the glyph: as `icon`, a name, an `<Icon>` with its own
 * variant, or an inline SVG, which goes inside an Icon; and the same `<Icon>`
 * and SVG as children. Each is one square `.icon`.
 */
export const IconForms: Story = {
  render: function IconFormsExample() {
    return (
      <>
        <Buttons>
          <IconButton icon="heart" aria-label="Favorite" />
          <IconButton
            icon={<Icon name="heart" variant="regular" />}
            aria-label="Favorite, outlined"
          />
          <IconButton icon={<ShareGlyph />} aria-label="Share" />
        </Buttons>
        <Buttons>
          <IconButton aria-label="Settings">
            <Icon name="cog" />
          </IconButton>
          <IconButton isRounded aria-label="Share, rounded">
            <ShareGlyph />
          </IconButton>
        </Buttons>
      </>
    );
  },
};

/**
 * The light and outlined fills, and the colorless `text` and `ghost` looks,
 * which draw no underline under the glyph.
 */
export const Fills: Story = {
  render: function FillsExample() {
    return (
      <Buttons>
        <IconButton color="danger" isLight icon="trash" aria-label="Delete" />
        <IconButton
          color="link"
          isOutlined
          icon="download"
          aria-label="Download"
        />
        <IconButton color="text" icon="ellipsis" aria-label="More actions" />
        <IconButton color="ghost" icon="xmark" aria-label="Close" />
      </Buttons>
    );
  },
};

/** A count or a dot from a Badge, with what it says in the button's name. */
export const WithABadge: Story = {
  render: function WithABadgeExample() {
    return (
      <Buttons p="2">
        <Badge content={3} overlap="circle">
          <IconButton
            isRounded
            icon="bell"
            aria-label="Notifications, 3 unread"
          />
        </Badge>
        <Badge content={12} overlap="square">
          <IconButton icon="envelope" aria-label="Inbox, 12 unread" />
        </Badge>
        <Badge dot color="success" overlap="circle">
          <IconButton isRounded icon="comment" aria-label="Messages, new" />
        </Badge>
      </Buttons>
    );
  },
};

/** A tooltip describes each button; the name stays on the button. */
export const WithTooltips: Story = {
  render: function WithTooltipsExample() {
    return (
      <Buttons p="6">
        <Tooltip label="Moves it to the trash" position="bottom">
          <IconButton icon="trash" aria-label="Delete" />
        </Tooltip>
        <Tooltip label="Opens it for editing" position="bottom">
          <IconButton icon="pen" aria-label="Edit" />
        </Tooltip>
        <Tooltip label="Saves a copy as a PDF" position="bottom">
          <IconButton icon="download" aria-label="Download" />
        </Tooltip>
      </Buttons>
    );
  },
};

/** A joined row of actions, square and rounded: rounded, the row's ends are round. */
export const JoinedRow: Story = {
  render: function JoinedRowExample() {
    return (
      <>
        <Buttons hasAddons role="group" aria-label="Zoom">
          <IconButton icon="minus" aria-label="Zoom out" />
          <IconButton icon="expand" aria-label="Fit to window" />
          <IconButton icon="plus" aria-label="Zoom in" />
        </Buttons>
        <Buttons hasAddons role="group" aria-label="Zoom, rounded">
          <IconButton isRounded icon="minus" aria-label="Zoom out" />
          <IconButton isRounded icon="expand" aria-label="Fit to window" />
          <IconButton isRounded icon="plus" aria-label="Zoom in" />
        </Buttons>
      </>
    );
  },
};

/** Beside an input in an addon field, at the input's height. */
export const InAnAddonField: Story = {
  render: function InAnAddonFieldExample() {
    return (
      <Field hasAddons>
        <Control isExpanded>
          <Input type="search" aria-label="Search the docs" />
        </Control>
        <Control>
          <IconButton
            color="primary"
            icon="magnifying-glass"
            aria-label="Search"
            type="submit"
          />
        </Control>
      </Field>
    );
  },
};

/** Loading keeps its size and its focus, square and round. */
export const Loading: Story = {
  render: function LoadingExample() {
    return (
      <Buttons>
        <IconButton isLoading icon="floppy-disk" aria-label="Save" />
        <IconButton
          isLoading
          isRounded
          color="primary"
          icon="floppy-disk"
          aria-label="Save, rounded"
        />
      </Buttons>
    );
  },
};

/** Disabled, as on Button. */
export const Disabled: Story = {
  args: { isDisabled: true },
};

/** As a link, with `as="a"`: the anchor's attributes follow. */
export const AsALink: Story = {
  render: function AsALinkExample() {
    return (
      <IconButton
        as="a"
        href="https://bulma.io/documentation/elements/button/"
        target="_blank"
        rel="noreferrer"
        icon="arrow-up-right-from-square"
        aria-label="Bulma's button docs, in a new tab"
      />
    );
  },
};
