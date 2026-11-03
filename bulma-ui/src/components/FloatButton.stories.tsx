import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { FloatButton } from './FloatButton';
import { FloatButtons } from './FloatButtons';
import { Badge } from './Badge';
import { ScrollArea } from './ScrollArea';
import { Content } from '../elements/Content';
import { Paragraph } from '../elements/Paragraph';
import { Title } from '../elements/Title';

const NOTE =
  'Search now matches tags as well as titles, and remembers the last filter you used on each page. Exports include the time zone, and a CSV export keeps the column order you set in the table.';

/** Enough of a page to scroll, so the buttons show they stay put. */
function PageContent({ paragraphs = 8 }: { paragraphs?: number }) {
  return (
    <Content p="5">
      <Title size="4">Release notes</Title>
      {Array.from({ length: paragraphs }, (_, i) => (
        <p key={i}>{NOTE}</p>
      ))}
    </Content>
  );
}

const meta: Meta<typeof FloatButton> = {
  title: 'Components/FloatButton',
  component: FloatButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A round icon button that floats in a corner of the screen: the page’s main action, a speed dial that opens a few related actions, or back to top. It’s an `IconButton` with `isRounded` inside an `Affix`, and its required name shows as a tooltip that a screen reader doesn’t read twice. Each story renders in a frame of its own, since a float button is fixed to the viewport of the page it’s on.',
      },
      story: { inline: false, height: '360px' },
    },
  },
  args: {
    'aria-label': 'New message',
    icon: 'pen',
    position: 'bottom-right',
  },
  argTypes: {
    'aria-label': {
      control: 'text',
      description:
        'The button’s name, which a screen reader announces and the tooltip shows. Required, or aria-labelledby in its place',
    },
    icon: {
      control: 'text',
      description: 'The glyph: an Icon name or a node. Decorative',
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
        'dark',
      ],
      description: 'Bulma color. Unset, Bulma’s default button',
    },
    size: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'small (30px), medium (50px) or large (60px). Unset, 40px',
    },
    showLabel: {
      control: 'boolean',
      description:
        'Print the name beside the icon as a pill, in place of the tooltip, for touch screens',
    },
    position: {
      control: 'select',
      options: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      description:
        'The corner it’s fixed to, as Affix’s. Ignored inside FloatButtons or a speed dial',
    },
    portal: {
      control: 'boolean',
      description:
        'Render it at the end of document.body, out of an ancestor’s transform, as Affix’s portal',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show Button’s loading spinner in place of the icon',
    },
    onClick: {
      action: 'clicked',
      description: 'Called when the button is activated',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FloatButton>;

export const Default: Story = {
  args: { color: 'primary' },
  render: function DefaultExample(args) {
    return (
      <>
        <PageContent />
        <FloatButton {...args} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', {
      name: 'New message',
    });
    await expect(button).not.toHaveAttribute('aria-describedby');
    await expect(button.closest('.affix')).not.toBeNull();
  },
};

export const ColorsAndSizes: Story = {
  render: function ColorsAndSizesExample() {
    return (
      <>
        <PageContent />
        <FloatButtons>
          <FloatButton aria-label="Small" icon="pen" size="small" />
          <FloatButton aria-label="Normal" icon="pen" color="info" />
          <FloatButton
            aria-label="Medium"
            icon="pen"
            size="medium"
            color="success"
          />
          <FloatButton
            aria-label="Large"
            icon="pen"
            size="large"
            color="primary"
          />
        </FloatButtons>
      </>
    );
  },
};

export const ShowLabel: Story = {
  render: function ShowLabelExample() {
    return (
      <>
        <PageContent />
        <FloatButton
          aria-label="Compose"
          icon="pen"
          color="primary"
          showLabel
        />
      </>
    );
  },
};

export const Stack: Story = {
  render: function StackExample() {
    return (
      <>
        <PageContent paragraphs={20} />
        <FloatButtons>
          <FloatButton.BackToTop />
          <Badge content={3} overlap="circle" color="danger">
            <FloatButton aria-label="Inbox, 3 unread" icon="inbox" />
          </Badge>
          <FloatButton.SpeedDial
            aria-label="Create"
            icon="plus"
            color="primary"
            direction="left"
          >
            <FloatButton aria-label="Note" icon="note-sticky" />
            <FloatButton aria-label="Task" icon="check" />
          </FloatButton.SpeedDial>
        </FloatButtons>
      </>
    );
  },
};

export const SpeedDial: Story = {
  render: function SpeedDialExample() {
    return (
      <>
        <PageContent />
        <FloatButton.SpeedDial aria-label="Create" icon="plus" color="primary">
          <FloatButton aria-label="Note" icon="note-sticky" />
          <FloatButton aria-label="Task" icon="check" />
          <FloatButton aria-label="Event" icon="calendar" />
        </FloatButton.SpeedDial>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Create' });
    await expect(canvas.queryByRole('menu')).toBeNull();
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('menu', { name: 'Create' })).toBeVisible();
    await expect(canvas.getByRole('menuitem', { name: 'Note' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('menu')).toBeNull();
    await expect(trigger).toHaveFocus();
  },
};

export const SpeedDialDirections: Story = {
  render: function SpeedDialDirectionsExample() {
    const actions = [
      <FloatButton key="note" aria-label="Note" icon="note-sticky" />,
      <FloatButton key="task" aria-label="Task" icon="check" />,
    ];
    return (
      <>
        <PageContent />
        <FloatButton.SpeedDial
          aria-label="Create, opens down"
          icon="arrow-down"
          position="top-left"
          defaultOpen
        >
          {actions}
        </FloatButton.SpeedDial>
        <FloatButton.SpeedDial
          aria-label="Create, opens left"
          icon="arrow-left"
          position="top-right"
          direction="left"
          defaultOpen
        >
          {actions}
        </FloatButton.SpeedDial>
        <FloatButton.SpeedDial
          aria-label="Create, opens right"
          icon="arrow-right"
          position="bottom-left"
          direction="right"
          defaultOpen
        >
          {actions}
        </FloatButton.SpeedDial>
        <FloatButton.SpeedDial
          aria-label="Create, opens up"
          icon="arrow-up"
          defaultOpen
        >
          {actions}
        </FloatButton.SpeedDial>
      </>
    );
  },
};

export const SpeedDialShowLabels: Story = {
  render: function SpeedDialShowLabelsExample() {
    return (
      <>
        <PageContent />
        <FloatButton.SpeedDial
          aria-label="Create"
          icon="plus"
          color="primary"
          showLabels
          defaultOpen
        >
          <FloatButton aria-label="Note" icon="note-sticky" />
          <FloatButton aria-label="Task" icon="check" />
          <FloatButton aria-label="Event" icon="calendar" />
        </FloatButton.SpeedDial>
      </>
    );
  },
};

export const SpeedDialOpenOnHover: Story = {
  render: function SpeedDialOpenOnHoverExample() {
    return (
      <>
        <PageContent />
        <FloatButton.SpeedDial
          aria-label="Share"
          icon="share-nodes"
          openOnHover
        >
          <FloatButton aria-label="Copy link" icon="link" />
          <FloatButton aria-label="Email" icon="envelope" />
        </FloatButton.SpeedDial>
      </>
    );
  },
};

export const SpeedDialControlled: Story = {
  render: function SpeedDialControlledExample() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <PageContent />
        <Paragraph px="5">The dial is {open ? 'open' : 'closed'}.</Paragraph>
        <FloatButton.SpeedDial
          aria-label={open ? 'Close the menu' : 'Create'}
          icon={open ? 'xmark' : 'plus'}
          color="primary"
          open={open}
          onOpenChange={setOpen}
        >
          <FloatButton aria-label="Note" icon="note-sticky" />
          <FloatButton aria-label="Task" icon="check" />
        </FloatButton.SpeedDial>
      </>
    );
  },
};

export const BackToTop: Story = {
  render: function BackToTopExample() {
    return (
      <>
        <main>
          <PageContent paragraphs={24} />
        </main>
        <FloatButton.BackToTop visibilityHeight={200} />
      </>
    );
  },
};

export const BackToTopInAScroller: Story = {
  render: function BackToTopInAScrollerExample() {
    const viewportRef = useRef<HTMLDivElement>(null);
    return (
      <Content p="5">
        <Paragraph>
          The button watches the feed below, scrolls it, and moves focus to it.
        </Paragraph>
        <ScrollArea ref={viewportRef} maxHeight="14rem" aria-label="Feed">
          <Title size="5">Feed</Title>
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i}>{NOTE}</p>
          ))}
        </ScrollArea>
        <FloatButton.BackToTop
          scrollContainer={viewportRef}
          visibilityHeight={100}
        />
      </Content>
    );
  },
};

export const CompoundUsage: Story = {
  render: function CompoundUsageExample() {
    return (
      <>
        <PageContent paragraphs={20} />
        <FloatButtons position="bottom-left">
          <FloatButton.BackToTop />
          <FloatButton.SpeedDial
            aria-label="Create"
            icon="plus"
            color="primary"
            direction="right"
          >
            <FloatButton aria-label="Note" icon="note-sticky" />
            <FloatButton aria-label="Task" icon="check" />
          </FloatButton.SpeedDial>
        </FloatButtons>
      </>
    );
  },
};
