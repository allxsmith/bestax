import { render, screen } from '@testing-library/react';
import { Avatars } from '../Avatars';
import { Avatar } from '../Avatar';
import { ConfigProvider } from '../../helpers/Config';

describe('Avatars', () => {
  it('renders all children when max is not set', () => {
    render(
      <Avatars>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
      </Avatars>
    );
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('GH')).toBeInTheDocument();
  });

  it('clamps to max and renders a surplus avatar', () => {
    render(
      <Avatars max={2}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Katherine Johnson" />
        <Avatar name="Margaret Hamilton" />
      </Avatars>
    );
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('GH')).toBeInTheDocument();
    expect(screen.queryByText('KJ')).not.toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('collapses every child into the surplus when max is 0', () => {
    render(
      <Avatars max={0}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Katherine Johnson" />
      </Avatars>
    );
    expect(screen.queryByText('AL')).not.toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('ignores a negative max and clamps nothing', () => {
    render(
      <Avatars max={-1}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Katherine Johnson" />
      </Avatars>
    );
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('GH')).toBeInTheDocument();
    expect(screen.getByText('KJ')).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('gives the surplus avatar an accessible name of "{N} more"', () => {
    render(
      <Avatars max={2}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Katherine Johnson" />
        <Avatar name="Margaret Hamilton" />
      </Avatars>
    );
    expect(screen.getByRole('img', { name: '2 more' })).toBeInTheDocument();
  });

  it('renders no surplus avatar when max is not exceeded', () => {
    render(
      <Avatars max={5}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
      </Avatars>
    );
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('applies a uniform size to every child and the surplus avatar', () => {
    render(
      <Avatars max={1} size="64x64">
        <Avatar name="Ada Lovelace" data-testid="first" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Katherine Johnson" />
      </Avatars>
    );
    expect(screen.getByTestId('first')).toHaveClass('is-64x64');
    expect(screen.getByText('+2').closest('figure')).toHaveClass('is-64x64');
  });

  it('applies a uniform shape to every child and the surplus avatar', () => {
    render(
      <Avatars max={1} shape="square">
        <Avatar name="Ada Lovelace" data-testid="first" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Katherine Johnson" />
      </Avatars>
    );
    expect(screen.getByTestId('first')).toHaveClass('is-square');
    expect(screen.getByText('+2').closest('figure')).toHaveClass('is-square');
  });

  it('lets a child keep its own size when the group size is unset', () => {
    render(
      <Avatars>
        <Avatar name="Ada Lovelace" size="32x32" data-testid="first" />
      </Avatars>
    );
    expect(screen.getByTestId('first')).toHaveClass('is-32x32');
  });

  it('lets a child keep its own shape when the group shape is unset', () => {
    render(
      <Avatars>
        <Avatar name="Ada Lovelace" shape="square" data-testid="first" />
      </Avatars>
    );
    expect(screen.getByTestId('first')).toHaveClass('is-square');
  });

  it('shows a single overflow avatar directly instead of a pointless "+1"', () => {
    render(
      <Avatars max={3}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Katherine Johnson" />
        <Avatar name="Margaret Hamilton" />
      </Avatars>
    );
    // Four children, max 3 — collapsing to "+1" saves no space, so the fourth
    // avatar renders directly and no surplus bubble appears.
    expect(screen.getByText('MH')).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('exposes Avatar as a compound static', () => {
    expect(Avatars.Avatar).toBe(Avatar);
  });

  it('applies the spacing class (defaults to md)', () => {
    const { container } = render(
      <Avatars>
        <Avatar name="Ada Lovelace" />
      </Avatars>
    );
    expect(container.firstChild).toHaveClass('is-spacing-md');
  });

  it('applies a custom spacing', () => {
    const { container } = render(
      <Avatars spacing="lg">
        <Avatar name="Ada Lovelace" />
      </Avatars>
    );
    expect(container.firstChild).toHaveClass('is-spacing-lg');
  });

  it('sets an inline spacing var and no spacing class for a numeric spacing', () => {
    const { container } = render(
      <Avatars spacing={16}>
        <Avatar name="Ada Lovelace" />
      </Avatars>
    );
    const el = container.firstChild as HTMLElement;
    expect(el).not.toHaveClass('is-spacing-16');
    expect(el.style.getPropertyValue('--bulma-avatars-spacing')).toBe('16px');
  });

  it('applies the is-spaced class for the non-overlapping mode', () => {
    const { container } = render(
      <Avatars spaced>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
      </Avatars>
    );
    expect(container.firstChild).toHaveClass('is-spaced');
  });

  it('preserves a caller style alongside the spacing var', () => {
    const { container } = render(
      <Avatars spacing={12} style={{ marginTop: '4px' }}>
        <Avatar name="Ada Lovelace" />
      </Avatars>
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue('--bulma-avatars-spacing')).toBe('12px');
    expect(el).toHaveStyle({ marginTop: '4px' });
  });

  it('passes Bulma helper props through', () => {
    const { container } = render(
      <Avatars m="3">
        <Avatar name="Ada Lovelace" />
      </Avatars>
    );
    expect(container.firstChild).toHaveClass('m-3');
  });

  it('applies a custom className', () => {
    const { container } = render(
      <Avatars className="extra">
        <Avatar name="Ada Lovelace" />
      </Avatars>
    );
    expect(container.firstChild).toHaveClass('extra');
  });

  it('renders children with an explicit key', () => {
    const members = [
      { id: 'a', name: 'Ada Lovelace' },
      { id: 'b', name: 'Grace Hopper' },
    ];
    render(
      <Avatars>
        {members.map(member => (
          <Avatar key={member.id} name={member.name} />
        ))}
      </Avatars>
    );
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('GH')).toBeInTheDocument();
  });

  it('ignores non-element children', () => {
    render(
      <Avatars>
        {null}
        {'text node'}
        <Avatar name="Ada Lovelace" />
      </Avatars>
    );
    expect(screen.getByText('AL')).toBeInTheDocument();
    // The text node must actually be dropped, not just coexist with the
    // avatar — without this assertion the test passes with or without the
    // isValidElement filter.
    expect(screen.queryByText('text node')).not.toBeInTheDocument();
  });

  it('counts Fragment children individually for max', () => {
    render(
      <Avatars max={2}>
        <>
          <Avatar name="Ada Lovelace" />
          <Avatar name="Grace Hopper" />
          <Avatar name="Alan Turing" />
          <Avatar name="Katherine Johnson" />
        </>
      </Avatars>
    );
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('GH')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.queryByText('AT')).not.toBeInTheDocument();
    expect(screen.queryByText('KJ')).not.toBeInTheDocument();
  });

  it('injects the group size through Fragment children', () => {
    const { container } = render(
      <Avatars size="48x48">
        <>
          <Avatar name="Ada Lovelace" />
        </>
      </Avatars>
    );
    expect(container.querySelector('.avatar')).toHaveClass('is-48x48');
  });

  it('flattens a keyed mapped list inside a Fragment next to a sibling without key collisions', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <Avatars max={2}>
        <Avatar name="Zz Static" />
        <>
          {['Ada Lovelace', 'Grace Hopper', 'Alan Turing'].map(n => (
            <Avatar key={n} name={n} />
          ))}
        </>
      </Avatars>
    );
    // 4 children, max 2 → 2 visible + "+2" surplus.
    expect(screen.getByText('ZS')).toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    // Re-keying flattened fragment children must not produce React's
    // duplicate-key warning.
    const keyWarnings = errorSpy.mock.calls.filter(args =>
      String(args[0]).includes('same key')
    );
    expect(keyWarnings).toHaveLength(0);
    errorSpy.mockRestore();
  });

  it('flattens nested Fragments', () => {
    render(
      <Avatars max={2}>
        <>
          <Avatar name="Ada Lovelace" />
          <>
            <Avatar name="Grace Hopper" />
            <Avatar name="Alan Turing" />
            <Avatar name="Katherine Johnson" />
          </>
        </>
      </Avatars>
    );
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('GH')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('applies the classPrefix from ConfigProvider', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <Avatars>
          <Avatar name="Ada Lovelace" />
        </Avatars>
      </ConfigProvider>
    );
    expect(container.firstChild).toHaveClass('bulma-avatars');
    expect(container.firstChild).not.toHaveClass('avatars');
  });

  it('ignores a fractional max and clamps nothing', () => {
    render(
      <Avatars max={2.5}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Katherine Johnson" />
      </Avatars>
    );
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('GH')).toBeInTheDocument();
    expect(screen.getByText('KJ')).toBeInTheDocument();
  });
});
