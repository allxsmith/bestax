import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import Control from '../Control';
import { ConfigProvider } from '../../helpers/Config';

// Mock Icon so we can test for its appearance
jest.mock('../../elements/Icon', () => ({
  Icon: ({ name, ...props }: { name: string; [key: string]: unknown }) => (
    <span data-testid={`icon-${name}`} {...props} />
  ),
}));

// Mock useBulmaClasses to avoid Bulma dependencies here
jest.mock('../../helpers/useBulmaClasses', () => ({
  useBulmaClasses: () => ({
    bulmaHelperClasses: 'bulma-helpers',
    rest: {},
  }),
  validColors: [
    'primary',
    'link',
    'info',
    'success',
    'warning',
    'danger',
    'black',
    'dark',
    'light',
    'white',
  ],
}));

describe('Control', () => {
  it('renders children', () => {
    render(<Control>My Control</Control>);
    expect(screen.getByText('My Control')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Control className="custom-control">X</Control>
    );
    expect(container.firstChild).toHaveClass('custom-control');
  });

  it('renders as <div> by default', () => {
    const { container } = render(<Control>DivByDefault</Control>);
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('renders as <p> when as="p"', () => {
    const { container } = render(<Control as="p">Paragraph</Control>);
    expect(container.firstChild?.nodeName).toBe('P');
  });

  it('applies Bulma control classes', () => {
    const { container } = render(
      <Control isLoading isExpanded size="large" className="extra">
        Y
      </Control>
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('control');
    expect(el).toHaveClass('is-loading');
    expect(el).toHaveClass('is-expanded');
    expect(el).toHaveClass('is-large');
    expect(el).toHaveClass('extra');
    expect(el).toHaveClass('bulma-helpers');
  });

  it('adds has-icons-left and renders left icon via iconLeftName shortcut', () => {
    render(
      <Control iconLeftName="user" data-testid="control-root">
        Has Icon
      </Control>
    );
    expect(screen.getByTestId('icon-user')).toHaveClass('is-left');
    const el = screen.getByTestId('control-root');
    expect(el).toHaveClass('has-icons-left');
  });

  it('adds has-icons-right and renders right icon via iconRightName shortcut', () => {
    render(
      <Control iconRightName="close" data-testid="control-root">
        Has Right Icon
      </Control>
    );
    expect(screen.getByTestId('icon-close')).toHaveClass('is-right');
    const el = screen.getByTestId('control-root');
    expect(el).toHaveClass('has-icons-right');
  });

  it('renders left and right icons via iconLeft/iconRight props', () => {
    render(
      <Control
        iconLeft={{ name: 'left', size: 'small' }}
        iconRight={{ name: 'right', size: 'large' }}
      >
        Icons
      </Control>
    );
    expect(screen.getByTestId('icon-left')).toHaveClass('is-left');
    expect(screen.getByTestId('icon-right')).toHaveClass('is-right');
  });

  it('forwards ref to DOM element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Control ref={ref}>Ref Control</Control>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);

    const pRef = createRef<HTMLParagraphElement>();
    render(
      <Control as="p" ref={pRef}>
        P Ref
      </Control>
    );
    expect(pRef.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it('handles textColor and bgColor props safely', () => {
    render(
      <Control textColor="danger" bgColor="white">
        Colors
      </Control>
    );
    expect(screen.getByText('Colors')).toBeInTheDocument();
  });

  it('does not render icons if icon names/props are missing', () => {
    render(<Control>Nothing</Control>);
    // Should not find any icon
    expect(screen.queryByTestId(/icon-/)).not.toBeInTheDocument();
  });

  it('applies classPrefix when provided via ConfigProvider', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <Control>Test content</Control>
      </ConfigProvider>
    );
    const control = container.querySelector('.bulma-control');
    expect(control).toBeInTheDocument();
    expect(control).not.toHaveClass('control');
  });
});
