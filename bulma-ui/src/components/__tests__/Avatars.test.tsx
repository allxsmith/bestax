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
      </Avatars>
    );
    expect(screen.getByTestId('first')).toHaveClass('is-64x64');
    expect(screen.getByText('+1').closest('figure')).toHaveClass('is-64x64');
  });

  it('lets a child keep its own size when the group size is unset', () => {
    render(
      <Avatars>
        <Avatar name="Ada Lovelace" size="32x32" data-testid="first" />
      </Avatars>
    );
    expect(screen.getByTestId('first')).toHaveClass('is-32x32');
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
});
