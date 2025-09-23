import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Cell } from '../Cell';
import { ConfigProvider } from '../../helpers/Config';

describe('Cell', () => {
  it('renders children', () => {
    const { getByText } = render(<Cell>Test content</Cell>);
    expect(getByText('Test content')).toBeInTheDocument();
  });

  it('always applies the .cell class', () => {
    const { container } = render(<Cell>Cell</Cell>);
    expect(container.querySelector('.cell')).toBeInTheDocument();
  });

  it('applies classPrefix when provided', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <Cell>Test content</Cell>
      </ConfigProvider>
    );
    expect(container.querySelector('.bulma-cell')).toBeInTheDocument();
    expect(container.querySelector('.cell')).not.toBeInTheDocument();
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Cell>Cell content</Cell>
        </ConfigProvider>
      );
      const cell = container.querySelector('.bulma-cell');
      expect(cell).toBeInTheDocument();
      expect(cell).toHaveClass('bulma-cell');
    });

    it('uses default classes when no prefix is provided', () => {
      const { container } = render(<Cell>Cell content</Cell>);
      const cell = container.querySelector('.cell');
      expect(cell).toBeInTheDocument();
      expect(cell).toHaveClass('cell');
    });

    it('uses default classes when classPrefix is undefined', () => {
      const { container } = render(
        <ConfigProvider classPrefix={undefined}>
          <Cell>Cell content</Cell>
        </ConfigProvider>
      );
      const cell = container.querySelector('.cell');
      expect(cell).toBeInTheDocument();
      expect(cell).toHaveClass('cell');
    });

    it('applies prefix to both main class and cell modifiers', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Cell colStart={2} colSpan={3} rowStart={1} textColor="primary">
            Cell content
          </Cell>
        </ConfigProvider>
      );
      const cell = container.querySelector('.bulma-cell');
      expect(cell).toBeInTheDocument();
      expect(cell).toHaveClass('bulma-cell');
      expect(cell).toHaveClass('bulma-is-col-start-2');
      expect(cell).toHaveClass('bulma-is-col-span-3');
      expect(cell).toHaveClass('bulma-is-row-start-1');
      expect(cell).toHaveClass('bulma-has-text-primary');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Cell colFromEnd={1} rowSpan={2} bgColor="danger">
          Cell content
        </Cell>
      );
      const cell = container.querySelector('.cell');
      expect(cell).toBeInTheDocument();
      expect(cell).toHaveClass('cell');
      expect(cell).toHaveClass('is-col-from-end-1');
      expect(cell).toHaveClass('is-row-span-2');
      expect(cell).toHaveClass('has-background-danger');
    });
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
