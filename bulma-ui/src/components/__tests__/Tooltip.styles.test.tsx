// Whether the pointer can reach a shown tooltip comes from _tooltip.scss,
// which jsdom never loads on its own, so className assertions cannot see it.
// These compile the real partial under a class prefix and assert computed
// style instead (pattern: HoverCard.styles.test.tsx). jsdom leaves `var()`
// unresolved, so values that read a variable are compared as written, and it
// computes no style for a pseudo-element, so the bridge is read off its rules.
import * as sass from 'sass';
import path from 'path';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
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

const gap =
  'calc(var(--bulma-tooltip-arrow-size) + var(--bulma-tooltip-arrow-margin))';

describe('Tooltip styles under a class prefix', () => {
  it('lets the pointer through a hidden tooltip', () => {
    renderPrefixed();
    expect(getComputedStyle(content()).pointerEvents).toBe('none');
    expect(getComputedStyle(content()).visibility).toBe('hidden');
  });

  it('lets the pointer onto a shown tooltip', () => {
    renderPrefixed({ active: true });
    expect(getComputedStyle(content()).pointerEvents).toBe('auto');
    expect(getComputedStyle(content()).visibility).toBe('visible');
  });

  it('lets the pointer onto a shown multiline tooltip', () => {
    renderPrefixed({ active: true, multiline: true });
    expect(getComputedStyle(content()).pointerEvents).toBe('auto');
  });

  it('keeps the arrow out of hit testing, so it never covers the trigger', () => {
    const [arrow] = rulesFor('.bestax-tooltip-content::before');
    expect(arrow.style.getPropertyValue('pointer-events')).toBe('none');
  });

  it('gives the bridge a box of its own, apart from the arrow', () => {
    const [bridge] = rulesFor('.bestax-tooltip-content::after');
    expect(bridge.style.content).toBe('""');
    expect(bridge.style.position).toBe('absolute');
  });

  it.each([
    ['top', '.bestax-tooltip.bestax-is-top', { top: '100%', height: gap }],
    [
      'top, with no position class',
      '.bestax-tooltip:not(.bestax-is-bottom):not(.bestax-is-left):not(.bestax-is-right)',
      { top: '100%', height: gap },
    ],
    [
      'bottom',
      '.bestax-tooltip.bestax-is-bottom',
      { bottom: '100%', height: gap },
    ],
  ])(
    'bridges the gap to the trigger across the whole tooltip at %s',
    (_, wrapperSelector, expected) => {
      const rules = rulesFor(
        `${wrapperSelector} .bestax-tooltip-content::after`
      );
      expect(rules).toHaveLength(1);
      const { style } = rules[0];
      expect(style.left).toBe('0');
      expect(style.right).toBe('0');
      for (const [property, value] of Object.entries(expected)) {
        expect(style.getPropertyValue(property)).toBe(value);
      }
    }
  );

  it.each([
    ['left', { left: '100%', width: gap }],
    ['right', { right: '100%', width: gap }],
  ])(
    'bridges the gap to the trigger down the whole tooltip at %s',
    (position, expected) => {
      const rules = rulesFor(
        `.bestax-tooltip.bestax-is-${position} .bestax-tooltip-content::after`
      );
      expect(rules).toHaveLength(1);
      const { style } = rules[0];
      expect(style.top).toBe('0');
      expect(style.bottom).toBe('0');
      for (const [property, value] of Object.entries(expected)) {
        expect(style.getPropertyValue(property)).toBe(value);
      }
    }
  );

  it('spans the same distance the tooltip keeps from the trigger', () => {
    renderPrefixed({ position: 'bottom' });
    expect(getComputedStyle(content()).top).toBe(
      'calc(100% + var(--bulma-tooltip-arrow-size) + var(--bulma-tooltip-arrow-margin))'
    );
  });
});
