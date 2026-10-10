// The keyboard focus ring of a File comes from _file.scss, which jsdom never
// loads on its own, so className assertions cannot see it. These compile the
// real partial and assert computed style instead. jsdom leaves `var()`
// unresolved, so values that read a variable are compared as written.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { act, render } from '@testing-library/react';
import File, { type FileProps } from '../File';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix = '') =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/file';`,
    {
      loadPaths: [SCSS, NODE_MODULES],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

let styleEl: HTMLStyleElement;

const withStylesheet = (prefix?: string) => {
  beforeAll(() => {
    styleEl = document.createElement('style');
    styleEl.textContent = compile(prefix);
    document.head.appendChild(styleEl);
  });
  afterAll(() => {
    styleEl.remove();
  });
};

const FOCUS_COLOR =
  'hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l))';

// Elements are found by selector, not by role: a role query reads each
// element's computed style, and jsdom keeps that until the DOM next changes,
// which focusing an element does not do. A stale entry would hide the
// :focus-visible rules.
const parts = (container: HTMLElement, prefix = '') => ({
  input: container.querySelector(`.${prefix}file-input`) as HTMLInputElement,
  cta: container.querySelector(`.${prefix}file-cta`) as HTMLElement,
  name: container.querySelector(`.${prefix}file-name`) as HTMLElement | null,
});

const COLORS: NonNullable<FileProps['color']>[] = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
  'black',
  'dark',
  'light',
  'white',
];

describe('File focus ring', () => {
  withStylesheet();

  it('draws the ring inside the CTA when the input has focus', () => {
    const { container } = render(<File />);
    const { input, cta } = parts(container);
    act(() => input.focus());
    const style = getComputedStyle(cta);
    expect(style.outlineColor).toBe(FOCUS_COLOR);
    expect(style.outlineStyle).toBe('var(--bulma-focus-style)');
    expect(style.outlineWidth).toBe('var(--bulma-focus-width)');
    expect(style.outlineOffset).toBe('calc(-1 * var(--bulma-focus-width))');
  });

  it('draws no ring without focus', () => {
    const { container } = render(<File />);
    expect(getComputedStyle(parts(container).cta).outlineColor).toBe('');
  });

  it('rings the CTA, not the name, when hasName shows one', () => {
    const { container } = render(<File hasName fileName="resume.pdf" />);
    const { input, cta, name } = parts(container);
    act(() => input.focus());
    expect(getComputedStyle(cta).outlineColor).toBe(FOCUS_COLOR);
    expect(getComputedStyle(name as HTMLElement).outlineColor).toBe('');
  });

  it.each(COLORS)(
    'sets the ring off the fill of an is-%s CTA in its text colour',
    color => {
      const { container } = render(<File color={color} />);
      const { input, cta } = parts(container);
      act(() => input.focus());
      const style = getComputedStyle(cta);
      // currentColor: the CTA's text colour, which Bulma sets to read on the
      // fill. jsdom resolves it to the computed `color`.
      expect(style.outlineColor).not.toBe(FOCUS_COLOR);
      expect(style.outlineColor).toBe(style.color);
      expect(style.outlineOffset).toBe('calc(-2 * var(--bulma-focus-width))');
    }
  );
});

// ---- The CTA's corners -----------------------------------------------------
// Bulma squares the CTA's inner corners under has-name, and a has-name File
// with no name takes is-empty to round them again (#978). Which declaration
// wins is a cascade across Bulma's sheet and the partial, mixing logical and
// physical radius properties, and jsdom computes none of it, so these read
// the rules that match the CTA and resolve each corner themselves.

type Corner = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';

// In a left-to-right, horizontal page, which corner each property sets.
const CORNER_OF: Record<string, Corner> = {
  'border-top-left-radius': 'top-left',
  'border-top-right-radius': 'top-right',
  'border-bottom-right-radius': 'bottom-right',
  'border-bottom-left-radius': 'bottom-left',
  'border-start-start-radius': 'top-left',
  'border-start-end-radius': 'top-right',
  'border-end-end-radius': 'bottom-right',
  'border-end-start-radius': 'bottom-left',
};

/** The words of a value, keeping each `var(…)` whole. */
const words = (value: string) => value.match(/(?:[^\s(]+|\([^)]*\))+/g) ?? [];

/** The corners a `border-radius` shorthand sets: CSS's one-to-four values. */
const shorthandCorners = (value: string): [Corner, string][] => {
  const [a = '', b = a, c = a, d = b] = words(value);
  return [
    ['top-left', a],
    ['top-right', b],
    ['bottom-right', c],
    ['bottom-left', d],
  ];
};

/**
 * Specificity as [ids, classes, types]. Enough for the sheets here, whose
 * rules on the CTA are plain class and attribute selectors.
 */
const specificity = (selector: string): number[] => [
  (selector.match(/#[\w-]+/g) ?? []).length,
  (selector.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length,
  (selector.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length,
];

const outranks = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true; // equal: the later declaration wins
};

/** Whether `el` matches `selector`; one jsdom can't parse matches nothing. */
const matches = (el: Element, selector: string) => {
  try {
    return el.matches(selector);
  } catch {
    return false;
  }
};

/** The radius each corner of `el` gets from the top-level rules of `css`. */
function cornersOf(el: Element, css: string): Record<Corner, string> {
  const sheet = document.createElement('style');
  // An @charset is valid only at the very start, and two sheets joined put
  // one in the middle.
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  const won = new Map<Corner, { value: string; rank: number[] }>();
  for (const rule of Array.from((sheet.sheet as CSSStyleSheet).cssRules)) {
    if (!(rule instanceof CSSStyleRule)) continue;
    const ranks = rule.selectorText
      .split(/,(?![^(]*\))/)
      .map(part => part.trim())
      .filter(part => matches(el, part))
      .map(specificity);
    if (ranks.length === 0) continue;
    const rank = ranks.reduce((best, next) =>
      outranks(next, best) ? next : best
    );
    const style = rule.style as unknown as ArrayLike<string> &
      CSSStyleDeclaration;
    for (let i = 0; i < style.length; i++) {
      const property = style[i];
      const value = style.getPropertyValue(property);
      const set: [Corner, string][] =
        property === 'border-radius'
          ? shorthandCorners(value)
          : CORNER_OF[property]
            ? [[CORNER_OF[property], value]]
            : [];
      for (const [corner, v] of set) {
        const held = won.get(corner);
        if (!held || outranks(rank, held.rank)) {
          won.set(corner, { value: v, rank });
        }
      }
    }
  }
  sheet.remove();
  return Object.fromEntries(
    [...won].map(([corner, { value }]) => [corner, value])
  ) as Record<Corner, string>;
}

const bulmaCss = (file = 'bulma.css') =>
  fs.readFileSync(
    path.join(path.dirname(require.resolve('bulma/package.json')), 'css', file),
    'utf8'
  );

const ROUND = 'var(--bulma-file-radius)';
const ALL_ROUND = {
  'top-left': ROUND,
  'top-right': ROUND,
  'bottom-right': ROUND,
  'bottom-left': ROUND,
};

const LAYOUTS: [string, Partial<FileProps>][] = [
  ['default', {}],
  ['isRight', { isRight: true }],
  ['isBoxed', { isBoxed: true }],
  ['isBoxed and isRight', { isBoxed: true, isRight: true }],
];

describe('the CTA of a hasName File with no name', () => {
  const ctaOf = (props: Partial<FileProps>) =>
    render(<File hasName {...props} />).container.querySelector(
      '.file-cta'
    ) as HTMLElement;

  // The extras ship after Bulma in bestax.css, and an app linking extras.css
  // can put it on either side of its own Bulma.
  const orders: [string, () => string][] = [
    ['the partial after Bulma', () => bulmaCss() + compile()],
    ['the partial before Bulma', () => compile() + bulmaCss()],
  ];

  describe.each(orders)('with %s', (_order, css) => {
    it.each(LAYOUTS)('rounds every corner in the %s layout', (_l, props) => {
      expect(cornersOf(ctaOf(props), css())).toEqual(ALL_ROUND);
    });
  });

  it('rounds every corner in a prefixed build', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <File hasName isBoxed />
      </ConfigProvider>
    );
    const cta = container.querySelector('.bulma-file-cta') as HTMLElement;
    expect(
      cornersOf(
        cta,
        bulmaCss('versions/bulma-prefixed.css') + compile('bulma-')
      )
    ).toEqual(ALL_ROUND);
  });

  // The CTA still meets the name the way Bulma draws it once there is one.
  it.each([
    ['default', {}, ['top-right', 'bottom-right']],
    ['isBoxed', { isBoxed: true }, ['bottom-right', 'bottom-left']],
  ] as [string, Partial<FileProps>, Corner[]][])(
    'squares the corners beside a name in the %s layout',
    (_l, props, square) => {
      const { container } = render(
        <File hasName fileName="resume.pdf" {...props} />
      );
      const cta = container.querySelector('.file-cta') as HTMLElement;
      const corners = cornersOf(cta, bulmaCss() + compile());
      for (const corner of square) expect(corners[corner]).toBe('0');
    }
  );
});

describe('File focus ring in a prefixed build', () => {
  withStylesheet('bestax-');

  it('draws the ring with the prefixed classes', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <File color="link" />
      </ConfigProvider>
    );
    const { input, cta } = parts(container, 'bestax-');
    act(() => input.focus());
    const style = getComputedStyle(cta);
    expect(style.outlineColor).toBe(style.color);
    expect(style.outlineOffset).toBe('calc(-2 * var(--bulma-focus-width))');
  });
});
