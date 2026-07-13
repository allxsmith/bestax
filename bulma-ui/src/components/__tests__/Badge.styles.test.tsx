// Standalone-mode CSS defects (see issue #264) are invisible to jsdom's default
// className assertions — fireEvent bypasses hit-testing and jsdom skips layout.
// These tests compile the real SCSS partial and assert computed style instead.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Badge } from '../Badge';

let styleEl: HTMLStyleElement;
let compiledCss: string;

beforeAll(() => {
  const result = sass.compile(
    path.resolve(__dirname, '../../scss/components/_badge.scss'),
    {
      loadPaths: [path.resolve(__dirname, '../../../../node_modules')],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  );
  compiledCss = result.css;
  styleEl = document.createElement('style');
  styleEl.textContent = result.css;
  document.head.appendChild(styleEl);
});

afterAll(() => {
  styleEl.remove();
});

describe('Badge standalone styles', () => {
  it('keeps the standalone pill clickable (pointer-events: auto)', () => {
    const { getByTestId } = render(<Badge content={5} data-testid="badge" />);
    expect(getComputedStyle(getByTestId('badge')).pointerEvents).toBe('auto');
  });

  it('positions a standalone pulse badge so the halo anchors to the pill', () => {
    const { getByTestId } = render(
      <Badge content={5} pulse data-testid="badge" />
    );
    expect(getComputedStyle(getByTestId('badge')).position).toBe('relative');
  });

  // jsdom can't resolve computed style for `::after` (getComputedStyle ignores
  // the pseudo-element argument), so assert against the compiled CSS text: the
  // pulse halo rule must declare pointer-events: none or it inherits the
  // standalone pill's `auto` and its 1.75×-scaled box swallows adjacent clicks.
  it('keeps the decorative pulse halo from intercepting clicks (pointer-events: none)', () => {
    const pulseRule = compiledCss
      .replace(/\s+/g, ' ')
      .match(/\.badge\.is-pulse::after\s*\{([^}]*)\}/);
    expect(pulseRule).not.toBeNull();
    expect(pulseRule?.[1]).toContain('pointer-events: none');
  });
});
