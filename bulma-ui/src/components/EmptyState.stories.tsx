import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { EmptyState } from './EmptyState';
import { Card } from './Card';
import { Panel } from './Panel';
import { Block } from '../elements/Block';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Icon } from '../elements/Icon';
import { Paragraph } from '../elements/Paragraph';
import { Table } from '../elements/Table';
import { Tbody } from '../elements/Tbody';
import { Td } from '../elements/Td';
import { Th } from '../elements/Th';
import { Thead } from '../elements/Thead';
import { Title } from '../elements/Title';
import { Tr } from '../elements/Tr';
import { UnorderedList } from '../elements/UnorderedList';
import { ListItem } from '../elements/ListItem';
import { Column } from '../columns/Column';
import { Columns } from '../columns/Columns';
import { Control } from '../form/Control';
import { Field } from '../form/Field';
import { Input } from '../form/Input';
import { Hero } from '../layout/Hero';
import { validColors } from '../helpers/useBulmaClasses';

const COLORS = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The block an app shows where content would be: an empty list, a search with no results, or a first-run screen. A picture in a circle, a heading, a line of text and the actions, in one column, written with the `icon`, `title` and `description` props or with the parts. The children always render as written, after the parts the props render.',
      },
    },
  },
  args: {
    icon: 'folder-open',
    title: 'No projects yet',
    description: 'Projects you create or join show up here.',
    children: <Button color="primary">New project</Button>,
  },
  argTypes: {
    icon: {
      control: 'text',
      description:
        'The picture in the circle: a string is an Icon name, anything else renders as given; hidden from assistive tech',
    },
    title: {
      control: 'text',
      description: 'The heading, rendered as EmptyState.Title',
    },
    titleAs: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      description:
        'The heading level for title, h2 by default; the size never changes it',
    },
    description: {
      control: 'text',
      description: 'A sentence or two under the title',
    },
    children: {
      control: false,
      description:
        'Rendered as written, after the parts the props render; group two or more buttons in EmptyState.Actions',
    },
    color: {
      control: 'select',
      options: [undefined, ...COLORS],
      description:
        'The indicator’s color, which colors the circle and its icon, not the text; neutral without it',
    },
    variant: {
      control: 'inline-radio',
      options: ['light', 'filled'],
      description:
        'light is a soft tint behind the icon in the color; filled is the color itself, with the icon in its invert',
    },
    size: {
      control: 'inline-radio',
      options: ['small', 'normal', 'medium', 'large'],
      description:
        'Sizes the indicator, the title, the description and the spacing together',
    },
    align: {
      control: 'inline-radio',
      options: ['center', 'left'],
      description:
        'center stacks everything in a centered column; left puts the indicator at the start of the line, beside the text',
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
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    children: (
      <EmptyState.Actions>
        <Button color="primary">New project</Button>
        <Button>Import</Button>
      </EmptyState.Actions>
    ),
  },
};

export const Parts: Story = {
  render: function PartsExample() {
    return (
      <EmptyState color="info">
        <EmptyState.Indicator>
          <Icon name="file" variant="regular" />
        </EmptyState.Indicator>
        <EmptyState.Title as="h3">Nothing uploaded yet</EmptyState.Title>
        <EmptyState.Description>
          Drop files here, or pick them from your computer.
        </EmptyState.Description>
        <EmptyState.Actions size="small">
          <Button color="info">Upload files</Button>
        </EmptyState.Actions>
      </EmptyState>
    );
  },
};

export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <>
        {(['small', 'normal', 'medium', 'large'] as const).map(size => (
          <Box key={size}>
            <EmptyState
              size={size}
              icon="inbox"
              title={`No messages (${size})`}
              description="Messages people send you show up here."
            >
              <Button color="primary">Write a message</Button>
            </EmptyState>
          </Box>
        ))}
      </>
    );
  },
};

export const Colors: Story = {
  render: function ColorsExample() {
    return (
      <Columns isMultiline>
        <Column size="one-third">
          <Box>
            <EmptyState size="small" icon="inbox" title="Neutral" />
          </Box>
        </Column>
        <Column size="one-third">
          <Box>
            <EmptyState
              size="small"
              variant="filled"
              icon="inbox"
              title="Neutral, filled"
            />
          </Box>
        </Column>
        <Column size="one-third" />
        {COLORS.map(color => (
          <Column key={color} size="one-third">
            <Box>
              <Columns isMobile>
                <Column>
                  <EmptyState
                    size="small"
                    color={color}
                    icon="check"
                    title={color}
                  />
                </Column>
                <Column>
                  <EmptyState
                    size="small"
                    color={color}
                    variant="filled"
                    icon="check"
                    title={`${color}, filled`}
                  />
                </Column>
              </Columns>
            </Box>
          </Column>
        ))}
      </Columns>
    );
  },
};

export const AlignLeft: Story = {
  render: function AlignLeftExample() {
    return (
      <>
        <Box>
          <EmptyState
            align="left"
            icon="folder-open"
            title="No projects yet"
            description="Projects you create or join show up here."
          >
            <Button color="primary">New project</Button>
          </EmptyState>
        </Box>
        <Box>
          <EmptyState
            align="left"
            color="primary"
            icon="folder-open"
            title="No projects yet"
            description="Projects you create or join show up here."
          >
            <EmptyState.Actions>
              <Button color="primary">New project</Button>
              <Button>Import</Button>
            </EmptyState.Actions>
          </EmptyState>
        </Box>
        <Box dir="rtl">
          <EmptyState
            align="left"
            color="info"
            icon="inbox"
            title="אין הודעות"
            description="הודעות שיישלחו אליך יופיעו כאן."
          >
            <Button color="info">כתיבת הודעה</Button>
          </EmptyState>
        </Box>
        <Columns>
          <Column>
            <Card header="Without a picture">
              <EmptyState
                align="left"
                size="small"
                title="No comments yet"
                titleAs="h3"
                description="With no indicator, left keeps no room for one."
              />
            </Card>
          </Column>
          <Column>
            <Card header="No block padding">
              {/* `py` replaces the padding, and the height kept for the
                  circle follows it. */}
              <EmptyState
                align="left"
                size="small"
                py="0"
                color="success"
                icon="check"
                title="All paid up"
                titleAs="h3"
              />
            </Card>
          </Column>
        </Columns>
      </>
    );
  },
};

export const LoneButtonAndRow: Story = {
  render: function LoneButtonAndRowExample() {
    return (
      <Columns>
        <Column>
          <Box>
            <EmptyState icon="inbox" title="One button">
              <Button color="primary">Centered at its own width</Button>
            </EmptyState>
          </Box>
        </Column>
        <Column>
          <Box>
            <EmptyState icon="inbox" title="A row that wraps">
              <EmptyState.Actions>
                <Button color="primary">New project</Button>
                <Button>Import</Button>
                <Button>Browse templates</Button>
                <Button>Invite a teammate</Button>
              </EmptyState.Actions>
            </EmptyState>
          </Box>
        </Column>
      </Columns>
    );
  },
};

export const PartsLeftOut: Story = {
  render: function PartsLeftOutExample() {
    return (
      <Columns>
        <Column>
          <Box>
            <EmptyState title="A title alone" />
          </Box>
        </Column>
        <Column>
          <Box>
            <EmptyState title="A title and a button">
              <Button>Refresh</Button>
            </EmptyState>
          </Box>
        </Column>
        <Column>
          <Box>
            <EmptyState
              icon="inbox"
              description="An icon and a line of text."
            />
          </Box>
        </Column>
      </Columns>
    );
  },
};

export const InContainers: Story = {
  render: function InContainersExample() {
    return (
      <>
        <Columns>
          <Column>
            <Box>
              <EmptyState
                size="small"
                icon="folder-open"
                title="No projects yet"
                titleAs="h3"
                description="Projects you create show up here."
              >
                <Button color="primary" size="small">
                  New project
                </Button>
              </EmptyState>
            </Box>
          </Column>
          <Column>
            <Card header="Invoices">
              <EmptyState
                size="small"
                align="left"
                color="success"
                variant="filled"
                icon="check"
                title="All paid up"
                titleAs="h3"
                description="New invoices show up here when they arrive."
              />
            </Card>
          </Column>
          <Column>
            <Panel>
              <Panel.Heading>Repositories</Panel.Heading>
              <Panel.Block>
                <EmptyState
                  flexGrow="1"
                  size="small"
                  icon="code-branch"
                  title="No repositories"
                  titleAs="h3"
                  description="Repositories you star show up here."
                />
              </Panel.Block>
            </Panel>
          </Column>
        </Columns>
        <Table isFullwidth>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Owner</Th>
              <Th>Updated</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td colSpan={3}>
                <EmptyState
                  size="small"
                  icon="table"
                  title="No rows to show"
                  titleAs="h3"
                  description="Rows you add show up here."
                />
              </Td>
            </Tr>
          </Tbody>
        </Table>
        <Hero color="primary">
          <Hero.Body>
            <EmptyState
              size="large"
              icon="rocket"
              title="Welcome to your workspace"
              titleAs="h1"
              description="Make a project to get started. You can invite people once it's set up."
            >
              <Button color="primary" isInverted>
                Make a project
              </Button>
            </EmptyState>
          </Hero.Body>
        </Hero>
      </>
    );
  },
};

export const IconLibraries: Story = {
  render: function IconLibrariesExample() {
    const pictures = [
      ['Font Awesome', <Icon key="fa" name="inbox" library="fa" />],
      ['Material Design Icons', <Icon key="mdi" name="inbox" library="mdi" />],
      ['Ionicons', <Icon key="ion" name="file-tray" library="ion" />],
      [
        'Material Icons',
        <Icon key="mi" name="inbox" library="material-icons" />,
      ],
      [
        'Material Symbols',
        <Icon key="ms" name="inbox" library="material-symbols" />,
      ],
      [
        'A bare SVG',
        <svg
          key="svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 12h-6l-2 3h-4l-2-3H2" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>,
      ],
    ] as const;
    return (
      <>
        {(['small', 'large'] as const).map(size => (
          <Columns key={size} isMultiline>
            {pictures.map(([name, picture]) => (
              <Column key={name} size="one-third">
                <Box>
                  <EmptyState
                    size={size}
                    color="link"
                    icon={picture}
                    title={name}
                    titleAs="h3"
                  />
                </Box>
              </Column>
            ))}
          </Columns>
        ))}
      </>
    );
  },
};

export const SearchWithNoResults: Story = {
  render: function SearchWithNoResultsExample() {
    const projects = ['Apollo', 'Gemini', 'Mercury'];
    const [query, setQuery] = useState('kraken');
    const searchRef = useRef<HTMLInputElement>(null);
    const term = query.trim().toLowerCase();
    const shown = projects.filter(name => name.toLowerCase().includes(term));

    function clear() {
      setQuery('');
      // The button goes away with the empty state, so focus goes back to
      // the field.
      searchRef.current?.focus();
    }

    return (
      <Box>
        {/* The level from `as` and the size from `textSize`. On Title, `size`
            would pick the level too, and make this an h5. */}
        <Title as="h2" textSize="5">
          Projects
        </Title>
        <Field label="Search projects">
          <Control>
            <Input
              ref={searchRef}
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </Control>
        </Field>
        {/* Always in the page, so a change to its text is announced. */}
        <Paragraph role="status" aria-atomic="true" visibility="sr-only">
          {shown.length === 0
            ? 'No projects match the search'
            : `${shown.length} of ${projects.length} projects`}
        </Paragraph>
        {shown.length === 0 ? (
          <EmptyState
            icon="search"
            title={`No projects match “${query}”`}
            titleAs="h3"
            description="Check the spelling, or clear the search."
          >
            <Button onClick={clear}>Clear search</Button>
          </EmptyState>
        ) : (
          <UnorderedList>
            {shown.map(name => (
              <ListItem key={name}>{name}</ListItem>
            ))}
          </UnorderedList>
        )}
      </Box>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The section's heading is an h2, and the empty state's sits under it.
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'Projects' })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('heading', { level: 3, name: /No projects match/ })
    ).toBeInTheDocument();
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'No projects match the search'
    );

    // The button goes away with the empty state, so focus goes back to the
    // field, and the status region, in the page all along, says the count.
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
    await expect(canvas.getByRole('searchbox')).toHaveFocus();
    await expect(canvas.getByRole('status')).toHaveTextContent(
      '3 of 3 projects'
    );

    // Search for nothing again, so the story ends where it started.
    await userEvent.type(canvas.getByRole('searchbox'), 'kraken');
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'No projects match the search'
    );
    await expect(
      canvas.getByRole('heading', { level: 3, name: /No projects match/ })
    ).toBeInTheDocument();
  },
};

export const CompoundUsage: Story = {
  render: function CompoundUsageExample() {
    return (
      <Block>
        <Box>
          <EmptyState align="left" color="warning">
            <EmptyState.Indicator>
              <Icon name="star" variant="regular" />
            </EmptyState.Indicator>
            <EmptyState.Title as="h3">No favorites yet</EmptyState.Title>
            <EmptyState.Description>
              Star a project to keep it here. A few to start with:
            </EmptyState.Description>
            <UnorderedList>
              <ListItem>
                <a href="#apollo">Apollo</a>
              </ListItem>
              <ListItem>
                <a href="#gemini">Gemini</a>
              </ListItem>
            </UnorderedList>
            <EmptyState.Actions size="small">
              <Button color="warning">Browse projects</Button>
              <Button>Not now</Button>
            </EmptyState.Actions>
          </EmptyState>
        </Box>
      </Block>
    );
  },
};
