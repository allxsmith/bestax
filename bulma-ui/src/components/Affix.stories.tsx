import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Affix } from './Affix';
import { Modal } from './Modal';
import { ScrollArea } from './ScrollArea';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Content } from '../elements/Content';
import { Icon } from '../elements/Icon';
import { Paragraph } from '../elements/Paragraph';
import { Title } from '../elements/Title';

const NOTE =
  'Search now matches tags as well as titles, and remembers the last filter you used on each page. Exports include the time zone, and a CSV export keeps the column order you set in the table.';

/** Enough of a page to scroll, so the Affix shows it stays put. */
function PageContent({
  title = 'Release notes',
  note = NOTE,
}: {
  title?: string;
  note?: string;
}) {
  return (
    <Content p="5">
      <Title size="4">{title}</Title>
      {Array.from({ length: 8 }, (_, i) => (
        <p key={i}>{note}</p>
      ))}
    </Content>
  );
}

const meta: Meta<typeof Affix> = {
  title: 'Components/Affix',
  component: Affix,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Content fixed to a corner of the viewport while the page scrolls under it: a floating button, a chat launcher, a feedback tab or a consent notice. It sits `--bulma-affix-offset-vertical` and `--bulma-affix-offset-horizontal` from the edges plus the safe-area inset, and stacks over the page’s content and under its navbar, static or fixed, its menus, popovers, the Sidebar, the modals, Tooltip and Toast. It doesn’t scroll, so content that can be taller than the screen scrolls itself. Each story here renders in a frame of its own, since an Affix is fixed to the viewport of the page it’s on.',
      },
      // An Affix is fixed to the viewport, so on the docs page each story
      // gets its own frame, or every one would land in the same corner.
      story: { inline: false, height: '320px' },
    },
  },
  args: {
    position: 'bottom-right',
    portal: false,
  },
  argTypes: {
    children: {
      control: false,
      description: 'What stays in the corner',
    },
    position: {
      control: 'select',
      options: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      description:
        'The corner of the viewport it’s fixed to. Physical: a right corner stays on the right in right-to-left text',
    },
    portal: {
      control: 'boolean',
      description:
        'Render it at the end of document.body (or a selector or element you pass), out of an ancestor’s transform, filter or contain',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the div',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Affix>;

export const Default: Story = {
  render: function DefaultExample(args) {
    return (
      <>
        <PageContent />
        <Affix {...args}>
          <Button color="primary">Help</Button>
        </Affix>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Help' });
    const affix = button.parentElement!;
    await expect(getComputedStyle(affix).position).toBe('fixed');
    await expect(affix).not.toHaveAttribute('role');
  },
};

export const Corners: Story = {
  render: function CornersExample() {
    return (
      <>
        <PageContent />
        <Affix position="top-left">
          <Button>Top left</Button>
        </Affix>
        <Affix position="top-right">
          <Button>Top right</Button>
        </Affix>
        <Affix position="bottom-left">
          <Button>Bottom left</Button>
        </Affix>
        <Affix position="bottom-right">
          <Button>Bottom right</Button>
        </Affix>
      </>
    );
  },
};

export const FeedbackTab: Story = {
  render: function FeedbackTabExample() {
    return (
      <>
        <PageContent />
        <Affix position="bottom-left">
          <Button color="primary">Feedback</Button>
        </Affix>
      </>
    );
  },
};

export const ChatLauncher: Story = {
  render: function ChatLauncherExample() {
    return (
      <>
        <PageContent />
        <Affix>
          <Button color="link" radius="rounded" aria-label="Open chat">
            <Icon name="comments" />
          </Button>
        </Affix>
      </>
    );
  },
};

export const Nudged: Story = {
  render: function NudgedExample() {
    return (
      <>
        <PageContent />
        <Affix position="bottom-left">
          <Button>At the offset</Button>
        </Affix>
        <Affix mb="6">
          <Button color="primary">Lifted 3rem</Button>
        </Affix>
      </>
    );
  },
};

export const ConsentNotice: Story = {
  render: function ConsentNoticeExample() {
    const [open, setOpen] = useState(true);
    return (
      <>
        <PageContent />
        {open && (
          <Affix position="bottom-left">
            <Box role="region" aria-label="Cookie consent" mb="0">
              {/* The text scrolls, within the viewport less the Affix's
                  offsets, its insets and room for the padding and buttons,
                  so the buttons stay on screen however short it gets. */}
              <ScrollArea
                maxHeight="calc(100dvh - 2 * var(--bulma-affix-offset-vertical) - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 7rem)"
                aria-label="What we store"
                mb="3"
              >
                <Paragraph>
                  We use one cookie to remember your theme. Nothing else is
                  stored, and nothing is shared.
                </Paragraph>
              </ScrollArea>
              <Buttons>
                <Button color="primary" onClick={() => setOpen(false)}>
                  Accept
                </Button>
                <Button onClick={() => setOpen(false)}>Decline</Button>
              </Buttons>
            </Box>
          </Affix>
        )}
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', {
      name: 'Cookie consent',
    });
    const affix = region.parentElement!;
    // Capped at the viewport less both offsets, so it fits a narrow frame,
    // and the buttons stay on screen however short the frame is.
    await expect(affix.getBoundingClientRect().right).toBeLessThanOrEqual(
      document.documentElement.clientWidth
    );
    const decline = within(region).getByRole('button', { name: 'Decline' });
    await expect(decline.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
    await expect(decline.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      document.documentElement.clientHeight
    );
  },
};

export const UnderAModal: Story = {
  render: function UnderAModalExample() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <PageContent />
        <Box mx="5">
          <Button onClick={() => setOpen(true)}>Open the modal</Button>
        </Box>
        <Affix>
          <Button color="primary">Help</Button>
        </Affix>
        <Modal active={open} onClose={() => setOpen(false)}>
          <Box>
            <Title size="4">Over the Affix</Title>
            <Paragraph>
              The modal and its background stack over the Affix, as a navbar,
              menus, popovers, the Sidebar, Tooltip and Toast do.
            </Paragraph>
          </Box>
        </Modal>
      </>
    );
  },
};

export const Portaled: Story = {
  args: { portal: true },
  render: function PortaledExample(args) {
    return (
      <>
        <PageContent />
        <Affix {...args}>
          <Button color="primary">At the end of the body</Button>
        </Affix>
      </>
    );
  },
};

export const RightToLeft: Story = {
  render: function RightToLeftExample() {
    return (
      <div dir="rtl" lang="ar">
        <PageContent
          title="ملاحظات الإصدار"
          note="يبحث البحث الآن في الوسوم والعناوين معًا، ويتذكر آخر عامل تصفية استخدمته في كل صفحة. وتتضمن ملفات التصدير المنطقة الزمنية."
        />
        <Affix position="bottom-left">
          <Button color="primary">ملاحظات</Button>
        </Affix>
      </div>
    );
  },
};
