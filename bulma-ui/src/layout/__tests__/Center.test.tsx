import { render, screen } from '@testing-library/react';
import { Center } from '../Center';
import { ConfigProvider } from '../../helpers/Config';

// The shared behavior (`as`, the list role, the ref, the helper props) is in
// helpers/__tests__/stackLayout.test.tsx, and the layout itself in
// Stack.styles.test.tsx.
describe('Center', () => {
  it('renders stack is-centered around its content', () => {
    render(
      <Center data-testid="center" p="6">
        <span>Loading</span>
      </Center>
    );
    const center = screen.getByTestId('center');
    expect(center.className).toBe('stack is-centered p-6');
    expect(center).toHaveTextContent('Loading');
  });

  it('has no gap unless you set one', () => {
    const { rerender } = render(<Center data-testid="center" />);
    expect(screen.getByTestId('center').className).not.toMatch(/is-gap/);
    rerender(<Center data-testid="center" gap="2" />);
    expect(screen.getByTestId('center')).toHaveClass('is-gap-2');
  });

  it('sizes itself to its content with display inline-flex', () => {
    render(<Center data-testid="center" display="inline-flex" />);
    expect(screen.getByTestId('center')).toHaveClass('is-inline-flex');
  });

  it('never reverses: a flexDirection from untyped code is dropped', () => {
    const untyped = { flexDirection: 'column' } as object;
    render(<Center data-testid="center" {...untyped} />);
    expect(screen.getByTestId('center').className).toBe('stack is-centered');
  });

  it('prefixes its modifier', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <Center data-testid="center" />
      </ConfigProvider>
    );
    expect(screen.getByTestId('center').className).toBe(
      'bestax-stack bestax-is-centered'
    );
  });
});
