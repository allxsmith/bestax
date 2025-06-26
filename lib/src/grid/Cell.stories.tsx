import React from 'react';
import { Grid } from './Grid';
import { Cell } from './Cell';
import { Notification } from '../elements/Notification';

export default {
  title: 'Grid/Cell',
  component: Cell,
};

export const ColumnStart = () => (
  <Grid isFixed fixedCols={4}>
    <Cell>
      <Notification>Cell 1</Notification>
    </Cell>
    <Cell colStart={3}>
      <Notification color="primary">Cell 2</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 3</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 4</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 5</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 6</Notification>
    </Cell>
  </Grid>
);

ColumnStart.storyName = 'Column Start';

export const ColumnFromEnd = () => (
  <Grid isFixed fixedCols={4}>
    <Cell>
      <Notification>Cell 1</Notification>
    </Cell>
    <Cell colFromEnd={2}>
      <Notification color="primary">Cell 2</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 3</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 4</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 5</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 6</Notification>
    </Cell>
  </Grid>
);

ColumnFromEnd.storyName = 'Column From End';

export const ColumnSpan = () => (
  <Grid isFixed fixedCols={4}>
    <Cell>
      <Notification>Cell 1</Notification>
    </Cell>
    <Cell colSpan={2}>
      <Notification color="primary">Cell 2</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 3</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 4</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 5</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 6</Notification>
    </Cell>
  </Grid>
);

ColumnSpan.storyName = 'Column Span';

export const RowStart = () => (
  <Grid isFixed fixedCols={4}>
    <Cell>
      <Notification>Cell 1</Notification>
    </Cell>
    <Cell rowStart={3}>
      <Notification color="primary">Cell 2</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 3</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 4</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 5</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 6</Notification>
    </Cell>
  </Grid>
);

RowStart.storyName = 'Row Start';

export const RowSpan = () => (
  <Grid isFixed fixedCols={4}>
    <Cell>
      <Notification>Cell 1</Notification>
    </Cell>
    <Cell rowSpan={2}>
      <Notification color="primary" style={{ height: '100%' }}>
        Cell 2
      </Notification>
    </Cell>
    <Cell>
      <Notification>Cell 3</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 4</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 5</Notification>
    </Cell>
    <Cell>
      <Notification>Cell 6</Notification>
    </Cell>
  </Grid>
);

RowSpan.storyName = 'Row Span';
