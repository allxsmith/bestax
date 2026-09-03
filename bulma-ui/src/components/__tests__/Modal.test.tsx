import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';
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
  });
});
