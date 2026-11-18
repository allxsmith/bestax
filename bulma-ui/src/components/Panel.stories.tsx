import { useId } from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import Panel from './Panel';
import { Table } from '../elements/Table';
import { Control } from '../form/Control';
import { Input } from '../form/Input';

const meta: Meta<typeof Panel> = {
  title: 'Components/Panel',
  component: Panel,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Panel>;

// Each panel is named after its heading through aria-labelledby. The docs page
// renders every story on one document, the first one twice, so each heading's
// id comes from useId.

export const RevolutionaryWar: Story = {
  render: function RevolutionaryWarStory() {
    const headingId = useId();
    return (
      <Panel aria-labelledby={headingId}>
        <Panel.Heading id={headingId}>Revolutionary Figures</Panel.Heading>
        <Panel.InputBlock placeholder="Search figures" />
        <Panel.Tabs>
          <a href="#all" className="is-active" aria-current="true">
            All
          </a>
          <a href="#patriots">Patriots</a>
          <a href="#loyalists">Loyalists</a>
          <a href="#battles">Battles</a>
          <a href="#documents">Documents</a>
        </Panel.Tabs>
        <Panel.Block href="#george-washington" active>
          <Panel.Icon name="user" variant="solid" />
          George Washington
        </Panel.Block>
        <Panel.Block href="#alexander-hamilton">
          <Panel.Icon name="user" variant="solid" />
          Alexander Hamilton
        </Panel.Block>
        <Panel.Block href="#benedict-arnold">
          <Panel.Icon name="user" variant="solid" />
          Benedict Arnold
        </Panel.Block>
        <Panel.Block href="#john-adams">
          <Panel.Icon name="user" variant="solid" />
          John Adams
        </Panel.Block>
        <Panel.Block href="#battle-of-saratoga">
          <Panel.Icon name="flag" variant="solid" />
          Battle of Saratoga
        </Panel.Block>
        <Panel.Block href="#treaty-of-paris">
          <Panel.Icon name="flag" variant="solid" />
          Treaty of Paris
        </Panel.Block>
        <Panel.Block href="#bunker-hill">
          <Panel.Icon name="flag" variant="solid" />
          Bunker Hill
        </Panel.Block>
        <Panel.CheckboxBlock>remember me</Panel.CheckboxBlock>
        <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
      </Panel>
    );
  },
};

export const Primary: Story = {
  render: function PrimaryStory() {
    const headingId = useId();
    return (
      <Panel color="primary" aria-labelledby={headingId}>
        <Panel.Heading id={headingId}>Primary Panel</Panel.Heading>
        <Panel.InputBlock placeholder="Search figures" />
        <Panel.Block href="#george-washington" active>
          <Panel.Icon name="user" variant="solid" />
          George Washington
        </Panel.Block>
        <Panel.Block href="#marquis-de-lafayette">
          <Panel.Icon name="user" variant="solid" />
          Marquis de Lafayette
        </Panel.Block>
        <Panel.Block href="#nathanael-greene">
          <Panel.Icon name="user" variant="solid" />
          Nathanael Greene
        </Panel.Block>
        <Panel.Block href="#battle-of-trenton">
          <Panel.Icon name="flag" variant="solid" />
          Battle of Trenton
        </Panel.Block>
        <Panel.Block href="#yorktown">
          <Panel.Icon name="flag" variant="solid" />
          Yorktown
        </Panel.Block>
        <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
      </Panel>
    );
  },
};

export const Link: Story = {
  render: function LinkStory() {
    const headingId = useId();
    return (
      <Panel color="link" aria-labelledby={headingId}>
        <Panel.Heading id={headingId}>Link Panel</Panel.Heading>
        <Panel.InputBlock placeholder="Search figures" />
        <Panel.Block href="#alexander-hamilton" active>
          <Panel.Icon name="user" variant="solid" />
          Alexander Hamilton
        </Panel.Block>
        <Panel.Block href="#thomas-jefferson">
          <Panel.Icon name="user" variant="solid" />
          Thomas Jefferson
        </Panel.Block>
        <Panel.Block href="#john-jay">
          <Panel.Icon name="user" variant="solid" />
          John Jay
        </Panel.Block>
        <Panel.Block href="#federalist-papers">
          <Panel.Icon name="flag" variant="solid" />
          Federalist Papers
        </Panel.Block>
        <Panel.Block href="#treaty-of-paris">
          <Panel.Icon name="flag" variant="solid" />
          Treaty of Paris
        </Panel.Block>
        <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
      </Panel>
    );
  },
};

export const Info: Story = {
  render: function InfoStory() {
    const headingId = useId();
    return (
      <Panel color="info" aria-labelledby={headingId}>
        <Panel.Heading id={headingId}>Info Panel</Panel.Heading>
        <Panel.InputBlock placeholder="Search figures" />
        <Panel.Block href="#benedict-arnold" active>
          <Panel.Icon name="user" variant="solid" />
          Benedict Arnold
        </Panel.Block>
        <Panel.Block href="#john-paul-jones">
          <Panel.Icon name="user" variant="solid" />
          John Paul Jones
        </Panel.Block>
        <Panel.Block href="#baron-von-steuben">
          <Panel.Icon name="user" variant="solid" />
          Baron von Steuben
        </Panel.Block>
        <Panel.Block href="#bunker-hill">
          <Panel.Icon name="flag" variant="solid" />
          Bunker Hill
        </Panel.Block>
        <Panel.Block href="#valley-forge">
          <Panel.Icon name="flag" variant="solid" />
          Valley Forge
        </Panel.Block>
        <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
      </Panel>
    );
  },
};

export const Success: Story = {
  render: function SuccessStory() {
    const headingId = useId();
    return (
      <Panel color="success" aria-labelledby={headingId}>
        <Panel.Heading id={headingId}>Success Panel</Panel.Heading>
        <Panel.InputBlock placeholder="Search figures" />
        <Panel.Block href="#marquis-de-lafayette" active>
          <Panel.Icon name="user" variant="solid" />
          Marquis de Lafayette
        </Panel.Block>
        <Panel.Block href="#deborah-sampson">
          <Panel.Icon name="user" variant="solid" />
          Deborah Sampson
        </Panel.Block>
        <Panel.Block href="#abigail-adams">
          <Panel.Icon name="user" variant="solid" />
          Abigail Adams
        </Panel.Block>
        <Panel.Block href="#yorktown">
          <Panel.Icon name="flag" variant="solid" />
          Yorktown
        </Panel.Block>
        <Panel.Block href="#declaration-of-independence">
          <Panel.Icon name="flag" variant="solid" />
          Declaration of Independence
        </Panel.Block>
        <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
      </Panel>
    );
  },
};

export const Warning: Story = {
  render: function WarningStory() {
    const headingId = useId();
    return (
      <Panel color="warning" aria-labelledby={headingId}>
        <Panel.Heading id={headingId}>Warning Panel</Panel.Heading>
        <Panel.InputBlock placeholder="Search figures" />
        <Panel.Block href="#thomas-paine" active>
          <Panel.Icon name="user" variant="solid" />
          Thomas Paine
        </Panel.Block>
        <Panel.Block href="#samuel-adams">
          <Panel.Icon name="user" variant="solid" />
          Samuel Adams
        </Panel.Block>
        <Panel.Block href="#mercy-otis-warren">
          <Panel.Icon name="user" variant="solid" />
          Mercy Otis Warren
        </Panel.Block>
        <Panel.Block href="#valley-forge">
          <Panel.Icon name="flag" variant="solid" />
          Valley Forge
        </Panel.Block>
        <Panel.Block href="#olive-branch-petition">
          <Panel.Icon name="flag" variant="solid" />
          Olive Branch Petition
        </Panel.Block>
        <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
      </Panel>
    );
  },
};

export const Danger: Story = {
  render: function DangerStory() {
    const headingId = useId();
    return (
      <Panel color="danger" aria-labelledby={headingId}>
        <Panel.Heading id={headingId}>Danger Panel</Panel.Heading>
        <Panel.InputBlock placeholder="Search figures" />
        <Panel.Block href="#king-george-iii" active>
          <Panel.Icon name="user" variant="solid" />
          King George III
        </Panel.Block>
        <Panel.Block href="#charles-cornwallis">
          <Panel.Icon name="user" variant="solid" />
          Charles Cornwallis
        </Panel.Block>
        <Panel.Block href="#benedict-arnold">
          <Panel.Icon name="user" variant="solid" />
          Benedict Arnold
        </Panel.Block>
        <Panel.Block href="#boston-massacre">
          <Panel.Icon name="flag" variant="solid" />
          Boston Massacre
        </Panel.Block>
        <Panel.Block href="#intolerable-acts">
          <Panel.Icon name="flag" variant="solid" />
          Intolerable Acts
        </Panel.Block>
        <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
      </Panel>
    );
  },
};

export const Black: Story = {
  render: function BlackStory() {
    const headingId = useId();
    return (
      <Panel color="black" aria-labelledby={headingId}>
        <Panel.Heading id={headingId}>Black Panel</Panel.Heading>
        <Panel.InputBlock placeholder="Search figures" />
        <Panel.Block href="#john-adams" active>
          <Panel.Icon name="user" variant="solid" />
          John Adams
        </Panel.Block>
        <Panel.Block href="#crispus-attucks">
          <Panel.Icon name="user" variant="solid" />
          Crispus Attucks
        </Panel.Block>
        <Panel.Block href="#sybil-ludington">
          <Panel.Icon name="user" variant="solid" />
          Sybil Ludington
        </Panel.Block>
        <Panel.Block href="#lexington-concord">
          <Panel.Icon name="flag" variant="solid" />
          Lexington & Concord
        </Panel.Block>
        <Panel.Block href="#boston-tea-party">
          <Panel.Icon name="flag" variant="solid" />
          Boston Tea Party
        </Panel.Block>
        <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
      </Panel>
    );
  },
};

export const Dark: Story = {
  render: function DarkStory() {
    const headingId = useId();
    return (
      <Panel color="dark" aria-labelledby={headingId}>
        <Panel.Heading id={headingId}>Dark Panel</Panel.Heading>
        <Panel.InputBlock placeholder="Search figures" />
        <Panel.Block href="#samuel-adams" active>
          <Panel.Icon name="user" variant="solid" />
          Samuel Adams
        </Panel.Block>
        <Panel.Block href="#haym-salomon">
          <Panel.Icon name="user" variant="solid" />
          Haym Salomon
        </Panel.Block>
        <Panel.Block href="#roger-sherman">
          <Panel.Icon name="user" variant="solid" />
          Roger Sherman
        </Panel.Block>
        <Panel.Block href="#continental-congress">
          <Panel.Icon name="flag" variant="solid" />
          Continental Congress
        </Panel.Block>
        <Panel.Block href="#articles-of-confederation">
          <Panel.Icon name="flag" variant="solid" />
          Articles of Confederation
        </Panel.Block>
        <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
      </Panel>
    );
  },
};

export const Light: Story = {
  render: function LightStory() {
    const headingId = useId();
    return (
      <Panel color="light" aria-labelledby={headingId}>
        <Panel.Heading id={headingId}>Light Panel</Panel.Heading>
        <Panel.InputBlock placeholder="Search figures" />
        <Panel.Block href="#abigail-adams" active>
          <Panel.Icon name="user" variant="solid" />
          Abigail Adams
        </Panel.Block>
        <Panel.Block href="#martha-washington">
          <Panel.Icon name="user" variant="solid" />
          Martha Washington
        </Panel.Block>
        <Panel.Block href="#phillis-wheatley">
          <Panel.Icon name="user" variant="solid" />
          Phillis Wheatley
        </Panel.Block>
        <Panel.Block href="#declaration-of-independence">
          <Panel.Icon name="flag" variant="solid" />
          Declaration of Independence
        </Panel.Block>
        <Panel.Block href="#bill-of-rights">
          <Panel.Icon name="flag" variant="solid" />
          Bill of Rights
        </Panel.Block>
        <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
      </Panel>
    );
  },
};

export const White: Story = {
  render: function WhiteStory() {
    const headingId = useId();
    return (
      <Panel color="white" aria-labelledby={headingId}>
        <Panel.Heading id={headingId}>White Panel</Panel.Heading>
        <Panel.InputBlock placeholder="Search figures" />
        <Panel.Block href="#paul-revere" active>
          <Panel.Icon name="user" variant="solid" />
          Paul Revere
        </Panel.Block>
        <Panel.Block href="#john-hancock">
          <Panel.Icon name="user" variant="solid" />
          John Hancock
        </Panel.Block>
        <Panel.Block href="#patrick-henry">
          <Panel.Icon name="user" variant="solid" />
          Patrick Henry
        </Panel.Block>
        <Panel.Block href="#midnight-ride">
          <Panel.Icon name="flag" variant="solid" />
          Midnight Ride
        </Panel.Block>
        <Panel.Block href="#give-me-liberty">
          <Panel.Icon name="flag" variant="solid" />
          Give Me Liberty
        </Panel.Block>
        <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
      </Panel>
    );
  },
};

export const CompoundUsage: Story = {
  render: function CompoundUsageStory() {
    const headingId = useId();
    return (
      <Panel aria-labelledby={headingId}>
        <Panel.Heading id={headingId}>Continental Congress</Panel.Heading>
        <Panel.Tabs>
          <a href="#all" className="is-active" aria-current="true">
            All
          </a>
          <a href="#delegates">Delegates</a>
        </Panel.Tabs>
        <Panel.Block href="#john-adams" active>
          <Panel.Icon name="user" variant="solid" />
          John Adams
        </Panel.Block>
        <Panel.Block href="#benjamin-franklin">
          <Panel.Icon name="user" variant="solid" />
          Benjamin Franklin
        </Panel.Block>
        <Panel.CheckboxBlock>remember me</Panel.CheckboxBlock>
        <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
      </Panel>
    );
  },
};

/**
 * `Panel.Icon` accepts a custom node via `children` in place of a class-based `name`.
 * The node is rendered inside the `panel-icon` container (not `icon`) — `Panel.Icon`
 * always overrides `containerClassName`.
 */
export const CustomNodeIcon: Story = {
  render: function CustomNodeIconStory() {
    const headingId = useId();
    return (
      <Panel aria-labelledby={headingId}>
        <Panel.Heading id={headingId}>Continental Congress</Panel.Heading>
        <Panel.Block href="#john-adams">
          <Panel.Icon ariaLabel="Custom SVG icon">
            <svg
              viewBox="0 0 16 16"
              width="1em"
              height="1em"
              fill="currentColor"
            >
              <circle cx="8" cy="8" r="6" />
            </svg>
          </Panel.Icon>
          John Adams
        </Panel.Block>
        <Panel.Block href="#benjamin-franklin">
          <Panel.Icon name="user" variant="solid" />
          Benjamin Franklin
        </Panel.Block>
      </Panel>
    );
  },
};

export const NotNavigation: Story = {
  render: function NotNavigationStory() {
    const headingId = useId();
    return (
      <Panel as="section" color="info" aria-labelledby={headingId}>
        <Panel.Heading id={headingId}>Congress Sessions</Panel.Heading>
        <Panel.Block as="div">
          <Table isFullwidth>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Session</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>1774</Table.Td>
                <Table.Td>First Continental Congress</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>1775</Table.Td>
                <Table.Td>Second Continental Congress</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Panel.Block>
        <Panel.Block href="#delegates">
          <Panel.Icon name="user" variant="solid" />
          All delegates
        </Panel.Block>
      </Panel>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'A panel that is not navigation renders through `as`: here a `section` named by its heading, so it is a region landmark. `Panel.Block as="div"` holds content that is not a link, such as a table; a block with no `as` is still an `<a>`.',
      },
    },
  },
};

export const SearchFieldWithItsOwnName: Story = {
  render: function SearchFieldWithItsOwnNameStory() {
    const headingId = useId();
    return (
      <Panel aria-labelledby={headingId}>
        <Panel.Heading id={headingId}>Repositories</Panel.Heading>
        <Panel.Block as="div">
          <Control iconLeftName="search">
            <Input aria-label="Search repositories" placeholder="Search" />
          </Control>
        </Panel.Block>
        <Panel.Block href="#bulma">
          <Panel.Icon name="book" variant="solid" />
          bulma
        </Panel.Block>
        <Panel.Block href="#marksheet">
          <Panel.Icon name="book" variant="solid" />
          marksheet
        </Panel.Block>
      </Panel>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '`Panel.InputBlock`’s field takes its name from its placeholder, and an `aria-label` passed to it goes on the block. For a field with a name of its own, build the block from `Panel.Block as="div"` with a `Control` and an `Input` inside, and give the `Input` the `aria-label`.',
      },
    },
  },
};
