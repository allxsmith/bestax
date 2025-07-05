import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BulmaGapSize, Columns } from './Columns';
import { Column } from './Column';
import { Notification } from '../elements/Notification';

const meta: Meta<typeof Columns> = {
  title: 'Columns/Columns',
  component: Columns,
};

export default meta;

// --- MOBILE COLUMNS STORY ---
export const MobileColumns: StoryObj = {
  render: () => (
    <>
      <p style={{ marginBottom: 16 }}>
        Columns are normally in effect from tablet and larger. Using the{' '}
        <code>isMobile</code> flag enables columns on Mobile and larger screens.
      </p>
      <Columns isMobile>
        <Column>
          <Notification color="primary">1</Notification>
        </Column>
        <Column>
          <Notification color="primary">2</Notification>
        </Column>
        <Column>
          <Notification color="primary">3</Notification>
        </Column>
        <Column>
          <Notification color="primary">4</Notification>
        </Column>
        <Column>
          <Notification color="primary">5</Notification>
        </Column>
      </Columns>
    </>
  ),
};

// --- DESKTOP COLUMNS STORY ---
export const DesktopColumns: StoryObj = {
  render: () => (
    <>
      <p style={{ marginBottom: 16 }}>
        Using the <code>isDesktop</code> flag enables columns on Desktop and
        larger screens.
      </p>
      <Columns isDesktop>
        <Column>
          <Notification color="primary">1</Notification>
        </Column>
        <Column>
          <Notification color="primary">2</Notification>
        </Column>
        <Column>
          <Notification color="primary">3</Notification>
        </Column>
        <Column>
          <Notification color="primary">4</Notification>
        </Column>
        <Column>
          <Notification color="primary">5</Notification>
        </Column>
      </Columns>
    </>
  ),
};

// --- DIFFERENT COLUMN SIZES PER BREAKPOINT ---
export const DifferentColumnSizesPerBreakpoint: StoryObj = {
  render: () => (
    <>
      <p style={{ marginBottom: 16 }}>
        These columns have different sizes per breakpoint. Resize the window to
        see this in action.
      </p>
      <Columns isMobile>
        <Column
          sizeMobile="three-quarters"
          sizeTablet="two-thirds"
          sizeDesktop="half"
          sizeWidescreen="one-third"
          sizeFullhd="one-quarter"
        >
          <Notification color="primary">
            <code>sizeMobile=&quot;three-quarters&quot;</code>
            <br />
            <code>sizeTablet=&quot;two-thirds&quot;</code>
            <br />
            <code>sizeDesktop=&quot;half&quot;</code>
            <br />
            <code>sizeWidescreen=&quot;one-third&quot;</code>
            <br />
            <code>sizeFullhd=&quot;one-quarter&quot;</code>
          </Notification>
        </Column>
        <Column>
          <Notification color="primary">2</Notification>
        </Column>
        <Column>
          <Notification color="primary">3</Notification>
        </Column>
        <Column>
          <Notification color="primary">4</Notification>
        </Column>
        <Column>
          <Notification color="primary">5</Notification>
        </Column>
      </Columns>
    </>
  ),
};

// --- NESTED COLUMNS STORY ---
export const NestedColumns: StoryObj = {
  render: () => (
    <>
      <p style={{ marginBottom: 16 }}>
        Columns can be nested within Column components.
      </p>
      <Columns>
        <Column>
          <Notification color="primary">First column</Notification>
          <Columns isMobile>
            <Column>
              <Notification color="primary">First nested column</Notification>
            </Column>
            <Column>
              <Notification color="primary">Second nested column</Notification>
            </Column>
          </Columns>
        </Column>
        <Column>
          <Notification color="primary">Second column</Notification>
          <Columns isMobile>
            <Column size="half">
              <Notification color="primary">50%</Notification>
            </Column>
            <Column>
              <Notification color="primary">Auto</Notification>
            </Column>
            <Column>
              <Notification color="primary">Auto</Notification>
            </Column>
          </Columns>
        </Column>
      </Columns>
    </>
  ),
};

// --- GAP SIZES STORY ---
export const GapSizes: StoryObj = {
  render: () => (
    <>
      <p style={{ marginBottom: 16 }}>
        You can control the gap between columns using <code>gapSize</code> and
        responsive gap props.
      </p>
      <Columns gapSize={0}>
        <Column>
          <Notification color="primary">gapSize=0</Notification>
        </Column>
        <Column>
          <Notification color="primary">gapSize=0</Notification>
        </Column>
      </Columns>
      <Columns gapSize={3}>
        <Column>
          <Notification color="primary">gapSize=3</Notification>
        </Column>
        <Column>
          <Notification color="primary">gapSize=3</Notification>
        </Column>
      </Columns>
      <Columns gapSizeMobile={1} gapSizeTablet={3} gapSizeDesktop={6}>
        <Column>
          <Notification color="primary">
            gapSizeMobile=1 gapSizeTablet=3 gapSizeDesktop=6
          </Notification>
        </Column>
        <Column>
          <Notification color="primary">
            gapSizeMobile=1 gapSizeTablet=3 gapSizeDesktop=6
          </Notification>
        </Column>
      </Columns>
    </>
  ),
};

// --- OFFSET STORY ---
export const Offsets: StoryObj = {
  render: () => (
    <>
      <p style={{ marginBottom: 16 }}>
        Columns can be offset using the <code>offset</code> prop and responsive
        offset props.
      </p>
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
    </>
  ),
};

// --- NARROW COLUMNS STORY ---
export const NarrowColumns: StoryObj = {
  render: () => (
    <>
      <p style={{ marginBottom: 16 }}>
        Narrow columns only take up as much space as their content requires.
      </p>
      <Columns>
        <Column isNarrow>
          <Notification color="primary" style={{ width: 200 }}>
            <span style={{ fontWeight: 'bold' }}>Narrow column</span>
            <br />
            <span>This column is only 200px wide.</span>
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
    </>
  ),
};

// --- GAPLESS STORY ---
export const Gapless: StoryObj = {
  render: () => (
    <>
      <p style={{ marginBottom: 16 }}>
        The <code>isGapless</code> prop removes the gap between columns.
      </p>
      <Columns isGapless>
        <Column>
          <Notification color="primary">1</Notification>
        </Column>
        <Column>
          <Notification color="primary">2</Notification>
        </Column>
        <Column>
          <Notification color="primary">3</Notification>
        </Column>
        <Column>
          <Notification color="primary">4</Notification>
        </Column>
      </Columns>
    </>
  ),
};

// --- MULTILINE GAPLESS STORY ---
export const MultilineGapless: StoryObj = {
  render: () => (
    <>
      <p style={{ marginBottom: 16 }}>
        You can combine <code>isGapless</code> and <code>isMultiline</code> to
        create dense, wrapping columns.
      </p>
      <Columns isGapless isMultiline isMobile>
        <Column size="one-quarter">
          <Notification color="primary">is-one-quarter</Notification>
        </Column>
        <Column size="one-quarter">
          <Notification color="primary">is-one-quarter</Notification>
        </Column>
        <Column size="one-quarter">
          <Notification color="primary">is-one-quarter</Notification>
        </Column>
        <Column size="one-quarter">
          <Notification color="primary">is-one-quarter</Notification>
        </Column>
        <Column size="half">
          <Notification color="primary">is-half</Notification>
        </Column>
        <Column size="one-quarter">
          <Notification color="primary">is-one-quarter</Notification>
        </Column>
        <Column size="one-quarter">
          <Notification color="primary">is-one-quarter</Notification>
        </Column>
        <Column size="one-quarter">
          <Notification color="primary">is-one-quarter</Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
      </Columns>
    </>
  ),
};

// --- VARIABLE GAP STORY ---
export const VariableGap: StoryObj<{ gapSize: number }> = {
  args: {
    gapSize: 2,
  },
  argTypes: {
    gapSize: {
      control: { type: 'number', min: 0, max: 8, step: 1 },
      description: 'Bulma gap size (0-8)',
    },
  },
  render: ({ gapSize }) => (
    <>
      <p style={{ marginBottom: 16 }}>
        The <code>gapSize</code> property controls the variable gap between
        columns. Change the value of the storybook control for{' '}
        <code>gapSize</code> to adjust spacing.
      </p>
      <Columns gapSize={gapSize as BulmaGapSize}>
        <Column size={3}>
          <Notification color="primary" className="has-text-centered">
            Side
          </Notification>
        </Column>
        <Column size={9}>
          <Notification color="primary" className="has-text-centered">
            Main
          </Notification>
        </Column>
      </Columns>
      <Columns gapSize={gapSize as BulmaGapSize}>
        <Column size={4}>
          <Notification color="primary" className="has-text-centered">
            Three columns
          </Notification>
        </Column>
        <Column size={4}>
          <Notification color="primary" className="has-text-centered">
            Three columns
          </Notification>
        </Column>
        <Column size={4}>
          <Notification color="primary" className="has-text-centered">
            Three columns
          </Notification>
        </Column>
      </Columns>
      <Columns gapSize={gapSize as BulmaGapSize}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Column key={i + 1}>
            <Notification color="primary" className="has-text-centered">
              {i + 1}
            </Notification>
          </Column>
        ))}
      </Columns>
    </>
  ),
};

// --- BREAKPOINT BASED COLUMN GAPS STORY ---
export const BreakpointBasedColumnGaps: StoryObj = {
  render: () => (
    <>
      <p style={{ marginBottom: 16 }}>
        This example uses different gap sizes per breakpoint, resize the window
        to see this in action
        <br />
        <code>
          gapSizeMobile={1} gapSizeTablet={4} gapSizeDesktop={3}{' '}
          gapSizeWidescreen={8} gapSizeFullhd={2}
        </code>
      </p>
      <Columns
        gapSizeMobile={1}
        gapSizeTablet={4}
        gapSizeDesktop={3}
        gapSizeWidescreen={8}
        gapSizeFullhd={2}
      >
        {[...Array(6)].map((_, idx) => (
          <Column key={idx}>
            <Notification color="primary">Column</Notification>
          </Column>
        ))}
      </Columns>
    </>
  ),
};

export const VerticalAlignment: StoryObj = {
  render: () => (
    <>
      <p style={{ marginBottom: 16 }}>
        Use <code>isVCentered</code> to vertically center columns.
      </p>
      <Columns isVCentered>
        <Column size={8}>
          <Notification color="primary">First column</Notification>
        </Column>
        <Column>
          <Notification color="primary">
            Can you see the vertical alignment? It should be really noticable
            with these two columns.
          </Notification>
        </Column>
      </Columns>
    </>
  ),
};

export const Multiline: StoryObj = {
  render: () => (
    <>
      <p style={{ marginBottom: 16 }}>
        Use <code>isMultiline</code> to allow columns to wrap to multiple lines.
      </p>
      <Columns isMultiline isMobile>
        <Column size="one-quarter">
          <Notification color="primary">
            <code>is-one-quarter</code>
          </Notification>
        </Column>
        <Column size="one-quarter">
          <Notification color="primary">
            <code>is-one-quarter</code>
          </Notification>
        </Column>
        <Column size="one-quarter">
          <Notification color="primary">
            <code>is-one-quarter</code>
          </Notification>
        </Column>
        <Column size="one-quarter">
          <Notification color="primary">
            <code>is-one-quarter</code>
          </Notification>
        </Column>
        <Column size="half">
          <Notification color="primary">
            <code>is-half</code>
          </Notification>
        </Column>
        <Column size="one-quarter">
          <Notification color="primary">
            <code>is-one-quarter</code>
          </Notification>
        </Column>
        <Column size="one-quarter">
          <Notification color="primary">
            <code>is-one-quarter</code>
          </Notification>
        </Column>
        <Column size="one-quarter">
          <Notification color="primary">
            <code>is-one-quarter</code>
          </Notification>
        </Column>
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
      </Columns>
    </>
  ),
};

export const CenteringColumns: StoryObj = {
  render: () => (
    <>
      <p style={{ marginBottom: 16 }}>
        Use <code>isCentered</code> to horizontally center columns within the
        container.
      </p>
      <Columns isMobile isCentered>
        <Column size="half">
          <Notification color="primary">
            <code className="html">is-half</code>
            <br />
          </Notification>
        </Column>
      </Columns>
    </>
  ),
};

export const MultilineCenteredColumns: StoryObj = {
  render: () => (
    <>
      <p style={{ marginBottom: 16 }}>
        Combine <code>isMultiline</code>, <code>isCentered</code>, and{' '}
        <code>isNarrow</code> for centered, wrapped narrow columns.
      </p>
      <Columns isMobile isMultiline isCentered>
        <Column isNarrow>
          <Notification color="primary">
            <code className="html">is-narrow</code>
            <br />
            First Column
          </Notification>
        </Column>
        <Column isNarrow>
          <Notification color="primary">
            <code className="html">is-narrow</code>
            <br />
            Our Second Column
          </Notification>
        </Column>
        <Column isNarrow>
          <Notification color="primary">
            <code className="html">is-narrow</code>
            <br />
            Third Column
          </Notification>
        </Column>
        <Column isNarrow>
          <Notification color="primary">
            <code className="html">is-narrow</code>
            <br />
            The Fourth Column
          </Notification>
        </Column>
        <Column isNarrow>
          <Notification color="primary">
            <code className="html">is-narrow</code>
            <br />
            Fifth Column
          </Notification>
        </Column>
      </Columns>
    </>
  ),
};
