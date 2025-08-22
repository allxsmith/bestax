import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../Pagination';
import { ConfigProvider } from '../../helpers/Config';

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
