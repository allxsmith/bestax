import { render, screen } from '@testing-library/react';
import { Tbody, TbodyProps } from '../Tbody';

// Extend TbodyProps to include data-testid
interface TestTbodyProps extends TbodyProps {
  'data-testid'?: string;
}

describe('Tbody Component', () => {
  const defaultProps: TestTbodyProps = {
    children: (
      <tr>
        <td>Test</td>
      </tr>
    ),
    'data-testid': 'tbody-test',
  };

  test('renders tbody with default props', () => {
    render(
      <table>
        <Tbody {...defaultProps} />
      </table>
    );
    const tbody = screen.getByTestId('tbody-test');
    expect(tbody).toBeInTheDocument();
    expect(tbody.tagName).toBe('TBODY');
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(
      <table>
        <Tbody {...defaultProps} m="4" />
      </table>
    );
    const tbody = screen.getByTestId('tbody-test');
    expect(tbody).toHaveClass('m-4');
  });

  test('applies custom className', () => {
    render(
      <table>
        <Tbody {...defaultProps} className="custom-tbody" />
      </table>
    );
    const tbody = screen.getByTestId('tbody-test');
    expect(tbody).toHaveClass('custom-tbody');
  });

  test('forwards additional HTML attributes', () => {
    render(
      <table>
        <Tbody {...defaultProps} data-testid="custom-tbody" />
      </table>
    );
    const tbody = screen.getByTestId('custom-tbody');
    expect(tbody).toBeInTheDocument();
    expect(tbody.tagName).toBe('TBODY');
  });

  test('renders children content', () => {
    render(
      <table>
        <Tbody {...defaultProps} />
      </table>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
