import { render, screen } from '@testing-library/react';
import { Thead, TheadProps } from '../Thead';

// Extend TheadProps to include data-testid
interface TestTheadProps extends TheadProps {
  'data-testid'?: string;
}

describe('Thead Component', () => {
  const defaultProps: TestTheadProps = {
    children: (
      <tr>
        <th>Test</th>
      </tr>
    ),
    'data-testid': 'thead-test',
  };

  test('renders thead with default props', () => {
    render(
      <table>
        <Thead {...defaultProps} />
      </table>
    );
    const thead = screen.getByTestId('thead-test');
    expect(thead).toBeInTheDocument();
    expect(thead.tagName).toBe('THEAD');
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(
      <table>
        <Thead {...defaultProps} m="4" />
      </table>
    );
    const thead = screen.getByTestId('thead-test');
    expect(thead).toHaveClass('m-4');
  });

  test('applies custom className', () => {
    render(
      <table>
        <Thead {...defaultProps} className="custom-thead" />
      </table>
    );
    const thead = screen.getByTestId('thead-test');
    expect(thead).toHaveClass('custom-thead');
  });

  test('forwards additional HTML attributes', () => {
    render(
      <table>
        <Thead {...defaultProps} data-testid="custom-thead" />
      </table>
    );
    const thead = screen.getByTestId('custom-thead');
    expect(thead).toBeInTheDocument();
    expect(thead.tagName).toBe('THEAD');
  });

  test('renders children content', () => {
    render(
      <table>
        <Thead {...defaultProps} />
      </table>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
