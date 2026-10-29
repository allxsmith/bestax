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
    expect(td).not.toHaveClass('has-text-left');
    expect(td).not.toHaveClass('has-text-right');
    expect(td).not.toHaveClass('has-text-centered');
  });

  test.each([
    ['left', 'has-text-left'],
    ['right', 'has-text-right'],
    ['centered', 'has-text-centered'],
  ])('applies alignment class for isAligned="%s"', (align, expectedClass) => {
    render(
      <table>
        <tbody>
          <tr>
            <Td
              {...defaultProps}
              isAligned={align as 'left' | 'right' | 'centered'}
            />
          </tr>
        </tbody>
      </table>
    );
    const td = screen.getByRole('cell', { name: 'Test' });
    expect(td).toHaveClass(expectedClass);
  });

  test('does not apply alignment class for invalid isAligned', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Td
              {...defaultProps}
              isAligned={'invalid' as unknown as TdProps['isAligned']}
            />
          </tr>
        </tbody>
      </table>
    );
    const td = screen.getByRole('cell', { name: 'Test' });
    expect(td).not.toHaveClass('has-text-invalid');
    expect(td).not.toHaveClass('has-text-left');
    expect(td).not.toHaveClass('has-text-right');
    expect(td).not.toHaveClass('has-text-centered');
  });

  test('applies alignment with color and other props', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Td
              {...defaultProps}
              color="primary"
              isAligned="centered"
              m="4"
              className="custom-td"
            />
          </tr>
        </tbody>
      </table>
    );
    const td = screen.getByRole('cell', { name: 'Test' });
    expect(td).toHaveClass('is-primary');
    expect(td).toHaveClass('has-text-centered');
    expect(td).toHaveClass('m-4');
    expect(td).toHaveClass('custom-td');
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

  test.each([
    ['isNarrow', 'is-narrow'],
    ['isVcentered', 'is-vcentered'],
  ])('applies %s as %s', (prop, expectedClass) => {
    render(
      <table>
        <tbody>
          <tr>
            <Td {...defaultProps} {...{ [prop]: true }} />
          </tr>
        </tbody>
      </table>
    );
    const td = screen.getByRole('cell', { name: 'Test' });
    expect(td).toHaveClass(expectedClass);
  });

  test('adds neither cell modifier by default', () => {
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
    expect(td).not.toHaveClass('is-narrow');
    expect(td).not.toHaveClass('is-vcentered');
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
      render(
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
      const td = screen.getByRole('cell', { name: 'Test' });
      expect(td).toHaveClass('my-prefix-is-primary');
    });

    it('uses default classes when no classPrefix provided', () => {
      render(
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
      const td = screen.getByRole('cell', { name: 'Test' });
      expect(td).toHaveClass('is-primary');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
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
      const td = screen.getByRole('cell', { name: 'Test' });
      expect(td).toHaveClass('is-primary');
    });

    it('applies classPrefix to alignment classes', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <table>
            <tbody>
              <tr>
                <Td isAligned="right">Test</Td>
              </tr>
            </tbody>
          </table>
        </ConfigProvider>
      );
      const td = screen.getByRole('cell', { name: 'Test' });
      expect(td).toHaveClass('my-prefix-has-text-right');
      expect(td).not.toHaveClass('has-text-right');
    });

    it('prefixes the cell modifiers', () => {
      render(
        <ConfigProvider classPrefix="bestax-">
          <table>
            <tbody>
              <tr>
                <Td isNarrow isVcentered>
                  Test
                </Td>
              </tr>
            </tbody>
          </table>
        </ConfigProvider>
      );
      const td = screen.getByRole('cell', { name: 'Test' });
      expect(td).toHaveClass('bestax-is-narrow', 'bestax-is-vcentered');
      expect(td).not.toHaveClass('is-narrow');
    });

    it('applies prefix to color, alignment and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <table>
            <tbody>
              <tr>
                <Td color="primary" isAligned="left" m="2" p="3">
                  Test Cell
                </Td>
              </tr>
            </tbody>
          </table>
        </ConfigProvider>
      );

      const td = screen.getByRole('cell', { name: 'Test Cell' });
      expect(td).toHaveClass('bulma-is-primary');
      expect(td).toHaveClass('bulma-has-text-left');
      expect(td).toHaveClass('bulma-m-2');
      expect(td).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      render(
        <table>
          <tbody>
            <tr>
              <Td color="info" isAligned="right" textAlign="centered">
                Standard Cell
              </Td>
            </tr>
          </tbody>
        </table>
      );

      const td = screen.getByRole('cell', { name: 'Standard Cell' });
      expect(td).toHaveClass('is-info');
      expect(td).toHaveClass('has-text-right');
      expect(td).toHaveClass('has-text-centered');
    });
  });
});
