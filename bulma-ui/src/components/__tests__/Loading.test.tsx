import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { Loading, LoadingProps } from '../Loading';
import { inertProps } from '../../helpers/inertProps';

describe('Loading', () => {
  describe('rendering', () => {
    it('renders nothing when not active', () => {
      render(<Loading />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('renders nothing when active is false', () => {
      render(<Loading active={false} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('renders when active is true', () => {
      render(<Loading active />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders loading overlay', () => {
      const { container } = render(<Loading active />);
      expect(container.querySelector('.loading-overlay')).toBeInTheDocument();
    });

    it('renders loading content', () => {
      const { container } = render(<Loading active />);
      expect(container.querySelector('.loading-content')).toBeInTheDocument();
    });

    it('renders loading icon', () => {
      const { container } = render(<Loading active />);
      expect(container.querySelector('.loading-icon')).toBeInTheDocument();
    });

    it('renders children as loading text', () => {
      render(<Loading active>Loading data...</Loading>);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('renders loading text container when children provided', () => {
      const { container } = render(<Loading active>Loading...</Loading>);
      expect(container.querySelector('.loading-text')).toBeInTheDocument();
    });

    it('does not render loading text when no children', () => {
      const { container } = render(<Loading active />);
      expect(container.querySelector('.loading-text')).not.toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('applies is-active class when active', () => {
      render(<Loading active />);
      expect(screen.getByRole('alert')).toHaveClass('is-active');
    });
  });

  describe('full page mode', () => {
    it('applies is-full-page class when isFullPage is true', () => {
      render(<Loading active isFullPage />);
      expect(screen.getByRole('alert')).toHaveClass('is-full-page');
    });

    it('does not apply is-full-page class when isFullPage is false', () => {
      render(<Loading active isFullPage={false} />);
      expect(screen.getByRole('alert')).not.toHaveClass('is-full-page');
    });
  });

  describe('sizes', () => {
    it.each(['small', 'medium', 'large'] as const)(
      'applies is-%s class to icon when size="%s"',
      size => {
        const { container } = render(<Loading active size={size} />);
        expect(container.querySelector('.loading-icon')).toHaveClass(
          `is-${size}`
        );
      }
    );

    it('does not apply size class when no size prop', () => {
      const { container } = render(<Loading active />);
      const icon = container.querySelector('.loading-icon');
      expect(icon).not.toHaveClass('is-small');
      expect(icon).not.toHaveClass('is-medium');
      expect(icon).not.toHaveClass('is-large');
    });
  });

  describe('colors', () => {
    it.each([
      'primary',
      'link',
      'info',
      'success',
      'warning',
      'danger',
    ] as const)(
      'applies is-%s class to loading element when color="%s"',
      color => {
        render(<Loading active color={color} />);
        expect(screen.getByRole('alert')).toHaveClass(`is-${color}`);
      }
    );

    it('does not apply color class when color prop is omitted', () => {
      render(<Loading active />);
      const loading = screen.getByRole('alert');
      expect(loading).not.toHaveClass('is-primary');
      expect(loading).not.toHaveClass('is-link');
      expect(loading).not.toHaveClass('is-info');
      expect(loading).not.toHaveClass('is-success');
      expect(loading).not.toHaveClass('is-warning');
      expect(loading).not.toHaveClass('is-danger');
    });

    it('combines color with other classes correctly', () => {
      render(<Loading active color="primary" isFullPage className="custom" />);
      const loading = screen.getByRole('alert');
      expect(loading).toHaveClass(
        'loading',
        'is-active',
        'is-full-page',
        'is-primary',
        'custom'
      );
    });
  });

  describe('cancel functionality', () => {
    it('renders cancel button when canCancel is true', () => {
      render(<Loading active canCancel />);
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it('does not render cancel button when canCancel is false', () => {
      render(<Loading active canCancel={false} />);
      expect(
        screen.queryByRole('button', { name: /cancel/i })
      ).not.toBeInTheDocument();
    });

    it('does not render cancel button by default', () => {
      render(<Loading active />);
      expect(
        screen.queryByRole('button', { name: /cancel/i })
      ).not.toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
      const handleCancel = jest.fn();
      render(<Loading active canCancel onCancel={handleCancel} />);

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when overlay is clicked', () => {
      const handleCancel = jest.fn();
      const { container } = render(
        <Loading active canCancel onCancel={handleCancel} />
      );

      fireEvent.click(container.querySelector('.loading-overlay')!);
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('does not call onCancel on overlay click when canCancel is false', () => {
      const handleCancel = jest.fn();
      const { container } = render(
        <Loading active canCancel={false} onCancel={handleCancel} />
      );

      fireEvent.click(container.querySelector('.loading-overlay')!);
      expect(handleCancel).not.toHaveBeenCalled();
    });

    it('calls onCancel when Escape key is pressed', () => {
      const handleCancel = jest.fn();
      render(<Loading active canCancel onCancel={handleCancel} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('leaves an Escape that something on the page already used', () => {
      const handleCancel = jest.fn();
      render(
        <>
          <Loading active canCancel onCancel={handleCancel} />
          <input
            aria-label="Search"
            onKeyDown={e => {
              if (e.key === 'Escape') e.preventDefault();
            }}
          />
        </>
      );
      fireEvent.keyDown(screen.getByLabelText('Search'), { key: 'Escape' });
      expect(handleCancel).not.toHaveBeenCalled();
    });

    it('hears Escape after a document listener added once it was active', () => {
      // A popup that opens while it shows adds its listener after this one,
      // and still gets the key first.
      const handleCancel = jest.fn();
      render(<Loading active canCancel onCancel={handleCancel} />);
      const claim = (e: KeyboardEvent) => e.preventDefault();
      document.addEventListener('keydown', claim);
      try {
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(handleCancel).not.toHaveBeenCalled();
      } finally {
        document.removeEventListener('keydown', claim);
      }
    });

    it('does not call onCancel on Escape when canCancel is false', () => {
      const handleCancel = jest.fn();
      render(<Loading active canCancel={false} onCancel={handleCancel} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleCancel).not.toHaveBeenCalled();
    });

    it('does not call onCancel on Escape when not active', () => {
      const handleCancel = jest.fn();
      render(<Loading active={false} canCancel onCancel={handleCancel} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleCancel).not.toHaveBeenCalled();
    });

    it('does not call onCancel on non-Escape keys', () => {
      // Hits the `e.key === 'Escape'` false branch in the keydown handler.
      const handleCancel = jest.fn();
      render(<Loading active canCancel onCancel={handleCancel} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'a' });
      expect(handleCancel).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has role="alert"', () => {
      render(<Loading active />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has aria-busy="true"', () => {
      render(<Loading active />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-label="Loading"', () => {
      render(<Loading active />);
      expect(screen.getByRole('alert')).toHaveAttribute(
        'aria-label',
        'Loading'
      );
    });

    it('overlay has aria-hidden="true"', () => {
      const { container } = render(<Loading active />);
      expect(container.querySelector('.loading-overlay')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });

    it('cancel button has aria-label', () => {
      render(<Loading active canCancel />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Cancel loading'
      );
    });
  });

  describe('what it covers', () => {
    // jsdom implements neither `inert` nor a tab order, so this applies the
    // browser's rule itself, as Collapse's tests do: an element inside an
    // inert subtree can't take focus. Named by label, else by text.
    const tabStops = () =>
      Array.from(
        document.body.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, [tabindex]'
        )
      )
        .filter(el => el.tabIndex >= 0 && !el.closest('[inert]'))
        .map(el => el.getAttribute('aria-label') ?? el.textContent);

    // The issue's reproduction: a control in a container the loading covers,
    // with something to Tab from before it and to after it.
    const Orders = (props: LoadingProps) => (
      <>
        <a href="#top">Before</a>
        <div className="orders">
          <button type="button">Edit order</button>
          <Loading overlay="opaque" {...props}>
            Loading orders
          </Loading>
        </div>
        <a href="#next">After</a>
      </>
    );

    it('takes the rest of its container out of the tab order', () => {
      render(<Orders active />);
      expect(tabStops()).toEqual(['Before', 'After']);
    });

    it('keeps its cancel button in the tab order', () => {
      render(<Orders active canCancel />);
      expect(tabStops()).toEqual(['Before', 'Cancel loading', 'After']);
    });

    it('with isFullPage, takes the rest of the page out, all but its cancel button', () => {
      render(<Orders active isFullPage canCancel />);
      expect(tabStops()).toEqual(['Cancel loading']);
    });

    it.each([
      ['in a container', false],
      ['over the whole page', true],
    ])(
      '%s, puts it all back when it goes inactive and on unmount',
      (_, isFullPage) => {
        const everything = ['Before', 'Edit order', 'After'];
        const { rerender, unmount } = render(
          <Orders active isFullPage={isFullPage} />
        );
        expect(tabStops()).not.toContain('Edit order');

        rerender(<Orders active={false} isFullPage={isFullPage} />);
        expect(tabStops()).toEqual(everything);

        rerender(<Orders active isFullPage={isFullPage} />);
        expect(tabStops()).not.toContain('Edit order');

        unmount();
        expect(document.querySelectorAll('[inert]')).toHaveLength(0);
      }
    );

    it('leaves content that was inert already inert', () => {
      const Page = ({ loading }: { loading: boolean }) => (
        <div>
          <div {...inertProps(true)}>
            <button type="button">Archived</button>
          </div>
          {loading && <Loading active />}
        </div>
      );
      const { rerender } = render(<Page loading />);
      const archived = screen.getByText('Archived').parentElement!;
      expect(archived).toHaveAttribute('inert');

      rerender(<Page loading={false} />);
      expect(archived).toHaveAttribute('inert');
    });

    it('gives focus back to a covered control once it goes away', () => {
      const { rerender } = render(<Orders active={false} />);
      const edit = screen.getByText('Edit order');
      edit.focus();

      rerender(<Orders active />);
      // jsdom leaves focus on an inert element; a browser moves it to <body>.
      edit.blur();
      rerender(<Orders active={false} />);
      expect(edit).toHaveFocus();
    });

    it('renders the same markup on the server, with nothing inert', () => {
      const html = renderToStaticMarkup(<Orders active isFullPage canCancel />);
      expect(html).not.toContain('inert');
    });
  });

  describe('className handling', () => {
    it('applies custom className', () => {
      render(<Loading active className="custom-class" />);
      expect(screen.getByRole('alert')).toHaveClass('custom-class');
    });

    it('applies overlayClassName', () => {
      const { container } = render(
        <Loading active overlayClassName="custom-overlay" />
      );
      expect(container.querySelector('.loading-overlay')).toHaveClass(
        'custom-overlay'
      );
    });

    it('applies iconClassName', () => {
      const { container } = render(
        <Loading active iconClassName="custom-icon" />
      );
      expect(container.querySelector('.loading-icon')).toHaveClass(
        'custom-icon'
      );
    });

    it('combines multiple classes correctly', () => {
      render(<Loading active isFullPage className="custom-class" />);
      const loading = screen.getByRole('alert');
      expect(loading).toHaveClass(
        'loading',
        'is-active',
        'is-full-page',
        'custom-class'
      );
    });
  });

  describe('Bulma helper classes', () => {
    it('applies Bulma helper classes from props', () => {
      render(<Loading active m="2" p="3" />);
      const loading = screen.getByRole('alert');
      expect(loading).toHaveClass('m-2', 'p-3');
    });
  });

  describe('body scroll lock', () => {
    afterEach(() => {
      document.body.style.overflow = '';
    });

    it('sets body overflow to hidden when full page and active', () => {
      render(<Loading active isFullPage />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('does not set body overflow when not full page', () => {
      render(<Loading active />);
      expect(document.body.style.overflow).toBe('');
    });

    it('does not set body overflow when not active', () => {
      render(<Loading active={false} isFullPage />);
      expect(document.body.style.overflow).toBe('');
    });

    it('restores body overflow on unmount', () => {
      const { unmount } = render(<Loading active isFullPage />);
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('indicator prop', () => {
    it('renders custom indicator when indicator prop is provided', () => {
      const { container } = render(
        <Loading active indicator={<span data-testid="custom-icon">★</span>} />
      );
      expect(
        container.querySelector('.loading-icon-custom')
      ).toBeInTheDocument();
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('does not render default spinner when indicator is provided', () => {
      const { container } = render(
        <Loading active indicator={<span>★</span>} />
      );
      expect(container.querySelector('.loading-icon')).not.toBeInTheDocument();
    });

    it('renders default spinner when no indicator', () => {
      const { container } = render(<Loading active />);
      expect(container.querySelector('.loading-icon')).toBeInTheDocument();
      expect(
        container.querySelector('.loading-icon-custom')
      ).not.toBeInTheDocument();
    });

    it('renders children alongside custom indicator', () => {
      const { container } = render(
        <Loading active indicator={<span>★</span>}>
          Loading text
        </Loading>
      );
      expect(
        container.querySelector('.loading-icon-custom')
      ).toBeInTheDocument();
      expect(screen.getByText('Loading text')).toBeInTheDocument();
    });
  });

  describe('overlay prop', () => {
    it.each(['light', 'dark', 'opaque'] as const)(
      'applies is-%s class when overlay="%s"',
      overlay => {
        render(<Loading active overlay={overlay} />);
        expect(screen.getByRole('alert')).toHaveClass(`is-${overlay}`);
      }
    );

    it('does not apply overlay class when no overlay prop', () => {
      render(<Loading active />);
      const loading = screen.getByRole('alert');
      expect(loading).not.toHaveClass('is-light');
      expect(loading).not.toHaveClass('is-dark');
      expect(loading).not.toHaveClass('is-opaque');
    });
  });

  describe('is-cancelable class', () => {
    it('applies is-cancelable class when canCancel is true', () => {
      render(<Loading active canCancel />);
      expect(screen.getByRole('alert')).toHaveClass('is-cancelable');
    });

    it('does not apply is-cancelable class when canCancel is false', () => {
      render(<Loading active canCancel={false} />);
      expect(screen.getByRole('alert')).not.toHaveClass('is-cancelable');
    });

    it('does not apply is-cancelable class by default', () => {
      render(<Loading active />);
      expect(screen.getByRole('alert')).not.toHaveClass('is-cancelable');
    });
  });

  describe('HTML attributes', () => {
    it('passes through HTML attributes', () => {
      render(<Loading active data-testid="loading" id="my-loading" />);
      const loading = screen.getByRole('alert');
      expect(loading).toHaveAttribute('data-testid', 'loading');
      expect(loading).toHaveAttribute('id', 'my-loading');
    });
  });
});
