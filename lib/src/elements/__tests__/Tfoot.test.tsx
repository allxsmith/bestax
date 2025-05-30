import { render, screen } from '@testing-library/react';
import { Tfoot, TfootProps } from '../Tfoot';

// Extend TfootProps to include data-testid
interface TestTfootProps extends TfootProps {
  'data-testid'?: string;
}

describe('Tfoot Component', () => {
  const defaultProps: TestTfootProps = {
    children: (
      <tr>
        <td>Test</td>
      </tr>
    ),
    'data-testid': 'tfoot-test',
  };

  test('renders tfoot with default props', () => {
    render(
      <table>
        <Tfoot {...defaultProps} />
      </table>
    );
    const tfoot = screen.getByTestId('tfoot-test');
    expect(tfoot).toBeInTheDocument();
    expect(tfoot.tagName).toBe('TFOOT');
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(
      <table>
        <Tfoot {...defaultProps} m="4" />
      </table>
    );
    const tfoot = screen.getByTestId('tfoot-test');
    expect(tfoot).toHaveClass('m-4');
  });

  test('applies custom className', () => {
    render(
      <table>
        <Tfoot {...defaultProps} className="custom-tfoot" />
      </table>
    );
    const tfoot = screen.getByTestId('tfoot-test');
    expect(tfoot).toHaveClass('custom-tfoot');
  });

  test('forwards additional HTML attributes', () => {
    render(
      <table>
        <Tfoot {...defaultProps} data-testid="custom-tfoot" />
      </table>
    );
    const tfoot = screen.getByTestId('custom-tfoot');
    expect(tfoot).toBeInTheDocument();
    expect(tfoot.tagName).toBe('TFOOT');
  });

  test('renders children content', () => {
    render(
      <table>
        <Tfoot {...defaultProps} />
      </table>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
