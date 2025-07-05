import { render, screen } from '@testing-library/react';
import { Td, TdProps } from '../Td';

describe('Td Component', () => {
  const defaultProps: TdProps = {
    children: 'Test',
  };

  test('renders td with default props', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Td {...defaultProps} />
          </tr>
        </tbody>
      </table>
    );
    const td = screen.getByRole('cell', { name: 'Test' });
    expect(td).toBeInTheDocument();
    expect(td.tagName).toBe('TD');
  });

  test('applies color class (e.g., is-primary)', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Td {...defaultProps} color="primary" />
          </tr>
        </tbody>
      </table>
    );
    const td = screen.getByRole('cell', { name: 'Test' });
    expect(td).toHaveClass('is-primary');
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Td {...defaultProps} m="4" />
          </tr>
        </tbody>
      </table>
    );
    const td = screen.getByRole('cell', { name: 'Test' });
    expect(td).toHaveClass('m-4');
  });

  test('applies custom className', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Td {...defaultProps} className="custom-td" />
          </tr>
        </tbody>
      </table>
    );
    const td = screen.getByRole('cell', { name: 'Test' });
    expect(td).toHaveClass('custom-td');
  });

  test('forwards additional HTML attributes', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Td {...defaultProps} data-testid="custom-td" />
          </tr>
        </tbody>
      </table>
    );
    const td = screen.getByTestId('custom-td');
    expect(td).toBeInTheDocument();
    expect(td.tagName).toBe('TD');
  });

  test('renders children content', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Td {...defaultProps} />
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
