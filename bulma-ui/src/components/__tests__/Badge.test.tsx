import { render, screen, fireEvent } from '@testing-library/react';
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
    const { container } = render(
      <Badge content={1}>
        <span>child</span>
      </Badge>
    );
    expect(container.querySelector('.badge')).toHaveClass(
      'is-danger',
      'is-top-right'
    );
  });

  it('applies a custom position', () => {
    const { container } = render(
      <Badge content={1} position="bottom-left">
        <span>child</span>
      </Badge>
    );
    expect(container.querySelector('.badge')).toHaveClass('is-bottom-left');
  });

  it('applies a custom overlap', () => {
    const { container } = render(
      <Badge content={1} overlap="circle">
        <span>child</span>
      </Badge>
    );
    expect(container.querySelector('.badge')).toHaveClass('is-overlap-circle');
  });

  it('does not emit position/overlap classes on a standalone badge', () => {
    render(<Badge content={1} data-testid="badge" />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('is-standalone');
    expect(badge).not.toHaveClass('is-top-right');
    expect(badge).not.toHaveClass('is-overlap-square');
  });

  it('applies the pulse class', () => {
    render(<Badge content={1} pulse data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveClass('is-pulse');
  });

  it('hides the badge without unmounting it when invisible', () => {
    const { container } = render(
      <Badge content={1} invisible data-testid="badge">
        <span data-testid="child">child</span>
      </Badge>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    // The pass-through data-testid lands on the wrapper root; the pill itself
    // carries is-invisible.
    expect(screen.getByTestId('badge')).toHaveClass('badge-wrapper');
    expect(container.querySelector('.badge')).toHaveClass('is-invisible');
  });

  it('keeps the wrapper (and its rest props) when the badge is hidden', () => {
    const onClick = jest.fn();
    render(
      <Badge content={0} data-testid="badge" id="root" onClick={onClick}>
        <span data-testid="child">child</span>
      </Badge>
    );
    const wrapper = screen.getByTestId('badge');
    expect(wrapper).toHaveClass('badge-wrapper');
    expect(wrapper).toHaveAttribute('id', 'root');
    expect(screen.getByTestId('child')).toBeInTheDocument();
    fireEvent.click(wrapper);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('routes className and rest to the wrapper, badgeClassName to the pill', () => {
    const { container } = render(
      <Badge content={3} className="wrap-extra" badgeClassName="pill-extra">
        <span>child</span>
      </Badge>
    );
    expect(container.querySelector('.badge-wrapper')).toHaveClass('wrap-extra');
    const pill = container.querySelector('.badge');
    expect(pill).toHaveClass('pill-extra');
    expect(pill).not.toHaveClass('wrap-extra');
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
