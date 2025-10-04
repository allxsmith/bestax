import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';
import { ConfigProvider } from '../../helpers/Config';

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

  describe('Compound Components API', () => {
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
});
