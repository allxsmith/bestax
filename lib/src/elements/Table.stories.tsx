import { Meta, StoryObj } from '@storybook/react';
import { Table } from './Table';
import { Thead } from './Thead';
import { Tbody } from './Tbody';
import { Tr } from './Tr';
import { Th } from './Th';
import { Td } from './Td';
import { Tfoot } from './Tfoot';

const meta: Meta<typeof Table> = {
  title: 'Components/Table',
  component: Table,
  argTypes: {
    isBordered: { control: 'boolean' },
    isStriped: { control: 'boolean' },
    isNarrow: { control: 'boolean' },
    isHoverable: { control: 'boolean' },
    isFullwidth: { control: 'boolean' },
    isResponsive: { control: 'boolean' },
    className: { control: 'text' },
    m: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
    },
    color: {
      control: 'select',
      options: [
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'black',
        'dark',
        'light',
        'white',
      ],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Table>;

// Fictitious hockey team data
const hockeyTeams = [
  { name: 'Ice Wolves', wins: 32, losses: 8, otl: 2, points: 66 },
  { name: 'Frost Giants', wins: 30, losses: 9, otl: 3, points: 63 },
  { name: 'Snow Leopards', wins: 28, losses: 10, otl: 4, points: 60 },
  { name: 'Polar Bears', wins: 27, losses: 11, otl: 4, points: 58 },
  { name: 'Glacier Hawks', wins: 26, losses: 12, otl: 4, points: 56 },
  { name: 'Tundra Titans', wins: 25, losses: 13, otl: 4, points: 54 },
  { name: 'Blizzard Kings', wins: 24, losses: 14, otl: 4, points: 52 },
  { name: 'Arctic Foxes', wins: 23, losses: 15, otl: 4, points: 50 },
  { name: 'Winter Hawks', wins: 22, losses: 16, otl: 4, points: 48 },
  { name: 'Ice Storm', wins: 21, losses: 17, otl: 4, points: 46 },
  { name: 'Frostbite Flyers', wins: 20, losses: 18, otl: 4, points: 44 },
  { name: 'Snow Owls', wins: 19, losses: 19, otl: 4, points: 42 },
  { name: 'Icy Eagles', wins: 18, losses: 20, otl: 4, points: 40 },
  { name: 'Glacial Gulls', wins: 17, losses: 21, otl: 4, points: 38 },
  { name: 'Chill Crusaders', wins: 16, losses: 22, otl: 4, points: 36 },
  { name: 'Frost Falcons', wins: 15, losses: 23, otl: 4, points: 34 },
  { name: 'Snow Sharks', wins: 14, losses: 24, otl: 4, points: 32 },
  { name: 'Ice Dragons', wins: 13, losses: 25, otl: 4, points: 30 },
  { name: 'Winter Wolves', wins: 12, losses: 26, otl: 4, points: 28 },
  { name: 'Sleet Stingers', wins: 11, losses: 27, otl: 4, points: 26 },
];

export const HockeyTeamRecords: Story = {
  render: () => (
    <Table isBordered isStriped isHoverable isFullwidth isResponsive>
      <Thead>
        <Tr>
          <Th isAligned="left">Team</Th>
          <Th isAligned="right">Wins</Th>
          <Th isAligned="right">Losses</Th>
          <Th isAligned="right">OTL</Th>
          <Th isAligned="right">Points</Th>
        </Tr>
      </Thead>
      <Tbody>
        {hockeyTeams.map((team, index) => (
          <Tr key={team.name} color={index === 2 ? 'primary' : undefined}>
            <Td>{team.name}</Td>
            <Td>{team.wins}</Td>
            <Td>{team.losses}</Td>
            <Td>{team.otl}</Td>
            <Td>{team.points}</Td>
          </Tr>
        ))}
      </Tbody>
      <Tfoot>
        <Tr>
          <Td colSpan={5}>Total Teams: {hockeyTeams.length}</Td>
        </Tr>
      </Tfoot>
    </Table>
  ),
};

export const ColoredCells: Story = {
  render: () => (
    <Table isBordered isFullwidth>
      <Thead>
        <Tr>
          <Th>Cell Color</Th>
          <Th>Example</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td>Primary</Td>
          <Td color="primary">Primary Colored Cell</Td>
        </Tr>
        <Tr>
          <Td>Success</Td>
          <Td color="success">Success Colored Cell</Td>
        </Tr>
        <Tr>
          <Td>Warning</Td>
          <Td color="warning">Warning Colored Cell</Td>
        </Tr>
        <Tr>
          <Td>Danger</Td>
          <Td color="danger">Danger Colored Cell</Td>
        </Tr>
        <Tr>
          <Td>Info</Td>
          <Td color="info">Info Colored Cell</Td>
        </Tr>
        <Tr>
          <Td>Link</Td>
          <Td color="link">Link Colored Cell</Td>
        </Tr>
        <Tr>
          <Td>Black</Td>
          <Td color="black">Black Colored Cell</Td>
        </Tr>
        <Tr>
          <Td>Dark</Td>
          <Td color="dark">Dark Colored Cell</Td>
        </Tr>
        <Tr>
          <Td>Light</Td>
          <Td color="light">Light Colored Cell</Td>
        </Tr>
        <Tr>
          <Td>White</Td>
          <Td color="white">White Colored Cell</Td>
        </Tr>
      </Tbody>
    </Table>
  ),
};

export const Default: Story = {
  args: {
    children: (
      <>
        <Thead>
          <Tr>
            <Th>Column 1</Th>
            <Th>Column 2</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Cell 1</Td>
            <Td>Cell 2</Td>
          </Tr>
        </Tbody>
      </>
    ),
  },
};

export const Bordered: Story = {
  args: {
    isBordered: true,
    children: (
      <>
        <Thead>
          <Tr>
            <Th>Column 1</Th>
            <Th>Column 2</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Cell 1</Td>
            <Td>Cell 2</Td>
          </Tr>
        </Tbody>
      </>
    ),
  },
};

export const Striped: Story = {
  args: {
    isStriped: true,
    children: (
      <>
        <Thead>
          <Tr>
            <Th>Column 1</Th>
            <Th>Column 2</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Cell 1</Td>
            <Td>Cell 2</Td>
          </Tr>
          <Tr>
            <Td>Cell 3</Td>
            <Td>Cell 4</Td>
          </Tr>
        </Tbody>
      </>
    ),
  },
};

export const Narrow: Story = {
  args: {
    isNarrow: true,
    children: (
      <>
        <Thead>
          <Tr>
            <Th>Column 1</Th>
            <Th>Column 2</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Cell 1</Td>
            <Td>Cell 2</Td>
          </Tr>
        </Tbody>
      </>
    ),
  },
};

export const Hoverable: Story = {
  args: {
    isHoverable: true,
    children: (
      <>
        <Thead>
          <Tr>
            <Th>Column 1</Th>
            <Th>Column 2</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Cell 1</Td>
            <Td>Cell 2</Td>
          </Tr>
          <Tr>
            <Td>Cell 3</Td>
            <Td>Cell 4</Td>
          </Tr>
        </Tbody>
      </>
    ),
  },
};

export const Fullwidth: Story = {
  args: {
    isFullwidth: true,
    children: (
      <>
        <Thead>
          <Tr>
            <Th>Column 1</Th>
            <Th>Column 2</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Cell 1</Td>
            <Td>Cell 2</Td>
          </Tr>
        </Tbody>
      </>
    ),
  },
};

export const Responsive: Story = {
  args: {
    isResponsive: true,
    children: (
      <>
        <Thead>
          <Tr>
            {Array.from({ length: 20 }, (_, i) => (
              <Th key={`col-${i + 1}`}>Column {i + 1}</Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            {Array.from({ length: 20 }, (_, i) => (
              <Td key={`cell-1-${i + 1}`}>Cell 1-{i + 1}</Td>
            ))}
          </Tr>
          <Tr>
            {Array.from({ length: 20 }, (_, i) => (
              <Td key={`cell-2-${i + 1}`}>Cell 2-{i + 1}</Td>
            ))}
          </Tr>
        </Tbody>
      </>
    ),
  },
};

export const AllModifiers: Story = {
  args: {
    isBordered: true,
    isStriped: true,
    isNarrow: true,
    isHoverable: true,
    isFullwidth: true,
    isResponsive: true,
    children: (
      <>
        <Thead>
          <Tr>
            <Th>Column 1</Th>
            <Th>Column 2</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Cell 1</Td>
            <Td>Cell 2</Td>
          </Tr>
          <Tr>
            <Td>Cell 3</Td>
            <Td>Cell 4</Td>
          </Tr>
        </Tbody>
      </>
    ),
  },
};
