import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Grid } from '../Grid';
import { Cell } from '../Cell';

// Simple test cell contents
const TestCell = ({ children = 'Cell' }) => <Cell>{children}</Cell>;

describe('Grid', () => {
  it('renders a plain grid with children', () => {
    const { container } = render(
      <Grid>
        <TestCell />
        <TestCell />
      </Grid>
    );
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid?.querySelectorAll('.cell')).toHaveLength(2);
  });

  it('applies gap, minCol, columnGap, rowGap modifiers', () => {
    const { container } = render(
      <Grid gap={3} columnGap={2} rowGap={1} minCol={4}>
        <TestCell />
      </Grid>
    );
    const grid = container.querySelector('.grid')!;
    expect(grid).toHaveClass('is-gap-3');
    expect(grid).toHaveClass('is-column-gap-2');
    expect(grid).toHaveClass('is-row-gap-1');
    expect(grid).toHaveClass('is-col-min-4');
  });

  it('renders as fixed-grid wrapper with grid inside', () => {
    const { container } = render(
      <Grid isFixed>
        <TestCell />
      </Grid>
    );
    const fixedGrid = container.querySelector('.fixed-grid');
    expect(fixedGrid).toBeInTheDocument();
    expect(fixedGrid?.querySelector('.grid')).toBeInTheDocument();
  });

  it('applies has-X-cols to fixed-grid', () => {
    const { container } = render(
      <Grid isFixed fixedCols={4}>
        <TestCell />
      </Grid>
    );
    const fixedGrid = container.querySelector('.fixed-grid');
    expect(fixedGrid).toHaveClass('has-4-cols');
  });

  it('applies has-auto-count to fixed-grid if fixedCols="auto"', () => {
    const { container } = render(
      <Grid isFixed fixedCols="auto">
        <TestCell />
      </Grid>
    );
    const fixedGrid = container.querySelector('.fixed-grid');
    expect(fixedGrid).toHaveClass('has-auto-count');
    // Should not have any other has-X-cols-* classes
    expect(fixedGrid?.className).not.toMatch(/has-\d+-cols/);
  });

  it('applies responsive col count classes to fixed-grid', () => {
    const { container } = render(
      <Grid
        isFixed
        fixedColsMobile={2}
        fixedColsTablet={3}
        fixedColsDesktop={4}
        fixedColsWidescreen={5}
        fixedColsFullhd={6}
      >
        <TestCell />
      </Grid>
    );
    const fixedGrid = container.querySelector('.fixed-grid');
    expect(fixedGrid).toHaveClass('has-2-cols-mobile');
    expect(fixedGrid).toHaveClass('has-3-cols-tablet');
    expect(fixedGrid).toHaveClass('has-4-cols-desktop');
    expect(fixedGrid).toHaveClass('has-5-cols-widescreen');
    expect(fixedGrid).toHaveClass('has-6-cols-fullhd');
  });

  it('applies textColor and bgColor as Bulma classes on grid', () => {
    const { container } = render(
      <Grid textColor="danger" bgColor="info">
        <TestCell />
      </Grid>
    );
    const grid = container.querySelector('.grid');
    // These depend on your useBulmaClasses implementation,
    // but typically would be something like "has-text-danger", "has-background-info"
    expect(grid?.className).toMatch(/has-text-danger/);
    expect(grid?.className).toMatch(/has-background-info/);
  });

  it('passes other props through to the grid element', () => {
    const { container } = render(
      <Grid id="test-grid" data-testid="the-grid">
        <TestCell />
      </Grid>
    );
    const grid = container.querySelector('.grid');
    expect(grid).toHaveAttribute('id', 'test-grid');
    expect(grid).toHaveAttribute('data-testid', 'the-grid');
  });

  it('applies custom className prop', () => {
    const { container } = render(
      <Grid className="custom-class">
        <TestCell />
      </Grid>
    );
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('custom-class');
  });

  it('does not render .fixed-grid if isFixed is false', () => {
    const { container } = render(
      <Grid>
        <TestCell />
      </Grid>
    );
    expect(container.querySelector('.fixed-grid')).not.toBeInTheDocument();
    expect(container.querySelector('.grid')).toBeInTheDocument();
  });
});
