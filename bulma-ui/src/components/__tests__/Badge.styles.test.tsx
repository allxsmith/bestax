// Standalone-mode CSS defects (see issue #264) are invisible to jsdom's default
// className assertions — fireEvent bypasses hit-testing and jsdom skips layout.
// These tests compile the real SCSS partial and assert computed style instead.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Badge } from '../Badge';
import { ConfigProvider } from '../../helpers/Config';
import {
  cascade,
  compilePartial,
  matches,
  splitList,
} from '../../__tests__/css-cascade';

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

// A badge is a background color with a shadow for a ring, which forced colors
// (Windows' contrast themes) paints in Canvas and drops, so a dot vanished and
// a pill lost its edge (#1989). jsdom evaluates no media query, so these
// compile the partial, with and without a class prefix, lift the
// forced-colors block's rules out of it, as a forced-colors page applies them,
// and resolve each property with the shared cascade.
describe('Badge on a forced-colors page', () => {
  const FORCED = '(forced-colors: active)';

  /** The sheet's top-level rules. */
  const topLevel = (css: string) => {
    const sheet = document.createElement('style');
    sheet.textContent = css;
    document.head.appendChild(sheet);
    try {
      return Array.from((sheet.sheet as CSSStyleSheet).cssRules);
    } finally {
      sheet.remove();
    }
  };

  /** The sheet as a forced-colors page reads it. */
  const forcedPage = (css: string) =>
    topLevel(css)
      .flatMap(rule =>
        rule instanceof CSSMediaRule && rule.conditionText === FORCED
          ? Array.from(rule.cssRules, inner => inner.cssText)
          : [rule.cssText]
      )
      .join('\n');

  /**
   * What the rules give one property, read as it's declared, in lower case,
   * since jsdom keeps a system color's case in some values and not others.
   */
  const valueOf = (el: Element, css: string, property: string) =>
    cascade(
      el,
      css,
      [property],
      (style, name) => style.getPropertyValue(name).trim() || undefined
    )?.toLowerCase();

  /**
   * The declarations of every top-level `::after` rule whose element part
   * matches `el`, in source order.
   */
  const afterOf = (el: Element, css: string) =>
    topLevel(css)
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
      .flatMap(rule =>
        splitList(rule.selectorText)
          .filter(part => part.endsWith('::after'))
          .filter(part => matches(el, part.slice(0, -'::after'.length)))
          .map(() =>
            `${rule.style.getPropertyValue('background-color')} / ${rule.style.getPropertyValue('outline')}`.toLowerCase()
          )
      );
  // The halo's fill and outline, at rest, and a count's on a forced page.
  const HALO = 'inherit / ';
  const RING = 'transparent / 1px solid canvastext';

  describe.each([
    ['no prefix', ''],
    ['a class prefix', 'bestax-'],
  ])('with %s', (_label, prefix) => {
    const partial = compilePartial('components/badge', prefix);
    const css = forcedPage(partial);

    /** A dot on an anchor, a standalone dot, a count and a standalone text badge. */
    const renderBadges = () => {
      const { getByTestId } = render(
        <ConfigProvider classPrefix={prefix}>
          <Badge dot color="danger" data-testid="dot">
            <span>icon</span>
          </Badge>
          <Badge dot color="success" pulse data-testid="standalone-dot" />
          <Badge content={4} color="danger" data-testid="count">
            <span>icon</span>
          </Badge>
          <Badge content="New" color="info" data-testid="text" />
        </ConfigProvider>
      );
      const pill = (id: string) => {
        const el = getByTestId(id);
        // A badge on an anchor puts the test id on its wrapper.
        return el.classList.contains(`${prefix}badge`)
          ? el
          : (el.querySelector(`.${prefix}badge`) as HTMLElement);
      };
      return {
        dots: [pill('dot'), pill('standalone-dot')],
        pills: [pill('count'), pill('text')],
      };
    };

    it('fills a dot in CanvasText, opted out of the browser’s colors, with its ring in Canvas', () => {
      const { dots } = renderBadges();
      for (const dot of dots) {
        expect(dot).toHaveClass(`${prefix}is-dot`);
        expect(valueOf(dot, css, 'background-color')).toBe('canvastext');
        expect(valueOf(dot, css, 'forced-color-adjust')).toBe('none');
        expect(valueOf(dot, css, 'box-shadow')).toBe(
          '0 0 0 var(--bulma-badge-ring-width) canvas'
        );
      }
    });

    it('draws a count’s or a text badge’s edge inside its box, and leaves its colors to the browser', () => {
      const { pills } = renderBadges();
      for (const pill of pills) {
        expect(valueOf(pill, css, 'outline')).toBe('1px solid canvastext');
        expect(valueOf(pill, css, 'outline-offset')).toBe('-1px');
        expect(valueOf(pill, css, 'forced-color-adjust')).toBeUndefined();
      }
    });

    // A background helper on the dot is `!important`, and the dot opts out
    // of the browser's colors, so the fill has to outrank it.
    it('fills a dot in CanvasText over a background helper', () => {
      const { getByTestId } = render(
        <ConfigProvider classPrefix={prefix}>
          <Badge
            dot
            className={`${prefix}has-background-dark`}
            data-testid="dot"
          />
        </ConfigProvider>
      );
      const helper = `.${prefix}has-background-dark { background-color: var(--bulma-dark) !important; }`;
      for (const sheet of [helper + css, css + helper]) {
        expect(valueOf(getByTestId('dot'), sheet, 'background-color')).toBe(
          'canvastext'
        );
      }
    });

    it('pulses a dot in its CanvasText fill, and a count as a CanvasText ring', () => {
      const { getByTestId } = render(
        <ConfigProvider classPrefix={prefix}>
          <Badge dot pulse data-testid="dot" />
          <Badge content={4} pulse data-testid="count" />
        </ConfigProvider>
      );
      // The halo reads the badge's fill, at rest and on a forced-colors page.
      expect(afterOf(getByTestId('dot'), css)).toEqual([HALO]);
      expect(afterOf(getByTestId('count'), css)).toEqual([HALO, RING]);
    });

    it('keeps every rule it adds inside the forced-colors block', () => {
      const outside: string[] = [];
      const walk = (rules: CSSRule[]) => {
        for (const rule of rules) {
          if (rule instanceof CSSMediaRule && rule.conditionText === FORCED) {
            continue;
          }
          if ('cssRules' in rule) {
            walk(Array.from((rule as CSSGroupingRule).cssRules));
          } else {
            outside.push(rule.cssText);
          }
        }
      };
      walk(topLevel(partial));
      expect(outside.length).toBeGreaterThan(0);
      for (const text of outside) {
        expect(text).not.toMatch(/outline|forced-color-adjust|canvas/i);
      }
    });
  });
});
