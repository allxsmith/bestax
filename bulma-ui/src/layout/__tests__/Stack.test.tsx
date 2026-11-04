import { render, screen } from '@testing-library/react';
import { Stack } from '../Stack';
import { ConfigProvider } from '../../helpers/Config';

// The shared behavior (`as`, the list role, the ref, the helper props) is in
// helpers/__tests__/stackLayout.test.tsx, and the layout itself in
// Stack.styles.test.tsx.
describe('Stack', () => {
  it('renders a column, stack is-vertical, with its children in order', () => {
    render(
      <Stack data-testid="stack">
        <p>First</p>
        <p>Second</p>
      </Stack>
    );
    const stack = screen.getByTestId('stack');
    expect(stack.className).toBe('stack is-vertical');
    expect(Array.from(stack.children).map(child => child.textContent)).toEqual([
      'First',
      'Second',
    ]);
  });

  it('leaves its default gap and alignment to the stylesheet', () => {
    render(<Stack data-testid="stack" />);
    const stack = screen.getByTestId('stack');
    expect(stack.className).not.toMatch(/is-gap|is-align-items/);
    expect(stack).not.toHaveAttribute('style');
  });

  it('replaces the defaults through the helper classes', () => {
    render(
      <Stack
        data-testid="stack"
        gap="2"
        alignItems="flex-start"
        justifyContent="center"
      />
    );
    expect(screen.getByTestId('stack')).toHaveClass(
      'is-gap-2',
      'is-align-items-flex-start',
      'is-justify-content-center'
    );
  });

  it('takes gapless for no gap at all', () => {
    render(<Stack data-testid="stack" gapless />);
    expect(screen.getByTestId('stack')).toHaveClass('is-gapless');
  });

  it('never reverses: a flexDirection from untyped code is dropped', () => {
    const untyped = { flexDirection: 'column-reverse' } as object;
    render(<Stack data-testid="stack" {...untyped} />);
    const stack = screen.getByTestId('stack');
    expect(stack.className).toBe('stack is-vertical');
    expect(stack).not.toHaveAttribute('flexdirection');
  });

  it('prefixes its modifier', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <Stack data-testid="stack" />
      </ConfigProvider>
    );
    expect(screen.getByTestId('stack').className).toBe(
      'bestax-stack bestax-is-vertical'
    );
  });
});
