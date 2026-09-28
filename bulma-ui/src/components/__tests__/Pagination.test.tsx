import { render, screen, fireEvent } from '@testing-library/react';
import Pagination, {
  PaginationLink,
  PaginationList,
  PaginationEllipsis,
  PaginationPrevious,
  PaginationNext,
} from '../Pagination';
import { ConfigProvider } from '../../helpers/Config';
import { resetColorDeprecationWarnings } from '../../helpers/colorDeprecations';

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  resetColorDeprecationWarnings();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe('Pagination', () => {
  it('renders nav with pagination class', () => {
    render(<Pagination data-testid="pagination" />);
    expect(screen.getByTestId('pagination')).toHaveClass('pagination');
    expect(screen.getByRole('navigation')).toHaveAttribute(
      'aria-label',
      'pagination'
    );
  });

  it('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <Pagination data-testid="pagination" />
      </ConfigProvider>
    );
    const pagination = screen.getByTestId('pagination');
    expect(pagination).toHaveClass('bulma-pagination');
    expect(pagination).not.toHaveClass('pagination');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Pagination data-testid="pagination" />
        </ConfigProvider>
      );
      const pagination = screen.getByTestId('pagination');
      expect(pagination).toHaveClass('bulma-pagination');
    });

    it('uses default classes when no prefix is provided', () => {
      render(<Pagination data-testid="pagination" />);
      const pagination = screen.getByTestId('pagination');
      expect(pagination).toHaveClass('pagination');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Pagination data-testid="pagination" />
        </ConfigProvider>
      );
      const pagination = screen.getByTestId('pagination');
      expect(pagination).toHaveClass('pagination');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Pagination color="primary" m="2" data-testid="pagination" />
        </ConfigProvider>
      );
      const pagination = screen.getByTestId('pagination');
      expect(pagination).toHaveClass('bulma-pagination');
      expect(pagination).toHaveClass('bulma-is-primary');
      expect(pagination).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(<Pagination color="danger" data-testid="pagination" />);
      const pagination = screen.getByTestId('pagination');
      expect(pagination).toHaveClass('pagination');
      expect(pagination).toHaveClass('is-danger');
    });
  });

  it('applies color and size classes', () => {
    render(
      <Pagination color="primary" size="large" data-testid="pagination" />
    );
    expect(screen.getByTestId('pagination')).toHaveClass('is-primary');
    expect(screen.getByTestId('pagination')).toHaveClass('is-large');
  });

  it('applies align and rounded classes', () => {
    render(<Pagination align="centered" rounded data-testid="pagination" />);
    expect(screen.getByTestId('pagination')).toHaveClass('is-centered');
    expect(screen.getByTestId('pagination')).toHaveClass('is-rounded');
  });

  it('accepts custom className', () => {
    render(
      <Pagination className="custom-pagination" data-testid="pagination" />
    );
    expect(screen.getByTestId('pagination')).toHaveClass('custom-pagination');
  });

  it('renders children', () => {
    render(
      <Pagination>
        <span data-testid="child">Child</span>
      </Pagination>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

describe('Pagination.List', () => {
  it('renders ul with pagination-list class', () => {
    render(<Pagination.List data-testid="list" />);
    expect(screen.getByTestId('list')).toHaveClass('pagination-list');
  });

  it('accepts custom className', () => {
    render(<Pagination.List className="custom-list" data-testid="list" />);
    expect(screen.getByTestId('list')).toHaveClass('custom-list');
  });

  it('renders children', () => {
    render(
      <Pagination.List>
        <li data-testid="child">Child</li>
      </Pagination.List>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

describe('Pagination.Link', () => {
  it('renders pagination link', () => {
    render(
      <Pagination.List>
        <Pagination.Link data-testid="link">1</Pagination.Link>
      </Pagination.List>
    );
    const link = screen.getByTestId('link');
    expect(link).toHaveClass('pagination-link');
    expect(link).toHaveTextContent('1');
  });

  it('renders as current (active) page', () => {
    render(
      <Pagination.List>
        <Pagination.Link active data-testid="link">
          2
        </Pagination.Link>
      </Pagination.List>
    );
    const link = screen.getByTestId('link');
    expect(link).toHaveClass('is-current');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('renders as disabled', () => {
    render(
      <Pagination.List>
        <Pagination.Link disabled data-testid="link">
          Prev
        </Pagination.Link>
      </Pagination.List>
    );
    const link = screen.getByTestId('link');
    expect(link).toHaveClass('is-disabled');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
  });

  it('calls onClick when not disabled', () => {
    const handleClick = jest.fn();
    render(
      <Pagination.List>
        <Pagination.Link data-testid="link" onClick={handleClick}>
          3
        </Pagination.Link>
      </Pagination.List>
    );
    fireEvent.click(screen.getByTestId('link'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(
      <Pagination.List>
        <Pagination.Link disabled data-testid="link" onClick={handleClick}>
          3
        </Pagination.Link>
      </Pagination.List>
    );
    fireEvent.click(screen.getByTestId('link'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not throw when clicked without an onClick handler (covers the if-onClick branch)', () => {
    render(
      <Pagination.List>
        <Pagination.Link data-testid="link">3</Pagination.Link>
      </Pagination.List>
    );
    expect(() => fireEvent.click(screen.getByTestId('link'))).not.toThrow();
  });
});

describe('Pagination.Ellipsis', () => {
  it('renders ellipsis', () => {
    render(
      <Pagination.List>
        <Pagination.Ellipsis data-testid="ellipsis" />
      </Pagination.List>
    );
    const ellipsis = screen.getByTestId('ellipsis');
    expect(ellipsis).toBeInTheDocument();
    expect(ellipsis).toHaveClass('pagination-ellipsis');
    expect(ellipsis).toHaveTextContent('…');
  });
});

// Tests for Pagination.Previous and Pagination.Next
describe('Pagination.Previous', () => {
  it('renders previous button with correct class', () => {
    render(
      <Pagination.Previous data-testid="prev">Previous</Pagination.Previous>
    );
    const prev = screen.getByTestId('prev');
    expect(prev).toHaveClass('pagination-previous');
    expect(prev).toHaveTextContent('Previous');
  });

  it('applies disabled state', () => {
    render(
      <Pagination.Previous data-testid="prev" disabled>
        Previous
      </Pagination.Previous>
    );
    const prev = screen.getByTestId('prev');
    expect(prev).toHaveClass('is-disabled');
    expect(prev).toHaveAttribute('aria-disabled', 'true');
    expect(prev).toHaveAttribute('tabindex', '-1');
  });

  it('calls onClick when not disabled', () => {
    const handleClick = jest.fn();
    render(
      <Pagination.Previous data-testid="prev" onClick={handleClick}>
        Previous
      </Pagination.Previous>
    );
    fireEvent.click(screen.getByTestId('prev'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(
      <Pagination.Previous data-testid="prev" disabled onClick={handleClick}>
        Previous
      </Pagination.Previous>
    );
    fireEvent.click(screen.getByTestId('prev'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe('Pagination.Next', () => {
  it('renders next button with correct class', () => {
    render(<Pagination.Next data-testid="next">Next</Pagination.Next>);
    const next = screen.getByTestId('next');
    expect(next).toHaveClass('pagination-next');
    expect(next).toHaveTextContent('Next');
  });

  it('applies disabled state', () => {
    render(
      <Pagination.Next data-testid="next" disabled>
        Next
      </Pagination.Next>
    );
    const next = screen.getByTestId('next');
    expect(next).toHaveClass('is-disabled');
    expect(next).toHaveAttribute('aria-disabled', 'true');
    expect(next).toHaveAttribute('tabindex', '-1');
  });

  it('calls onClick when not disabled', () => {
    const handleClick = jest.fn();
    render(
      <Pagination.Next data-testid="next" onClick={handleClick}>
        Next
      </Pagination.Next>
    );
    fireEvent.click(screen.getByTestId('next'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(
      <Pagination.Next data-testid="next" disabled onClick={handleClick}>
        Next
      </Pagination.Next>
    );
    fireEvent.click(screen.getByTestId('next'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe('Compound components', () => {
  it('exposes the named exports as statics', () => {
    expect(Pagination.Link).toBe(PaginationLink);
    expect(Pagination.List).toBe(PaginationList);
    expect(Pagination.Ellipsis).toBe(PaginationEllipsis);
    expect(Pagination.Previous).toBe(PaginationPrevious);
    expect(Pagination.Next).toBe(PaginationNext);
  });

  it('renders pagination through the dot path', () => {
    const { container } = render(
      <Pagination>
        <Pagination.Previous>Previous</Pagination.Previous>
        <Pagination.Next>Next page</Pagination.Next>
        <Pagination.List>
          <Pagination.Link active>1</Pagination.Link>
          <Pagination.Ellipsis />
          <Pagination.Link>10</Pagination.Link>
        </Pagination.List>
      </Pagination>
    );
    expect(container.querySelector('.pagination')).toBeInTheDocument();
    expect(container.querySelector('.pagination-previous')).toBeInTheDocument();
    expect(container.querySelector('.pagination-next')).toBeInTheDocument();
    expect(container.querySelector('.pagination-list')).toBeInTheDocument();
    expect(container.querySelectorAll('.pagination-link')).toHaveLength(2);
    expect(container.querySelector('.pagination-ellipsis')).toBeInTheDocument();
  });
});

describe('Pagination deprecated color prop', () => {
  it('warns once in development when color is passed', () => {
    const { rerender } = render(<Pagination color="primary" />);
    rerender(<Pagination color="danger" />);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Pagination "color" prop is deprecated')
    );
  });

  it('does not warn when color is omitted', () => {
    render(<Pagination />);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('Pagination from total', () => {
  /** The row as shown: each page's number, `…` for a gap, `*` on the current page. */
  const row = (container: HTMLElement) =>
    [...container.querySelectorAll('.pagination-list > li > *')]
      .map(item =>
        item.classList.contains('pagination-ellipsis')
          ? '…'
          : `${item.textContent}${item.classList.contains('is-current') ? '*' : ''}`
      )
      .join(' ');
  const links = (container: HTMLElement) => [
    ...container.querySelectorAll<HTMLAnchorElement>('.pagination-link'),
  ];
  const link = (container: HTMLElement, page: number) =>
    links(container).find(item => item.textContent === String(page))!;

  it("renders Bulma's markup: Previous, Next, then a link for each page", () => {
    const { container } = render(<Pagination total={3} current={2} />);
    const nav = container.querySelector('nav.pagination')!;
    expect(
      [...nav.children].map(child => child.className.split(' ')[0])
    ).toEqual(['pagination-previous', 'pagination-next', 'pagination-list']);
    expect(nav.querySelector('.pagination-previous')).toHaveTextContent(
      'Previous'
    );
    expect(nav.querySelector('.pagination-next')).toHaveTextContent('Next');
    expect(row(container)).toBe('1 2* 3');
    expect(link(container, 2)).toHaveAttribute('aria-current', 'page');
    expect(link(container, 1)).not.toHaveAttribute('aria-current');
  });

  it('puts none of its page props on the <nav>', () => {
    const { container } = render(
      <Pagination
        total={10}
        current={2}
        onPageChange={() => {}}
        siblingCount={2}
        boundaryCount={1}
        previousLabel="Back"
        nextLabel="On"
        disabled={false}
        getPageHref={page => `?page=${page}`}
        getPageLabel={page => `Seite ${page}`}
        data-testid="pages"
      />
    );
    const nav = container.querySelector('nav')!;
    expect(nav.getAttributeNames().sort()).toEqual([
      'aria-label',
      'class',
      'data-testid',
      'role',
    ]);
  });

  it('keeps the row the same length as the current page moves', () => {
    const shown = (current: number) =>
      row(render(<Pagination total={10} current={current} />).container);
    expect(shown(1)).toBe('1* 2 3 4 5 … 10');
    expect(shown(4)).toBe('1 2 3 4* 5 … 10');
    expect(shown(5)).toBe('1 … 4 5* 6 … 10');
    expect(shown(7)).toBe('1 … 6 7* 8 9 10');
    expect(shown(10)).toBe('1 … 6 7 8 9 10*');
  });

  it('shows every page when they fit', () => {
    const { container } = render(<Pagination total={7} current={4} />);
    expect(row(container)).toBe('1 2 3 4* 5 6 7');
  });

  it('takes the window and boundaries it is given', () => {
    const shown = (props: { siblingCount?: number; boundaryCount?: number }) =>
      row(render(<Pagination total={20} current={10} {...props} />).container);
    expect(shown({ siblingCount: 0 })).toBe('1 … 10* … 20');
    expect(shown({ siblingCount: 2 })).toBe('1 … 8 9 10* 11 12 … 20');
    expect(shown({ boundaryCount: 2 })).toBe('1 2 … 9 10* 11 … 19 20');
    expect(shown({ boundaryCount: 0 })).toBe('… 9 10* 11 …');
    // Negative and fractional counts are read as whole ones from zero.
    expect(shown({ siblingCount: -1, boundaryCount: 1.8 })).toBe(
      '1 … 10* … 20'
    );
  });

  it('holds the current page to the pages there are', () => {
    expect(row(render(<Pagination total={3} current={9} />).container)).toBe(
      '1 2 3*'
    );
    expect(row(render(<Pagination total={3} current={-2} />).container)).toBe(
      '1* 2 3'
    );
  });

  it('renders no pages, and both ends disabled, for no pages', () => {
    for (const total of [0, -3, Number.NaN]) {
      const { container, unmount } = render(<Pagination total={total} />);
      expect(links(container)).toHaveLength(0);
      expect(container.querySelector('.pagination-previous')).toHaveClass(
        'is-disabled'
      );
      expect(container.querySelector('.pagination-next')).toHaveClass(
        'is-disabled'
      );
      unmount();
    }
  });

  it('calls onPageChange, and leaves the page to its owner when controlled', () => {
    const onPageChange = jest.fn();
    const { container } = render(
      <Pagination total={5} current={2} onPageChange={onPageChange} />
    );
    fireEvent.click(link(container, 4));
    expect(onPageChange).toHaveBeenCalledWith(4);
    expect(row(container)).toBe('1 2* 3 4 5');
    fireEvent.click(container.querySelector('.pagination-previous')!);
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    fireEvent.click(container.querySelector('.pagination-next')!);
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    // The page already current is no change.
    fireEvent.click(link(container, 2));
    expect(onPageChange).toHaveBeenCalledTimes(3);
  });

  it('keeps the page itself when no current is given', () => {
    const onPageChange = jest.fn();
    const { container } = render(
      <Pagination total={5} onPageChange={onPageChange} />
    );
    expect(row(container)).toBe('1* 2 3 4 5');
    fireEvent.click(link(container, 3));
    expect(row(container)).toBe('1 2 3* 4 5');
    fireEvent.click(container.querySelector('.pagination-next')!);
    expect(row(container)).toBe('1 2 3 4* 5');
    expect(onPageChange.mock.calls).toEqual([[3], [4]]);
    // It works with no callback too.
    const plain = render(<Pagination total={3} />).container;
    fireEvent.click(link(plain, 2));
    expect(row(plain)).toBe('1 2* 3');
  });

  it('disables Previous on the first page and Next on the last', () => {
    const onPageChange = jest.fn();
    const first = render(
      <Pagination total={3} current={1} onPageChange={onPageChange} />
    ).container;
    const previous = first.querySelector('.pagination-previous')!;
    expect(previous).toHaveClass('is-disabled');
    fireEvent.click(previous);
    fireEvent.keyDown(previous, { key: 'Enter' });
    const last = render(
      <Pagination total={3} current={3} onPageChange={onPageChange} />
    ).container;
    const next = last.querySelector('.pagination-next')!;
    expect(next).toHaveClass('is-disabled');
    fireEvent.click(next);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('disables every link with disabled', () => {
    const onPageChange = jest.fn();
    const { container } = render(
      <Pagination total={5} current={3} disabled onPageChange={onPageChange} />
    );
    for (const item of container.querySelectorAll(
      '.pagination-link, .pagination-previous, .pagination-next'
    )) {
      expect(item).toHaveClass('is-disabled');
      fireEvent.click(item);
      fireEvent.keyDown(item, { key: 'Enter' });
    }
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('lets Enter or Space choose a page, as the buttons its links are', () => {
    const onPageChange = jest.fn();
    const { container } = render(
      <Pagination total={5} current={1} onPageChange={onPageChange} />
    );
    const three = link(container, 3);
    expect(three).toHaveAttribute('role', 'button');
    expect(three).not.toHaveAttribute('href');
    fireEvent.keyDown(three, { key: 'Enter' });
    fireEvent.keyDown(link(container, 4), { key: ' ' });
    fireEvent.keyDown(link(container, 5), { key: 'a' });
    expect(onPageChange.mock.calls).toEqual([[3], [4]]);
  });

  it('makes each a real link with getPageHref', () => {
    const onPageChange = jest.fn();
    const { container } = render(
      <Pagination
        total={5}
        current={1}
        onPageChange={onPageChange}
        getPageHref={page => `?page=${page}`}
      />
    );
    const three = link(container, 3);
    expect(three).toHaveAttribute('href', '?page=3');
    expect(three).not.toHaveAttribute('role');
    expect(container.querySelector('.pagination-next')).toHaveAttribute(
      'href',
      '?page=2'
    );
    // A disabled end goes nowhere.
    expect(container.querySelector('.pagination-previous')).not.toHaveAttribute(
      'href'
    );
    fireEvent.keyDown(three, { key: 'Enter' });
    expect(onPageChange).not.toHaveBeenCalled();
    fireEvent.click(three);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('names each page link, in its own words when given them', () => {
    const named = (props: { getPageLabel?: (page: number) => string }) =>
      links(render(<Pagination total={3} {...props} />).container).map(item =>
        item.getAttribute('aria-label')
      );
    expect(named({})).toEqual(['Page 1', 'Page 2', 'Page 3']);
    expect(named({ getPageLabel: page => `Seite ${page}` })).toEqual([
      'Seite 1',
      'Seite 2',
      'Seite 3',
    ]);
  });

  it('reads a count that is no number as its default', () => {
    const { container } = render(
      <Pagination
        total={20}
        current={10}
        siblingCount={Number.NaN}
        boundaryCount={Infinity}
      />
    );
    expect(row(container)).toBe('1 … 9 10* 11 … 20');
  });

  it('renders from total beside a child that renders nothing', () => {
    const show = false;
    const { container } = render(
      <Pagination total={3} current={1}>
        {show && <Pagination.List />}
      </Pagination>
    );
    expect(row(container)).toBe('1* 2 3');
  });

  it('takes its own labels for Previous and Next', () => {
    const { container } = render(
      <Pagination total={3} previousLabel="Back" nextLabel={<b>On</b>} />
    );
    expect(container.querySelector('.pagination-previous')).toHaveTextContent(
      'Back'
    );
    expect(container.querySelector('.pagination-next b')).toHaveTextContent(
      'On'
    );
  });

  it('renders its children as given when it has any, total or not', () => {
    const { container } = render(
      <Pagination total={10} current={2}>
        <Pagination.List>
          <Pagination.Link>custom</Pagination.Link>
        </Pagination.List>
      </Pagination>
    );
    expect(links(container).map(item => item.textContent)).toEqual(['custom']);
    expect(container.querySelector('.pagination-previous')).toBeNull();
    expect(container.querySelector('nav')).not.toHaveAttribute('total');
  });

  it('keeps its size, alignment and rounding', () => {
    const { container } = render(
      <Pagination total={3} size="small" align="centered" rounded />
    );
    expect(container.querySelector('nav')).toHaveClass(
      'pagination',
      'is-small',
      'is-centered',
      'is-rounded'
    );
  });
});
