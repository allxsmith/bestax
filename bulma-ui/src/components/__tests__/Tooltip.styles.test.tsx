// Whether the pointer can reach a shown tooltip comes from _tooltip.scss,
// which jsdom never loads on its own, so className assertions cannot see it.
// These compile the real partial under a class prefix and assert computed
// style instead (pattern: HoverCard.styles.test.tsx). jsdom leaves `var()`
// unresolved, so values that read a variable are compared as written, and it
// computes no style for a pseudo-element, so the bridge is read off its rules.
import * as sass from 'sass';
import path from 'path';
import type { ComponentProps } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip } from '../Tooltip';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

let styleEl: HTMLStyleElement;

beforeAll(() => {
  styleEl = document.createElement('style');
  styleEl.textContent = sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: 'bestax-');
     @use 'components/tooltip';`,
    {
      loadPaths: [SCSS, NODE_MODULES],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;
  document.head.appendChild(styleEl);
});

afterAll(() => {
  styleEl.remove();
});

const renderPrefixed = (props: Partial<ComponentProps<typeof Tooltip>> = {}) =>
  render(
    <ConfigProvider classPrefix="bestax-">
      <Tooltip label="Tip" {...props}>
        <button>Trigger</button>
      </Tooltip>
    </ConfigProvider>
  );

const content = () => screen.getByRole('tooltip', { hidden: true });

/** The declarations of every rule whose selector list has `selector`. */
const rulesFor = (selector: string) =>
  Array.from(styleEl.sheet!.cssRules).filter(
    (rule): rule is CSSStyleRule =>
      rule instanceof CSSStyleRule &&
      rule.selectorText.split(',').some(part => part.trim() === selector)
  );

/** Shows it the way the pointer does, so it is open rather than only active. */
const hoverOpen = () => {
  const event = new MouseEvent('pointerover', { bubbles: true });
  Object.defineProperty(event, 'pointerType', { value: 'mouse' });
  fireEvent(screen.getByRole('button', { name: 'Trigger' }), event);
  act(() => {
    jest.runOnlyPendingTimers();
  });
};

/** A registered `--bulma-*` value as the rule for `selector` declares it. */
const registered = (selector: string, name: string) =>
  rulesFor(selector)
    .map(rule => rule.style.getPropertyValue(`--bulma-${name}`))
    .find(Boolean);

const bridge = (selector: string) => {
  const rules = rulesFor(`${selector}::after`);
  expect(rules.length).toBeGreaterThan(0);
  return (property: string) =>
    rules.map(rule => rule.style.getPropertyValue(property)).find(Boolean);
};

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Tooltip styles under a class prefix', () => {
  it('lets the pointer through a hidden tooltip', () => {
    renderPrefixed();
    expect(getComputedStyle(content()).pointerEvents).toBe('none');
    expect(getComputedStyle(content()).visibility).toBe('hidden');
  });

  // It takes no aria-hidden: `visibility: hidden` keeps it out of the
  // accessibility tree, and a description that points straight at it still
  // reads it (accname step 2A).
  it('keeps a hidden tooltip out of the accessibility tree, still describing its trigger', () => {
    renderPrefixed();
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Trigger' })
    ).toHaveAccessibleDescription('Tip');

    hoverOpen();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tip');
    expect(
      screen.getByRole('button', { name: 'Trigger' })
    ).toHaveAccessibleDescription('Tip');
  });

  it('lets the pointer through a tooltip only active shows, with no bridge', () => {
    const { container } = renderPrefixed({ active: true });
    expect(getComputedStyle(content()).visibility).toBe('visible');
    expect(getComputedStyle(content()).pointerEvents).toBe('none');
    expect(container.firstChild).not.toHaveClass('bestax-is-open');
  });

  it.each([
    ['', {}],
    [' multiline', { multiline: true }],
  ])('lets the pointer onto a%s tooltip the pointer opened', (_, props) => {
    const { container } = renderPrefixed(props);
    hoverOpen();
    expect(container.firstChild).toHaveClass('bestax-is-open');
    expect(getComputedStyle(content()).pointerEvents).toBe('auto');
  });

  it('keeps the arrow out of hit testing, so it never covers the trigger', () => {
    const [arrow] = rulesFor('.bestax-tooltip-content::before');
    expect(arrow.style.getPropertyValue('pointer-events')).toBe('none');
  });

  it('draws the bridge from the wrapper, and only while open', () => {
    const at = bridge('.bestax-tooltip.bestax-is-open');
    expect(at('content')).toBe('""');
    expect(at('position')).toBe('absolute');
    expect(rulesFor('.bestax-tooltip-content::after')).toHaveLength(0);
  });

  it.each([
    ['top', '.bestax-tooltip.bestax-is-open.bestax-is-top', 'bottom'],
    [
      'top, with no position class',
      '.bestax-tooltip.bestax-is-open:not(.bestax-is-bottom):not(.bestax-is-left):not(.bestax-is-right)',
      'bottom',
    ],
    ['bottom', '.bestax-tooltip.bestax-is-open.bestax-is-bottom', 'top'],
  ])(
    'bridges the gap at %s across the trigger’s width only',
    (_, selector, edge) => {
      const at = bridge(selector);
      expect(at(edge)).toBe('100%');
      expect(at('left')).toBe('0');
      expect(at('right')).toBe('0');
      expect(at('width')).toBeUndefined();
    }
  );

  it.each([
    ['left', 'right'],
    ['right', 'left'],
  ])(
    'bridges the gap at %s down the trigger’s height only',
    (position, edge) => {
      const at = bridge(`.bestax-tooltip.bestax-is-open.bestax-is-${position}`);
      expect(at(edge)).toBe('100%');
      expect(at('top')).toBe('0');
      expect(at('bottom')).toBe('0');
      expect(at('height')).toBeUndefined();
    }
  );

  it.each([
    ['the default size', '', '.bestax-tooltip-content'],
    [
      'small',
      '.bestax-is-small',
      '.bestax-tooltip.bestax-is-small .bestax-tooltip-content',
    ],
    [
      'medium',
      '.bestax-is-medium',
      '.bestax-tooltip.bestax-is-medium .bestax-tooltip-content',
    ],
    [
      'large',
      '.bestax-is-large',
      '.bestax-tooltip.bestax-is-large .bestax-tooltip-content',
    ],
  ])(
    'spans the gap the tooltip keeps at %s, in every position',
    (_, size, contentSelector) => {
      const arrow = registered(contentSelector, 'tooltip-arrow-size');
      const margin = registered(
        '.bestax-tooltip-content',
        'tooltip-arrow-margin'
      );
      const gap = `calc(${arrow} + ${margin})`;
      const open = `.bestax-tooltip.bestax-is-open${size}`;
      expect(bridge(`${open}.bestax-is-top`)('height')).toBe(gap);
      expect(bridge(`${open}.bestax-is-bottom`)('height')).toBe(gap);
      expect(bridge(`${open}.bestax-is-left`)('width')).toBe(gap);
      expect(bridge(`${open}.bestax-is-right`)('width')).toBe(gap);
    }
  );

  it('keeps the tooltip that distance from the trigger', () => {
    renderPrefixed({ position: 'bottom' });
    expect(getComputedStyle(content()).top).toBe(
      'calc(100% + var(--bulma-tooltip-arrow-size) + var(--bulma-tooltip-arrow-margin))'
    );
  });
});
