import { useState } from 'react';
import {
  BulmaFixedGridCols,
  BulmaGapValue,
  BulmaMinColValue,
  Grid,
} from './Grid';
import { Cell } from './Cell';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Notification } from '../elements/Notification';

export default {
  title: 'Grid/Grid',
  component: Grid,
};

const cellCount = 24;
const cellNodes = Array.from({ length: cellCount }, (_, i) => (
  <Cell key={i}>
    <Notification color="primary">Cell {i + 1}</Notification>
  </Cell>
));

export const SmartGrid = () => <Grid>{cellNodes}</Grid>;

SmartGrid.storyName = 'Smart Grid';

export const MinimumColumnWidth = () => {
  const [minCol, setMinCol] = useState<number>(4);

  return (
    <div>
      <Buttons hasAddons>
        <Button isStatic>Select a Minimum Column Width:</Button>
        {Array.from({ length: 32 }, (_, i) => (
          <Button
            key={i + 1}
            color={minCol === i + 1 ? 'primary' : undefined}
            onClick={() => setMinCol(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
      </Buttons>
      <Grid minCol={minCol as BulmaMinColValue}>{cellNodes}</Grid>
    </div>
  );
};

MinimumColumnWidth.storyName = 'Minimum Column Width';

export const Gap = () => {
  const [gap, setGap] = useState<number>(2);

  return (
    <div>
      <Buttons hasAddons>
        <Button isStatic>Select a Gap:</Button>
        {Array.from({ length: 8 }, (_, i) => (
          <Button
            key={i + 1}
            color={gap === i + 1 ? 'primary' : undefined}
            onClick={() => setGap(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
      </Buttons>
      <Grid gap={gap as BulmaGapValue}>{cellNodes}</Grid>
    </div>
  );
};

Gap.storyName = 'Gap';

export const ColumnGap = () => {
  const [columnGap, setColumnGap] = useState<number>(2);

  return (
    <div>
      <Buttons hasAddons>
        <Button isStatic>Select a Column Gap:</Button>
        {Array.from({ length: 8 }, (_, i) => (
          <Button
            key={i + 1}
            color={columnGap === i + 1 ? 'primary' : undefined}
            onClick={() => setColumnGap(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
      </Buttons>
      <Grid columnGap={columnGap as BulmaGapValue}>{cellNodes}</Grid>
    </div>
  );
};

ColumnGap.storyName = 'Column Gap';

export const RowGap = () => {
  const [rowGap, setRowGap] = useState<number>(2);

  return (
    <div>
      <Buttons hasAddons>
        <Button isStatic>Select a Row Gap:</Button>
        {Array.from({ length: 8 }, (_, i) => (
          <Button
            key={i + 1}
            color={rowGap === i + 1 ? 'primary' : undefined}
            onClick={() => setRowGap(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
      </Buttons>
      <Grid rowGap={rowGap as BulmaGapValue}>{cellNodes}</Grid>
    </div>
  );
};

RowGap.storyName = 'Row Gap';

export const FixedGrid = () => {
  // Only 12 cells for this story
  const fixedCellNodes = Array.from({ length: 12 }, (_, i) => (
    <Cell key={i}>
      <Notification color="primary">Cell {i + 1}</Notification>
    </Cell>
  ));

  return <Grid isFixed>{fixedCellNodes}</Grid>;
};
FixedGrid.storyName = 'Fixed Grid';

export const FixedGridCols = () => {
  const [fixedCols, setFixedCols] = useState<number>(4);

  // Only 12 cells for this story
  const fixedCellNodes = Array.from({ length: 12 }, (_, i) => (
    <Cell key={i}>
      <Notification color="primary">Cell {i + 1}</Notification>
    </Cell>
  ));

  return (
    <div>
      <Buttons hasAddons>
        <Button isStatic>Select Columns:</Button>
        {Array.from({ length: 12 }, (_, i) => (
          <Button
            key={i + 1}
            color={fixedCols === i + 1 ? 'primary' : undefined}
            onClick={() => setFixedCols(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
      </Buttons>
      <Grid isFixed fixedCols={fixedCols as BulmaFixedGridCols}>
        {fixedCellNodes}
      </Grid>
    </div>
  );
};
FixedGridCols.storyName = 'Fixed Grid Cols';

const breakpoints = [
  { label: 'Mobile', key: 'Mobile', prop: 'fixedColsMobile' },
  { label: 'Tablet', key: 'Tablet', prop: 'fixedColsTablet' },
  { label: 'Desktop', key: 'Desktop', prop: 'fixedColsDesktop' },
  { label: 'Widescreen', key: 'Widescreen', prop: 'fixedColsWidescreen' },
  { label: 'FullHd', key: 'Fullhd', prop: 'fixedColsFullhd' },
];

export const FixedGridColsByBreakpoint = () => {
  // State for main (default) fixedCols and for each breakpoint
  const [cols] = useState<number>(4);
  const [breakpoint, setBreakpoint] = useState<string>('Mobile');
  const [breakpointCols, setBreakpointCols] = useState<Record<string, number>>({
    Mobile: 4,
    Tablet: 6,
    Desktop: 8,
    Widescreen: 10,
    Fullhd: 12,
  });

  // Only 12 cells for this story
  const fixedCellNodes = Array.from({ length: 12 }, (_, i) => (
    <Cell key={i}>
      <Notification color="primary">Cell {i + 1}</Notification>
    </Cell>
  ));

  // Prepare props for Grid
  const gridProps: Record<string, unknown> = {
    isFixed: true,
    fixedCols: cols,
    fixedColsMobile: breakpointCols.Mobile,
    fixedColsTablet: breakpointCols.Tablet,
    fixedColsDesktop: breakpointCols.Desktop,
    fixedColsWidescreen: breakpointCols.Widescreen,
    fixedColsFullhd: breakpointCols.Fullhd,
  };

  return (
    <div>
      <p style={{ marginBottom: 10 }}>
        Resize the browser to see this in action!
      </p>
      <Buttons hasAddons>
        <Button isStatic>Select Breakpoint:</Button>
        {breakpoints.map(bp => (
          <Button
            key={bp.key}
            color={breakpoint === bp.key ? 'primary' : undefined}
            onClick={() => setBreakpoint(bp.key)}
          >
            {bp.label}
          </Button>
        ))}
      </Buttons>
      <Buttons hasAddons>
        <Button isStatic>
          {breakpoint === 'Mobile'
            ? 'Columns (Mobile)'
            : `Columns (${breakpoint})`}
        </Button>
        {Array.from({ length: 12 }, (_, i) => (
          <Button
            key={i + 1}
            color={breakpointCols[breakpoint] === i + 1 ? 'primary' : undefined}
            onClick={() =>
              setBreakpointCols(prev => ({
                ...prev,
                [breakpoint]: i + 1,
              }))
            }
          >
            {i + 1}
          </Button>
        ))}
      </Buttons>
      <Grid {...gridProps}>{fixedCellNodes}</Grid>
    </div>
  );
};
FixedGridColsByBreakpoint.storyName = 'Fixed Grid Cols By Breakpoint';

export const FixedGridAutoCount = () => {
  // 16 cells for this story
  const fixedAutoCellNodes = Array.from({ length: 16 }, (_, i) => (
    <Cell key={i}>
      <Notification color="primary">Cell {i + 1}</Notification>
    </Cell>
  ));

  // If your Grid component accepts isFixed and hasAutoCount as props, use them directly.
  // If not, you may need to provide className manually as below.
  return (
    <Grid isFixed fixedCols="auto">
      {fixedAutoCellNodes}
    </Grid>
  );
};
FixedGridAutoCount.storyName = 'Fixed Grid Auto Count';
