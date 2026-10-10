// Where the card sits, and that the pointer can reach it, come from
// _hovercard.scss, which jsdom never loads on its own, so className assertions
// cannot see them. These compile the real partial under a class prefix and
// assert computed style instead (pattern: Popover.styles.test.tsx). jsdom
// leaves `var()` unresolved, so values that read a variable are compared as
// written.
import * as sass from 'sass';
import path from 'path';
import type { ComponentProps } from 'react';
import { render } from '@testing-library/react';
import { HoverCard } from '../HoverCard';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

let styleEl: HTMLStyleElement;

beforeAll(() => {
  styleEl = document.createElement('style');
  styleEl.textContent = sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: 'bestax-');
     @use 'components/hovercard';`,
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

const renderPrefixed = (
  props: Partial<ComponentProps<typeof HoverCard>> = {}
) =>
  render(
    <ConfigProvider classPrefix="bestax-">
      <HoverCard trigger={<a href="#ada">Ada</a>} defaultOpen {...props}>
        Content
      </HoverCard>
    </ConfigProvider>
  );

const card = () =>
  document.querySelector('.bestax-hover-card-content') as HTMLElement;

describe('HoverCard styles under a class prefix', () => {
  it('makes the wrapper an inline block an inline card can sit against', () => {
    const { container } = renderPrefixed();
    const style = getComputedStyle(container.firstChild as Element);
    expect(style.position).toBe('relative');
    expect(style.display).toBe('inline-block');
  });

  it('places an inline card below the trigger, the gap from the offset variable', () => {
    renderPrefixed();
    const style = getComputedStyle(card());
    expect(style.position).toBe('absolute');
    expect(style.top).toBe('100%');
    expect(style.left).toBe('0px');
    expect(style.marginTop).toBe('var(--bulma-hover-card-offset)');
  });

  it('leaves the card to the pointer, unlike a tooltip, and pads it', () => {
    renderPrefixed();
    const style = getComputedStyle(card());
    expect(style.pointerEvents).not.toBe('none');
    expect(style.padding).toBe('var(--bulma-hover-card-padding)');
    expect(style.zIndex).toBe('var(--bulma-hover-card-z-index)');
  });

  it('sizes the card to its content rather than to the trigger it sits against', () => {
    renderPrefixed();
    const style = getComputedStyle(card());
    expect(style.width).toBe('max-content');
    expect(style.maxWidth).toBe('var(--bulma-hover-card-max-width)');
    expect(style.whiteSpace).toBe('normal');
  });

  it('places an inline top-right card above the trigger, on its right edge', () => {
    renderPrefixed({ position: 'top-right' });
    const style = getComputedStyle(card());
    expect(style.bottom).toBe('100%');
    expect(style.right).toBe('0px');
    expect(style.marginBottom).toBe('var(--bulma-hover-card-offset)');
  });

  it('frees a portaled card from the corner offsets, so only its coordinates place it', () => {
    renderPrefixed({ appendToBody: true, position: 'top-right' });
    const style = getComputedStyle(card());
    expect(style.position).toBe('fixed');
    expect(style.bottom).toBe('auto');
    expect(style.right).toBe('auto');
    expect(style.marginTop).toBe('calc(-1 * var(--bulma-hover-card-offset))');
  });

  it('declares its variables on the card, which a portaled card needs', () => {
    renderPrefixed({ appendToBody: true });
    expect(card().parentElement).toBe(document.body);
    expect(
      getComputedStyle(card()).getPropertyValue('--bulma-hover-card-offset')
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
    const cardRule = rules.find(
      rule => rule.selectorText === '.bestax-hover-card-content'
    );
    expect(cardRule?.style.animation).toBe('none');
  });
});
