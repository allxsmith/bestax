// Where the menu sits, and what keeps it inside the viewport, come from
// _contextmenu.scss, which jsdom never loads on its own, so className
// assertions cannot see them. These compile the real partial under a class
// prefix and assert computed style instead (pattern: HoverCard.styles.test.tsx).
// jsdom leaves `var()` unresolved, so values that read a variable are
// compared as written.
import * as sass from 'sass';
import path from 'path';
import { fireEvent, render } from '@testing-library/react';
import { ContextMenu } from '../ContextMenu';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

let styleEl: HTMLStyleElement;

beforeAll(() => {
  styleEl = document.createElement('style');
  styleEl.textContent = sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: 'bestax-');
     @use 'components/contextmenu';`,
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

const openPrefixed = () => {
  render(
    <ConfigProvider classPrefix="bestax-">
      <ContextMenu
        aria-label="Actions"
        trigger={<div data-testid="trigger">report.pdf</div>}
      >
        <ContextMenu.Item>Rename</ContextMenu.Item>
      </ContextMenu>
    </ConfigProvider>
  );
  fireEvent.contextMenu(document.querySelector('[data-testid="trigger"]')!);
};

const box = () =>
  document.querySelector('.bestax-context-menu-content') as HTMLElement;

const ruleFor = (selector: string) =>
  Array.from(styleEl.sheet!.cssRules).find(
    (rule): rule is CSSStyleRule =>
      rule instanceof CSSStyleRule && rule.selectorText === selector
  );

describe('ContextMenu styles under a class prefix', () => {
  it('fixes a zero-size box to the viewport, over the page', () => {
    openPrefixed();
    const style = getComputedStyle(box());
    expect(style.position).toBe('fixed');
    expect(style.width).toBe('0px');
    expect(style.height).toBe('0px');
    expect(style.zIndex).toBe('var(--bulma-context-menu-z-index)');
  });

  it('places the box with both classes, so it wins over Bulma’s .dropdown whichever loads last', () => {
    expect(
      ruleFor('.bestax-dropdown.bestax-context-menu-content')
    ).toBeTruthy();
  });

  it('caps the menu’s height and scrolls it inside', () => {
    openPrefixed();
    const content = box().querySelector('.bestax-dropdown-content')!;
    const style = getComputedStyle(content);
    expect(style.maxHeight).toBe('var(--bulma-context-menu-max-height)');
    expect(style.overflowY).toBe('auto');
  });

  it('draws an item’s focus ring inside it, where the scrolling content can’t clip it', () => {
    // jsdom's CSSOM drops :focus-visible rules, so read the compiled sheet.
    expect(styleEl.textContent).toMatch(
      /\.bestax-dropdown\.bestax-context-menu-content \.bestax-dropdown-item:focus-visible \{\s*outline-offset: calc\(-1 \* var\(--bulma-focus-width\)\);\s*\}/
    );
  });

  it('declares its variables on the box, which is portaled away from the trigger', () => {
    openPrefixed();
    expect(box().parentElement).toBe(document.body);
    const style = getComputedStyle(box());
    expect(style.getPropertyValue('--bulma-context-menu-max-height')).toBe(
      'calc(100dvh - 1rem)'
    );
    expect(style.getPropertyValue('--bulma-context-menu-z-index')).toBe('70');
  });

  it('turns off the iOS callout on the trigger', () => {
    const rule = ruleFor('.bestax-context-menu');
    expect(rule?.cssText).toContain('-webkit-touch-callout: none');
  });
});
