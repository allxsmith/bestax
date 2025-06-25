import type { Meta, StoryObj } from '@storybook/react';
import { Columns } from './Columns';
import { Column } from './Column';
import { Notification } from '../elements/Notification';

const meta: Meta<typeof Column> = {
  title: 'Columns/Column',
  component: Column,
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Columns>
      <Column>
        <Notification color="primary">First column</Notification>
      </Column>
      <Column>
        <Notification color="info">Second column</Notification>
      </Column>
      <Column>
        <Notification color="link">Third column</Notification>
      </Column>
      <Column>
        <Notification color="warning">Fourth column</Notification>
      </Column>
    </Columns>
  ),
};

// --- SIZES STORY ---
export const Sizes: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Columns>
        <Column size="four-fifths">
          <Notification color="primary">is-four-fifths</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
      </Columns>
      <Columns>
        <Column size="three-quarters">
          <Notification color="primary">is-three-quarters</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
      </Columns>
      <Columns>
        <Column size="two-thirds">
          <Notification color="primary">is-two-thirds</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
      </Columns>
      <Columns>
        <Column size="three-fifths">
          <Notification color="primary">is-three-fifths</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
      </Columns>
      <Columns>
        <Column size="half">
          <Notification color="primary">is-half</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
      </Columns>
      <Columns>
        <Column size="two-fifths">
          <Notification color="primary">is-two-fifths</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
      </Columns>
      <Columns>
        <Column size="one-third">
          <Notification color="primary">is-one-third</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
      </Columns>
      <Columns>
        <Column size="one-quarter">
          <Notification color="primary">is-one-quarter</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
      </Columns>
      <Columns>
        <Column size="one-fifth">
          <Notification color="primary">is-one-fifth</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
      </Columns>
    </div>
  ),
};

// --- 12 COLUMN SYSTEM STORY ---
export const TwelveColumnSystem: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
        <Columns key={num}>
          <Column size={num}>
            <Notification color="primary" pr={num === 1 ? '2' : undefined}>
              is-{num}
            </Notification>
          </Column>
          <Column>
            <Notification color="primary">Auto</Notification>
          </Column>
          <Column>
            <Notification color="primary">Auto</Notification>
          </Column>
        </Columns>
      ))}
    </div>
  ),
};

// --- OFFSET STORY ---
export const Offsets: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Columns isMobile>
        <Column size="half" offset="one-quarter">
          <Notification color="primary">
            is-half is-offset-one-quarter
          </Notification>
        </Column>
      </Columns>
      <Columns isMobile>
        <Column size="three-fifths" offset="one-fifth">
          <Notification color="primary">
            is-three-fifths is-offset-one-fifth
          </Notification>
        </Column>
      </Columns>
      <Columns isMobile>
        <Column size={4} offset={8}>
          <Notification color="primary">is-4 is-offset-8</Notification>
        </Column>
      </Columns>
      <Columns isMobile>
        <Column size={11} offset={1}>
          <Notification color="primary">is-11 is-offset-1</Notification>
        </Column>
      </Columns>
    </div>
  ),
};

// --- NARROW COLUMN STORY ---
export const Narrow: StoryObj = {
  render: () => (
    <Columns>
      <Column isNarrow>
        <Notification color="primary" style={{ width: 180 }}>
          <span style={{ fontWeight: 'bold' }}>Narrow column</span>
          <br />
          <span>
            This column is only as wide as it needs to be, 180px wide.
          </span>
        </Notification>
      </Column>
      <Column>
        <Notification color="primary">
          <span style={{ fontWeight: 'bold' }}>Flexible column</span>
          <br />
          <span>This column will take up the remaining space available.</span>
        </Notification>
      </Column>
    </Columns>
  ),
};
