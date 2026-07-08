import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';
import { ConfigProvider } from '../../helpers/Config';

describe('Badge', () => {
  it('renders content overlaid on children', () => {
    render(
      <Badge content={5}>
        <span data-testid="child">child</span>
      </Badge>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders content above max as "{max}+"', () => {
    render(<Badge content={128} max={99} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('renders numeric content at or below max as-is', () => {
    render(<Badge content={42} max={99} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders string content as-is, ignoring max', () => {
    render(<Badge content="NEW" />);
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('hides at content=0 by default', () => {
    const { container } = render(
      <Badge content={0}>
        <span>child</span>
      </Badge>
    );
    expect(container.querySelectorAll('.badge')).toHaveLength(0);
  });

  it('shows at content=0 when showZero is set', () => {
    render(
      <Badge content={0} showZero>
        <span>child</span>
      </Badge>
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders a dot with no content text', () => {
    const { container } = render(
      <Badge dot>
        <span>child</span>
      </Badge>
    );
    const dot = container.querySelector('.is-dot');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveTextContent('');
  });

  it('marks a dot as aria-hidden', () => {
    const { container } = render(
      <Badge dot>
        <span>child</span>
      </Badge>
    );
    expect(container.querySelector('.is-dot')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('announces count content via role=status and aria-label', () => {
    render(
      <Badge content={7}>
        <span>child</span>
      </Badge>
    );
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-label', '7');
  });

  it('renders standalone without children', () => {
    render(<Badge content={5} color="info" />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('5')).toHaveClass('is-standalone', 'is-info');
  });

  it('renders nothing when there is no content, no dot, and no children', () => {
    const { container } = render(<Badge />);
    expect(container.firstChild).toBeNull();
  });

  it('renders only the children when the indicator is hidden', () => {
    render(
      <Badge>
        <span data-testid="child">child</span>
      </Badge>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('applies the default color (danger) and position (top-right)', () => {
    render(<Badge content={1} data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveClass(
      'is-danger',
      'is-top-right'
    );
  });

  it('applies a custom position', () => {
    render(<Badge content={1} position="bottom-left" data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveClass('is-bottom-left');
  });

  it('applies a custom overlap', () => {
    render(<Badge content={1} overlap="circle" data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveClass('is-overlap-circle');
  });

  it('applies the pulse class', () => {
    render(<Badge content={1} pulse data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveClass('is-pulse');
  });

  it('hides the badge without unmounting it when invisible', () => {
    render(
      <Badge content={1} invisible data-testid="badge">
        <span data-testid="child">child</span>
      </Badge>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toHaveClass('is-invisible');
  });

  it('renders when invisible even without content or dot', () => {
    const { container } = render(<Badge invisible />);
    expect(container.querySelector('.is-invisible')).toBeInTheDocument();
  });

  it('passes Bulma helper props through', () => {
    render(<Badge content={1} m="3" data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveClass('m-3');
  });

  it('applies a custom className', () => {
    render(<Badge content={1} className="extra" data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveClass('extra');
  });

  it('applies the classPrefix from ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <Badge content={1} data-testid="badge" />
      </ConfigProvider>
    );
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bulma-badge');
    expect(badge).not.toHaveClass('badge');
  });
});
