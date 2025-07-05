import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Cell } from '../Cell';

describe('Cell', () => {
  it('renders children', () => {
    const { getByText } = render(<Cell>Test content</Cell>);
    expect(getByText('Test content')).toBeInTheDocument();
  });

  it('always applies the .cell class', () => {
    const { container } = render(<Cell>Cell</Cell>);
    expect(container.querySelector('.cell')).toBeInTheDocument();
  });

  it('applies col/row grid modifiers as classes', () => {
    const { container } = render(
      <Cell
        colStart={2}
        colFromEnd={1}
        colSpan={3}
        rowStart={2}
        rowFromEnd={1}
        rowSpan={4}
      />
    );
    const cell = container.querySelector('.cell');
    expect(cell).toHaveClass('is-col-start-2');
    expect(cell).toHaveClass('is-col-from-end-1');
    expect(cell).toHaveClass('is-col-span-3');
    expect(cell).toHaveClass('is-row-start-2');
    expect(cell).toHaveClass('is-row-from-end-1');
    expect(cell).toHaveClass('is-row-span-4');
  });

  it('applies custom className', () => {
    const { container } = render(<Cell className="my-custom">Hi</Cell>);
    const cell = container.querySelector('.cell');
    expect(cell).toHaveClass('my-custom');
  });

  it('passes through other props to div', () => {
    const { container } = render(<Cell id="cell-id" data-testid="cell-test" />);
    const cell = container.querySelector('.cell');
    expect(cell).toHaveAttribute('id', 'cell-id');
    expect(cell).toHaveAttribute('data-testid', 'cell-test');
  });

  it('applies textColor and bgColor as Bulma classes', () => {
    const { container } = render(
      <Cell textColor="primary" bgColor="danger">
        Colored
      </Cell>
    );
    const cell = container.querySelector('.cell');
    // These depend on your useBulmaClasses implementation,
    // but typically would be something like "has-text-primary", "has-background-danger"
    expect(cell?.className).toMatch(/has-text-primary/);
    expect(cell?.className).toMatch(/has-background-danger/);
  });

  it('does not apply grid modifier classes if not specified', () => {
    const { container } = render(<Cell />);
    const cell = container.querySelector('.cell');
    expect(cell?.className).not.toMatch(
      /is-col-start-|is-col-from-end-|is-col-span-|is-row-start-|is-row-from-end-|is-row-span-/
    );
  });
});
