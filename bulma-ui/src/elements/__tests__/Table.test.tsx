import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { Table, TableProps } from '../Table';
import { Thead } from '../Thead';
import { Tbody } from '../Tbody';
import { Tfoot } from '../Tfoot';
import { Tr } from '../Tr';
import { Th } from '../Th';
import { Td } from '../Td';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';

describe('Table Component', () => {
  const defaultProps: TableProps = {
    children: (
      <tbody>
        <tr>
          <td>Test</td>
        </tr>
      </tbody>
    ),
  };

  test('renders table with default props', () => {
    render(<Table {...defaultProps} />);
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass('table');
    expect(table.parentElement).not.toHaveClass('table-container');

    // Verify the table is not wrapped in a div with table-container
    expect(table.closest('.table-container')).toBeNull();
  });

  test('applies Bulma modifier classes', () => {
    render(
      <Table
        {...defaultProps}
        isBordered
        isStriped
        isNarrow
        isHoverable
        isFullwidth
      />
    );
    const table = screen.getByRole('table');
    expect(table).toHaveClass(
      'table is-bordered is-striped is-narrow is-hoverable is-fullwidth'
    );
  });

  test('wraps in table-container when isResponsive is true', () => {
    render(<Table {...defaultProps} isResponsive />);
    const table = screen.getByRole('table');
    expect(table.parentElement).toHaveClass('table-container');
    expect(table.parentElement?.tagName).toBe('DIV');
  });

  test('does not wrap in div when isResponsive is false', () => {
    render(<Table {...defaultProps} isResponsive={false} />);
    const table = screen.getByRole('table');
    expect(table).not.toHaveClass('table-container');
    // Check if the table is not wrapped in a table-container

    expect(table.closest('.table-container')).toBeNull();
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(<Table {...defaultProps} m="4" />);
    const table = screen.getByRole('table');
    expect(table).toHaveClass('table m-4');
  });

  test('applies custom className', () => {
    render(<Table {...defaultProps} className="custom-table" />);
    const table = screen.getByRole('table');
    expect(table).toHaveClass('table custom-table');
  });

  test('forwards additional HTML attributes', () => {
    render(<Table {...defaultProps} data-testid="custom-table" />);
    const table = screen.getByTestId('custom-table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass('table');
  });

  test('renders children content', () => {
    render(<Table {...defaultProps} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  describe('ClassPrefix', () => {
    it('applies classPrefix to main table class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <Table {...defaultProps} />
        </ConfigProvider>
      );
      const table = screen.getByRole('table');
      expect(table).toHaveClass('my-prefix-table');
    });

    it('applies classPrefix to table-container when responsive', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <Table {...defaultProps} isResponsive />
        </ConfigProvider>
      );
      const table = screen.getByRole('table');
      expect(table).toHaveClass('my-prefix-table');
      expect(table.parentElement).toHaveClass('my-prefix-table-container');
    });

    it('uses default classes when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Table {...defaultProps} isResponsive />
        </ConfigProvider>
      );
      const table = screen.getByRole('table');
      expect(table).toHaveClass('table');
      expect(table.parentElement).toHaveClass('table-container');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Table {...defaultProps} />
        </ConfigProvider>
      );
      const table = screen.getByRole('table');
      expect(table).toHaveClass('table');
    });

    it('applies prefix to both main class and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Table isBordered isStriped isNarrow isResponsive m="2">
            <tbody>
              <tr>
                <td>Test Cell</td>
              </tr>
            </tbody>
          </Table>
        </ConfigProvider>
      );

      const tableContainer = container.querySelector('.bulma-table-container');
      expect(tableContainer).toBeInTheDocument();

      const table = screen.getByRole('table');
      expect(table).toHaveClass('bulma-table');
      expect(table).toHaveClass('bulma-is-bordered');
      expect(table).toHaveClass('bulma-is-striped');
      expect(table).toHaveClass('bulma-is-narrow');
      expect(table).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Table isBordered isHoverable isResponsive p="3">
          <tbody>
            <tr>
              <td>Standard Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const tableContainer = container.querySelector('.table-container');
      expect(tableContainer).toBeInTheDocument();

      const table = screen.getByRole('table');
      expect(table).toHaveClass('table');
      expect(table).toHaveClass('is-bordered');
      expect(table).toHaveClass('is-hoverable');
      expect(table).toHaveClass('p-3');
    });
  });
});

describe('Compound components', () => {
  test('statics are the separately exported components', () => {
    expect(Table.Thead).toBe(Thead);
    expect(Table.Tbody).toBe(Tbody);
    expect(Table.Tfoot).toBe(Tfoot);
    expect(Table.Tr).toBe(Tr);
    expect(Table.Th).toBe(Th);
    expect(Table.Td).toBe(Td);
  });

  test('renders a full table through the dot path', () => {
    render(
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>Alice</Table.Td>
          </Table.Tr>
        </Table.Tbody>
        <Table.Tfoot>
          <Table.Tr>
            <Table.Td>Total</Table.Td>
          </Table.Tr>
        </Table.Tfoot>
      </Table>
    );
    expect(screen.getByRole('table')).toHaveClass('table');
    expect(screen.getByText('Name').tagName).toBe('TH');
    expect(screen.getByText('Alice').closest('tbody')).not.toBeNull();
    expect(screen.getByText('Total').closest('tfoot')).not.toBeNull();
  });
});

describe('Table subcomponents without an empty class attribute', () => {
  test('Thead renders no class attribute without props', () => {
    render(
      <table>
        <Thead data-testid="thead">
          <tr>
            <th>H</th>
          </tr>
        </Thead>
      </table>
    );
    expect(screen.getByTestId('thead')).not.toHaveAttribute('class');
  });

  test('Tbody renders no class attribute without props', () => {
    render(
      <table>
        <Tbody data-testid="tbody">
          <tr>
            <td>B</td>
          </tr>
        </Tbody>
      </table>
    );
    expect(screen.getByTestId('tbody')).not.toHaveAttribute('class');
  });

  test('Tfoot renders no class attribute without props', () => {
    render(
      <table>
        <Tfoot data-testid="tfoot">
          <tr>
            <td>F</td>
          </tr>
        </Tfoot>
      </table>
    );
    expect(screen.getByTestId('tfoot')).not.toHaveAttribute('class');
  });

  test('Tr renders no class attribute without props', () => {
    render(
      <table>
        <tbody>
          <Tr data-testid="tr">
            <td>R</td>
          </Tr>
        </tbody>
      </table>
    );
    expect(screen.getByTestId('tr')).not.toHaveAttribute('class');
  });

  test('Th renders no class attribute without props', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th data-testid="th">H</Th>
          </tr>
        </thead>
      </table>
    );
    expect(screen.getByTestId('th')).not.toHaveAttribute('class');
  });

  test('Td renders no class attribute without props', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Td data-testid="td">D</Td>
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByTestId('td')).not.toHaveAttribute('class');
  });
});

describe('Table fullwidth aliases', () => {
  const body = (
    <tbody>
      <tr>
        <td>Cell</td>
      </tr>
    </tbody>
  );

  it('applies is-fullwidth via the canonical isFullwidth prop', () => {
    render(<Table isFullwidth>{body}</Table>);
    expect(screen.getByRole('table')).toHaveClass('is-fullwidth');
  });

  it('applies is-fullwidth via the deprecated isFullWidth prop', () => {
    render(<Table isFullWidth>{body}</Table>);
    expect(screen.getByRole('table')).toHaveClass('is-fullwidth');
  });

  it('isFullwidth wins when both spellings are set', () => {
    render(
      <Table isFullwidth={false} isFullWidth>
        {body}
      </Table>
    );
    expect(screen.getByRole('table')).not.toHaveClass('is-fullwidth');
  });

  it('does not leak the deprecated alias onto the DOM', () => {
    render(<Table isFullWidth>{body}</Table>);
    expect(screen.getByRole('table')).not.toHaveAttribute('isFullWidth');
  });

  it('applies the class prefix to is-fullwidth', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <Table isFullwidth>{body}</Table>
      </ConfigProvider>
    );
    expect(screen.getByRole('table')).toHaveClass('bestax-is-fullwidth');
  });
});

describe('isResponsive from the keyboard (#1839)', () => {
  // jsdom lays nothing out, so the container's widths come from `widths`,
  // which each test sets before it renders or before it scrolls.
  const widths = { scrollWidth: 200, clientWidth: 200 };
  type Width = keyof typeof widths;
  const saved = new Map<Width, PropertyDescriptor | undefined>();
  const isContainer = (el: Element) =>
    el.classList.contains('table-container') ||
    el.classList.contains('bestax-table-container');

  beforeAll(() => {
    for (const key of Object.keys(widths) as Width[]) {
      saved.set(
        key,
        Object.getOwnPropertyDescriptor(HTMLElement.prototype, key)
      );
      Object.defineProperty(HTMLElement.prototype, key, {
        configurable: true,
        get(this: HTMLElement) {
          return isContainer(this) ? widths[key] : 0;
        },
      });
    }
  });

  afterAll(() => {
    for (const [key, descriptor] of saved) {
      if (descriptor)
        Object.defineProperty(HTMLElement.prototype, key, descriptor);
      else
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
          key
        ];
    }
  });

  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    Object.assign(widths, { scrollWidth: 200, clientWidth: 200 });
    resetDevWarnings();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  const overflow = () =>
    Object.assign(widths, { scrollWidth: 600, clientWidth: 200 });
  const fit = () =>
    Object.assign(widths, { scrollWidth: 200, clientWidth: 200 });

  const rows = (
    <Tbody>
      <Tr>
        <Td>Ice Wolves</Td>
        <Td>32</Td>
      </Tr>
    </Tbody>
  );

  it('makes an overflowing container a region you can tab to, named as the table is', () => {
    overflow();
    render(
      <Table isResponsive aria-label="Scores">
        {rows}
      </Table>
    );
    const region = screen.getByRole('region', { name: 'Scores' });
    expect(region).toHaveClass('table-container');
    expect(region).toHaveAttribute('tabindex', '0');
    // The table keeps its own role and name.
    expect(screen.getByRole('table', { name: 'Scores' }).parentElement).toBe(
      region
    );
  });

  it('takes the name from the table’s aria-labelledby', () => {
    overflow();
    render(
      <>
        <h2 id="scores-heading">Scores</h2>
        <Table isResponsive aria-labelledby="scores-heading">
          {rows}
        </Table>
      </>
    );
    const region = screen.getByRole('region', { name: 'Scores' });
    expect(region).toHaveAttribute('aria-labelledby', 'scores-heading');
    expect(screen.getByRole('table', { name: 'Scores' })).toBeInTheDocument();
  });

  it('leaves a container the table fits in a plain div, with no tab stop', () => {
    render(
      <Table isResponsive aria-label="Scores">
        {rows}
      </Table>
    );
    const container = screen.getByRole('table').parentElement!;
    expect(container).toHaveClass('table-container');
    expect(screen.queryByRole('region')).toBeNull();
    expect(container).not.toHaveAttribute('tabindex');
    expect(container).not.toHaveAttribute('role');
    expect(container).not.toHaveAttribute('aria-label');
    expect(warn).not.toHaveBeenCalled();
  });

  it('goes back to a plain div when the table stops overflowing', () => {
    overflow();
    render(
      <Table isResponsive aria-label="Scores">
        {rows}
      </Table>
    );
    const container = screen.getByRole('region', { name: 'Scores' });
    fit();
    fireEvent.scroll(container);
    expect(screen.queryByRole('region')).toBeNull();
    expect(container).not.toHaveAttribute('tabindex');
    expect(container).not.toHaveAttribute('aria-label');
  });

  it('keeps the tab stop while it has focus, and drops it once focus leaves', () => {
    overflow();
    render(
      <Table isResponsive aria-label="Scores">
        {rows}
      </Table>
    );
    const container = screen.getByRole('region', { name: 'Scores' });
    act(() => container.focus());
    fit();
    fireEvent.scroll(container);
    expect(container).toHaveAttribute('tabindex', '0');
    expect(container).toHaveFocus();
    act(() => container.blur());
    expect(container).not.toHaveAttribute('tabindex');
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('warns once in development when it overflows with no name', () => {
    overflow();
    render(<Table isResponsive>{rows}</Table>);
    render(<Table isResponsive>{rows}</Table>);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/<Table isResponsive>.*aria-label/);
  });

  it('does not warn for a named table', () => {
    overflow();
    render(
      <Table isResponsive aria-label="Scores">
        {rows}
      </Table>
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps the class prefix on the region', () => {
    overflow();
    render(
      <ConfigProvider classPrefix="bestax-">
        <Table isResponsive aria-label="Scores">
          {rows}
        </Table>
      </ConfigProvider>
    );
    expect(screen.getByRole('region', { name: 'Scores' })).toHaveClass(
      'bestax-table-container'
    );
  });

  it('renders a plain container on the server', () => {
    overflow();
    const html = renderToString(
      <Table isResponsive aria-label="Scores">
        {rows}
      </Table>
    );
    expect(html).toContain('<div class="table-container"><table');
    expect(html).not.toContain('role="region"');
    expect(html).not.toContain('tabindex');
  });
});
