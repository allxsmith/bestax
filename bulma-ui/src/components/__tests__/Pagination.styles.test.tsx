// Bulma marks the current page link with colors alone, which forced colors
// replaces, so `_pagination.scss` draws it in Highlight and HighlightText
// there (#1367). jsdom evaluates no media query, and which color wins is a
// cascade across Bulma's sheet and the partial, in either order, so these
// compile the real partial, link it with Bulma's own CSS on either side, and
// resolve each property themselves the way a browser on a forced-colors page
// would: the rules at the top level and in a `forced-colors: active` block,
// ranked by importance, then specificity, then source order. A rule this
// can't rank, or one in a block it doesn't walk that sets a property it
// resolves, fails the test rather than dropping out.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import { Pagination } from '../Pagination';
import { DataTable } from '../DataTable';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json. The partial
// compiles against its Sass and is checked against its CSS, so an upgrade
// moves the two together.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix = '') =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/pagination';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

const bulmaCss = (file = 'bulma.css') =>
  fs.readFileSync(path.join(BULMA, 'css', file), 'utf8');

const FORCED = '@media (forced-colors: active)';

interface Rule {
  /** The at-rules around it, outermost first, as written. */
  context: string[];
  selector: string;
  declarations: Record<string, string>;
}

/**
 * Every style rule in a sheet of Sass's expanded output, which Bulma's CSS
 * is too. Neither puts a brace or a semicolon inside a string.
 */
function rulesOf(css: string): Rule[] {
  const rules: Rule[] = [];
  // What each open brace opened: an at-rule's head, or a style rule.
  const open: (string | Rule)[] = [];
  let buffer = '';
  for (const char of css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@charset "UTF-8";/g, '')) {
    if (char === '{') {
      const head = buffer.replace(/\s+/g, ' ').trim();
      buffer = '';
      if (head.startsWith('@')) {
        open.push(head);
      } else {
        const rule: Rule = {
          context: open.filter((o): o is string => typeof o === 'string'),
          selector: head,
          declarations: {},
        };
        rules.push(rule);
        open.push(rule);
      }
    } else if (char === '}') {
      const closed = open.pop();
      if (closed && typeof closed !== 'string') {
        for (const declaration of buffer.split(';')) {
          const at = declaration.indexOf(':');
          if (at < 0) continue;
          closed.declarations[declaration.slice(0, at).trim()] = declaration
            .slice(at + 1)
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
      buffer = '';
    } else {
      buffer += char;
    }
  }
  return rules;
}

/**
 * Specificity as [ids, classes, types]. `:not()` counts as its argument,
 * which is all the rules here need; any other functional pseudo-class, or an
 * argument that is a list, is refused.
 */
function specificity(selector: string): number[] {
  for (const [, name, arg] of selector.matchAll(/:([\w-]+)\(([^)]*)\)/g)) {
    if (name !== 'not' || arg.includes(',')) {
      throw new Error(
        `${selector} sets a property this test resolves with ` +
          `:${name}(${arg}), which it does not rank. Extend \`specificity\` ` +
          'before trusting a result.'
      );
    }
  }
  const flat = selector.replace(/:not\(([^)]*)\)/g, ' $1 ');
  return [
    (flat.match(/#[\w-]+/g) ?? []).length,
    (flat.match(/\.[\w-]+|\[[^\]]*\]|:[\w-]+/g) ?? []).length,
    (flat.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length,
  ];
}

const outranks = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
};

/** Whether one selector of a list matches `el`; a pseudo-element never does. */
const matches = (el: Element, part: string) => {
  if (part.includes('::')) return false;
  try {
    return el.matches(part);
  } catch {
    return false;
  }
};

/** Each property, and the shorthands that set it too. */
const SETTERS: Record<string, string[]> = {
  'background-color': ['background-color', 'background'],
  'border-color': ['border-color', 'border'],
  color: ['color'],
  'forced-color-adjust': ['forced-color-adjust'],
};

/**
 * The value of `property` on `el`, as the rules of `css` resolve it on a
 * forced-colors page, or undefined if none sets it.
 */
function resolve(css: string, el: Element, property: string) {
  const setters = SETTERS[property];
  let won: { value: string; rank: number[] } | undefined;
  rulesOf(css).forEach((rule, order) => {
    const declared = Object.keys(rule.declarations).filter(name =>
      setters.includes(name)
    );
    if (declared.length === 0) return;
    const selectors = rule.selector
      .split(/,(?![^(]*\))/)
      .map(part => part.trim())
      .filter(part => matches(el, part));
    if (selectors.length === 0) return;
    const applies =
      rule.context.length === 0 ||
      (rule.context.length === 1 && rule.context[0] === FORCED);
    if (!applies) {
      // `@media`, `@supports`, `@layer` and the like change when or in what
      // order their rules apply, which this file doesn't model, so a value
      // set in one fails rather than being read as if it never applied.
      if (rule.context.some(at => at.startsWith('@keyframes'))) return;
      throw new Error(
        `${rule.context.join(' ')} sets ${property} on ${rule.selector}, in a ` +
          'block this test does not walk. Extend `resolve` before trusting ' +
          'a result.'
      );
    }
    const specific = selectors
      .map(specificity)
      .reduce((best, next) => (outranks(next, best) ? next : best));
    declared.forEach(name => {
      const raw = rule.declarations[name];
      const important = /!important$/.test(raw) ? 1 : 0;
      const value = raw.replace(/\s*!important$/, '');
      const rank = [important, ...specific, order];
      if (!won || !outranks(won.rank, rank)) won = { value, rank };
    });
  });
  return won?.value;
}

/** How a page link looks on a forced-colors page, from `css`. */
const look = (css: string, el: Element) =>
  Object.fromEntries(
    Object.keys(SETTERS).map(property => [property, resolve(css, el, property)])
  );

const HIGHLIGHTED = {
  'background-color': 'Highlight',
  'border-color': 'Highlight',
  color: 'HighlightText',
  'forced-color-adjust': 'none',
};

/** The current page's link and page 1's, with `prefix` on every class. */
function linksOf(container: HTMLElement, prefix: string) {
  const current = container.querySelectorAll(
    `a.${prefix}pagination-link.${prefix}is-current`
  );
  expect(current).toHaveLength(1);
  expect(current[0].getAttribute('aria-current')).toBe('page');
  const other = container.querySelector(
    `a.${prefix}pagination-link:not(.${prefix}is-current)`
  ) as Element;
  expect(other).not.toBeNull();
  return { current: current[0], other };
}

describe('the current page on a forced-colors page', () => {
  // Bulma's CSS can land on either side of the extras: `bestax-no-dark-mode`
  // emits them first, and an app can link `extras.css` before its own Bulma.
  describe.each([
    ['the partial after Bulma', '', () => bulmaCss() + compile()],
    ['the partial before Bulma', '', () => compile() + bulmaCss()],
    [
      'a prefixed build, the partial after Bulma',
      'bulma-',
      () => bulmaCss('versions/bulma-prefixed.css') + compile('bulma-'),
    ],
    [
      'a prefixed build, the partial before Bulma',
      'bulma-',
      () => compile('bulma-') + bulmaCss('versions/bulma-prefixed.css'),
    ],
  ])('with %s', (_order, prefix, css) => {
    it('is drawn in Highlight, and the other pages are left to the browser', () => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <Pagination total={8} current={3} onPageChange={() => {}} />
        </ConfigProvider>
      );
      const { current, other } = linksOf(container, prefix);
      expect(current.textContent).toBe('3');
      expect(look(css(), current)).toEqual(HIGHLIGHTED);
      expect(resolve(css(), other, 'forced-color-adjust')).toBeUndefined();
    });

    it('is drawn in Highlight in a DataTable’s pager', () => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <DataTable
            caption="Users"
            columns={[{ id: 'name', header: 'Name' }]}
            data={[
              { id: 'u1', name: 'Ada' },
              { id: 'u2', name: 'Grace' },
              { id: 'u3', name: 'Alan' },
            ]}
            pageSize={2}
          />
        </ConfigProvider>
      );
      const { current } = linksOf(container, prefix);
      expect(look(css(), current)).toEqual(HIGHLIGHTED);
    });
  });

  it('is like every other page with Bulma alone, which is the bug', () => {
    const { container } = render(
      <Pagination total={8} current={3} onPageChange={() => {}} />
    );
    const { current } = linksOf(container, '');
    expect(resolve(bulmaCss(), current, 'forced-color-adjust')).toBeUndefined();
  });
});

describe('the Pagination partial', () => {
  it.each([
    ['no prefix', ''],
    ['a class prefix', 'bestax-'],
  ])(
    'changes nothing outside forced colors, with %s, and names only prefixed classes',
    (_label, prefix) => {
      const rules = rulesOf(compile(prefix));
      expect(rules.map(rule => [rule.selector, rule.context])).toEqual([
        [
          `.${prefix}pagination-link.${prefix}is-current, .${prefix}pagination-link.${prefix}is-selected`,
          [FORCED],
        ],
      ]);
    }
  );

  it('is in the components index, so bestax.css and extras.css carry it', () => {
    const index = fs.readFileSync(
      path.join(SCSS, 'components/_index.scss'),
      'utf8'
    );
    expect(index).toMatch(/^@use 'pagination';$/m);
  });
});
