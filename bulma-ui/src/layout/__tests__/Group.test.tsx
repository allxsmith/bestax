import { render, screen } from '@testing-library/react';
import { Group } from '../Group';
import { ConfigProvider } from '../../helpers/Config';

// The shared behavior (`as`, the list role, the ref, the helper props) is in
// helpers/__tests__/stackLayout.test.tsx, and the layout itself in
// Stack.styles.test.tsx.
describe('Group', () => {
  it('renders a row, stack is-horizontal, with its children in order', () => {
    render(
      <Group data-testid="group">
        <button>Save</button>
        <button>Cancel</button>
      </Group>
    );
    const group = screen.getByTestId('group');
    expect(group.className).toBe('stack is-horizontal');
    expect(screen.getAllByRole('button').map(b => b.textContent)).toEqual([
      'Save',
      'Cancel',
    ]);
  });

  it('leaves its default gap, alignment and wrapping to the stylesheet', () => {
    render(<Group data-testid="group" />);
    expect(screen.getByTestId('group').className).not.toMatch(
      /is-gap|is-align-items|is-flex-wrap/
    );
  });

  it('replaces the defaults through the helper classes', () => {
    render(
      <Group
        data-testid="group"
        gap="1"
        alignItems="baseline"
        justifyContent="space-between"
        flexWrap="nowrap"
      />
    );
    expect(screen.getByTestId('group')).toHaveClass(
      'is-gap-1',
      'is-align-items-baseline',
      'is-justify-content-space-between',
      'is-flex-wrap-nowrap'
    );
  });

  it('shares the row equally with isFullwidth', () => {
    render(<Group data-testid="group" isFullwidth />);
    const group = screen.getByTestId('group');
    expect(group.className).toBe('stack is-horizontal is-fullwidth');
    expect(group).not.toHaveAttribute('isfullwidth');
  });

  it.each(['tablet', 'desktop', 'widescreen'] as const)(
    'stacks below %s with breakpoint',
    breakpoint => {
      render(<Group data-testid="group" breakpoint={breakpoint} isFullwidth />);
      const group = screen.getByTestId('group');
      expect(group.className).toBe(
        `stack is-horizontal is-fullwidth is-${breakpoint}`
      );
      expect(group).not.toHaveAttribute('breakpoint');
    }
  );

  it('ignores a breakpoint it does not know, from untyped code', () => {
    const untyped = { breakpoint: 'fullhd' } as object;
    render(<Group data-testid="group" {...untyped} />);
    expect(screen.getByTestId('group').className).toBe('stack is-horizontal');
  });

  it('never reverses: a flexDirection from untyped code is dropped', () => {
    const untyped = { flexDirection: 'row-reverse' } as object;
    render(<Group data-testid="group" {...untyped} />);
    expect(screen.getByTestId('group').className).toBe('stack is-horizontal');
  });

  it('prefixes its modifiers', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <Group data-testid="group" isFullwidth breakpoint="desktop" />
      </ConfigProvider>
    );
    expect(screen.getByTestId('group').className).toBe(
      'bestax-stack bestax-is-horizontal bestax-is-fullwidth bestax-is-desktop'
    );
  });
});
