import { Fragment, useId, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import {
  TableOfContents,
  useScrollSpy,
  type TableOfContentsItem,
} from './TableOfContents';
import { Menu } from './Menu';
import { Content } from '../elements/Content';
import { Paragraph } from '../elements/Paragraph';
import { Title } from '../elements/Title';
import { Column } from '../columns/Column';
import { validColors } from '../helpers/useBulmaClasses';
import { Columns } from '../columns/Columns';

/**
 * A gardening guide's sections. The docs page renders every story on one
 * document, some of them twice, so each copy's ids start with a prefix of its
 * own from `useId`.
 */
const guide = (prefix: string): TableOfContentsItem[] => [
  { id: `${prefix}-spot`, label: 'Choosing a spot' },
  {
    id: `${prefix}-soil`,
    label: 'Preparing the soil',
    children: [
      { id: `${prefix}-testing`, label: 'Testing it' },
      { id: `${prefix}-compost`, label: 'Adding compost' },
    ],
  },
  { id: `${prefix}-planting`, label: 'Planting' },
  { id: `${prefix}-watering`, label: 'Watering' },
  { id: `${prefix}-harvest`, label: 'Harvest' },
];

const TEXT: Record<string, string[]> = {
  spot: [
    'Most vegetables want six to eight hours of direct sun a day, so watch the yard for a day before you dig and note where the shade from the house and the trees falls in the morning and in the afternoon.',
    'Pick a spot you pass every day. A bed by the back door gets weeded and watered, and one at the far end of the yard gets forgotten by July.',
    'Keep it away from big trees, whose roots take the water and food meant for the vegetables, and out of the low corner where rain collects.',
  ],
  soil: [
    'Good soil crumbles in your hand, holds water without turning to mud, and is full of worms. Few yards start with it, and it takes a season or two to build.',
  ],
  testing: [
    'A home test kit from a garden center tells you the pH and the main nutrients in a few minutes, and a lab test through your local extension office tells you more for a little more.',
    'Most vegetables grow best between 6.0 and 7.0. Lime raises a low pH, and sulfur lowers a high one, a little at a time, testing again each spring.',
  ],
  compost: [
    'Spread two or three inches of compost over the bed in the fall or early spring and work it into the top few inches. It feeds the soil, loosens clay and helps sand hold water.',
    'Leaves, grass clippings and kitchen scraps make compost in a few months in a pile turned now and then. Keep meat, dairy and oils out of it.',
  ],
  planting: [
    'Seed packets give the depth, the spacing and the weeks before or after the last frost to plant. Cool crops like peas and lettuce go in early, and tomatoes, peppers and squash wait for warm soil.',
    'Plant tall crops on the north side of the bed so they don’t shade the short ones, and leave paths, so you never step on the soil you just loosened.',
    'Water seeds and new plants every day or two until they’re growing well.',
  ],
  watering: [
    'An inch of water a week, from rain or from you, is the usual rule. Water deeply and less often, so the roots grow down instead of staying near the surface.',
    'Water in the morning, at the base of the plants. Wet leaves overnight invite disease, and a soaker hose under mulch wastes the least.',
    'Stick a finger in the soil before you water. If it’s damp two inches down, wait a day.',
  ],
  harvest: [
    'Pick often. Beans, zucchini and cucumbers make more the more you take, and a zucchini left a week becomes a club.',
  ],
};

/** The guide itself, with a heading for each section. */
const Guide = ({ prefix }: { prefix: string }) => {
  const section = (id: string, title: string, level: 'h2' | 'h3' = 'h2') => (
    <>
      <Title
        as={level}
        textSize={level === 'h2' ? '4' : '5'}
        id={`${prefix}-${id}`}
      >
        {title}
      </Title>
      {TEXT[id].map((text, i) => (
        <Paragraph key={i}>{text}</Paragraph>
      ))}
    </>
  );
  return (
    <Content>
      {section('spot', 'Choosing a spot')}
      {section('soil', 'Preparing the soil')}
      {section('testing', 'Testing it', 'h3')}
      {section('compost', 'Adding compost', 'h3')}
      {section('planting', 'Planting')}
      {section('watering', 'Watering')}
      {section('harvest', 'Harvest')}
    </Content>
  );
};

const meta: Meta<typeof TableOfContents> = {
  title: 'Components/TableOfContents',
  component: TableOfContents,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A long page’s sections as links in Bulma’s menu look, marking the one being read with `is-active` and `aria-current="location"`. Its links are plain `#id` links, so following one is the browser’s own jump. `useScrollSpy` picks the current section, and marks it anywhere else too. Scroll the page to see it follow.',
      },
    },
  },
  args: {
    isSticky: true,
  },
  argTypes: {
    items: {
      control: false,
      description:
        'The sections, in page order: { id, label, children? }, each a link to #id',
    },
    isSticky: {
      control: 'boolean',
      description:
        'Sticks to the top of the viewport as the page scrolls, and scrolls itself when it’s taller than the viewport',
    },
    offset: {
      control: 'number',
      description:
        'Pixels from the viewport’s top where a section counts as reached; unset, the page’s scroll-padding-top',
    },
    labels: {
      control: 'object',
      description: 'The visible strings: title, "On this page" by default',
    },
    onCurrentChange: {
      control: false,
      description:
        'Called with the current section’s id when it changes, or null above the first section',
    },
    textColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Text color helper, on the nav',
    },
    bgColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Background color helper, on the nav',
    },
  },
};
export default meta;
type Story = StoryObj<typeof TableOfContents>;

/**
 * A guide with its sections in a side column. The list sticks as the page
 * scrolls and marks the section being read.
 */
export const Default: Story = {
  render: function DefaultExample(args) {
    const pageId = useId();
    return (
      <Columns>
        <Column>
          <Guide prefix={pageId} />
        </Column>
        <Column size="one-quarter">
          <TableOfContents {...args} items={guide(pageId)} />
        </Column>
      </Columns>
    );
  },
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation', {
      name: 'On this page',
    });
    // Each link names a heading on the page by its id.
    const headings = within(nav)
      .getAllByRole('link')
      .map(
        link =>
          canvasElement.ownerDocument.getElementById(
            decodeURIComponent(link.getAttribute('href')!.slice(1))
          )?.textContent
      );
    await expect(headings).toEqual([
      'Choosing a spot',
      'Preparing the soil',
      'Testing it',
      'Adding compost',
      'Planting',
      'Watering',
      'Harvest',
    ]);
  },
};

/**
 * A list longer than the viewport. Sticky, it's as tall as the room below
 * its top, and it scrolls itself to keep the current link in view without
 * moving the page.
 */
export const LongList: Story = {
  render: function LongListExample(args) {
    const pageId = useId();
    const chapters = Array.from({ length: 30 }, (_, i) => ({
      id: `${pageId}-${i + 1}`,
      label: `Chapter ${i + 1}`,
    }));
    return (
      <Columns>
        <Column>
          <Content>
            {chapters.map(chapter => (
              <Fragment key={chapter.id}>
                <Title as="h2" textSize="4" id={chapter.id}>
                  {chapter.label}
                </Title>
                {TEXT.spot.map((text, i) => (
                  <Paragraph key={i}>{text}</Paragraph>
                ))}
              </Fragment>
            ))}
          </Content>
        </Column>
        <Column size="one-quarter">
          <TableOfContents {...args} items={chapters} />
        </Column>
      </Columns>
    );
  },
};

/**
 * `labels.title` names the list in your app's language; it's the visible
 * title and the name of the `<nav>`.
 */
export const Labels: Story = {
  args: { labels: { title: 'Sur cette page' } },
  render: function LabelsExample(args) {
    const pageId = useId();
    return (
      <Columns>
        <Column>
          <Guide prefix={pageId} />
        </Column>
        <Column size="one-quarter">
          <TableOfContents {...args} items={guide(pageId)} />
        </Column>
      </Columns>
    );
  },
};

/**
 * `onCurrentChange` reports each new section's id, here to a line above the
 * guide.
 */
export const OnCurrentChange: Story = {
  render: function OnCurrentChangeExample(args) {
    const pageId = useId();
    const [current, setCurrent] = useState<string | null>(null);
    return (
      <Columns>
        <Column>
          <Paragraph textWeight="semibold">
            Reading: {current?.slice(pageId.length + 1) ?? 'nothing yet'}
          </Paragraph>
          <Guide prefix={pageId} />
        </Column>
        <Column size="one-quarter">
          <TableOfContents
            {...args}
            items={guide(pageId)}
            onCurrentChange={setCurrent}
          />
        </Column>
      </Columns>
    );
  },
};

/** A settings page's sections, and what each one holds. */
const SETTINGS = [
  {
    id: 'profile',
    label: 'Profile',
    text: 'Your name, photo and the short bio other people see beside your posts. Changes show everywhere within a minute.',
  },
  {
    id: 'security',
    label: 'Security',
    text: 'Your password, two-step sign-in, and the browsers and phones signed in to your account, any of which you can sign out from here.',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    text: 'What we email you about, and what only shows in the app: mentions, replies, weekly summaries and product news.',
  },
  {
    id: 'billing',
    label: 'Billing',
    text: 'Your plan, the card we charge, and every invoice since you signed up, each one ready to download.',
  },
];

/** A long settings page whose nav is its table of contents. */
function SettingsPage() {
  const pageId = useId();
  const current = useScrollSpy({
    ids: SETTINGS.map(section => `${pageId}-${section.id}`),
  });
  return (
    <Columns>
      <Column size="one-quarter">
        <Menu aria-label="Settings">
          <Menu.Label>Settings</Menu.Label>
          <Menu.List>
            {SETTINGS.map(section => {
              const id = `${pageId}-${section.id}`;
              return (
                <Menu.Item
                  key={id}
                  href={`#${encodeURIComponent(id)}`}
                  active={current === id}
                  aria-current={current === id ? 'location' : undefined}
                >
                  {section.label}
                </Menu.Item>
              );
            })}
          </Menu.List>
        </Menu>
      </Column>
      <Column>
        <Content>
          {SETTINGS.map(section => (
            <Fragment key={section.id}>
              <Title as="h2" textSize="4" id={`${pageId}-${section.id}`}>
                {section.label}
              </Title>
              {[1, 2, 3].map(i => (
                <Paragraph key={i}>{section.text}</Paragraph>
              ))}
            </Fragment>
          ))}
        </Content>
      </Column>
    </Columns>
  );
}

/**
 * The hook on its own, marking the section in view in an app's nav `Menu`,
 * on a long settings page whose nav is its table of contents. The current
 * item gets `aria-current="location"` in place of `MenuItem`'s `page`.
 */
export const WithMenu: Story = {
  render: function WithMenuExample() {
    return <SettingsPage />;
  },
};
