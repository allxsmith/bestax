import { render, screen } from '@testing-library/react';
import { Tbody, TbodyProps } from '../Tbody';
import { ConfigProvider } from '../../helpers/Config';

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

  describe('ClassPrefix', () => {
    it('applies prefix to helper classes when provided', () => {
      render(
        <table>
          <ConfigProvider classPrefix="bulma-">
            <Tbody m="2" p="3" data-testid="tbody">
              <tr>
                <td>Test</td>
              </tr>
            </Tbody>
          </ConfigProvider>
        </table>
      );
      const tbody = screen.getByTestId('tbody');
      expect(tbody).toHaveClass('bulma-m-2');
      expect(tbody).toHaveClass('bulma-p-3');
    });

    it('uses default helper classes when no prefix is provided', () => {
      render(
        <table>
          <Tbody m="2" p="3" data-testid="tbody">
            <tr>
              <td>Test</td>
            </tr>
          </Tbody>
        </table>
      );
      const tbody = screen.getByTestId('tbody');
      expect(tbody).toHaveClass('m-2');
      expect(tbody).toHaveClass('p-3');
    });

    it('uses default helper classes when classPrefix is undefined', () => {
      render(
        <table>
          <ConfigProvider classPrefix={undefined}>
            <Tbody m="2" p="3" data-testid="tbody">
              <tr>
                <td>Test</td>
              </tr>
            </Tbody>
          </ConfigProvider>
        </table>
      );
      const tbody = screen.getByTestId('tbody');
      expect(tbody).toHaveClass('m-2');
      expect(tbody).toHaveClass('p-3');
    });

    it('applies prefix to all helper classes', () => {
      render(
        <table>
          <ConfigProvider classPrefix="bulma-">
            <Tbody
              color="primary"
              textAlign="centered"
              m="4"
              data-testid="tbody"
            >
              <tr>
                <td>Test</td>
              </tr>
            </Tbody>
          </ConfigProvider>
        </table>
      );
      const tbody = screen.getByTestId('tbody');
      expect(tbody).toHaveClass('bulma-has-text-primary');
      expect(tbody).toHaveClass('bulma-has-text-centered');
      expect(tbody).toHaveClass('bulma-m-4');
    });

    it('works without prefix', () => {
      render(
        <table>
          <Tbody color="danger" textAlign="left" data-testid="tbody">
            <tr>
              <td>Test</td>
            </tr>
          </Tbody>
        </table>
      );
      const tbody = screen.getByTestId('tbody');
      expect(tbody).toHaveClass('has-text-danger');
      expect(tbody).toHaveClass('has-text-left');
    });
  });
});
