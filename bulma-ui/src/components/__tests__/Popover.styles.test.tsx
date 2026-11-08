// Where the panel sits comes from _popover.scss, which jsdom never loads on
// its own, so className assertions cannot see it. These compile the real
// partial under a class prefix and assert computed style instead (pattern:
// DateInput.styles.test.tsx). jsdom leaves `var()` unresolved, so values that
// read a variable are compared as written.
import * as sass from 'sass';
import path from 'path';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Popover } from '../Popover';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

let styleEl: HTMLStyleElement;

beforeAll(() => {
  styleEl = document.createElement('style');
  styleEl.textContent = sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: 'bestax-');
     @use 'components/popover';`,
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

const renderPrefixed = (props: Partial<ComponentProps<typeof Popover>> = {}) =>
  render(
    <ConfigProvider classPrefix="bestax-">
      <Popover
        trigger={<button>Open</button>}
        ariaLabel="Panel"
        defaultOpen
        {...props}
      >
        Content
      </Popover>
    </ConfigProvider>
  );

describe('Popover styles under a class prefix', () => {
  it('positions the wrapper so an inline panel can sit against it', () => {
    const { container } = renderPrefixed();
    expect(getComputedStyle(container.firstChild as Element).position).toBe(
      'relative'
    );
  });

  it('puts the default panel at the right edge right to left, and a named corner where it says', () => {
    // jsdom maps no `dir` to `direction`, which the placement reads.
    const rtl = document.createElement('style');
    rtl.textContent = '[dir="rtl"] { direction: rtl; }';
    document.head.appendChild(rtl);
    document.documentElement.setAttribute('dir', 'rtl');
    try {
      const { unmount } = renderPrefixed();
      const byDefault = getComputedStyle(screen.getByRole('dialog'));
      expect(byDefault.right).toBe('0px');
      expect(byDefault.left).not.toBe('0px');
      unmount();
      renderPrefixed({ position: 'bottom-left' });
      const named = getComputedStyle(screen.getByRole('dialog'));
      expect(named.left).toBe('0px');
      expect(named.right).not.toBe('0px');
    } finally {
      document.documentElement.removeAttribute('dir');
      rtl.remove();
    }
  });

  it('puts a panel open on first paint at the right edge right to left, before any effect', () => {
    // Server markup, so no effect has read the direction: the stylesheet
    // alone has to place it.
    const page = document.createElement('div');
    page.setAttribute('dir', 'rtl');
    page.innerHTML = renderToStaticMarkup(
      <ConfigProvider classPrefix="bestax-">
        <Popover trigger={<button>Open</button>} ariaLabel="Panel" defaultOpen>
          Content
        </Popover>
      </ConfigProvider>
    );
    document.body.appendChild(page);
    try {
      const style = getComputedStyle(page.querySelector('[role="dialog"]')!);
      expect(style.right).toBe('0px');
      expect(style.left).not.toBe('0px');
    } finally {
      page.remove();
    }
  });

  it('places an inline panel below the trigger, the gap from the offset variable', () => {
    renderPrefixed();
    const style = getComputedStyle(screen.getByRole('dialog'));
    expect(style.position).toBe('absolute');
    expect(style.top).toBe('100%');
    expect(style.left).toBe('0px');
    expect(style.marginTop).toBe('var(--bulma-popover-offset)');
  });

  it('sizes the panel to its content rather than to the trigger it sits against', () => {
    renderPrefixed();
    const style = getComputedStyle(screen.getByRole('dialog'));
    expect(style.width).toBe('max-content');
    expect(style.maxWidth).toBe('var(--bulma-popover-max-width)');
  });

  it('places an inline top-right panel above the trigger, on its right edge', () => {
    renderPrefixed({ position: 'top-right' });
    const style = getComputedStyle(screen.getByRole('dialog'));
    expect(style.bottom).toBe('100%');
    expect(style.right).toBe('0px');
    expect(style.marginBottom).toBe('var(--bulma-popover-offset)');
  });

  it('frees a portaled panel from the corner offsets, so only its coordinates place it', () => {
    renderPrefixed({ appendToBody: true, position: 'top-right' });
    const style = getComputedStyle(screen.getByRole('dialog'));
    expect(style.position).toBe('fixed');
    expect(style.bottom).toBe('auto');
    expect(style.right).toBe('auto');
    expect(style.marginTop).toBe('calc(-1 * var(--bulma-popover-offset))');
  });

  it('declares its variables on the panel, which a portaled panel needs', () => {
    renderPrefixed({ appendToBody: true });
    const panel = screen.getByRole('dialog');
    expect(panel.parentElement).toBe(document.body);
    expect(
      getComputedStyle(panel).getPropertyValue('--bulma-popover-offset')
    ).toBe('0.25rem');
  });

  it('drops the open animation under prefers-reduced-motion', () => {
    const reduced = Array.from(styleEl.sheet!.cssRules).filter(
      (rule): rule is CSSMediaRule =>
        rule instanceof CSSMediaRule &&
        rule.conditionText.includes('prefers-reduced-motion: reduce')
    );
    const rules = reduced.flatMap(media =>
      Array.from(media.cssRules).filter(
        (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule
      )
    );
    const panelRule = rules.find(
      rule => rule.selectorText === '.bestax-popover-content'
    );
    expect(panelRule?.style.animation).toBe('none');
  });
});
