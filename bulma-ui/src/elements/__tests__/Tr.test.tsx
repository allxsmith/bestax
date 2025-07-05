import { render, screen } from '@testing-library/react';
import { Tr, TrProps } from '../Tr';

describe('Tr Component', () => {
  const defaultProps: TrProps = {
    children: <td>Test</td>,
  };

  test('renders tr with default props', () => {
    render(
      <table>
        <tbody>
          <Tr {...defaultProps} />
        </tbody>
      </table>
    );
    const tr = screen.getByRole('row', { name: /Test/i });
    expect(tr).toBeInTheDocument();
    expect(tr.tagName).toBe('TR');
    expect(tr).not.toHaveClass('is-selected');
  });

  test('applies color class (e.g., is-primary)', () => {
    render(
      <table>
        <tbody>
          <Tr {...defaultProps} color="primary" />
        </tbody>
      </table>
    );
    const tr = screen.getByRole('row', { name: /Test/i });
    expect(tr).toHaveClass('is-primary');
  });

  test('applies is-selected class when isSelected is true', () => {
    render(
      <table>
        <tbody>
          <Tr {...defaultProps} isSelected />
        </tbody>
      </table>
    );
    const tr = screen.getByRole('row', { name: /Test/i });
    expect(tr).toHaveClass('is-selected');
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(
      <table>
        <tbody>
          <Tr {...defaultProps} m="4" />
        </tbody>
      </table>
    );
    const tr = screen.getByRole('row', { name: /Test/i });
    expect(tr).toHaveClass('m-4');
  });

  test('applies custom className', () => {
    render(
      <table>
        <tbody>
          <Tr {...defaultProps} className="custom-tr" />
        </tbody>
      </table>
    );
    const tr = screen.getByRole('row', { name: /Test/i });
    expect(tr).toHaveClass('custom-tr');
  });

  test('forwards additional HTML attributes', () => {
    render(
      <table>
        <tbody>
          <Tr {...defaultProps} data-testid="custom-tr" />
        </tbody>
      </table>
    );
    const tr = screen.getByTestId('custom-tr');
    expect(tr).toBeInTheDocument();
    expect(tr.tagName).toBe('TR');
  });

  test('renders children content', () => {
    render(
      <table>
        <tbody>
          <Tr {...defaultProps} />
        </tbody>
      </table>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
