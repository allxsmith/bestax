import { render, screen } from '@testing-library/react';
import { Td, TdProps } from '../Td';
import { ConfigProvider } from '../../helpers/Config';

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

  describe('ClassPrefix', () => {
    it('applies classPrefix to color classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="my-prefix-">
          <table>
            <tbody>
              <tr>
                <Td color="primary">Test</Td>
              </tr>
            </tbody>
          </table>
        </ConfigProvider>
      );
      const td = container.querySelector('td');
      expect(td).toHaveClass('my-prefix-is-primary');
    });

    it('uses default classes when no classPrefix provided', () => {
      const { container } = render(
        <ConfigProvider>
          <table>
            <tbody>
              <tr>
                <Td color="primary">Test</Td>
              </tr>
            </tbody>
          </table>
        </ConfigProvider>
      );
      const td = container.querySelector('td');
      expect(td).toHaveClass('is-primary');
    });

    it('uses default classes when classPrefix is undefined', () => {
      const { container } = render(
        <ConfigProvider classPrefix={undefined}>
          <table>
            <tbody>
              <tr>
                <Td color="primary">Test</Td>
              </tr>
            </tbody>
          </table>
        </ConfigProvider>
      );
      const td = container.querySelector('td');
      expect(td).toHaveClass('is-primary');
    });

    it('applies prefix to both color and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <table>
            <tbody>
              <tr>
                <Td color="primary" m="2" p="3">
                  Test Cell
                </Td>
              </tr>
            </tbody>
          </table>
        </ConfigProvider>
      );

      const td = container.querySelector('td');
      expect(td).toHaveClass('bulma-is-primary');
      expect(td).toHaveClass('bulma-m-2');
      expect(td).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <Td color="info" textAlign="centered">
                Standard Cell
              </Td>
            </tr>
          </tbody>
        </table>
      );

      const td = container.querySelector('td');
      expect(td).toHaveClass('is-info');
      expect(td).toHaveClass('has-text-centered');
    });
  });
});
