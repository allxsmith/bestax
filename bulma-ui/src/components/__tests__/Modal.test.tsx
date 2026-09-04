import { createRef } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { Modal } from '../Modal';
import { Loading } from '../Loading';
import { Sidebar } from '../Sidebar';
import { ConfigProvider } from '../../helpers/Config';

afterEach(() => {
  document.body.style.overflow = '';
});

const latin =
  'Quando in cursu rerum humanarum fit ut populus aliquis dissolvere vincula politica quae eum cum alio coniunxerunt, et inter potestates terrae, statum separatam et aequalem, ad quem Iura Naturae et Dei Naturalis eum ius habere concedunt, rationabile decus postulat ut causas separationis declarent.';

describe('Modal', () => {
  it('does not render as active by default', () => {
    const { container } = render(<Modal>{latin}</Modal>);
    expect(container.firstChild).not.toHaveClass('is-active');
  });

  it('renders as active when active=true', () => {
    render(<Modal active>{latin}</Modal>);
    expect(screen.getByTestId('modal')).toHaveClass('is-active');
  });

  it('renders modal-card when title is provided', () => {
    render(
      <Modal active modalCardTitle="Title">
        {latin}
      </Modal>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByTestId('modal-body')).toBeInTheDocument();
    expect(screen.getByTestId('modal')).toHaveClass('modal');
  });

  it('renders modal-card when foot is provided', () => {
    render(
      <Modal active modalCardFoot={<div>Footer</div>}>
        {latin}
      </Modal>
    );
    expect(screen.getByText('Footer')).toBeInTheDocument();
    expect(screen.getByTestId('modal-body')).toBeInTheDocument();
  });

  it('renders modal-content when no card title or foot is provided', () => {
    render(<Modal active>{latin}</Modal>);
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    expect(screen.getByText(latin)).toBeInTheDocument();
  });

  it('calls onClose when background is clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal active onClose={onClose}>
        {latin}
      </Modal>
    );
    fireEvent.click(screen.getByTestId('modal-background'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button in header is clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal active modalCardTitle="T" onClose={onClose}>
        {latin}
      </Modal>
    );
    fireEvent.click(screen.getByTestId('modal-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when floating close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal active onClose={onClose}>
        {latin}
      </Modal>
    );
    fireEvent.click(screen.getByTestId('modal-close-float'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders modal-card if type="card" even without title or foot', () => {
    render(
      <Modal active type="card">
        {latin}
      </Modal>
    );
    expect(screen.getByTestId('modal-body')).toBeInTheDocument();
  });

  it('renders modal-content if type="content" even with title/foot', () => {
    render(
      <Modal
        active
        type="content"
        modalCardTitle="Should not show"
        modalCardFoot={<span>Should not show</span>}
      >
        {latin}
      </Modal>
    );
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
  });

  it('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <Modal active>{latin}</Modal>
      </ConfigProvider>
    );
    const modal = screen.getByTestId('modal');
    expect(modal).toHaveClass('bulma-modal');
    expect(modal).not.toHaveClass('modal');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Modal active data-testid="modal">
            {latin}
          </Modal>
        </ConfigProvider>
      );
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveClass('bulma-modal');
    });

    it('uses default classes when no prefix is provided', () => {
      render(
        <Modal active data-testid="modal">
          {latin}
        </Modal>
      );
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveClass('modal');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Modal active data-testid="modal">
            {latin}
          </Modal>
        </ConfigProvider>
      );
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveClass('modal');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Modal active textColor="primary" m="2" data-testid="modal">
            {latin}
          </Modal>
        </ConfigProvider>
      );
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveClass('bulma-modal');
      expect(modal).toHaveClass('bulma-has-text-primary');
      expect(modal).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(
        <Modal active textColor="danger" data-testid="modal">
          {latin}
        </Modal>
      );
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveClass('modal');
      expect(modal).toHaveClass('has-text-danger');
    });
  });

  describe('Compound components', () => {
    it('defines all compound statics', () => {
      expect(Modal.Background).toBeDefined();
      expect(Modal.Content).toBeDefined();
      expect(Modal.Card).toBeDefined();
      expect(Modal.Card.Head).toBeDefined();
      expect(Modal.Card.Title).toBeDefined();
      expect(Modal.Card.Body).toBeDefined();
      expect(Modal.Card.Foot).toBeDefined();
      expect(Modal.Close).toBeDefined();
    });

    it('renders a modal card through the dot paths', () => {
      const { container } = render(
        <Modal isActive>
          <Modal.Background />
          <Modal.Card>
            <Modal.Card.Head>
              <Modal.Card.Title>Title</Modal.Card.Title>
            </Modal.Card.Head>
            <Modal.Card.Body>{latin}</Modal.Card.Body>
            <Modal.Card.Foot>Foot</Modal.Card.Foot>
          </Modal.Card>
        </Modal>
      );
      expect(container.querySelector('.modal')).toBeInTheDocument();
      expect(container.querySelector('.modal-background')).toBeInTheDocument();
      expect(container.querySelector('.modal-card')).toBeInTheDocument();
      expect(container.querySelector('.modal-card-head')).toBeInTheDocument();
      expect(container.querySelector('.modal-card-title')).toBeInTheDocument();
      expect(container.querySelector('.modal-card-body')).toBeInTheDocument();
      expect(container.querySelector('.modal-card-foot')).toBeInTheDocument();
    });

    it('renders Modal with compound Background component', () => {
      const onClose = jest.fn();
      render(
        <Modal isActive>
          <Modal.Background
            onClick={onClose}
            data-testid="compound-background"
          />
          <Modal.Content>{latin}</Modal.Content>
        </Modal>
      );
      expect(screen.getByTestId('compound-background')).toHaveClass(
        'modal-background'
      );
      fireEvent.click(screen.getByTestId('compound-background'));
      expect(onClose).toHaveBeenCalled();
    });

    it('renders Modal.Card with compound components', () => {
      const onClose = jest.fn();
      render(
        <Modal isActive>
          <Modal.Background onClick={onClose} />
          <Modal.Card>
            <Modal.Card.Head>
              <Modal.Card.Title>Test Title</Modal.Card.Title>
              <Modal.Close onClick={onClose} data-testid="compound-close" />
            </Modal.Card.Head>
            <Modal.Card.Body>{latin}</Modal.Card.Body>
            <Modal.Card.Foot>Footer Content</Modal.Card.Foot>
          </Modal.Card>
        </Modal>
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText(latin)).toBeInTheDocument();
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('compound-close'));
      expect(onClose).toHaveBeenCalled();
    });

    it('renders Modal.Content with compound components', () => {
      render(
        <Modal isActive>
          <Modal.Background />
          <Modal.Content data-testid="compound-content">
            <div>{latin}</div>
          </Modal.Content>
          <Modal.Close />
        </Modal>
      );
      expect(screen.getByTestId('compound-content')).toHaveClass(
        'modal-content'
      );
      expect(screen.getByText(latin)).toBeInTheDocument();
    });

    it('supports isActive prop as alias for active', () => {
      render(
        <Modal isActive>
          <Modal.Background />
          <Modal.Content>{latin}</Modal.Content>
        </Modal>
      );
      expect(screen.getByTestId('modal')).toHaveClass('is-active');
    });

    it('Modal.Close renders with delete variant by default', () => {
      render(
        <Modal isActive>
          <Modal.Close data-testid="close-btn" />
        </Modal>
      );
      expect(screen.getByTestId('close-btn')).toHaveClass('delete');
      expect(screen.getByTestId('close-btn')).not.toHaveClass('modal-close');
    });

    it('Modal.Close renders with floating variant', () => {
      render(
        <Modal isActive>
          <Modal.Close variant="floating" data-testid="close-btn" />
        </Modal>
      );
      expect(screen.getByTestId('close-btn')).toHaveClass('modal-close');
      expect(screen.getByTestId('close-btn')).toHaveClass('is-large');
    });

    it('Modal.Close renders with custom size for floating variant', () => {
      render(
        <Modal isActive>
          <Modal.Close
            variant="floating"
            size="medium"
            data-testid="close-btn"
          />
        </Modal>
      );
      expect(screen.getByTestId('close-btn')).toHaveClass('modal-close');
      expect(screen.getByTestId('close-btn')).toHaveClass('is-medium');
    });

    it('allows mixing compound components with custom classes', () => {
      render(
        <Modal isActive className="custom-modal">
          <Modal.Background className="custom-bg" data-testid="bg" />
          <Modal.Card className="custom-card" data-testid="card">
            <Modal.Card.Body className="custom-body" data-testid="body">
              {latin}
            </Modal.Card.Body>
          </Modal.Card>
        </Modal>
      );
      expect(screen.getByTestId('modal')).toHaveClass('custom-modal');
      expect(screen.getByTestId('bg')).toHaveClass('custom-bg');
      expect(screen.getByTestId('card')).toHaveClass('custom-card');
      expect(screen.getByTestId('body')).toHaveClass('custom-body');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to the root .modal element (legacy API)', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Modal active ref={ref}>
          {latin}
        </Modal>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(screen.getByTestId('modal'));
    });

    it('forwards ref to the root .modal element (compound API)', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Modal isActive ref={ref}>
          <Modal.Background />
          <Modal.Content>{latin}</Modal.Content>
        </Modal>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(screen.getByTestId('modal'));
    });

    it('forwards to a callback ref, and detaches on unmount', () => {
      const seen: (HTMLDivElement | null)[] = [];
      // Block body on purpose: a callback ref that returns a value is read as
      // a cleanup function under React 19.
      const { unmount } = render(
        <Modal
          active
          ref={node => {
            seen.push(node);
          }}
        >
          {latin}
        </Modal>
      );
      expect(seen[0]).toBe(screen.getByTestId('modal'));
      unmount();
      expect(seen[seen.length - 1]).toBeNull();
    });

    // The cleanup contract is honored identically on React 18 and 19 (the CI
    // matrix), so this does not branch on React.version.
    it('runs a forwarded callback ref cleanup on unmount instead of calling it with null', () => {
      const calls: (HTMLDivElement | null)[] = [];
      const cleanup = jest.fn();
      const callbackRef = (node: HTMLDivElement | null) => {
        calls.push(node);
        if (!node) return undefined;
        return () => {
          cleanup();
        };
      };

      const { unmount } = render(
        <Modal active ref={callbackRef}>
          {latin}
        </Modal>
      );
      expect(calls).toEqual([screen.getByTestId('modal')]);
      expect(cleanup).not.toHaveBeenCalled();

      unmount();

      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(calls).toHaveLength(1);
    });
  });

  describe('Escape key', () => {
    it('calls onClose on Escape by default when active', () => {
      const onClose = jest.fn();
      render(
        <Modal active onClose={onClose}>
          {latin}
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose on Escape when inactive', () => {
      const onClose = jest.fn();
      render(<Modal onClose={onClose}>{latin}</Modal>);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not call onClose on Escape when closeOnEscape is false', () => {
      const onClose = jest.fn();
      render(
        <Modal active onClose={onClose} closeOnEscape={false}>
          {latin}
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not call onClose for non-Escape keys', () => {
      const onClose = jest.fn();
      render(
        <Modal active onClose={onClose}>
          {latin}
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('tolerates a missing onClose prop on Escape', () => {
      render(<Modal active>{latin}</Modal>);
      expect(() =>
        fireEvent.keyDown(document, { key: 'Escape' })
      ).not.toThrow();
    });

    it('closes only the topmost modal when several are open', () => {
      const onCloseBackground = jest.fn();
      const onCloseTop = jest.fn();
      render(
        <>
          <Modal active onClose={onCloseBackground}>
            Background
          </Modal>
          <Modal active onClose={onCloseTop}>
            Top
          </Modal>
        </>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onCloseTop).toHaveBeenCalledTimes(1);
      expect(onCloseBackground).not.toHaveBeenCalled();
    });

    it('closes the next modal down once the topmost one has closed', () => {
      const onCloseBackground = jest.fn();
      const onCloseTop = jest.fn();
      const { rerender } = render(
        <>
          <Modal active onClose={onCloseBackground}>
            Background
          </Modal>
          <Modal active onClose={onCloseTop}>
            Top
          </Modal>
        </>
      );

      rerender(
        <>
          <Modal active onClose={onCloseBackground}>
            Background
          </Modal>
          <Modal active={false} onClose={onCloseTop}>
            Top
          </Modal>
        </>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onCloseBackground).toHaveBeenCalledTimes(1);
      expect(onCloseTop).not.toHaveBeenCalled();
    });
  });

  describe('Focus containment', () => {
    it('cycles Tab from the last focusable back to the first', () => {
      render(
        <Modal active>
          <button type="button">First</button>
          <button type="button">Last</button>
        </Modal>
      );

      screen.getByText('Last').focus();
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(screen.getByText('First')).toHaveFocus();
    });

    it('ignores a negative-tabIndex anchor when picking the last tab stop', () => {
      // `[href]` matches regardless of tabindex, so without a tabbable filter
      // this trailing anchor would be treated as the last tab stop and Tab
      // from the real last control would escape the modal.
      render(
        <Modal active>
          <button type="button">First</button>
          <button type="button">Last</button>
          <a href="#skip" tabIndex={-1}>
            Not tabbable
          </a>
        </Modal>
      );

      screen.getByText('Last').focus();
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(screen.getByText('First')).toHaveFocus();

      screen.getByText('First').focus();
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(screen.getByText('Last')).toHaveFocus();
    });

    it('ignores tab indexes below -1 when picking tab stops', () => {
      render(
        <Modal active>
          <button type="button">First</button>
          <button type="button">Last</button>
          <button type="button" tabIndex={-2}>
            Skipped
          </button>
        </Modal>
      );

      screen.getByText('Last').focus();
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(screen.getByText('First')).toHaveFocus();
    });

    it('cycles Shift+Tab from the first focusable back to the last', () => {
      render(
        <Modal active>
          <button type="button">First</button>
          <button type="button">Last</button>
        </Modal>
      );

      expect(screen.getByText('First')).toHaveFocus();
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(screen.getByText('Last')).toHaveFocus();
    });

    it('pulls focus back in when Tab is pressed from outside the modal', () => {
      const outside = document.createElement('button');
      document.body.appendChild(outside);

      render(
        <Modal active>
          <button type="button">First</button>
          <button type="button">Last</button>
        </Modal>
      );

      outside.focus();
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(screen.getByText('First')).toHaveFocus();

      outside.focus();
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(screen.getByText('Last')).toHaveFocus();

      document.body.removeChild(outside);
    });

    it('leaves Tab alone in the middle of the modal', () => {
      render(
        <Modal active>
          <button type="button">First</button>
          <button type="button">Middle</button>
          <button type="button">Last</button>
        </Modal>
      );

      const middle = screen.getByText('Middle');
      middle.focus();
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(middle).toHaveFocus();
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(middle).toHaveFocus();
    });

    it('focuses the modal root on Tab when nothing inside is focusable', () => {
      render(<Modal active>{latin}</Modal>);
      const modal = screen.getByTestId('modal');
      modal.blur();
      expect(modal).not.toHaveFocus();

      fireEvent.keyDown(document, { key: 'Tab' });
      expect(modal).toHaveFocus();
    });

    it('contains Tab in the topmost modal only', () => {
      const outside = document.createElement('button');
      document.body.appendChild(outside);

      render(
        <>
          <Modal active>
            <button type="button">Background control</button>
          </Modal>
          <Modal active>
            <button type="button">Top control</button>
          </Modal>
        </>
      );

      outside.focus();
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(screen.getByText('Top control')).toHaveFocus();

      document.body.removeChild(outside);
    });
  });

  describe('Accessible name', () => {
    it('labels the dialog with the modal-card title', () => {
      render(
        <Modal active modalCardTitle="Settings">
          {latin}
        </Modal>
      );

      const labelledBy =
        screen.getByTestId('modal').getAttribute('aria-labelledby') ?? '';
      expect(labelledBy).not.toBe('');
      expect(document.getElementById(labelledBy)).toHaveTextContent('Settings');
    });

    it('has no aria-labelledby when there is no card title', () => {
      render(<Modal active>{latin}</Modal>);
      expect(screen.getByTestId('modal')).not.toHaveAttribute(
        'aria-labelledby'
      );
    });

    it('lets a caller-supplied aria-labelledby win over the card title', () => {
      render(
        <>
          <h2 id="custom-title">Custom</h2>
          <Modal
            active
            modalCardTitle="Settings"
            aria-labelledby="custom-title"
          >
            {latin}
          </Modal>
        </>
      );
      expect(screen.getByTestId('modal')).toHaveAttribute(
        'aria-labelledby',
        'custom-title'
      );
    });
  });

  describe('Scroll lock', () => {
    it('locks body scroll while active by default', () => {
      const { unmount } = render(<Modal active>{latin}</Modal>);
      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(document.body.style.overflow).toBe('');
    });

    it('does not lock body scroll when inactive', () => {
      render(<Modal>{latin}</Modal>);
      expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('does not lock body scroll when lockScroll is false', () => {
      render(
        <Modal active lockScroll={false}>
          {latin}
        </Modal>
      );
      expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('stays locked when an overlapping Loading closes first', () => {
      const overlays = (loadingActive: boolean) => (
        <>
          <Modal active>{latin}</Modal>
          <Loading active={loadingActive} isFullPage />
        </>
      );

      const { rerender } = render(overlays(true));
      expect(document.body.style.overflow).toBe('hidden');

      rerender(overlays(false));
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('stays locked when an overlapping Sidebar closes first', () => {
      const overlays = (sidebarOpen: boolean) => (
        <>
          <Modal active>{latin}</Modal>
          <Sidebar isOpen={sidebarOpen} onClose={() => {}}>
            <div>Sidebar content</div>
          </Sidebar>
        </>
      );

      const { rerender } = render(overlays(true));
      expect(document.body.style.overflow).toBe('hidden');

      rerender(overlays(false));
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('role and aria-modal', () => {
    it('defaults to role="dialog" and aria-modal="true" when active', () => {
      render(<Modal active>{latin}</Modal>);
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it('has no role or aria-modal when inactive', () => {
      render(<Modal>{latin}</Modal>);
      const modal = screen.getByTestId('modal');
      expect(modal).not.toHaveAttribute('role');
      expect(modal).not.toHaveAttribute('aria-modal');
    });

    it('lets a caller-supplied role win over the default', () => {
      render(
        <Modal active role="alertdialog">
          {latin}
        </Modal>
      );
      expect(screen.getByTestId('modal')).toHaveAttribute(
        'role',
        'alertdialog'
      );
    });

    it('skips the default aria-modal when role is presentation', () => {
      render(
        <Modal active role="presentation">
          {latin}
        </Modal>
      );
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveAttribute('role', 'presentation');
      expect(modal).not.toHaveAttribute('aria-modal');
    });

    it('lets a caller-supplied aria-modal win over the default', () => {
      render(
        <Modal active aria-modal="false">
          {latin}
        </Modal>
      );
      expect(screen.getByTestId('modal')).toHaveAttribute(
        'aria-modal',
        'false'
      );
    });
  });

  describe('Focus management', () => {
    it('moves focus to the first focusable element on open', () => {
      render(
        <Modal active>
          <button type="button">First</button>
          <button type="button">Second</button>
        </Modal>
      );
      expect(screen.getByText('First')).toHaveFocus();
    });

    it('skips a disabled first control and focuses the first enabled one', () => {
      render(
        <Modal active>
          <button type="button" disabled>
            Disabled
          </button>
          <button type="button">Enabled</button>
        </Modal>
      );
      expect(screen.getByText('Enabled')).toHaveFocus();
    });

    it('skips a negative-tabIndex first control when moving focus in', () => {
      render(
        <Modal active>
          <a href="#skip" tabIndex={-1}>
            Not tabbable
          </a>
          <button type="button">Enabled</button>
        </Modal>
      );
      expect(screen.getByText('Enabled')).toHaveFocus();
    });

    it('falls back to focusing the modal root when nothing is focusable', () => {
      render(<Modal active>{latin}</Modal>);
      expect(screen.getByTestId('modal')).toHaveFocus();
    });

    it('restores focus to the previously focused element on close', () => {
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      outside.focus();
      expect(outside).toHaveFocus();

      const { rerender } = render(
        <Modal active>
          <button type="button">Inside</button>
        </Modal>
      );
      expect(screen.getByText('Inside')).toHaveFocus();

      rerender(<Modal active={false}>content</Modal>);
      expect(outside).toHaveFocus();

      document.body.removeChild(outside);
    });

    it('does not pull focus out of a modal that is still open on top', () => {
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      outside.focus();

      const stack = (backgroundActive: boolean) => (
        <>
          <Modal active={backgroundActive}>
            <button type="button">Background control</button>
          </Modal>
          <Modal active>
            <button type="button">Top control</button>
          </Modal>
        </>
      );

      const { rerender } = render(stack(true));
      expect(screen.getByText('Top control')).toHaveFocus();

      // Closing the background modal must not restore the focus it saved.
      rerender(stack(false));
      expect(screen.getByText('Top control')).toHaveFocus();
      expect(outside).not.toHaveFocus();

      document.body.removeChild(outside);
    });
  });

  describe('Portal', () => {
    it('renders inline when portal is false (default)', () => {
      const { container } = render(<Modal active>{latin}</Modal>);
      expect(container.querySelector('[data-testid="modal"]')).not.toBeNull();
    });

    it('renders into document.body when portal is true', () => {
      const { container } = render(
        <Modal active portal>
          {latin}
        </Modal>
      );
      expect(container.querySelector('[data-testid="modal"]')).toBeNull();
      const modalEl = document.querySelector('[data-testid="modal"]');
      expect(modalEl).not.toBeNull();
      expect(modalEl?.parentElement).toBe(document.body);
    });

    it('renders into a custom selector string', () => {
      const target = document.createElement('div');
      target.id = 'modal-target';
      document.body.appendChild(target);

      render(
        <Modal active portal="#modal-target">
          {latin}
        </Modal>
      );
      expect(target.querySelector('[data-testid="modal"]')).not.toBeNull();

      document.body.removeChild(target);
    });

    it('renders into a given HTMLElement', () => {
      const target = document.createElement('div');
      document.body.appendChild(target);

      render(
        <Modal active portal={target}>
          {latin}
        </Modal>
      );
      expect(target.querySelector('[data-testid="modal"]')).not.toBeNull();

      document.body.removeChild(target);
    });

    it('keeps focus in the modal across the hydration portal move, and restores it on close', async () => {
      // The move from inline to portal remounts the subtree, so the focus
      // effect has to re-run against the new nodes — otherwise focus is left
      // on the detached node and close never restores it.
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      outside.focus();

      const modal = (
        <Modal active portal>
          <button type="button">Inside</button>
        </Modal>
      );
      const container = document.createElement('div');
      container.innerHTML = renderToString(modal);
      document.body.appendChild(container);

      let unmountRoot = () => {};
      await act(async () => {
        const root = hydrateRoot(container, modal);
        unmountRoot = () => root.unmount();
      });

      // Focus followed the modal into the portal rather than staying behind.
      const portaledButton = document.body.querySelector<HTMLButtonElement>(
        '[data-testid="modal"] button'
      );
      expect(portaledButton).not.toBeNull();
      expect(portaledButton).toHaveFocus();

      // And the pre-open element is still the restore target after the move.
      await act(async () => unmountRoot());
      expect(outside).toHaveFocus();

      document.body.removeChild(container);
      document.body.removeChild(outside);
    });

    it('hydrates the server markup inline, then moves into the portal', async () => {
      const modal = (
        <Modal active portal>
          Hydrated modal
        </Modal>
      );
      const container = document.createElement('div');
      container.innerHTML = renderToString(modal);
      document.body.appendChild(container);

      // The server renders inline, so the markup must be there to hydrate.
      expect(container.querySelector('[data-testid="modal"]')).not.toBeNull();

      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      let unmountRoot = () => {};
      await act(async () => {
        const root = hydrateRoot(container, modal);
        unmountRoot = () => root.unmount();
      });

      // No hydration mismatch, and the modal has moved into document.body.
      expect(errorSpy).not.toHaveBeenCalled();
      expect(container.querySelector('[data-testid="modal"]')).toBeNull();
      const portaled = document.body.querySelector('[data-testid="modal"]');
      expect(portaled?.parentElement).toBe(document.body);

      await act(async () => unmountRoot());
      errorSpy.mockRestore();
      document.body.removeChild(container);
    });

    it('re-points a forwarded ref at the portaled node after the hydration move', async () => {
      // The move remounts the subtree, so the forwarded ref has to detach from
      // the inline node and reattach to the portaled one; a consumer holding
      // the first node would otherwise be pointing at a detached element.
      const seen: (HTMLDivElement | null)[] = [];
      const modal = (
        <Modal
          active
          portal
          ref={(node: HTMLDivElement | null) => {
            seen.push(node);
          }}
        >
          Hydrated modal
        </Modal>
      );
      const container = document.createElement('div');
      container.innerHTML = renderToString(modal);
      document.body.appendChild(container);

      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      let unmountRoot = () => {};
      await act(async () => {
        const root = hydrateRoot(container, modal);
        unmountRoot = () => root.unmount();
      });

      const portaled = document.body.querySelector('[data-testid="modal"]');
      expect(portaled).not.toBeNull();
      expect(seen[seen.length - 1]).toBe(portaled);

      await act(async () => unmountRoot());
      expect(seen[seen.length - 1]).toBeNull();
      errorSpy.mockRestore();
      document.body.removeChild(container);
    });
  });
});
