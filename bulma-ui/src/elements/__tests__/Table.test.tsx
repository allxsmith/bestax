import { render, screen } from '@testing-library/react';
import { Table, TableProps } from '../Table';

describe('Table Component', () => {
  const defaultProps: TableProps = {
    children: (
      <tbody>
        <tr>
          <td>Test</td>
        </tr>
      </tbody>
    ),
  };

  test('renders table with default props', () => {
    render(<Table {...defaultProps} />);
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass('table');
    expect(table.parentElement).not.toHaveClass('table-container');

    // Verify the table is not wrapped in a div with table-container
    expect(table.closest('.table-container')).toBeNull();
  });

  test('applies Bulma modifier classes', () => {
    render(
      <Table
        {...defaultProps}
        isBordered
        isStriped
        isNarrow
        isHoverable
        isFullwidth
      />
    );
    const table = screen.getByRole('table');
    expect(table).toHaveClass(
      'table is-bordered is-striped is-narrow is-hoverable is-fullwidth'
    );
  });

  test('wraps in table-container when isResponsive is true', () => {
    render(<Table {...defaultProps} isResponsive />);
    const table = screen.getByRole('table');
    expect(table.parentElement).toHaveClass('table-container');
    expect(table.parentElement?.tagName).toBe('DIV');
  });

  test('does not wrap in div when isResponsive is false', () => {
    render(<Table {...defaultProps} isResponsive={false} />);
    const table = screen.getByRole('table');
    expect(table).not.toHaveClass('table-container');
    // Check if the table is not wrapped in a table-container

    expect(table.closest('.table-container')).toBeNull();
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(<Table {...defaultProps} m="4" />);
    const table = screen.getByRole('table');
    expect(table).toHaveClass('table m-4');
  });

  test('applies custom className', () => {
    render(<Table {...defaultProps} className="custom-table" />);
    const table = screen.getByRole('table');
    expect(table).toHaveClass('table custom-table');
  });

  test('forwards additional HTML attributes', () => {
    render(<Table {...defaultProps} data-testid="custom-table" />);
    const table = screen.getByTestId('custom-table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass('table');
  });

  test('renders children content', () => {
    render(<Table {...defaultProps} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
