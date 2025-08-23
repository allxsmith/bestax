import { render, screen } from '@testing-library/react';
import { Tfoot, TfootProps } from '../Tfoot';
import { ConfigProvider } from '../../helpers/Config';

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

  describe('ClassPrefix', () => {
    it('applies prefix to helper classes when provided', () => {
      render(
        <table>
          <ConfigProvider classPrefix="bulma-">
            <Tfoot m="2" p="3" data-testid="tfoot">
              <tr>
                <td>Test</td>
              </tr>
            </Tfoot>
          </ConfigProvider>
        </table>
      );
      const tfoot = screen.getByTestId('tfoot');
      expect(tfoot).toHaveClass('bulma-m-2');
      expect(tfoot).toHaveClass('bulma-p-3');
    });

    it('uses default helper classes when no prefix is provided', () => {
      render(
        <table>
          <Tfoot m="2" p="3" data-testid="tfoot">
            <tr>
              <td>Test</td>
            </tr>
          </Tfoot>
        </table>
      );
      const tfoot = screen.getByTestId('tfoot');
      expect(tfoot).toHaveClass('m-2');
      expect(tfoot).toHaveClass('p-3');
    });

    it('uses default helper classes when classPrefix is undefined', () => {
      render(
        <table>
          <ConfigProvider classPrefix={undefined}>
            <Tfoot m="2" p="3" data-testid="tfoot">
              <tr>
                <td>Test</td>
              </tr>
            </Tfoot>
          </ConfigProvider>
        </table>
      );
      const tfoot = screen.getByTestId('tfoot');
      expect(tfoot).toHaveClass('m-2');
      expect(tfoot).toHaveClass('p-3');
    });

    it('applies prefix to all helper classes', () => {
      render(
        <table>
          <ConfigProvider classPrefix="bulma-">
            <Tfoot
              color="primary"
              textAlign="centered"
              m="4"
              data-testid="tfoot"
            >
              <tr>
                <td>Test</td>
              </tr>
            </Tfoot>
          </ConfigProvider>
        </table>
      );
      const tfoot = screen.getByTestId('tfoot');
      expect(tfoot).toHaveClass('bulma-has-text-primary');
      expect(tfoot).toHaveClass('bulma-has-text-centered');
      expect(tfoot).toHaveClass('bulma-m-4');
    });

    it('works without prefix', () => {
      render(
        <table>
          <Tfoot color="danger" textAlign="left" data-testid="tfoot">
            <tr>
              <td>Test</td>
            </tr>
          </Tfoot>
        </table>
      );
      const tfoot = screen.getByTestId('tfoot');
      expect(tfoot).toHaveClass('has-text-danger');
      expect(tfoot).toHaveClass('has-text-left');
    });
  });
});
