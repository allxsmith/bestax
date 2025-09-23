import { render, screen } from '@testing-library/react';
import { Thead, TheadProps } from '../Thead';
import { ConfigProvider } from '../../helpers/Config';

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

  describe('ClassPrefix', () => {
    it('applies prefix to helper classes when provided', () => {
      render(
        <table>
          <ConfigProvider classPrefix="bulma-">
            <Thead m="2" p="3" data-testid="thead">
              <tr>
                <th>Test</th>
              </tr>
            </Thead>
          </ConfigProvider>
        </table>
      );
      const thead = screen.getByTestId('thead');
      expect(thead).toHaveClass('bulma-m-2');
      expect(thead).toHaveClass('bulma-p-3');
    });

    it('uses default helper classes when no prefix is provided', () => {
      render(
        <table>
          <Thead m="2" p="3" data-testid="thead">
            <tr>
              <th>Test</th>
            </tr>
          </Thead>
        </table>
      );
      const thead = screen.getByTestId('thead');
      expect(thead).toHaveClass('m-2');
      expect(thead).toHaveClass('p-3');
    });

    it('uses default helper classes when classPrefix is undefined', () => {
      render(
        <table>
          <ConfigProvider classPrefix={undefined}>
            <Thead m="2" p="3" data-testid="thead">
              <tr>
                <th>Test</th>
              </tr>
            </Thead>
          </ConfigProvider>
        </table>
      );
      const thead = screen.getByTestId('thead');
      expect(thead).toHaveClass('m-2');
      expect(thead).toHaveClass('p-3');
    });

    it('applies prefix to all helper classes', () => {
      render(
        <table>
          <ConfigProvider classPrefix="bulma-">
            <Thead
              color="primary"
              textAlign="centered"
              m="4"
              data-testid="thead"
            >
              <tr>
                <th>Test</th>
              </tr>
            </Thead>
          </ConfigProvider>
        </table>
      );
      const thead = screen.getByTestId('thead');
      expect(thead).toHaveClass('bulma-has-text-primary');
      expect(thead).toHaveClass('bulma-has-text-centered');
      expect(thead).toHaveClass('bulma-m-4');
    });

    it('works without prefix', () => {
      render(
        <table>
          <Thead color="danger" textAlign="left" data-testid="thead">
            <tr>
              <th>Test</th>
            </tr>
          </Thead>
        </table>
      );
      const thead = screen.getByTestId('thead');
      expect(thead).toHaveClass('has-text-danger');
      expect(thead).toHaveClass('has-text-left');
    });
  });
});
