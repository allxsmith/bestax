// `_loading.scss` draws Loading's spinner as a conic-gradient background, and
// forced colors (Windows' contrast themes) drops background images, so the
// partial redraws the spinner as a border there. jsdom evaluates no media
// query, so these compile the partial, with no prefix and under one, read its
// rules off the sheet, and resolve which one wins on the icon Loading renders,
// the way a browser would: by importance, then specificity, then source
// order. A rule the walk cannot place fails the test rather than dropping out,
// as in `Loader.styles.test.tsx`, since the negative checks below are only as
// good as the walk is complete.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Loading, type LoadingProps } from '../Loading';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/loading';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

const FORCED = '(forced-colors: active)';

type Declaration = { property: string; value: string; important: boolean };

type Found = {
  /** One selector of the rule's list. */
  selector: string;
  /** The media query the rule sits in, or '' for none. */
  media: string;
  /** The rule's declarations as the sheet writes them, in order. */
  declarations: Declaration[];
  order: number;
};

/** `css` with its comments taken out and its strings kept whole. */
const uncommented = (css: string) =>
  css.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\/\*[\s\S]*?\*\//g,
    (_, kept?: string) => kept ?? ''
  );

/**
 * The items at the top level of a list of rules or of declarations, in
 * order: each one's prelude and the text of its `{…}` block, or null for
 * one that ends in `;` instead. A `;` or a brace inside a string or a
 * `url(…)` ends nothing.
 */
function itemsOf(text: string) {
  const out: { prelude: string; block: string | null }[] = [];
  let quote = '';
  let parens = 0;
  let braces = 0;
  let start = 0;
  let open = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = '';
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') parens++;
    else if (ch === ')') parens--;
    else if (parens > 0) continue;
    else if (ch === '{') {
      if (braces++ === 0) open = i;
    } else if (ch === '}') {
      if (--braces === 0) {
        out.push({
          prelude: text.slice(start, open).trim(),
          block: text.slice(open + 1, i),
        });
        start = i + 1;
      }
    } else if (ch === ';' && braces === 0) {
      const prelude = text.slice(start, i).trim();
      if (prelude) out.push({ prelude, block: null });
      start = i + 1;
    }
  }
  const rest = text.slice(start).trim();
  if (rest) out.push({ prelude: rest, block: null });
  return out;
}

/** A style rule's declarations as the sheet writes them, in order. */
const declarationsOf = (block: string): Declaration[] =>
  itemsOf(block).flatMap(({ prelude, block: nested }) => {
    const colon = prelude.indexOf(':');
    if (nested !== null || colon < 0) return [];
    const written = prelude.slice(colon + 1).trim();
    return [
      {
        property: prelude.slice(0, colon).trim(),
        value: written.replace(/\s*!\s*important$/i, ''),
        important: /!\s*important$/i.test(written),
      },
    ];
  });

/**
 * Every style rule in `css`, one entry per selector, in source order. It's
 * read off the sheet's text rather than jsdom's CSSOM, which drops a
 * shorthand with a `var()` in it when a longhand follows, as the icon's
 * forced-colors border does, where a browser keeps the other sides.
 */
function rulesOf(css: string): Found[] {
  const out: Found[] = [];
  let order = 0;
  const walk = (text: string, media: string) => {
    for (const { prelude, block } of itemsOf(text)) {
      // A statement like `@charset` holds no rules.
      if (block === null) continue;
      if (/^@media\b/i.test(prelude)) {
        walk(block, prelude.slice('@media'.length).trim());
      } else if (!prelude.startsWith('@')) {
        order++;
        const declarations = declarationsOf(block);
        for (const selector of prelude.split(/\s*,\s*/)) {
          out.push({ selector, media, declarations, order });
        }
      } else if (
        !/^@(-\w+-)?keyframes\b/.test(prelude) &&
        /loading/.test(prelude + block)
      ) {
        // `@supports`, `@layer`, `@container` and the like change when or in
        // what order their rules apply, which this test does not model, so a
        // Loading rule inside one has to fail rather than go unread.
        // Keyframes hold no style rules.
        throw new Error(
          `${prelude} styles Loading in rules this test does not walk. ` +
            'Extend `rulesOf` before trusting a result.'
        );
      }
    }
  };
  walk(uncommented(css), '');
  return out;
}

/** The declarations that set each longhand checked here, shorthands included. */
const SETS: Record<string, string[]> = {
  'background-image': ['background-image', 'background'],
  'border-top-color': [
    'border-top-color',
    'border-top',
    'border-color',
    'border',
  ],
  'border-right-color': [
    'border-right-color',
    'border-right',
    'border-color',
    'border',
  ],
  'border-bottom-color': [
    'border-bottom-color',
    'border-bottom',
    'border-color',
    'border',
  ],
  'box-sizing': ['box-sizing'],
  opacity: ['opacity'],
};

/** Classes, attributes and pseudo-classes, then elements, as one number. */
function specificity(selector: string) {
  const classes = (selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) ?? [])
    .length;
  const elements = (selector.match(/(^|[\s>+~])[a-z][\w-]*/gi) ?? []).length;
  return classes * 10 + elements;
}

/** Whether rank `a` outranks `b`, comparing them part by part. */
const beats = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
};

/**
 * The declaration that wins `longhand` on the element, with forced colors on
 * or off, as the property it was written with and its value, or null when
 * the partial sets nothing there. It's ranked by importance, specificity and
 * source order. Within a rule, the last declaration that sets the longhand is
 * the one that counts. A shorthand is kept whole, so a border written as one
 * reads as the whole border.
 */
function winning(
  found: Found[],
  el: Element,
  longhand: keyof typeof SETS,
  forced: boolean
) {
  let best: { rank: number[]; property: string; value: string } | null = null;
  for (const rule of found) {
    if (rule.media !== '' && !(forced && rule.media === FORCED)) continue;
    if (!el.matches(rule.selector)) continue;
    const sets = rule.declarations.filter(({ property }) =>
      SETS[longhand].includes(property)
    );
    const last = sets[sets.length - 1];
    if (!last) continue;
    const rank = [
      last.important ? 1 : 0,
      specificity(rule.selector),
      rule.order,
    ];
    if (!best || beats(rank, best.rank)) {
      best = { rank, property: last.property, value: last.value };
    }
  }
  return best && { property: best.property, value: best.value };
}

// The checks below are only as good as the walk and the ranking, so what they
// would misread has to fail, or come out the way a browser has it.
describe('the cascade resolver', () => {
  it.each([
    '@supports (border: 1px solid CanvasText) { .loading-icon { border: 1px solid red; } }',
    '@layer base { .loading-overlay { opacity: 0.5; } }',
    '@container (min-width: 1px) { .bestax-loading-icon { background: none; } }',
  ])('refuses a Loading rule it cannot place: %s', css => {
    expect(() => rulesOf(css)).toThrow('Extend `rulesOf`');
  });

  it('passes over a rule it does not walk when nothing in it is Loading’s', () => {
    expect(
      rulesOf('@container (min-width: 1px) { .x { color: red; } }')
    ).toEqual([]);
    expect(
      rulesOf('@keyframes spin { to { transform: rotate(1turn); } }')
    ).toEqual([]);
  });

  it('lets an important declaration win over a later, more specific one', () => {
    const found = rulesOf(
      '.loading-icon { background: red !important; } ' +
        '@media (forced-colors: active) { div.loading-icon.x { background: none; } }'
    );
    const el = document.createElement('div');
    el.className = 'loading-icon x';
    expect(winning(found, el, 'background-image', true)).toEqual({
      property: 'background',
      value: 'red',
    });
  });
});

const VARIANTS: Array<[string, Partial<LoadingProps>]> = [
  ['the default spinner', {}],
  ['a small spinner', { size: 'small' }],
  ['a large primary spinner', { size: 'large', color: 'primary' }],
  ['a danger spinner on a dark overlay', { overlay: 'dark', color: 'danger' }],
];

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the Loading partial with %s', (_label, prefix) => {
  const iconOf = (props: Partial<LoadingProps>) => {
    const { container, unmount } = render(
      <ConfigProvider classPrefix={prefix}>
        <Loading active {...props}>
          Loading data
        </Loading>
      </ConfigProvider>
    );
    return {
      icon: container.querySelector(`.${prefix}loading-icon`)!,
      unmount,
    };
  };

  it.each(VARIANTS)(
    'draws %s as a gradient normally, with no border',
    (_name, props) => {
      const found = rulesOf(compile(prefix));
      const { icon, unmount } = iconOf(props);
      expect(icon).not.toBeNull();
      expect(winning(found, icon, 'background-image', false)?.value).toMatch(
        /^conic-gradient\(/
      );
      for (const side of ['border-top-color', 'border-right-color'] as const) {
        expect(winning(found, icon, side, false)).toBeNull();
      }
      unmount();
    }
  );

  it.each(VARIANTS)(
    'redraws %s in forced colors as a CanvasText border, open at the top',
    (_name, props) => {
      const found = rulesOf(compile(prefix));
      const { icon, unmount } = iconOf(props);
      // The gradient goes, since forced colors would drop it anyway.
      expect(winning(found, icon, 'background-image', true)).toEqual({
        property: 'background',
        value: 'none',
      });
      // A ring at the width the mask keeps, which each size sets.
      const ring = {
        property: 'border',
        value: 'var(--bulma-loading-icon-border-width) solid CanvasText',
      };
      expect(winning(found, icon, 'border-right-color', true)).toEqual(ring);
      expect(winning(found, icon, 'border-bottom-color', true)).toEqual(ring);
      // Canvas is the page's own color, which forced colors leaves alone, so
      // the top stays open and the ring still reads as a spinner.
      expect(winning(found, icon, 'border-top-color', true)).toEqual({
        property: 'border-top-color',
        value: 'Canvas',
      });
      // The border sits inside the icon's width and height rather than
      // adding to them, whatever box-sizing an ancestor hands down, so the
      // spinner keeps its size when a contrast theme comes on.
      expect(winning(found, icon, 'box-sizing', true)?.value).toBe(
        'border-box'
      );
      unmount();
    }
  );

  it.each([
    ['the default overlay', {}],
    ['a light overlay', { overlay: 'light' }],
    ['a dark overlay', { overlay: 'dark' }],
    ['an opaque overlay', { overlay: 'opaque' }],
    ['a full-page overlay', { isFullPage: true }],
    ['a light full-page overlay', { isFullPage: true, overlay: 'light' }],
  ] as Array<[string, Partial<LoadingProps>]>)(
    'makes %s opaque in forced colors, and only there',
    (_name, props) => {
      const found = rulesOf(compile(prefix));
      const { container, unmount } = render(
        <ConfigProvider classPrefix={prefix}>
          <Loading active {...props} />
        </ConfigProvider>
      );
      const overlay = container.querySelector(`.${prefix}loading-overlay`)!;
      // Forced colors keeps an opacity, so the page would show through: the
      // ring's Canvas gap would read as a band over it, and the text would
      // sit over whatever is beneath.
      expect(winning(found, overlay, 'opacity', true)?.value).toBe('1');
      expect(winning(found, overlay, 'opacity', false)?.value).toMatch(
        /^var\(--bulma-loading-overlay-(fullpage-)?opacity\)$/
      );
      unmount();
    }
  );

  it('keeps every border on the spinner inside the forced-colors block', () => {
    // A border drawn, that is: the icon's `border-radius` makes the circle
    // in every mode.
    const draws =
      /^border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-(color|style|width))?$/;
    const found = rulesOf(compile(prefix));
    const borders = found.filter(
      ({ selector, declarations }) =>
        selector.includes(`${prefix}loading-icon`) &&
        declarations.some(({ property }) => draws.test(property))
    );
    expect(borders.length).toBeGreaterThan(0);
    expect(new Set(borders.map(({ media }) => media))).toEqual(
      new Set([FORCED])
    );
  });
});
