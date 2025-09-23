import { render, screen } from '@testing-library/react';
import { Tr, TrProps } from '../Tr';
import { ConfigProvider } from '../../helpers/Config';

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

  describe('ClassPrefix', () => {
    it('applies classPrefix to modifier classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="my-prefix-">
          <table>
            <tbody>
              <Tr color="primary" isSelected>
                <td>Test</td>
              </Tr>
            </tbody>
          </table>
        </ConfigProvider>
      );
      const tr = container.querySelector('tr');
      expect(tr).toHaveClass('my-prefix-is-primary');
      expect(tr).toHaveClass('my-prefix-is-selected');
    });

    it('uses default classes when no classPrefix provided', () => {
      const { container } = render(
        <ConfigProvider>
          <table>
            <tbody>
              <Tr color="primary" isSelected>
                <td>Test</td>
              </Tr>
            </tbody>
          </table>
        </ConfigProvider>
      );
      const tr = container.querySelector('tr');
      expect(tr).toHaveClass('is-primary');
      expect(tr).toHaveClass('is-selected');
    });

    it('uses default classes when classPrefix is undefined', () => {
      const { container } = render(
        <ConfigProvider classPrefix={undefined}>
          <table>
            <tbody>
              <Tr color="primary" isSelected>
                <td>Test</td>
              </Tr>
            </tbody>
          </table>
        </ConfigProvider>
      );
      const tr = container.querySelector('tr');
      expect(tr).toHaveClass('is-primary');
      expect(tr).toHaveClass('is-selected');
    });

    it('applies prefix to both modifier and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <table>
            <tbody>
              <Tr color="primary" isSelected m="2" p="3">
                <td>Test Row</td>
              </Tr>
            </tbody>
          </table>
        </ConfigProvider>
      );

      const tr = container.querySelector('tr');
      expect(tr).toHaveClass('bulma-is-primary');
      expect(tr).toHaveClass('bulma-is-selected');
      expect(tr).toHaveClass('bulma-m-2');
      expect(tr).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      const { container } = render(
        <table>
          <tbody>
            <Tr color="info" isSelected textAlign="centered">
              <td>Standard Row</td>
            </Tr>
          </tbody>
        </table>
      );

      const tr = container.querySelector('tr');
      expect(tr).toHaveClass('is-info');
      expect(tr).toHaveClass('is-selected');
      expect(tr).toHaveClass('has-text-centered');
    });
  });
});
