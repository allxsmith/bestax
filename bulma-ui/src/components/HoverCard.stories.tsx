import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { HoverCard } from './HoverCard';
import { Avatar } from './Avatar';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Link } from '../elements/Link';
import { Paragraph } from '../elements/Paragraph';
import { SubTitle } from '../elements/SubTitle';
import { Tag } from '../elements/Tag';
import { Tags } from '../elements/Tags';
import { Title } from '../elements/Title';
import { Media } from '../layout/Media';

const meta: Meta<typeof HoverCard> = {
  title: 'Components/HoverCard',
  component: HoverCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A card that previews what is behind a link or a button while the pointer rests on it or keyboard focus is on it. The pointer can move onto the card, Escape closes it from anywhere, and touch never opens it.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    trigger: {
      control: false,
      description:
        'The link or button the card previews; it receives aria-expanded and aria-controls',
    },
    children: {
      control: false,
      description:
        'The card content: a preview, with links and buttons at most',
    },
    open: {
      control: 'boolean',
      description: 'Controlled open state',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Initial open state when uncontrolled',
    },
    onOpenChange: {
      control: false,
      description:
        'Called with the state asked for, when a delay runs out and right away on Escape',
    },
    openDelay: {
      control: 'number',
      description:
        'Milliseconds of hover or keyboard focus before the card opens',
    },
    closeDelay: {
      control: 'number',
      description:
        'Milliseconds the card stays after the pointer and focus leave, the time to cross the gap onto it',
    },
    position: {
      control: 'select',
      options: ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'auto'],
      description:
        'Where the card opens against the trigger; auto keeps it in the viewport',
    },
    appendToBody: {
      control: 'boolean',
      description:
        'Render the card at the end of document.body, fixed to the viewport',
    },
    contentClassName: {
      control: 'text',
      description: 'Additional classes for the card',
    },
  },
  args: {
    openDelay: 600,
    closeDelay: 300,
    position: 'bottom-left',
    appendToBody: false,
  },
};

export default meta;
type Story = StoryObj<typeof HoverCard>;

/** The preview a username link opens: who they are, and where to read more. */
const ProfilePreview = () => (
  <Media>
    <Media.Left>
      <Avatar name="Ada Lovelace" size="48x48" />
    </Media.Left>
    <Media.Content>
      <Title as="p" size="6">
        Ada Lovelace
      </Title>
      <SubTitle as="p" size="6">
        Analytical Engine team
      </SubTitle>
      <Link href="#profile">View profile</Link>
    </Media.Content>
  </Media>
);

/**
 * A profile preview on a username. Hover the link, or Tab to it, and wait for
 * the open delay; move onto the card to use its link. Use the controls to try
 * the delays and the placement.
 */
export const Default: Story = {
  render: args => (
    <HoverCard {...args} trigger={<Link href="#ada">Ada Lovelace</Link>}>
      <ProfilePreview />
    </HoverCard>
  ),
};

/**
 * A card open from the start, to see how it looks in each theme. It closes
 * once the pointer or focus has been and gone, or on Escape.
 */
export const Open: Story = {
  render: () => (
    <Box pb="6" mb="6">
      <HoverCard defaultOpen trigger={<Link href="#ada">Ada Lovelace</Link>}>
        <ProfilePreview />
      </HoverCard>
    </Box>
  ),
};

/**
 * A trigger in a sentence. The card's content is block-level and can't sit
 * inside a `<p>`, so a trigger in running text takes `appendToBody`.
 */
export const InRunningText: Story = {
  render: () => (
    <Paragraph>
      Reviewed by{' '}
      <HoverCard appendToBody trigger={<Link href="#ada">Ada Lovelace</Link>}>
        <ProfilePreview />
      </HoverCard>{' '}
      and merged the same day.
    </Paragraph>
  ),
};

/**
 * A button trigger previewing a repository. The button keeps its own click;
 * the card only shows what's behind it.
 */
export const ButtonTrigger: Story = {
  render: () => (
    <HoverCard
      position="auto"
      trigger={<Button color="primary">allxsmith/bestax</Button>}
    >
      <Title as="p" size="6">
        allxsmith/bestax
      </Title>
      <Paragraph mb="3">
        React components for Bulma v1, in TypeScript.
      </Paragraph>
      <Tags>
        <Tag>react</Tag>
        <Tag>bulma</Tag>
        <Tag>typescript</Tag>
      </Tags>
    </HoverCard>
  ),
};

/**
 * The four corners. Each card opens below or above its trigger, lined up
 * with its left or right edge.
 */
export const Positions: Story = {
  render: () => (
    <Box pt="6" pb="6" display="flex" justifyContent="space-around">
      {(['bottom-left', 'bottom-right', 'top-left', 'top-right'] as const).map(
        position => (
          <HoverCard
            key={position}
            position={position}
            trigger={<Button>{position}</Button>}
          >
            <Paragraph>Opens {position}.</Paragraph>
          </HoverCard>
        )
      )}
    </Box>
  ),
};

/**
 * Controlled: the page holds the open state, and `onOpenChange` reports every
 * request to change it. The Follow button inside closes the card itself.
 */
export const Controlled: Story = {
  render: function ControlledHoverCard() {
    const [open, setOpen] = useState(false);
    const [following, setFollowing] = useState(false);
    return (
      <>
        <Paragraph mb="3">
          The card is {open ? 'open' : 'closed'}
          {following ? ', and you follow Ada' : ''}.
        </Paragraph>
        <HoverCard
          open={open}
          onOpenChange={setOpen}
          trigger={<Link href="#ada">Ada Lovelace</Link>}
        >
          <ProfilePreview />
          <Button
            size="small"
            color="primary"
            mt="3"
            onClick={() => {
              setFollowing(true);
              setOpen(false);
            }}
          >
            Follow
          </Button>
        </HoverCard>
      </>
    );
  },
};
