import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { FloatButton } from './FloatButton';
import { FloatButtons } from './FloatButtons';
import { Badge } from './Badge';
import { Content } from '../elements/Content';
import { Title } from '../elements/Title';

const NOTE =
  'Search now matches tags as well as titles, and remembers the last filter you used on each page. Exports include the time zone, and a CSV export keeps the column order you set in the table.';

/** Enough of a page to scroll, so the stack shows it stays put. */
function PageContent() {
  return (
    <Content p="5">
      <Title size="4">Release notes</Title>
      {Array.from({ length: 20 }, (_, i) => (
        <p key={i}>{NOTE}</p>
      ))}
    </Content>
  );
}

const meta: Meta<typeof FloatButtons> = {
  title: 'Components/FloatButtons',
  component: FloatButtons,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Several float buttons stacked in one corner, so none covers another: a column on the corner’s side, top to bottom in the order they’re written. The buttons inside take no corner of their own, and their tooltips open away from that side.',
      },
      story: { inline: false, height: '360px' },
    },
  },
  args: {
    position: 'bottom-right',
    portal: false,
  },
  argTypes: {
    children: {
      control: false,
      description:
        'FloatButtons, a FloatButton.SpeedDial, a FloatButton.BackToTop, or any of them in a Badge, top to bottom',
    },
    position: {
      control: 'select',
      options: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      description: 'The corner, as Affix’s. The buttons line up on its side',
    },
    portal: {
      control: 'boolean',
      description:
        'Render it at the end of document.body, out of an ancestor’s transform, as Affix’s portal',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the div',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FloatButtons>;

export const Default: Story = {
  render: function DefaultExample(args) {
    return (
      <>
        <PageContent />
        <FloatButtons {...args}>
          <FloatButton aria-label="Help" icon="question" />
          <Badge content={3} overlap="circle" color="danger">
            <FloatButton aria-label="Inbox, 3 unread" icon="inbox" />
          </Badge>
          <FloatButton aria-label="New message" icon="pen" color="primary" />
        </FloatButtons>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const help = canvas.getByRole('button', { name: 'Help' });
    const compose = canvas.getByRole('button', { name: 'New message' });
    await expect(help.closest('.affix')).toBe(compose.closest('.affix'));
    await expect(help.getBoundingClientRect().bottom).toBeLessThan(
      compose.getBoundingClientRect().top
    );
  },
};

export const WithBackToTopAndASpeedDial: Story = {
  render: function WithBackToTopAndASpeedDialExample() {
    return (
      <>
        <PageContent />
        <FloatButtons position="bottom-left">
          <FloatButton.BackToTop visibilityHeight={200} />
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

export const LabelsInATopCorner: Story = {
  render: function LabelsInATopCornerExample() {
    return (
      <>
        <PageContent />
        <FloatButtons position="top-right">
          <FloatButton aria-label="Help" icon="question" showLabel />
          <FloatButton
            aria-label="New message"
            icon="pen"
            color="primary"
            showLabel
          />
        </FloatButtons>
      </>
    );
  },
};
