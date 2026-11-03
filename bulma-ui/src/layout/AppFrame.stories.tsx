import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AppFrame, useAppFrame } from './AppFrame';
import { Navbar } from '../components/Navbar';
import { Menu } from '../components/Menu';
import { Footer } from './Footer';
import { Section } from './Section';
import { Block } from '../elements/Block';
import { Button } from '../elements/Button';
import { Content } from '../elements/Content';
import { Icon } from '../elements/Icon';
import { Paragraph } from '../elements/Paragraph';
import { Title } from '../elements/Title';
import { Checkbox } from '../form/Checkbox';
import { LocaleProvider } from '../helpers/LocaleProvider';
import { validColors } from '../helpers/useBulmaClasses';

/** The header: a Navbar with the frame's burger in its brand. */
const header = (brand = 'Acme') => (
  <AppFrame.Header key="header">
    <Navbar aria-label="Site">
      <Navbar.Brand>
        <Navbar.Item href="#">
          <strong>{brand}</strong>
        </Navbar.Item>
        <AppFrame.Burger />
      </Navbar.Brand>
    </Navbar>
  </AppFrame.Header>
);

/** The nav column's Menu. */
const menu = (
  <Menu>
    <Menu.Label>General</Menu.Label>
    <Menu.List>
      <Menu.Item href="#" active>
        Dashboard
      </Menu.Item>
      <Menu.Item href="#">Orders</Menu.Item>
      <Menu.Item href="#">Customers</Menu.Item>
    </Menu.List>
    <Menu.Label>Admin</Menu.Label>
    <Menu.List>
      <Menu.Item href="#">Team</Menu.Item>
      <Menu.Item href="#">Settings</Menu.Item>
    </Menu.List>
  </Menu>
);

/** A page long enough to scroll, so the header and the column stick. */
const page = (title = 'Dashboard') => (
  <Section>
    <Title as="h1">{title}</Title>
    <Content>
      {Array.from({ length: 12 }, (_, i) => (
        <p key={i}>
          The header and the nav column stay in view while the page scrolls.
          Narrow the window below the breakpoint and the nav becomes a drawer
          behind the burger.
        </p>
      ))}
    </Content>
  </Section>
);

const footer = (
  <AppFrame.Footer key="footer">
    <Footer as="div">
      <Paragraph textAlign="centered">Acme, Inc.</Paragraph>
    </Footer>
  </AppFrame.Footer>
);

const meta: Meta<typeof AppFrame> = {
  title: 'Layout/AppFrame',
  component: AppFrame,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    // Each story is a whole page, so the docs page shows each in a frame of
    // its own.
    docs: {
      story: { inline: false, iframeHeight: 480 },
      description: {
        component:
          'The frame an app’s pages sit in: a header across the top, a navigation column down the side, the page, and an aside and a footer, with a skip link first. The header and the column stick while the document scrolls. Below the breakpoint the nav is a modal drawer behind the burger, and from it up the burger collapses the column.',
      },
    },
  },
  args: {
    children: [
      header(),
      <AppFrame.Nav key="nav">{menu}</AppFrame.Nav>,
      <AppFrame.Main key="main">{page()}</AppFrame.Main>,
      footer,
    ],
  },
  argTypes: {
    children: {
      control: false,
      description:
        'The parts, each a direct child: Header, Nav, Main, Aside and Footer, in that order',
    },
    breakpoint: {
      control: 'inline-radio',
      options: ['tablet', 'desktop', 'widescreen'],
      description:
        'The width from which the nav is a column; below it, the nav is a drawer',
    },
    navOpen: {
      control: false,
      description: 'Whether the drawer is open, to hold the state yourself',
    },
    defaultNavOpen: {
      control: 'boolean',
      description: 'Whether the drawer starts open',
    },
    onNavOpenChange: {
      action: 'nav open changed',
      description: 'Called with the drawer state asked for',
    },
    navCollapsed: {
      control: false,
      description:
        'Whether the column is collapsed, to hold the state yourself',
    },
    defaultNavCollapsed: {
      control: 'boolean',
      description: 'Whether the column starts collapsed',
    },
    onNavCollapsedChange: {
      action: 'nav collapsed changed',
      description: 'Called with the column state asked for',
    },
    skipLink: {
      control: 'boolean',
      description: 'Renders the skip link to the main content first',
    },
    labels: {
      control: 'object',
      description:
        'The strings the frame renders: skipLink, nav, closeNav and burger',
    },
    textColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Text color helper',
    },
    bgColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Background color helper',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppFrame>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('banner')).toBeInTheDocument();
    await expect(canvas.getByRole('main')).toBeInTheDocument();
    const skip = canvas.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toHaveAttribute(
      'href',
      `#${canvas.getByRole('main').id}`
    );
    await expect(canvas.getByRole('button', { name: 'menu' })).toHaveAttribute(
      'aria-controls',
      canvasElement.querySelector('.app-frame-nav')?.id
    );
  },
};

export const CompoundUsage: Story = {
  render: function CompoundUsageExample() {
    return (
      <AppFrame>
        <AppFrame.Header>
          <Navbar aria-label="Site">
            <Navbar.Brand>
              <Navbar.Item href="#">
                <strong>Acme</strong>
              </Navbar.Item>
              <AppFrame.Burger />
            </Navbar.Brand>
          </Navbar>
        </AppFrame.Header>
        <AppFrame.Nav>{menu}</AppFrame.Nav>
        <AppFrame.Main>{page()}</AppFrame.Main>
        <AppFrame.Aside aria-label="On this page" p="4">
          <Paragraph textWeight="semibold">On this page</Paragraph>
          <Paragraph>
            An outline, details or filters go beside the page.
          </Paragraph>
        </AppFrame.Aside>
        <AppFrame.Footer>
          <Footer as="div">
            <Paragraph textAlign="centered">Acme, Inc.</Paragraph>
          </Footer>
        </AppFrame.Footer>
      </AppFrame>
    );
  },
};

/** The column collapses from the burger, with the state kept by the story. */
export const CollapsedColumn: Story = {
  render: function CollapsedColumnExample() {
    const [collapsed, setCollapsed] = useState(true);
    return (
      <AppFrame navCollapsed={collapsed} onNavCollapsedChange={setCollapsed}>
        {header()}
        <AppFrame.Nav>{menu}</AppFrame.Nav>
        <AppFrame.Main>
          <Section>
            <Title as="h1">Orders</Title>
            <Paragraph>
              The column is {collapsed ? 'collapsed' : 'expanded'}. Press the
              burger to toggle it.
            </Paragraph>
          </Section>
        </AppFrame.Main>
      </AppFrame>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const burger = canvas.getByRole('button', { name: 'menu' });
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(burger);
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
  },
};

/**
 * The column collapses to a rail of icons. Each label stays its link's name,
 * and shows in a tooltip beside the rail on hover and keyboard focus. The
 * section's button expands the column and opens the section.
 */
export const IconRail: Story = {
  render: function IconRailExample() {
    const [collapsed, setCollapsed] = useState(true);
    return (
      <AppFrame navCollapsed={collapsed} onNavCollapsedChange={setCollapsed}>
        {header()}
        <AppFrame.Nav rail>
          <Menu>
            <Menu.Label>General</Menu.Label>
            <Menu.List>
              <Menu.Item href="#" icon={<Icon name="house" />} active>
                Dashboard
              </Menu.Item>
              <Menu.Item href="#" icon={<Icon name="box" />}>
                Orders
              </Menu.Item>
              <Menu.Item href="#" icon={<Icon name="users" />}>
                Customers
              </Menu.Item>
            </Menu.List>
            <Menu.Section label="Reports" icon={<Icon name="chart-line" />}>
              <Menu.List>
                <Menu.Item href="#">Sales</Menu.Item>
                <Menu.Item href="#">Returns</Menu.Item>
              </Menu.List>
            </Menu.Section>
            <Menu.Label>Admin</Menu.Label>
            <Menu.List>
              <Menu.Item href="#" icon={<Icon name="gear" />}>
                Settings
              </Menu.Item>
            </Menu.List>
          </Menu>
        </AppFrame.Nav>
        <AppFrame.Main>{page('Orders')}</AppFrame.Main>
      </AppFrame>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dashboard = canvas.getByRole('link', { name: 'Dashboard' });
    await expect(dashboard).not.toHaveAttribute('aria-describedby');
    await expect(canvasElement.querySelector('.app-frame-nav')).toHaveClass(
      'is-rail'
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Reports' }));
    await expect(canvasElement.querySelector('.app-frame-nav')).not.toHaveClass(
      'is-rail'
    );
    await expect(
      canvas.getByRole('button', { name: 'Reports' })
    ).toHaveAttribute('aria-expanded', 'true');
  },
};

/** A drawer of filters, which stays open as you pick, from the tablet up. */
export const FiltersAtTablet: Story = {
  render: function FiltersAtTabletExample() {
    return (
      <AppFrame breakpoint="tablet" labels={{ nav: 'Filters' }}>
        {header('Shop')}
        <AppFrame.Nav closeOnNavigate={false} width="14rem">
          <Title as="h2" textSize="6">
            Filters
          </Title>
          <Block display="flex" flexDirection="column" rowGap="1">
            <Checkbox>In stock</Checkbox>
            <Checkbox>On sale</Checkbox>
            <Checkbox>Free shipping</Checkbox>
          </Block>
        </AppFrame.Nav>
        <AppFrame.Main>{page('Products')}</AppFrame.Main>
      </AppFrame>
    );
  },
};

/** A control of your own: it reads and toggles the frame through `useAppFrame()`. */
function SectionsToggle() {
  const frame = useAppFrame();
  const expanded = frame.isDrawer ? frame.navOpen : !frame.navCollapsed;
  return (
    <Button
      size="small"
      aria-controls={frame.navId}
      aria-expanded={expanded}
      onClick={frame.toggleNav}
    >
      {expanded ? 'Hide sections' : 'Show sections'}
    </Button>
  );
}

/** A toggle of your own, from `useAppFrame()`, beside the frame's burger. */
export const CustomToggle: Story = {
  render: function CustomToggleExample() {
    return (
      <AppFrame>
        {header()}
        <AppFrame.Nav>{menu}</AppFrame.Nav>
        <AppFrame.Main>
          <Section>
            <SectionsToggle />
          </Section>
        </AppFrame.Main>
      </AppFrame>
    );
  },
};

/** Right to left, the column sits on the right and the drawer comes from it. */
export const RightToLeft: Story = {
  render: function RightToLeftExample() {
    return (
      <LocaleProvider dir="rtl" locale="ar">
        <AppFrame
          labels={{
            skipLink: 'انتقل إلى المحتوى',
            nav: 'الأقسام',
            closeNav: 'إغلاق التنقل',
            burger: 'القائمة',
          }}
        >
          {header('أكمي')}
          <AppFrame.Nav>
            <Menu>
              <Menu.List>
                <Menu.Item href="#" active>
                  لوحة التحكم
                </Menu.Item>
                <Menu.Item href="#">الطلبات</Menu.Item>
              </Menu.List>
            </Menu>
          </AppFrame.Nav>
          <AppFrame.Main>{page('لوحة التحكم')}</AppFrame.Main>
        </AppFrame>
      </LocaleProvider>
    );
  },
};
