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
});
